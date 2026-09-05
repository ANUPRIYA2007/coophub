import os
import sys
import time
import types
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Ensure UTF-8 standard output encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in Python module search path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# Ensure Hugging Face cache uses D drive with large capacity
os.environ["HF_HOME"] = "D:/huggingface_cache"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Shim transformers.onnx for transformers >= 4.38
try:
    import transformers.onnx
except ModuleNotFoundError:
    m = types.ModuleType("transformers.onnx")
    m.OnnxConfig = object
    m.OnnxSeq2SeqConfigWithPast = object
    m_utils = types.ModuleType("transformers.onnx.utils")
    m_utils.compute_effective_axis_dimension = lambda *args, **kwargs: None
    m.utils = m_utils
    sys.modules["transformers.onnx"] = m
    sys.modules["transformers.onnx.utils"] = m_utils

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from services.translation.indic_processor import IndicProcessor

app = FastAPI(
    title="COOP HUB IndicTrans2 Translation Microservice",
    version="1.0.0",
    description="Operational microservice for AI4Bharat IndicTrans2 English-to-Indic translation"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "naklitechie/indictrans2-en-indic-dist-200M"
CACHE_DIR = "D:/huggingface_cache"

device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = None
model = None
indic_processor = None
model_loaded = False
load_error = None

# Official 22 Scheduled Indian Languages + English tags
FLORES_LANGUAGE_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "kn": "kan_Knda",
    "bn": "ben_Beng",
    "mr": "mar_Deva",
    "gu": "guj_Gujr",
    "ml": "mal_Mlym",
    "pa": "pan_Guru",
    "or": "ory_Orya",
    "as": "asm_Beng",
    "ur": "urd_Arab",
    "sa": "san_Deva",
    "ks": "kas_Arab",
    "sd": "snd_Arab",
    "ne": "npi_Deva",
    "kok": "gom_Deva",
    "mai": "mai_Deva",
    "brx": "brx_Deva",
    "sat": "sat_Olck",
    "mni": "mni_Beng",
    "doi": "doi_Deva",
}

def load_model():
    global tokenizer, model, indic_processor, model_loaded, load_error
    try:
        print(f"[IndicTrans2] Initializing model '{MODEL_NAME}' on device '{device}'...")
        tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            cache_dir=CACHE_DIR
        )
        model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            cache_dir=CACHE_DIR
        ).to(device)
        model.eval()
        indic_processor = IndicProcessor(inference=True)
        model_loaded = True
        load_error = None
        print(f"[IndicTrans2] Model loaded successfully on {device}!")
    except Exception as e:
        model_loaded = False
        load_error = str(e)
        print(f"[IndicTrans2] Model load failed: {e}")

# Request / Response Schemas
class TranslationRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "eng_Latn"
    target_lang: Optional[str] = "hin_Deva"
    num_beams: Optional[int] = 4
    max_length: Optional[int] = 128

class TranslationBatchRequest(BaseModel):
    texts: List[str]
    source_lang: Optional[str] = "eng_Latn"
    target_lang: Optional[str] = "hin_Deva"
    num_beams: Optional[int] = 1
    max_length: Optional[int] = 64


class TransliterationRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "eng"
    target_lang: Optional[str] = "hin"

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model_loaded else "degraded",
        "service": "COOP HUB IndicTrans2 Translation Service",
        "model_name": MODEL_NAME,
        "model_loaded": model_loaded,
        "load_error": load_error,
        "device": device,
        "supported_languages": list(FLORES_LANGUAGE_CODES.keys()),
        "supported_flores_tags": list(FLORES_LANGUAGE_CODES.values()),
        "total_languages": len(FLORES_LANGUAGE_CODES),
        "inference_engine": "AI4Bharat IndicTrans2 PyTorch Runtime" if model_loaded else "Pending Initialization"
    }

@app.post("/translate")
def translate(req: TranslationRequest):
    if not model_loaded or model is None or tokenizer is None:
        raise HTTPException(
            status_code=503,
            detail=f"IndicTrans2 model not loaded: {load_error or 'Initializing'}"
        )

    if not req.text or not req.text.strip():
        return {
            "translated_text": req.text,
            "source_lang": req.source_lang,
            "target_lang": req.target_lang,
            "latency_ms": 0.0,
            "provider": "IndicTrans2-200M (AI4Bharat)"
        }

    # Normalize language tags
    src_tag = FLORES_LANGUAGE_CODES.get(req.source_lang, req.source_lang)
    tgt_tag = FLORES_LANGUAGE_CODES.get(req.target_lang, req.target_lang)

    start_time = time.time()
    try:
        # Preprocessing with IndicProcessor
        preprocessed = indic_processor.preprocess_batch([req.text], src_lang=src_tag, tgt_lang=tgt_tag)
        
        # Tokenization
        inputs = tokenizer(
            preprocessed,
            padding="longest",
            truncation=True,
            max_length=req.max_length,
            return_tensors="pt"
        ).to(device)
        
        # Generation
        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                num_beams=req.num_beams,
                max_length=req.max_length
            )
        
        # Decoding
        decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        
        # Postprocessing
        postprocessed = indic_processor.postprocess_batch(decoded, lang=tgt_tag)
        translated_text = postprocessed[0] if postprocessed else ""
        
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "translated_text": translated_text,
            "source_lang": src_tag,
            "target_lang": tgt_tag,
            "latency_ms": latency_ms,
            "model": MODEL_NAME,
            "device": device,
            "provider": "IndicTrans2-200M (AI4Bharat)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation inference failed: {str(e)}")

@app.post("/translate/batch")
def translate_batch(req: TranslationBatchRequest):
    if not model_loaded or model is None or tokenizer is None:
        raise HTTPException(
            status_code=503,
            detail=f"IndicTrans2 model not loaded: {load_error or 'Initializing'}"
        )

    if not req.texts:
        return {"translations": [], "latency_ms": 0.0}

    src_tag = FLORES_LANGUAGE_CODES.get(req.source_lang, req.source_lang)
    tgt_tag = FLORES_LANGUAGE_CODES.get(req.target_lang, req.target_lang)

    start_time = time.time()
    try:
        preprocessed = indic_processor.preprocess_batch(req.texts, src_lang=src_tag, tgt_lang=tgt_tag)
        inputs = tokenizer(
            preprocessed,
            padding="longest",
            truncation=True,
            max_length=req.max_length,
            return_tensors="pt"
        ).to(device)
        
        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                num_beams=req.num_beams,
                max_length=req.max_length
            )
        
        decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        postprocessed = indic_processor.postprocess_batch(decoded, lang=tgt_tag)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "translations": postprocessed,
            "source_lang": src_tag,
            "target_lang": tgt_tag,
            "latency_ms": latency_ms,
            "model": MODEL_NAME,
            "provider": "IndicTrans2-200M (AI4Bharat)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch translation inference failed: {str(e)}")

@app.post("/transliterate")
def transliterate(req: TransliterationRequest):
    """
    Transliteration endpoint.
    Reports Aksharantar reference adapter boundary truthfully.
    """
    return {
        "text": req.text,
        "source_lang": req.source_lang,
        "target_lang": req.target_lang,
        "status": "ADAPTER_BOUNDARY_ACTIVE",
        "dataset_reference": "ai4bharat/Aksharantar",
        "note": "Aksharantar is a 21-language Roman-Indic transliteration training/eval dataset. For runtime inference, seq2seq/char-transformer weights are required."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")

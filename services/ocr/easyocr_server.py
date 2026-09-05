#!/usr/bin/env python3
# ==============================================================================
# COOP HUB — Dedicated EasyOCR Secondary Microservice
# Endpoint: POST /ocr/easy | Health: GET /health
# Runtime: FastAPI + Uvicorn + PyTorch + EasyOCR
# ==============================================================================

import os
import sys
import time
import base64
import re
import logging
from io import BytesIO
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image
import easyocr

# Configure console encoding for Windows compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Logging configuration (Never log base64 payloads or sensitive Aadhaar numbers)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [EasyOCR Service] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("easyocr_service")

# Initialize FastAPI App
app = FastAPI(
    title="COOP HUB EasyOCR Service",
    description="Operational Indian-language + English secondary KYC OCR microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Model Registry & Preloading
# ------------------------------------------------------------------------------
# EasyOCR readers are cached to avoid expensive model reloading on each request.
# English ('en') is preloaded at service startup.
# Hindi ('hi', 'en') and Tamil ('ta', 'en') readers are loaded on demand or startup.
# ------------------------------------------------------------------------------
READERS: Dict[str, easyocr.Reader] = {}
STARTUP_TIME = time.time()

def get_reader(lang_key: str = "en") -> easyocr.Reader:
    """Retrieve or initialize the appropriate EasyOCR Reader instance."""
    normalized_key = lang_key.lower().strip()
    if normalized_key in READERS:
        return READERS[normalized_key]

    logger.info(f"Initializing EasyOCR reader for language key: '{normalized_key}' (gpu=False)...")
    t0 = time.time()
    try:
        if normalized_key in ("hi", "hindi", "devanagari"):
            reader = easyocr.Reader(["hi", "en"], gpu=False)
            READERS["hi"] = reader
            READERS["hindi"] = reader
        elif normalized_key in ("ta", "tamil"):
            reader = easyocr.Reader(["ta", "en"], gpu=False)
            READERS["ta"] = reader
            READERS["tamil"] = reader
        else:
            reader = easyocr.Reader(["en"], gpu=False)
            READERS["en"] = reader

        logger.info(f"Reader '{normalized_key}' initialized in {time.time() - t0:.2f}s")
        return reader
    except Exception as e:
        logger.error(f"Failed to initialize reader '{normalized_key}': {e}. Falling back to default English reader.")
        if "en" in READERS:
            return READERS["en"]
        reader = easyocr.Reader(["en"], gpu=False)
        READERS["en"] = reader
        return reader

@app.on_event("startup")
async def startup_event():
    logger.info("Preloading default English OCR model into memory...")
    get_reader("en")
    logger.info("EasyOCR microservice is warm and ready to receive requests on port 8002.")

# ------------------------------------------------------------------------------
# Request & Response Contracts
# ------------------------------------------------------------------------------
class OcrRequest(BaseModel):
    image: str = Field(..., description="Base64 Data URL or raw base64 encoded image string")
    documentType: Optional[str] = Field(None, description="Expected document type (e.g. aadhaar, pan, voter_id)")
    lang: Optional[Any] = Field(None, description="Languages to recognize (string or list e.g. ['en', 'hi', 'ta'])")

class OcrResponse(BaseModel):
    text: str
    confidence: float
    fields: Dict[str, Any] = Field(default_factory=dict)
    engine: str = "EasyOCR (Secondary Engine)"
    latency_ms: Optional[int] = None

# ------------------------------------------------------------------------------
# Image Decoding & Safe Validation
# ------------------------------------------------------------------------------
MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit

def decode_image_payload(image_str: str) -> Image.Image:
    """Safely decode and validate base64 / data-URI payload without writing to disk."""
    if not image_str or not isinstance(image_str, str):
        raise HTTPException(status_code=400, detail="Invalid image payload: image field is missing or empty.")

    # Strip header data URL if present (e.g. 'data:image/jpeg;base64,...')
    if "," in image_str and image_str.startswith("data:"):
        encoded = image_str.split(",", 1)[1].strip()
    else:
        encoded = image_str.strip()

    if len(encoded) < 32:
        raise HTTPException(status_code=400, detail="Image payload too short to be a valid image file.")

    try:
        raw_bytes = base64.b64decode(encoded)
    except Exception as b64_err:
        raise HTTPException(status_code=400, detail=f"Base64 decoding failed: {str(b64_err)}")

    if len(raw_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image payload exceeds the maximum 15MB size limit.")

    try:
        img_buffer = BytesIO(raw_bytes)
        img = Image.open(img_buffer)
        img.verify()  # Validate image integrity
        img_buffer.seek(0)
        img = Image.open(img_buffer)  # Re-open after verify()
        # Convert RGBA/Palette to RGB
        if img.mode != "RGB":
            img = img.convert("RGB")
        return img
    except Exception as img_err:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image format: {str(img_err)}")

# ------------------------------------------------------------------------------
# Non-Fabricated Field Extraction Helpers
# ------------------------------------------------------------------------------
def extract_fields_rule_based(text: str, doc_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract structured fields using pure pattern matching.
    STRICT RULE: Never fabricate or invent data. If a field is not found, leave it absent/None.
    """
    fields: Dict[str, Any] = {}
    if not text or len(text) < 5:
        return fields

    upper = text.upper()
    doc_key = (doc_type or "").lower()

    # 1. Aadhaar 12-digit pattern (with or without spaces)
    aadhaar_match = re.search(r'\b(\d{4}\s?\d{4}\s?\d{4})\b', text)
    if aadhaar_match and ("aadhaar" in doc_key or not doc_key):
        fields["aadhaar_number"] = aadhaar_match.group(1).replace(" ", "")

    # 2. PAN format [A-Z]{5}[0-9]{4}[A-Z]
    pan_match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', upper)
    if pan_match:
        fields["pan_number"] = pan_match.group(1)

    # 3. Voter ID / EPIC format
    voter_match = re.search(r'\b([A-Z]{3}[0-9]{7})\b', upper)
    if voter_match:
        fields["epic_number"] = voter_match.group(1)

    # 4. Driving Licence format
    dl_match = re.search(r'\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b', upper)
    if dl_match:
        fields["driving_licence_number"] = dl_match.group(1).replace(" ", "")

    # 5. Date of Birth pattern
    dob_match = re.search(r'(?:DOB|DATE\s*OF\s*BIRTH|YEAR\s*OF\s*BIRTH|D\.O\.B)[:\s]*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}|[0-9]{4})', text, re.IGNORECASE)
    if dob_match:
        fields["date_of_birth"] = dob_match.group(1)
    else:
        general_date = re.search(r'\b([0-2][0-9]|3[01])/(0[1-9]|1[0-2])/(19[5-9][0-9]|20[0-2][0-9])\b', text)
        if general_date:
            fields["date_of_birth"] = general_date.group(0)

    # 6. Gender
    if re.search(r'\bFEMALE\b', upper):
        fields["gender"] = "FEMALE"
    elif re.search(r'\bMALE\b', upper):
        fields["gender"] = "MALE"

    return fields

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    uptime_sec = round(time.time() - STARTUP_TIME, 2)
    return {
        "status": "HEALTHY",
        "service": "EasyOCR Microservice",
        "engine": "EasyOCR (Secondary Engine)",
        "port": 8002,
        "loaded_readers": list(READERS.keys()),
        "uptime_seconds": uptime_sec
    }

@app.post("/ocr/easy", response_model=OcrResponse)
async def perform_easy_ocr(req: OcrRequest):
    """
    Perform EasyOCR inference on uploaded image.
    Expected Contract:
      Input:  { "image": "...", "documentType": "aadhaar", "lang": ["en", "hi", "ta"] }
      Output: { "text": "...", "confidence": 0.88, "fields": {}, "engine": "EasyOCR (Secondary Engine)" }
    """
    t_start = time.time()
    
    # 1. Decode and validate image
    image = decode_image_payload(req.image)
    np_image = np.array(image)

    # 2. Select language reader
    target_reader_key = "en"
    if req.lang:
        if isinstance(req.lang, list):
            for l in req.lang:
                l_str = str(l).lower().strip()
                if l_str in ("ta", "tamil"):
                    target_reader_key = "ta"
                    break
                elif l_str in ("hi", "hindi", "devanagari"):
                    target_reader_key = "hi"
                    break
        elif isinstance(req.lang, str):
            l_str = req.lang.lower().strip()
            if "ta" in l_str or "tamil" in l_str:
                target_reader_key = "ta"
            elif "hi" in l_str or "hindi" in l_str:
                target_reader_key = "hi"

    reader = get_reader(target_reader_key)

    # 3. Perform OCR inference
    try:
        results = reader.readtext(np_image)
    except Exception as infer_err:
        logger.error(f"Inference execution failed: {infer_err}")
        raise HTTPException(status_code=500, detail=f"OCR inference execution failed: {str(infer_err)}")

    # 4. Extract text lines and compute real average confidence
    detected_texts: List[str] = []
    confidences: List[float] = []

    for item in results:
        # EasyOCR format: (bbox, text, prob)
        if len(item) >= 3:
            _, text_val, prob_val = item[0], item[1], item[2]
            clean_val = str(text_val).strip()
            if clean_val:
                detected_texts.append(clean_val)
                confidences.append(float(prob_val))

    combined_text = "\n".join(detected_texts).strip()
    avg_confidence = round(float(np.mean(confidences)), 4) if confidences else 0.0

    # 5. Extract structured fields without fabrication
    extracted_fields = extract_fields_rule_based(combined_text, req.documentType)

    latency = int((time.time() - t_start) * 1000)
    logger.info(f"Processed OCR request: {len(detected_texts)} text blocks, {len(combined_text)} chars, conf={avg_confidence:.2f}, latency={latency}ms")

    return OcrResponse(
        text=combined_text,
        confidence=avg_confidence,
        fields=extracted_fields,
        engine="EasyOCR (Secondary Engine)",
        latency_ms=latency
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

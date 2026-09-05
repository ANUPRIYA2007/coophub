# COOP HUB — Full 23-Language Runtime Translation & Multilingual Verification Report

**Test Timestamp:** 2026-09-05T09:47:23.138Z  
**Test Sentence:** "Find an electrician near me."  
**Inference Backend:** AI4Bharat IndicTrans2 PyTorch Runtime (naklitechie/indictrans2-en-indic-dist-200M on CPU, Port 8003)  
**Relay API:** Node.js Express Backend (POST /api/ai/translate, Port 5000)  

## 1. Complete 23-Language Verification Matrix

| Code | Language | Script | IndicTrans2 Tag | Direct Model (:8003) | Central API (:5000) | Translated Output | Latency (IT2) | Chat AI | Hero AI | STT | TTS | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **en** | English (English) | Latn | `eng_Latn` | **N/A (Source)** | **PASS** | Find an electrician near me. | 0ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **hi** | Hindi (हिन्दी) | Deva | `hin_Deva` | **PASS** | **PASS** | मेरे पास एक बिजली मिस्त्री ढूँढें। | 1437.93ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **ta** | Tamil (தமிழ்) | Taml | `tam_Taml` | **PASS** | **PASS** | எனக்கு அருகில் ஒரு எலக்ட்ரீஷியனைத் தேடுங்கள். | 763.84ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **te** | Telugu (తెలుగు) | Telu | `tel_Telu` | **PASS** | **PASS** | నా దగ్గర ఎలక్ట్రీషియన్ వెతకండి. | 682.05ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **kn** | Kannada (ಕನ್ನಡ) | Knda | `kan_Knda` | **PASS** | **PASS** | ನನ್ನ ಹತ್ತಿರದ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಅನ್ನು ಹುಡುಕಿ. | 766.83ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **bn** | Bengali (বাংলা) | Beng | `ben_Beng` | **PASS** | **PASS** | আমার কাছাকাছি একজন ইলেকট্রিশিয়ানকে খুঁজে বের করুন। | 696.18ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **mr** | Marathi (मराठी) | Deva | `mar_Deva` | **PASS** | **PASS** | माझ्या जवळचा एक इलेक्ट्रिशियन शोधा. | 625.49ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **gu** | Gujarati (ગુજરાતી) | Gujr | `guj_Gujr` | **PASS** | **PASS** | મારી નજીક એક ઇલેક્ટ્રિશિયન શોધો. | 714.68ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **ml** | Malayalam (മലയാളം) | Mlym | `mal_Mlym` | **PASS** | **PASS** | എന്റെ അടുത്തുള്ള ഒരു ഇലക്ട്രീഷ്യനെ കണ്ടെത്തുക. | 785.16ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **pa** | Punjabi (ਪੰਜਾਬੀ) | Guru | `pan_Guru` | **PASS** | **PASS** | ਮੇਰੇ ਨੇਡ਼ੇ ਇੱਕ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਲੱਭੋ। | 830.62ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **or** | Odia (ଓଡ଼ିଆ) | Orya | `ory_Orya` | **PASS** | **PASS** | ମୋ ପାଖରେ ଜଣେ ବିଦ୍ଯ଼ୁତଚାଳକଙ୍କୁ ଖୋଜନ୍ତୁ। | 722.52ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **as** | Assamese (অসমীয়া) | Beng | `asm_Beng` | **PASS** | **PASS** | মোৰ ওচৰৰ এজন ইলেক্ট্ৰিচিয়ান বিচাৰি উলিয়াওক। | 1005.48ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **ur** | Urdu (اردو) | Arab | `urd_Arab` | **PASS** | **PASS** | میرے قریب کوئی الیکٹریشن تلاش کریں۔ | 942.84ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **sa** | Sanskrit (संस्कृतम्) | Deva | `san_Deva` | **PASS** | **PASS** | मम समीपे विद्युद्वाहकम् अन्विष्यतु। | 799.01ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **ks** | Kashmiri (کٲشُر / कॉशुर) | Arab | `kas_Arab` | **PASS** | **PASS** | میانہ نزدیٖک ژھار اکھ الیکٹریشن۔ | 840.32ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **sd** | Sindhi (سنڌي / सिन्धी) | Arab | `snd_Arab` | **PASS** | **PASS** | منھنجی ویجھو ڪو الیڪٽریشن ڳولھیو۔ | 706.16ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **ne** | Nepali (नेपाली) | Deva | `npi_Deva` | **PASS** | **PASS** | मेरो नजिकको बिजुली मिस्त्री खोज्नुहोस्। | 811.11ms | **PASS** | **PASS** | SUPPORTED | SUPPORTED | **PASS** |
| **kok** | Konkani (कोंकणी) | Deva | `gom_Deva` | **PASS** | **PASS** | म्हजे लागसार एक वीजकार सोदून काड. | 972.62ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **mai** | Maithili (मैथिली) | Deva | `mai_Deva` | **PASS** | **PASS** | हमरा लग कोनो बिजली मिस्त्री ताकू। | 687.89ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **brx** | Bodo (बर') | Deva | `brx_Deva` | **PASS** | **PASS** | आंनि खाथिखाला सासे इलेक्ट्रिसियानखौ नागिर। | 1075.72ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **sat** | Santali (ᱥᱟᱱᱛᱟᱲᱤ) | Olck | `sat_Olck` | **PASS** | **PASS** | ᱤᱧ ᱥᱳᱨᱥᱳᱯᱳᱨ ᱢᱤᱫᱦᱚᱲ الیᱠᱨᱮᱥᱤᱭᱟᱱ ᱛᱚᱞᱟᱥ ᱢᱮ ᱾ | 967.04ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **mni** | Manipuri (Meitei) (মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ) | Beng | `mni_Beng` | **PASS** | **PASS** | ঐগী মনাক্তা ইলেক্ত্রিসিয়ন অমা লৈয়ু। | 1010.59ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |
| **doi** | Dogri (डोगरी) | Deva | `doi_Deva` | **PASS** | **PASS** | मेरे आस्सै-पास्सै इक बिजली मिस्त्री तुप्पो। | 993.68ms | **PASS** | **PASS** | UNSUPPORTED | UNSUPPORTED | **PASS** |

## 2. Verification Summary Counters

- **Product Languages Registered:** 23 / 23
- **IndicTrans2 Runtime Languages Verified:** 23 / 23
- **Central API Translation Verified:** 23 / 23
- **Chat AI Language Integration Verified:** 23 / 23
- **Hero AI Language Integration Verified:** 23 / 23
- **STT Voice Languages Verified:** 12 / 23
- **TTS Voice Languages Verified:** 12 / 23
- **System Status:** GREEN — 23/23 INDIVIDUALLY VERIFIED

## 3. Translation Output Highlights Across 23 Languages

### English (`en` / `eng_Latn`)
- **IndicTrans2 Output:** `Find an electrician near me.`
- **Node Relay Output:** `Find an electrician near me.`
- **Inference Latency:** 0 ms
- **Provider:** Default Source

### Hindi (`hi` / `hin_Deva`)
- **IndicTrans2 Output:** `मेरे पास एक बिजली मिस्त्री ढूँढें।`
- **Node Relay Output:** `मेरे पास एक बिजली मिस्त्री ढूँढें।`
- **Inference Latency:** 1437.93 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Tamil (`ta` / `tam_Taml`)
- **IndicTrans2 Output:** `எனக்கு அருகில் ஒரு எலக்ட்ரீஷியனைத் தேடுங்கள்.`
- **Node Relay Output:** `எனக்கு அருகில் ஒரு எலக்ட்ரீஷியனைத் தேடுங்கள்.`
- **Inference Latency:** 763.84 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Telugu (`te` / `tel_Telu`)
- **IndicTrans2 Output:** `నా దగ్గర ఎలక్ట్రీషియన్ వెతకండి.`
- **Node Relay Output:** `నా దగ్గర ఎలక్ట్రీషియన్ వెతకండి.`
- **Inference Latency:** 682.05 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Kannada (`kn` / `kan_Knda`)
- **IndicTrans2 Output:** `ನನ್ನ ಹತ್ತಿರದ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಅನ್ನು ಹುಡುಕಿ.`
- **Node Relay Output:** `ನನ್ನ ಹತ್ತಿರದ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಅನ್ನು ಹುಡುಕಿ.`
- **Inference Latency:** 766.83 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Bengali (`bn` / `ben_Beng`)
- **IndicTrans2 Output:** `আমার কাছাকাছি একজন ইলেকট্রিশিয়ানকে খুঁজে বের করুন।`
- **Node Relay Output:** `আমার কাছাকাছি একজন ইলেকট্রিশিয়ানকে খুঁজে বের করুন।`
- **Inference Latency:** 696.18 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Marathi (`mr` / `mar_Deva`)
- **IndicTrans2 Output:** `माझ्या जवळचा एक इलेक्ट्रिशियन शोधा.`
- **Node Relay Output:** `माझ्या जवळचा एक इलेक्ट्रिशियन शोधा.`
- **Inference Latency:** 625.49 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Gujarati (`gu` / `guj_Gujr`)
- **IndicTrans2 Output:** `મારી નજીક એક ઇલેક્ટ્રિશિયન શોધો.`
- **Node Relay Output:** `મારી નજીક એક ઇલેક્ટ્રિશિયન શોધો.`
- **Inference Latency:** 714.68 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Malayalam (`ml` / `mal_Mlym`)
- **IndicTrans2 Output:** `എന്റെ അടുത്തുള്ള ഒരു ഇലക്ട്രീഷ്യനെ കണ്ടെത്തുക.`
- **Node Relay Output:** `എന്റെ അടുത്തുള്ള ഒരു ഇലക്ട്രീഷ്യനെ കണ്ടെത്തുക.`
- **Inference Latency:** 785.16 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Punjabi (`pa` / `pan_Guru`)
- **IndicTrans2 Output:** `ਮੇਰੇ ਨੇਡ਼ੇ ਇੱਕ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਲੱਭੋ।`
- **Node Relay Output:** `ਮੇਰੇ ਨੇਡ਼ੇ ਇੱਕ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਲੱਭੋ।`
- **Inference Latency:** 830.62 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Odia (`or` / `ory_Orya`)
- **IndicTrans2 Output:** `ମୋ ପାଖରେ ଜଣେ ବିଦ୍ଯ଼ୁତଚାଳକଙ୍କୁ ଖୋଜନ୍ତୁ।`
- **Node Relay Output:** `ମୋ ପାଖରେ ଜଣେ ବିଦ୍ଯ଼ୁତଚାଳକଙ୍କୁ ଖୋଜନ୍ତୁ।`
- **Inference Latency:** 722.52 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Assamese (`as` / `asm_Beng`)
- **IndicTrans2 Output:** `মোৰ ওচৰৰ এজন ইলেক্ট্ৰিচিয়ান বিচাৰি উলিয়াওক।`
- **Node Relay Output:** `মোৰ ওচৰৰ এজন ইলেক্ট্ৰিচিয়ান বিচাৰি উলিয়াওক।`
- **Inference Latency:** 1005.48 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Urdu (`ur` / `urd_Arab`)
- **IndicTrans2 Output:** `میرے قریب کوئی الیکٹریشن تلاش کریں۔`
- **Node Relay Output:** `میرے قریب کوئی الیکٹریشن تلاش کریں۔`
- **Inference Latency:** 942.84 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Sanskrit (`sa` / `san_Deva`)
- **IndicTrans2 Output:** `मम समीपे विद्युद्वाहकम् अन्विष्यतु।`
- **Node Relay Output:** `मम समीपे विद्युद्वाहकम् अन्विष्यतु।`
- **Inference Latency:** 799.01 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Kashmiri (`ks` / `kas_Arab`)
- **IndicTrans2 Output:** `میانہ نزدیٖک ژھار اکھ الیکٹریشن۔`
- **Node Relay Output:** `میانہ نزدیٖک ژھار اکھ الیکٹریشن۔`
- **Inference Latency:** 840.32 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Sindhi (`sd` / `snd_Arab`)
- **IndicTrans2 Output:** `منھنجی ویجھو ڪو الیڪٽریشن ڳولھیو۔`
- **Node Relay Output:** `منھنجی ویجھو ڪو الیڪٽریشن ڳولھیو۔`
- **Inference Latency:** 706.16 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Nepali (`ne` / `npi_Deva`)
- **IndicTrans2 Output:** `मेरो नजिकको बिजुली मिस्त्री खोज्नुहोस्।`
- **Node Relay Output:** `मेरो नजिकको बिजुली मिस्त्री खोज्नुहोस्।`
- **Inference Latency:** 811.11 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Konkani (`kok` / `gom_Deva`)
- **IndicTrans2 Output:** `म्हजे लागसार एक वीजकार सोदून काड.`
- **Node Relay Output:** `म्हजे लागसार एक वीजकार सोदून काड.`
- **Inference Latency:** 972.62 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Maithili (`mai` / `mai_Deva`)
- **IndicTrans2 Output:** `हमरा लग कोनो बिजली मिस्त्री ताकू।`
- **Node Relay Output:** `हमरा लग कोनो बिजली मिस्त्री ताकू।`
- **Inference Latency:** 687.89 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Bodo (`brx` / `brx_Deva`)
- **IndicTrans2 Output:** `आंनि खाथिखाला सासे इलेक्ट्रिसियानखौ नागिर।`
- **Node Relay Output:** `आंनि खाथिखाला सासे इलेक्ट्रिसियानखौ नागिर।`
- **Inference Latency:** 1075.72 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Santali (`sat` / `sat_Olck`)
- **IndicTrans2 Output:** `ᱤᱧ ᱥᱳᱨᱥᱳᱯᱳᱨ ᱢᱤᱫᱦᱚᱲ الیᱠᱨᱮᱥᱤᱭᱟᱱ ᱛᱚᱞᱟᱥ ᱢᱮ ᱾`
- **Node Relay Output:** `ᱤᱧ ᱥᱳᱨᱥᱳᱯᱳᱨ ᱢᱤᱫᱦᱚᱲ الیᱠᱨᱮᱥᱤᱭᱟᱱ ᱛᱚᱞᱟᱥ ᱢᱮ ᱾`
- **Inference Latency:** 967.04 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Manipuri (Meitei) (`mni` / `mni_Beng`)
- **IndicTrans2 Output:** `ঐগী মনাক্তা ইলেক্ত্রিসিয়ন অমা লৈয়ু।`
- **Node Relay Output:** `ঐগী মনাক্তা ইলেক্ত্রিসিয়ন অমা লৈয়ু।`
- **Inference Latency:** 1010.59 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)

### Dogri (`doi` / `doi_Deva`)
- **IndicTrans2 Output:** `मेरे आस्सै-पास्सै इक बिजली मिस्त्री तुप्पो।`
- **Node Relay Output:** `मेरे आस्सै-पास्सै इक बिजली मिस्त्री तुप्पो।`
- **Inference Latency:** 993.68 ms
- **Provider:** IndicTrans2-200M (AI4Bharat) (cpu)


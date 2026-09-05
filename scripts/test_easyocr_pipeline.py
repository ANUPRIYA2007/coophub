#!/usr/bin/env python3
# ==============================================================================
# COOP HUB — Automated EasyOCR Operational Verification Suite
# Runs 12 comprehensive checkpoints for EasyOCR service, Node integration, and fallback
# ==============================================================================

import sys
import time
import requests
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("COOP HUB — EASYOCR OPERATIONAL VERIFICATION & PIPELINE TEST")
print("=" * 80)

passed = 0
failed = 0

def record_test(idx, title, fn):
    global passed, failed
    try:
        fn()
        print(f"[PASS] [EASYOCR-TEST {idx:02d}/12] {title}")
        passed += 1
    except Exception as e:
        print(f"[FAIL] [EASYOCR-TEST {idx:02d}/12] {title} -> {str(e)}")
        failed += 1

# Generate synthetic non-PII test image
def make_synthetic_fixture():
    img = Image.new("RGB", (600, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 590, 290], outline=(30, 64, 175), width=3)
    lines = ["COOP HUB OCR TEST", "ELECTRICIAN", "CHENNAI", "TEST DOCUMENT"]
    y = 40
    for line in lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 55
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=95)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

SYNTHETIC_FIXTURE = make_synthetic_fixture()

# Test 1: Service Health Endpoint
def t1():
    r = requests.get("http://127.0.0.1:8002/health", timeout=5)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data.get("status") == "HEALTHY", f"Expected HEALTHY, got {data.get('status')}"
    assert "en" in data.get("loaded_readers", []), "Expected 'en' reader loaded"
record_test(1, "EasyOCR Service Health Endpoint (GET /health)", t1)

# Test 2: EasyOCR Direct Inference (POST /ocr/easy)
def t2():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={
        "image": SYNTHETIC_FIXTURE,
        "documentType": "skill_certificate"
    }, timeout=15)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert "text" in data and len(data["text"]) > 10, "Expected non-empty text"
    assert "confidence" in data and data["confidence"] > 0.5, f"Low confidence: {data.get('confidence')}"
    assert data.get("engine") == "EasyOCR (Secondary Engine)", "Engine tag mismatch"
record_test(2, "EasyOCR Direct Inference with Valid Image (POST /ocr/easy)", t2)

# Test 3: Actual Text Recognition Accuracy
def t3():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={"image": SYNTHETIC_FIXTURE}, timeout=15)
    text = r.json().get("text", "").upper()
    assert "COOP" in text, "Missing 'COOP' in OCR output"
    assert "CHENNAI" in text, "Missing 'CHENNAI' in OCR output"
    assert "DOCUMENT" in text, "Missing 'DOCUMENT' in OCR output"
record_test(3, "Actual OCR Text Recognition Accuracy (Zero Fake Results)", t3)

# Test 4: Real Confidence Calculation
def t4():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={"image": SYNTHETIC_FIXTURE}, timeout=15)
    conf = r.json().get("confidence", 0)
    assert 0.50 <= conf <= 1.0, f"Unrealistic confidence score: {conf}"
record_test(4, "Confidence Metric Calculation & Verification", t4)

# Test 5: Reject Empty / Missing Image
def t5():
    r1 = requests.post("http://127.0.0.1:8002/ocr/easy", json={"image": ""})
    assert r1.status_code == 400, f"Expected 400 for empty image, got {r1.status_code}"
    r2 = requests.post("http://127.0.0.1:8002/ocr/easy", json={"foo": "bar"})
    assert r2.status_code == 422, f"Expected 422 for missing image, got {r2.status_code}"
record_test(5, "Safe Rejection of Empty or Missing Image Payloads", t5)

# Test 6: Reject Corrupted Base64 Input
def t6():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={"image": "data:image/jpeg;base64,invalid-binary-junk-here"})
    assert r.status_code == 400, f"Expected 400 for corrupted image, got {r.status_code}"
record_test(6, "Safe Rejection of Corrupt Base64 Input", t6)

# Test 7: Multi-Language Configuration
def t7():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={
        "image": SYNTHETIC_FIXTURE,
        "lang": ["en", "hi"]
    }, timeout=20)
    assert r.status_code == 200, f"Expected 200 for multilingual, got {r.status_code}"
record_test(7, "Multilingual Language Dispatcher Integration", t7)

# Test 8: Node.js Backend Integration (/api/ai/process-document)
def t8():
    r = requests.post("http://localhost:5000/api/ai/process-document", json={
        "document": SYNTHETIC_FIXTURE,
        "documentCategory": "skill_certificate",
        "expectedDocumentType": "skill_certificate",
        "pillarProfile": { "full_name": "Electrician" }
    }, timeout=20)
    assert r.status_code == 200, f"Expected 200 from Node.js, got {r.status_code}"
    data = r.json()
    assert data.get("success") is True, f"Pipeline failed: {data.get('error')}"
    assert data.get("ocr", {}).get("engine") == "EasyOCR (Secondary Engine)", f"Expected EasyOCR, got {data.get('ocr', {}).get('engine')}"
record_test(8, "Node.js End-to-End Pipeline Integration (/api/ai/process-document)", t8)

# Test 9: Node.js Alias Route (/api/ai/ocr/extract-document)
def t9():
    r = requests.post("http://localhost:5000/api/ai/ocr/extract-document", json={
        "document": SYNTHETIC_FIXTURE,
        "documentCategory": "skill_certificate",
        "expectedDocumentType": "skill_certificate",
        "pillarProfile": { "full_name": "Electrician" }
    }, timeout=20)
    assert r.status_code == 200, f"Expected 200 from alias route, got {r.status_code}"
    data = r.json()
    assert data.get("success") is True, f"Alias pipeline failed: {data.get('error')}"
    assert data.get("result", {}).get("ocr_provider") == "EasyOCR (Secondary Engine)", "Legacy provider mismatch"
record_test(9, "Node.js KYC Document Extraction Alias (/api/ai/ocr/extract-document)", t9)

# Test 10: Accurate Telemetry & Engine Typing
def t10():
    r = requests.post("http://localhost:5000/api/ai/process-document", json={
        "document": SYNTHETIC_FIXTURE,
        "documentCategory": "skill_certificate"
    }, timeout=20)
    data = r.json()
    assert data.get("ocr", {}).get("engine") == "EasyOCR (Secondary Engine)"
    assert data.get("result", {}).get("ocr_provider") == "EasyOCR (Secondary Engine)"
    assert data.get("ocr", {}).get("confidence") >= 50
record_test(10, "Provider Telemetry Verification (ocr_provider = EasyOCR)", t10)

# Test 11: Non-Fabrication Rule (Unmatched fields remain empty/absent)
def t11():
    r = requests.post("http://127.0.0.1:8002/ocr/easy", json={
        "image": SYNTHETIC_FIXTURE,
        "documentType": "aadhaar"
    }, timeout=15)
    fields = r.json().get("fields", {})
    # Since fixture contains no real Aadhaar 12-digit number, it must NOT be fabricated
    assert "aadhaar_number" not in fields or not fields["aadhaar_number"], f"Fabricated Aadhaar detected: {fields.get('aadhaar_number')}"
record_test(11, "Strict Non-Fabrication Rule (No Hallucinated Data)", t11)

# Test 12: Pipeline Graceful Fallback Preservation
def t12():
    # Calling Node.js with invalid base64 image should fail safely without crashing Node
    r = requests.post("http://localhost:5000/api/ai/process-document", json={
        "document": "data:image/jpeg;base64,invalid"
    }, timeout=10)
    assert r.status_code in (200, 400), f"Unexpected status: {r.status_code}"
    # Verify Node server is still alive
    r_health = requests.get("http://localhost:5000/api/health", timeout=5)
    assert r_health.status_code == 200, "Node.js crashed after invalid input"
record_test(12, "Server Stability & Error Isolation (No Server Crashes)", t12)

print("=" * 80)
print(f"VERIFICATION RESULTS: {passed}/12 CHECKPOINTS PASSED | {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
else:
    print("ALL 12 EASYOCR INTEGRATION CHECKPOINTS PASSED WITH ZERO REGRESSIONS!")
    sys.exit(0)

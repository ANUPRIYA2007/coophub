#!/usr/bin/env python3
"""
Generate safe non-PII synthetic document fixture for EasyOCR verification.
Contains:
  COOP HUB OCR TEST
  ELECTRICIAN
  CHENNAI
  TEST DOCUMENT
"""
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

def generate_synthetic_fixture():
    width, height = 600, 300
    image = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)

    # Draw border
    draw.rectangle([10, 10, width - 10, height - 10], outline=(30, 64, 175), width=3)
    
    # Text lines
    lines = [
        "COOP HUB OCR TEST",
        "ELECTRICIAN",
        "CHENNAI",
        "TEST DOCUMENT"
    ]
    
    y = 40
    for line in lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 55

    buf = BytesIO()
    image.save(buf, format="JPEG", quality=95)
    raw_bytes = buf.getvalue()
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"

if __name__ == "__main__":
    uri = generate_synthetic_fixture()
    print("FIXTURE_GENERATED_LENGTH:", len(uri))
    with open("scripts/fixture_data_uri.txt", "w") as f:
        f.write(uri)

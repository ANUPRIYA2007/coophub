#!/usr/bin/env python3
import os
import sys
import zipfile
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

model_dir = os.path.expanduser('~/.EasyOCR/model')
os.makedirs(model_dir, exist_ok=True)

# Remove any stale temp.zip
temp_file = os.path.join(model_dir, 'temp.zip')
if os.path.exists(temp_file):
    try:
        os.remove(temp_file)
    except Exception:
        pass

MODELS = [
    {
        'name': 'CRAFT Text Detector',
        'target_file': os.path.join(model_dir, 'craft_mlt_25k.pth'),
        'url': 'https://github.com/JaidedAI/EasyOCR/releases/download/pre-v1.1.6/craft_mlt_25k.zip',
        'zip_name': os.path.join(model_dir, 'craft_mlt_25k.zip')
    },
    {
        'name': 'English Recognition Model',
        'target_file': os.path.join(model_dir, 'english_g2.pth'),
        'url': 'https://github.com/JaidedAI/EasyOCR/releases/download/v1.3/english_g2.zip',
        'zip_name': os.path.join(model_dir, 'english_g2.zip')
    },
    {
        'name': 'Devanagari (Hindi) Recognition Model',
        'target_file': os.path.join(model_dir, 'devanagari.pth'),
        'url': 'https://github.com/JaidedAI/EasyOCR/releases/download/pre-v1.1.6/devanagari.zip',
        'zip_name': os.path.join(model_dir, 'devanagari.zip')
    },
    {
        'name': 'Tamil Recognition Model',
        'target_file': os.path.join(model_dir, 'tamil.pth'),
        'url': 'https://github.com/JaidedAI/EasyOCR/releases/download/v1.1.7/tamil.zip',
        'zip_name': os.path.join(model_dir, 'tamil.zip')
    }
]

def download_and_extract(item):
    target = item['target_file']
    if os.path.exists(target) and os.path.getsize(target) > 1000:
        print(f"✓ {item['name']} already exists at {target} ({os.path.getsize(target):,} bytes)")
        return True

    url = item['url']
    zip_path = item['zip_name']
    print(f"Downloading {item['name']} from {url}...")

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    resp = requests.get(url, headers=headers, stream=True, timeout=60)
    resp.raise_for_status()

    total = int(resp.headers.get('content-length', 0))
    downloaded = 0
    with open(zip_path, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=65536):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total > 0 and downloaded % (1024 * 1024 * 5) < 65536:
                    print(f"  Downloaded {downloaded / (1024*1024):.1f} MB / {total / (1024*1024):.1f} MB ({(downloaded/total)*100:.1f}%)")

    print(f"Extracting {zip_path} to {model_dir}...")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(model_dir)

    try:
        os.remove(zip_path)
    except Exception:
        pass

    if os.path.exists(target):
        print(f"✓ Successfully installed {item['name']} ({os.path.getsize(target):,} bytes)")
        return True
    else:
        print(f"Warning: Expected {target} after unzip, but file not found. Files in dir: {os.listdir(model_dir)}")
        return False

for m in MODELS:
    download_and_extract(m)

print("\nModel setup complete!")

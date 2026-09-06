import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, QrCode, ShieldCheck, AlertCircle, CheckCircle2, 
  Loader2, X, RefreshCw, Eye, Lock, FileText 
} from 'lucide-react';

const SERVER_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL)
  ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
  : '';

export default function UidaiQrScannerModal({ 
  isOpen, 
  onClose, 
  pillarProfile = {},
  onQrSuccess = () => {} 
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [decodedResult, setDecodedResult] = useState(null);
  const [rawTextPayload, setRawTextPayload] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize camera stream when camera tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanVideoFrames();
      }
    } catch (err) {
      console.warn('Camera initiation note:', err.message);
      setCameraError(`Camera error: ${err.message}. Please use the Image Upload or Text option.`);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Live BarcodeDetector scanning loop
  const scanVideoFrames = async () => {
    if (!videoRef.current || !streamRef.current) return;

    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            stopCamera();
            await processQrPayload(rawValue);
            return;
          }
        }
      } catch (detectErr) {
        // Continue loop
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrames);
  };

  // Send raw QR payload to server decoder
  const processQrPayload = async (payloadStr) => {
    if (!payloadStr) return;
    setProcessing(true);
    setStatusMessage('Decompressing UIDAI Secure QR & verifying cryptographic signature...');

    try {
      const res = await fetch(`${SERVER_BASE}/api/kyc/aadhaar/decode-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrPayload: payloadStr,
          pillarProfile
        })
      });

      const data = await res.json();
      if (data.success) {
        setDecodedResult(data);
      } else {
        setCameraError(data.error || 'Failed to decode UIDAI QR code.');
      }
    } catch (err) {
      setCameraError(`QR processing error: ${err.message}`);
    } finally {
      setProcessing(false);
      setStatusMessage('');
    }
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setCameraError(null);
    setStatusMessage('Scanning document image for UIDAI Secure QR...');

    try {
      // 1. Try browser native BarcodeDetector on image
      if ('BarcodeDetector' in window) {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = async (event) => {
          img.onload = async () => {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const codes = await detector.detect(img);
              if (codes.length > 0 && codes[0].rawValue) {
                await processQrPayload(codes[0].rawValue);
                return;
              }
              setCameraError('No readable QR code found in this image. Please upload a high-contrast original scan.');
              setProcessing(false);
            } catch (err) {
              setCameraError(`Image scan failed: ${err.message}`);
              setProcessing(false);
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Fallback: Read as text or pass payload
        setCameraError('Barcode detector is not supported in this browser. Please use Chrome/Edge or paste the raw QR data.');
        setProcessing(false);
      }
    } catch (err) {
      setCameraError(err.message);
      setProcessing(false);
    }
  };

  const handleApplyResult = () => {
    if (decodedResult) {
      onQrSuccess(decodedResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                UIDAI Secure QR Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative Cryptographic QR Extraction
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => { setActiveTab('camera'); setDecodedResult(null); setCameraError(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => { setActiveTab('file'); setDecodedResult(null); setCameraError(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image / PDF</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setDecodedResult(null); setCameraError(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Numeric Payload</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {processing && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                {statusMessage}
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{cameraError}</div>
            </div>
          )}

          {/* Mode 1: Camera Stream */}
          {activeTab === 'camera' && !decodedResult && (
            <div className="space-y-3">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-48 h-48 border-2 border-blue-500/80 rounded-2xl">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-0.5 -ml-0.5 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-0.5 -mr-0.5 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-0.5 -ml-0.5 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-0.5 -mr-0.5 rounded-br-lg" />
                    {/* Laser scanner effect */}
                    <div className="w-full h-0.5 bg-blue-400/80 shadow-[0_0_8px_#38bdf8] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Point your camera at the secure square QR code on the front or back of the Aadhaar card.
              </p>
            </div>
          )}

          {/* Mode 2: File Upload */}
          {activeTab === 'file' && !decodedResult && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors">
                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select image containing UIDAI QR Code
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP high-resolution photos
                </span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {/* Mode 3: Manual Numeric Payload */}
          {activeTab === 'manual' && !decodedResult && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Paste BigInt / Raw Numeric Payload from Scanner:
              </label>
              <textarea
                value={rawTextPayload}
                onChange={(e) => setRawTextPayload(e.target.value)}
                rows={4}
                placeholder="Paste UIDAI decimal stream or base64 QR string..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => processQrPayload(rawTextPayload)}
                disabled={!rawTextPayload.trim() || processing}
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
              >
                Decode Payload
              </button>
            </div>
          )}

          {/* Result Inspection Card */}
          {decodedResult && (
            <div className="space-y-3 animate-fade-in">
              <div className={`p-4 rounded-xl border ${
                decodedResult.authoritative_verified 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    decodedResult.authoritative_verified 
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {decodedResult.authoritative_verified ? 'OFFICIALLY VERIFIED (UIDAI DSC)' : 'AI-ASSISTED (SIGNATURE UNVERIFIED)'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    UIDAI Secure QR V2
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {decodedResult.signature_verification?.notice || 'QR payload extracted successfully.'}
                </p>
              </div>

              {/* Extracted Fields Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Extracted Identity Data:
                </div>
                <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {decodedResult.extracted_data?.full_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="text-slate-500">Masked Aadhaar:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {decodedResult.extracted_data?.document_number_masked || 'XXXX-XXXX-XXXX'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {decodedResult.extracted_data?.date_of_birth || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="text-slate-500">Gender:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {decodedResult.extracted_data?.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">District & State:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {decodedResult.extracted_data?.district}, {decodedResult.extracted_data?.state} ({decodedResult.extracted_data?.pincode})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero mock data policy active.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            {decodedResult && (
              <button
                type="button"
                onClick={handleApplyResult}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Extracted Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

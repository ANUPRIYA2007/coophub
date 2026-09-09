import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCcw, SwitchCamera, Upload, AlertCircle } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileFallbackRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            startCamera(facingMode);
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const stopCamera = () => {
        if (stream) {
            try {
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.warn("Track stop note:", e);
            }
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async (targetFacing = 'environment') => {
        setIsInitializing(true);
        setError(null);
        stopCamera();

        try {
            let mediaStream = null;
            // 1. Try preferred facing mode with ideal constraint
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: targetFacing },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
            } catch (firstErr) {
                // 2. Fallback to generic any video track (e.g. laptop webcam)
                console.info("Falling back to standard video input:", firstErr.message);
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.log("Video auto-play handled:", playErr);
                }
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Web camera access was not granted or is unavailable on this device. You can use your device camera or pick a photo directly below.");
        } finally {
            setIsInitializing(false);
        }
    };

    const handleFlipCamera = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        // Mirror if front camera
        if (facingMode === 'user') {
            context.translate(width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, width, height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `coophub_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                stopCamera();
                onCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.92);
    };

    const handleFallbackFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            stopCamera();
            onCapture(file);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Close Button */}
            <button 
                type="button"
                onClick={() => {
                    stopCamera();
                    onClose();
                }}
                className="absolute top-5 right-5 text-white/90 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-105 z-20"
                title="Close Camera"
            >
                <X size={22} />
            </button>

            <div className="w-full max-w-lg bg-navy-950 rounded-3xl overflow-hidden shadow-2xl border border-navy-700 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-navy-800 flex justify-between items-center bg-navy-900/80">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <h3 className="text-white font-bold text-base">Capture Service Issue Photo</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {stream && (
                            <button 
                                type="button"
                                onClick={handleFlipCamera}
                                className="text-xs text-navy-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center gap-1.5 transition-colors border border-navy-700"
                                title="Switch Camera"
                            >
                                <SwitchCamera size={14} /> Flip
                            </button>
                        )}
                        {error && (
                            <button 
                                type="button"
                                onClick={() => startCamera(facingMode)} 
                                className="text-orange-400 hover:text-orange-300 flex items-center gap-1.5 text-xs bg-orange-500/10 px-2.5 py-1.5 rounded-lg border border-orange-500/20"
                            >
                                <RefreshCcw size={14} /> Retry
                            </button>
                        )}
                    </div>
                </div>

                {/* Viewport */}
                <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                    {isInitializing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-white gap-3">
                            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-navy-200">Accessing camera hardware...</span>
                        </div>
                    )}

                    {error ? (
                        <div className="p-6 text-center space-y-4 max-w-sm">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                                <AlertCircle size={28} />
                            </div>
                            <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                            <button
                                type="button"
                                onClick={() => fileFallbackRef.current?.click()}
                                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                            >
                                <Upload size={14} /> Use Device Camera / Browse Photo
                            </button>
                        </div>
                    ) : (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                            {/* Viewfinder Guidelines */}
                            <div className="absolute inset-6 border-2 border-white/25 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                                <div className="flex justify-between">
                                    <div className="w-4 h-4 border-t-2 border-l-2 border-orange-400" />
                                    <div className="w-4 h-4 border-t-2 border-r-2 border-orange-400" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                        Frame the issue clearly
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="w-4 h-4 border-b-2 border-l-2 border-orange-400" />
                                    <div className="w-4 h-4 border-b-2 border-r-2 border-orange-400" />
                                </div>
                            </div>
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls Footer */}
                <div className="p-5 flex flex-col items-center gap-3 bg-navy-900 border-t border-navy-800">
                    <div className="flex items-center justify-center w-full relative">
                        {/* Shutter Button */}
                        <button
                            type="button"
                            onClick={handleCapture}
                            disabled={!!error || !stream || isInitializing}
                            className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 border-4 border-white flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                            title="Take Snapshot"
                        >
                            <Camera size={26} />
                        </button>
                    </div>

                    {/* Secondary Device Camera Fallback */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => fileFallbackRef.current?.click()}
                            className="text-xs text-navy-400 hover:text-orange-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Upload size={13} /> Or upload / snap via device photo picker
                        </button>
                        <input
                            ref={fileFallbackRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFallbackFileSelect}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCcw } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Unable to access camera. Please allow camera permissions in your browser.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to file
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.9);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
                <X size={24} />
            </button>

            <div className="w-full max-w-md bg-navy-900 rounded-3xl overflow-hidden shadow-2xl border border-navy-700">
                <div className="p-4 border-b border-navy-800 flex justify-between items-center">
                    <h3 className="text-white font-semibold">Take Photo</h3>
                    {error && (
                        <button onClick={startCamera} className="text-orange-400 hover:text-orange-300 flex items-center gap-2 text-sm">
                            <RefreshCcw size={16} /> Retry
                        </button>
                    )}
                </div>

                <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-black flex items-center justify-center">
                    {error ? (
                        <p className="text-red-400 text-sm text-center px-8">{error}</p>
                    ) : (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-6 flex justify-center bg-navy-900">
                    <button
                        onClick={handleCapture}
                        disabled={!!error || !stream}
                        className="w-16 h-16 rounded-full bg-orange-500 border-4 border-white flex items-center justify-center text-white hover:bg-orange-600 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <Camera size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
}

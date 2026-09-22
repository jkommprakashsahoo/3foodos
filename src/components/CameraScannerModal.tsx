// FoodWise AI: Operational Food Waste Capture Screen
// Clean, serious operational tool with camera viewfinder, upload, and test tray selector

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, AlertCircle, RefreshCw } from 'lucide-react';
import { SAMPLE_TRAYS, SampleTray } from '../data/sampleTrays.ts';
import { WasteScanResult } from '../types.ts';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: WasteScanResult, imagePreview: string) => void;
  geminiConfigured: boolean;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  geminiConfigured
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setAnalysisError(null);
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this frame. Please use image upload or test sample trays.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError('Live camera not available. Use file upload or test tray samples below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    processImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleTray = (sample: SampleTray) => {
    setCapturedImage(sample.dataUrl);
    stopCamera();
    processImage(sample.dataUrl);
  };

  const processImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/scan-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData,
          mimeType: 'image/jpeg'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze tray image.');
      }

      onAnalysisComplete(data.data, imageData);
    } catch (err: any) {
      console.error('[Vision analysis failed]', err);
      setAnalysisError('Unable to analyze image. Check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E2] rounded-lg w-full max-w-xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E5E2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Record Food Waste</h2>
            <p className="text-xs text-[#666666]">Step 1: Capture or upload tray image</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE] hover:text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Camera Area */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="relative w-full aspect-video bg-[#171717] rounded-md overflow-hidden flex items-center justify-center border border-[#E5E5E2]">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured food tray"
                className="w-full h-full object-cover"
              />
            ) : stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 text-[#888888]">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  {cameraError || 'Camera feed ready'}
                </p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Simple Viewfinder Overlay Frame */}
            {!capturedImage && (
              <div className="absolute inset-6 border border-white/20 pointer-events-none rounded-sm">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/80" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/80" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/80" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/80" />
              </div>
            )}

            {/* Inline processing state */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                <div className="flex items-center gap-2 bg-[#171717] px-3.5 py-2 rounded border border-[#333333] text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Analyzing image…</span>
                </div>
              </div>
            )}
          </div>

          {/* Inline Error Message */}
          {analysisError && (
            <div className="p-3 rounded bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C] flex items-center justify-between">
              <span>{analysisError}</span>
              <button
                onClick={() => capturedImage && processImage(capturedImage)}
                className="font-medium underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={captureFrame}
              disabled={isAnalyzing || !stream}
              className="flex-1 py-2 px-3 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 py-2 px-3 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF] transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-[#666666]" />
              <span>Upload image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Test Samples for Quick Evaluation */}
          <div className="pt-2 border-t border-[#E5E5E2]">
            <p className="text-[11px] font-medium text-[#666666] uppercase tracking-wider mb-2">
              Or select test sample tray
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_TRAYS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSampleTray(sample)}
                  disabled={isAnalyzing}
                  className="text-left p-1.5 rounded border border-[#E5E5E2] hover:border-[#CCCCCC] bg-[#F7F7F5] transition-colors"
                >
                  <img
                    src={sample.dataUrl}
                    alt={sample.name}
                    className="w-full h-12 object-cover rounded-xs mb-1"
                  />
                  <p className="text-[11px] font-medium text-[#171717] truncate">{sample.name}</p>
                  <p className="text-[10px] text-[#666666] capitalize">{sample.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FoodWise AI: Operational Food Waste Capture Screen
// Clean, serious operational tool with camera viewfinder, upload, and test tray selector

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, AlertCircle, RefreshCw } from 'lucide-react';
import { SAMPLE_TRAYS, SampleTray } from '../data/sampleTrays.ts';
import { WasteScanResult } from '../types.ts';
import { analyzeWasteImage } from '../services/waste.ts';
import { Badge } from './ui/Badge.tsx';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: WasteScanResult, imagePreview: string) => void;
  geminiConfigured: boolean;
  demoMode: boolean;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  geminiConfigured,
  demoMode
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [analysis, setAnalysis] = useState<WasteScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setAnalysis(null);
      setAnalysisError(null);
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

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

  const resetCapture = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setAnalysisError(null);
    void startCamera();
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
    setMimeType('image/jpeg');
    setAnalysis(null);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Choose an image file to continue.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError('This image is larger than 10 MB. Choose a smaller image and try again.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      setMimeType(file.type || 'image/jpeg');
      setAnalysis(null);
      stopCamera();
    };
    reader.onerror = () => setAnalysisError('Unable to read this image. Choose another file and try again.');
    reader.readAsDataURL(file);
  };

  const handleSelectSampleTray = (sample: SampleTray) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        setAnalysisError('Unable to prepare this demo image. Choose another tray or upload a photo.');
        return;
      }
      context.drawImage(image, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
      setMimeType('image/jpeg');
      setAnalysis(null);
      setAnalysisError(null);
      stopCamera();
    };
    image.onerror = () => setAnalysisError('Unable to load this demo image. Choose another tray or upload a photo.');
    image.src = sample.dataUrl;
  };

  const processImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await analyzeWasteImage(imageData, mimeType);
      setAnalysis(response.data);
    } catch (err: unknown) {
      console.error('[Vision analysis failed]', err);
      setAnalysisError(err instanceof Error ? err.message : 'Unable to analyze image. Check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waste-scanner-title"
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-[#E5E5E2] bg-white shadow-lg sm:h-auto sm:max-h-[92vh] sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E2] px-4 py-3.5 sm:px-5">
          <div>
            <h2 id="waste-scanner-title" className="text-sm font-semibold text-[#171717]">Record Food Waste</h2>
            <p className="text-xs text-[#666666]">Capture leftover food using your phone camera or upload an image.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close waste scanner"
            className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE] hover:text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!geminiConfigured && (
          <div role="status" className="border-b border-[#e9c9a6] bg-[#fff8ee] px-4 py-2 text-xs text-[#765124] sm:px-5">
            Live Gemini analysis is not configured for this workspace. Image analysis will report an error until the server key is set.
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {analysis && (
          <section className="rounded-md border border-[#e2e6e1] bg-white p-3" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#202821]">Visual assessment</h3>
                <p className="mt-1 text-xs text-[#68736a]">{analysis.overallAssessment}</p>
              </div>
              <Badge variant="estimated">AI estimate</Badge>
            </div>
            <div className="mt-3 divide-y divide-[#edf0ec]">
              {analysis.foodItems.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.wasteLevel === 'high' ? 'danger' : item.wasteLevel === 'medium' ? 'warning' : 'success'}>
                      {item.wasteLevel} waste
                    </Badge>
                    <span className="text-xs text-[#68736a]">{item.visualConfidencePercentage}% visual confidence</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-[#edf0ec] pt-2 text-xs font-medium text-[#72552b]">
              Human confirmation required. The image does not measure weight or certify food safety.
            </p>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetCapture} className="rounded-md border border-[#dfe4df] px-3 py-2 text-sm font-medium hover:bg-[#f3f5f2]">Retake image</button>
              <button type="button" onClick={() => capturedImage && onAnalysisComplete(analysis, capturedImage)} className="rounded-md bg-[#1f5c45] px-3 py-2 text-sm font-medium text-white hover:bg-[#194b39]">Review quantities</button>
            </div>
          </section>
        )}

        {/* Viewfinder / Camera Area */}
          <div className="relative flex min-h-[42vh] w-full flex-1 items-center justify-center overflow-hidden rounded-md border border-[#E5E5E2] bg-[#171717] sm:aspect-video sm:min-h-0 sm:flex-none">
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
                    {cameraError || 'Allow camera access or upload an image.'}
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
                onClick={() => capturedImage && void processImage(capturedImage)}
                className="font-medium underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={captureFrame}
              disabled={isAnalyzing || !stream || !!capturedImage}
              className="flex-1 py-2.5 px-3 rounded-md text-sm font-medium bg-[#1f5c45] hover:bg-[#194b39] text-white disabled:opacity-45 transition-colors flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{capturedImage ? 'Photo captured' : 'Capture'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 py-2.5 px-3 rounded-md text-sm font-medium border border-[#dfe4df] bg-white text-[#202821] hover:bg-[#f3f5f2] transition-colors flex items-center justify-center gap-1.5"
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

          {capturedImage && !analysis && (
            <div className="flex flex-col-reverse gap-2 border-t border-[#edf0ec] pt-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetCapture} disabled={isAnalyzing} className="rounded-md border border-[#dfe4df] px-3 py-2 text-sm font-medium hover:bg-[#f3f5f2] disabled:opacity-50">Retake</button>
              <button type="button" onClick={() => void processImage(capturedImage)} disabled={isAnalyzing} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1f5c45] px-3 py-2 text-sm font-medium text-white hover:bg-[#194b39] disabled:opacity-50">
                {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin" />Analyzing…</> : 'Analyze image'}
              </button>
            </div>
          )}

          {/* Test fixtures are deliberately available only when demo data is enabled. */}
          {demoMode && <div className="border-t border-[#E5E5E2] pt-3">
            <p className="text-[11px] font-medium text-[#666666] uppercase tracking-wider mb-2">
              Demo test trays
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SAMPLE_TRAYS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSampleTray(sample)}
                  disabled={isAnalyzing}
                  className="min-h-11 rounded border border-[#E5E5E2] bg-[#F7F7F5] p-1.5 text-left transition-colors hover:border-[#CCCCCC] disabled:opacity-50"
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
          </div>}
        </div>
      </div>
    </div>
  );
};

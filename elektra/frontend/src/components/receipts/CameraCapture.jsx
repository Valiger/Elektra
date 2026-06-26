import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize camera
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (!active) {
          // If unmounted before promise resolves
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    }

    startCamera();

    // Cleanup on unmount
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas to actual video resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Pause video to freeze the frame for the user
    video.pause();
    
    // Trigger success animation
    setIsSuccess(true);

    // Convert to file
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'scan_capture.jpg', { type: 'image/jpeg' });
        
        // Wait a brief moment so the user sees the green success frame
        setTimeout(() => {
          onCapture(file);
        }, 600);
      },
      'image/jpeg',
      0.9
    );
  }, [onCapture]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-[300px] bg-black/20 rounded-2xl">
        <span className="material-symbols-outlined text-4xl text-[#ffb4ab] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
          no_photography
        </span>
        <p className="text-[#ffb4ab] font-bold">Camera Access Denied</p>
        <p className="text-secondary text-sm mt-1 mb-4">Please allow camera permissions in your browser settings.</p>
        <button
          onClick={onCancel}
          className="text-xs font-bold text-on-surface underline underline-offset-2 opacity-70"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-black rounded-2xl overflow-hidden shadow-inner flex flex-col">
      {/* Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden Canvas for extracting image */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Target Guide Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-center">
        <div 
          className={`
            w-full flex-1 border-2 rounded-xl transition-colors duration-300 relative
            ${isSuccess ? 'border-[#4ade80] bg-[#4ade80]/10' : 'border-white/70'}
          `}
          style={{
            boxShadow: isSuccess ? '0 0 30px rgba(74, 222, 128, 0.4)' : '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Corner brackets for aesthetic scanning feel */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -ml-[2px] -mt-[2px] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mr-[2px] -mt-[2px] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -ml-[2px] -mb-[2px] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mr-[2px] -mb-[2px] rounded-br-lg" />
        </div>
        <p className="text-center text-white font-semibold text-sm mt-4 drop-shadow-md">
          {isSuccess ? 'Capture Successful!' : 'Align bill within frame'}
        </p>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-6 z-20 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent pt-12">
        <button
          onClick={onCancel}
          disabled={isSuccess}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur disabled:opacity-0 transition-opacity"
        >
          <span className="material-symbols-outlined text-white text-lg">close</span>
        </button>

        {/* Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={isSuccess}
          className={`
            w-16 h-16 rounded-full border-4 flex items-center justify-center transition-transform active:scale-95
            ${isSuccess ? 'border-[#4ade80]' : 'border-white'}
          `}
        >
          <div className={`w-12 h-12 rounded-full transition-colors ${isSuccess ? 'bg-[#4ade80]' : 'bg-white'}`} />
        </button>

        <div className="w-10 h-10" /> {/* Spacer for flex balance */}
      </div>
    </div>
  );
}

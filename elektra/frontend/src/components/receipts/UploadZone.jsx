import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import CameraCapture from './CameraCapture';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

/**
 * UploadZone
 *
 * Props:
 *   onScanSuccess(extractedData)  – called after scan completes
 *   scanning   – boolean from useReceipts
 *   scanError  – string | null
 *   onScan(file)  – scanBill action from useReceipts
 */
export default function UploadZone({ onScanSuccess, scanning, scanError, onScan }) {
  const [mode, setMode]           = useState('upload'); // 'upload' | 'camera'
  const [sizeError, setSizeError] = useState(null);
  const [preview, setPreview]     = useState(null); // data-URL for image preview

  const handleDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      setSizeError(null);

      // Handle rejected files (too large or wrong type)
      if (rejectedFiles.length > 0) {
        const tooBig = rejectedFiles.some((f) =>
          f.errors.some((e) => e.code === 'file-too-large')
        );
        setSizeError(
          tooBig
            ? 'File exceeds 10 MB. Please use a smaller image.'
            : 'Unsupported file type. Use JPEG, PNG, WebP, or PDF.'
        );
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Show preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      try {
        const result = await onScan(file);
        if (result) onScanSuccess(result);
      } catch {
        // scanError is set by the hook
      }
    },
    [onScan, onScanSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: scanning,
  });


  return (
    <div className="w-full">
      {/* Mode toggle */}
      {!scanning && !preview && (
        <div className="flex bg-[#2a2040] rounded-xl p-1 mb-4 shadow-inner">
          <button
            onClick={() => setMode('upload')}
            className={`
              flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200
              ${mode === 'upload' ? 'bg-[#403060] text-white shadow-md' : 'text-secondary opacity-70 hover:opacity-100'}
            `}
          >
            Upload File
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`
              flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200
              ${mode === 'camera' ? 'bg-[#403060] text-white shadow-md' : 'text-secondary opacity-70 hover:opacity-100'}
            `}
          >
            Use Camera
          </button>
        </div>
      )}

      {/* Outer glass card */}
      <div
        className="
          glass-panel rounded-3xl p-5
          transition-all duration-300
        "
        style={{
          background: isDragActive && mode === 'upload'
            ? 'rgba(233,196,0,0.08)'
            : 'rgba(180,150,230,0.18)',
        }}
      >
        {mode === 'camera' && !scanning && !preview ? (
          <div className="animate-fade-in">
            <CameraCapture
              onCancel={() => setMode('upload')}
              onCapture={async (file) => {
                setMode('upload'); // Reset UI mode
                setPreview(URL.createObjectURL(file)); // Show preview of captured image
                try {
                  const result = await onScan(file);
                  if (result) onScanSuccess(result);
                } catch {
                  // scanError handled by hook
                }
              }}
            />
          </div>
        ) : (
          /* Tonal dashed inner zone — uses box-shadow trick (no border) */
          <div
            {...getRootProps()}
            id="upload-dropzone"
            className="
              relative flex flex-col items-center justify-center
              rounded-2xl py-12 px-6 gap-5
              cursor-pointer select-none
              transition-all duration-300 outline-none
              min-h-[230px]
            "
          style={{
            background: isDragActive
              ? 'rgba(233,196,0,0.06)'
              : 'rgba(200,170,240,0.10)',
            boxShadow: isDragActive
              ? 'inset 0 0 0 2px rgba(233,196,0,0.6), 0 0 40px 4px rgba(233,196,0,0.08)'
              : 'inset 0 0 0 1.5px rgba(180,150,230,0.30)',
            /* Dashed effect via repeating gradient strip around edge */
            backgroundImage: isDragActive
              ? 'repeating-linear-gradient(0deg,rgba(233,196,0,0.35) 0,rgba(233,196,0,0.35) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(90deg,rgba(233,196,0,0.35) 0,rgba(233,196,0,0.35) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(180deg,rgba(233,196,0,0.35) 0,rgba(233,196,0,0.35) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(270deg,rgba(233,196,0,0.35) 0,rgba(233,196,0,0.35) 8px,transparent 8px,transparent 18px)'
              : 'repeating-linear-gradient(0deg,rgba(180,150,230,0.25) 0,rgba(180,150,230,0.25) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(90deg,rgba(180,150,230,0.25) 0,rgba(180,150,230,0.25) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(180deg,rgba(180,150,230,0.25) 0,rgba(180,150,230,0.25) 8px,transparent 8px,transparent 18px),repeating-linear-gradient(270deg,rgba(180,150,230,0.25) 0,rgba(180,150,230,0.25) 8px,transparent 8px,transparent 18px)',
            backgroundRepeat: 'no-repeat',
            backgroundPositionX: '0, 0, 100%, 0',
            backgroundPositionY: '0, 0, 0, 100%',
            backgroundSize: '1.5px 100%, 100% 1.5px, 1.5px 100%, 100% 1.5px',
          }}
        >
          <input {...getInputProps()} />

          {scanning ? (
            /* ── Scanning spinner ── */
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(233,196,0,0.12)' }}
              >
                {/* Spinning bolt */}
                <span
                  className="material-symbols-outlined text-primary text-4xl animate-spin"
                  style={{ fontVariationSettings: "'FILL' 1", animationDuration: '1.4s' }}
                >
                  bolt
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-on-surface font-semibold text-sm tracking-wide">
                  Scanning your bill…
                </p>
                <p className="text-secondary text-xs opacity-70">
                  OCR is reading your energy data
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-40 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(180,150,230,0.20)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #E9C400, #665500)',
                    animation: 'progressSlide 1.4s ease-in-out infinite',
                    width: '60%',
                  }}
                />
              </div>
            </div>
          ) : preview ? (
            /* ── Image preview ── */
            <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
              <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <img
                  src={preview}
                  alt="Bill preview"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(24,0,72,0.7))' }}
                />
              </div>
              <p className="text-secondary text-xs opacity-70">
                Tap to select a different file
              </p>
            </div>
          ) : (
            /* ── Default idle state ── */
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              {/* Icon circle */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300"
                style={{
                  background: isDragActive
                    ? 'rgba(233,196,0,0.18)'
                    : 'rgba(180,150,230,0.20)',
                  transform: isDragActive ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isDragActive
                    ? '0 0 24px rgba(233,196,0,0.22)'
                    : '0 0 0 rgba(0,0,0,0)',
                }}
              >
                <span
                  className="material-symbols-outlined text-4xl transition-colors duration-300"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                    color: isDragActive ? '#E9C400' : '#cfbfef',
                  }}
                >
                  bolt
                </span>
              </div>

              {/* Labels */}
              <div className="flex flex-col items-center gap-1.5">
                <p
                  className="font-headline font-bold text-base text-center transition-colors duration-300"
                  style={{ color: isDragActive ? '#E9C400' : '#e8ddff' }}
                >
                  {isDragActive ? 'Release to scan' : 'Drop your bill here'}
                </p>
                <p className="text-secondary text-sm opacity-70 text-center">
                  or tap to browse
                </p>
              </div>

              {/* Accepted formats badge */}
              <div className="flex gap-2 flex-wrap justify-center mt-1">
                {['JPG', 'PNG', 'WebP', 'PDF'].map((fmt) => (
                  <span
                    key={fmt}
                    className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(180,150,230,0.18)', color: '#cfbfef' }}
                  >
                    {fmt}
                  </span>
                ))}
                <span
                  className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(180,150,230,0.18)', color: '#cfbfef' }}
                >
                  Max 10 MB
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Error display ── */}
        {sizeError && (
          <div
            className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 animate-fade-in"
            style={{ background: 'rgba(255,100,100,0.10)' }}
          >
            <span
              className="material-symbols-outlined text-lg mt-0.5 flex-shrink-0"
              style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
            <p className="text-sm" style={{ color: '#ffb4ab' }}>
              {sizeError}
            </p>
          </div>
        )}
        {scanError && (
          <div
            className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 animate-fade-in"
            style={{ background: 'rgba(255,100,100,0.10)' }}
          >
            <span
              className="material-symbols-outlined text-lg mt-0.5 flex-shrink-0"
              style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ffb4ab' }}>
                {scanError}
              </p>
              <p className="text-xs mt-0.5 opacity-70" style={{ color: '#ffb4ab' }}>
                Try a clearer image — ensure good lighting and the full bill is visible.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes progressSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

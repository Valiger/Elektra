import React, { useEffect } from 'react';

/**
 * Toast
 *
 * Props:
 *   message   – string to display
 *   type      – 'success' | 'error' (default 'success')
 *   onDismiss – callback invoked after 3 s (or immediately on dismiss click)
 */
export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      className="fixed bottom-24 left-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] glass-panel animate-toast-in"
      style={{
        transform: 'translateX(-50%)',
        background: isError
          ? 'rgba(80,0,30,0.96)'
          : 'rgba(31,11,77,0.96)',
        border: isError
          ? '1px solid rgba(255,100,100,0.30)'
          : '1px solid rgba(233,196,0,0.30)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <span
        className="material-symbols-outlined text-base flex-shrink-0"
        style={{
          color: isError ? '#ffb4ab' : '#E9C400',
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {isError ? 'error' : 'check_circle'}
      </span>
      <span
        className="text-sm font-bold tracking-wide"
        style={{ color: isError ? '#ffb4ab' : '#E9C400' }}
      >
        {message}
      </span>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <span
          className="material-symbols-outlined text-sm"
          style={{ color: isError ? '#ffb4ab' : '#E9C400' }}
        >
          close
        </span>
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-toast-in {
          animation: toastIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>
    </div>
  );
}

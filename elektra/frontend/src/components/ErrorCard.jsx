import React from 'react';

/**
 * ErrorCard
 *
 * Props:
 *   message – error string to display
 *   hint    – optional secondary hint text (e.g. "Try a clearer image")
 *   compact – if true, use a smaller inline style
 */
export default function ErrorCard({ message, hint, compact = false }) {
  if (!message) return null;

  if (compact) {
    return (
      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3 animate-fade-in"
        style={{ background: 'rgba(255,100,100,0.10)' }}
        role="alert"
      >
        <span
          className="material-symbols-outlined text-base mt-0.5 flex-shrink-0"
          style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
        >
          bolt
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#ffb4ab' }}>
            {message}
          </p>
          {hint && (
            <p className="text-xs mt-0.5 opacity-70" style={{ color: '#ffb4ab' }}>
              {hint}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center animate-fade-in"
      style={{ background: 'rgba(255,60,60,0.08)' }}
      role="alert"
    >
      <span
        className="material-symbols-outlined text-4xl"
        style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
      >
        bolt
      </span>
      <div>
        <p className="font-headline font-bold text-base" style={{ color: '#ffb4ab' }}>
          {message}
        </p>
        {hint && (
          <p className="text-sm mt-1 opacity-70" style={{ color: '#ffb4ab' }}>
            {hint}
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}

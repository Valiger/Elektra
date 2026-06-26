import React from 'react';

/**
 * Spinner
 *
 * Props:
 *   size     – 'sm' | 'md' (default 'md')  controls circle size
 *   label    – optional text shown below the spinner (page-level)
 *   fullPage – if true, centres the spinner vertically in a flex container
 */
export default function Spinner({ size = 'md', label, fullPage = false }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  const circle = (
    <div
      className={`${dim} rounded-full border-2 border-b-primary border-primary/20 animate-spin flex-shrink-0`}
    />
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        {circle}
        {label && (
          <p className="text-on-surface-variant text-sm font-medium">{label}</p>
        )}
      </div>
    );
  }

  if (label) {
    return (
      <div className="flex items-center gap-2">
        {circle}
        <span className="text-on-surface-variant text-sm">{label}</span>
      </div>
    );
  }

  return circle;
}

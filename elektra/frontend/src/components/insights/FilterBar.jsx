import React from 'react';

const filters = [
  { label: 'This Month', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'All Time', value: 'all_time' },
];

export default function FilterBar({ activeFilter, setFilter }) {
  return (
    <div className="sticky top-20 z-30 px-6 py-4 flex justify-between gap-3 bg-[#180048]/90 backdrop-blur-xl">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`flex-1 py-2 text-[11px] sm:text-sm font-medium rounded-full transition-all whitespace-nowrap px-1 sm:px-2 ${
            activeFilter === f.value
              ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(233,196,0,0.3)]'
              : 'glass-panel text-secondary hover:opacity-80'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

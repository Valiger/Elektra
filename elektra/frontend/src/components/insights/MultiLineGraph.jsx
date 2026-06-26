import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// 7-colour palette for the multi-line chart
const PALETTE = [
  '#E9C400', // gold
  '#B48EFF', // lavender
  '#FF7EDB', // pink
  '#7EE8FF', // cyan
  '#FF9F7E', // peach
  '#90FF8A', // lime
  '#FF6B6B', // coral
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl p-3 shadow-lg text-[11px]"
      style={{ background: 'rgba(24,0,72,0.95)', border: 'none', minWidth: 140 }}
    >
      <p
        className="uppercase tracking-widest mb-2 font-bold"
        style={{ color: '#8b68c8', fontSize: 9 }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-bold text-on-surface">
            {entry.value?.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MultiLineGraph({ title, subtitle, series, periods, unit = '₱' }) {
  const [visible, setVisible] = useState(
    () => new Set(series.map((s) => s.field))
  );

  const toggle = (field) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        if (next.size > 1) next.delete(field); // keep at least one visible
      } else {
        next.add(field);
      }
      return next;
    });

  // Build recharts data: one object per period
  const chartData = periods.map((period, idx) => {
    const row = { period };
    series.forEach((s) => {
      row[s.field] = s.values[idx] ?? 0;
    });
    return row;
  });

  const singlePoint = chartData.length === 1;

  return (
    <div className="glass-panel rounded-[1.5rem] p-6 flex flex-col mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: '#8b68c8' }}
          >
            {subtitle}
          </p>
          <p className="font-headline font-black text-lg text-primary">
            {title}
          </p>
        </div>
        <span
          className="text-[10px] text-secondary uppercase tracking-widest mt-1 opacity-60"
        >
          {unit}
        </span>
      </div>

      {/* Toggle pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {series.map((s, i) => {
          const color = PALETTE[i % PALETTE.length];
          const on = visible.has(s.field);
          return (
            <button
              key={s.field}
              onClick={() => toggle(s.field)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-150"
              style={{
                background: on ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: on ? color : '#666',
                border: `1.5px solid ${on ? color : 'transparent'}`,
                boxShadow: on ? `0 0 8px ${color}44` : 'none',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[160px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-secondary text-sm opacity-50">
              No data for this period
            </span>
          </div>
        ) : singlePoint ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            {series.filter((s) => visible.has(s.field)).map((s) => (
              <div key={s.field} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: PALETTE[series.indexOf(s) % PALETTE.length] }}
                />
                <span className="text-[11px] text-secondary">{s.label}:</span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: PALETTE[series.indexOf(s) % PALETTE.length] }}
                >
                  {s.values[0]?.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cfbfef', fontSize: 9 }}
                dy={8}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(233,196,0,0.15)', strokeWidth: 1 }} />
              {series.map((s, i) =>
                visible.has(s.field) ? (
                  <Line
                    key={s.field}
                    type="monotone"
                    dataKey={s.field}
                    name={s.label}
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PALETTE[i % PALETTE.length], strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

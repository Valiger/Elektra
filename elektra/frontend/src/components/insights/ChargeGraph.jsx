import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPeso, formatKwh } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const formatted = unit === 'kWh' ? formatKwh(val) : formatPeso(val);
    return (
      <div className="bg-[#180048]/90 rounded-[12px] p-3 shadow-lg border-none pointer-events-none">
        <p className="text-secondary text-[10px] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-primary font-bold">{formatted}</p>
      </div>
    );
  }
  return null;
};

export default function ChargeGraph({ title, field, data, periods, aggregate, unit }) {
  const formattedAggregate = unit === 'kWh' ? formatKwh(aggregate) : formatPeso(aggregate);

  // Map to chartData for Recharts
  const chartData = (data || []).map((val, idx) => ({
    period: periods[idx],
    value: val,
  }));

  return (
    <div className="glass-panel rounded-[1.5rem] p-6 flex flex-col mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 w-full">
        <div className="font-headline font-black text-2xl text-primary mt-1">
          {formattedAggregate}
        </div>
        <div className="text-[10px] text-secondary uppercase tracking-widest text-right max-w-[120px] leading-tight mt-1">
          {title}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[120px] w-full relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-secondary text-sm">No data for this period</span>
          </div>
        ) : chartData.length === 1 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(233,196,0,0.8)] mb-2"></div>
            <span className="text-[9px] text-[#cfbfef] font-medium">{chartData[0].period}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${field}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(233,196,0,0.3)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(233,196,0,0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cfbfef', fontSize: 9 }}
                dy={10}
              />
              <Tooltip
                content={<CustomTooltip unit={unit} />}
                cursor={{ stroke: 'rgba(233,196,0,0.2)', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#E9C400"
                strokeWidth={3}
                fill={`url(#gradient-${field})`}
                activeDot={{ r: 6, fill: '#E9C400', strokeWidth: 0 }}
                dot={{ r: 4, fill: '#E9C400', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import cat1 from '../../../../asset/1.mp4';
import cat2 from '../../../../asset/2.mp4';
import cat3 from '../../../../asset/3.mp4';

// ── Charge chip config ────────────────────────────────────────────────────────
const CHARGES = [
  { key: 'gen_charge',          label: 'Generation',     color: '#E9C400', bg: 'rgba(233,196,0,0.14)'       },
  { key: 'transdel_charge',     label: 'Trans & Del',    color: '#d5bbff', bg: 'rgba(213,187,255,0.12)'     },
  { key: 'system_loss_charge',  label: 'System Loss',    color: '#ff9e80', bg: 'rgba(255,158,128,0.12)'     },
  { key: 'distsys_charge',      label: 'Distribution',   color: '#80cbc4', bg: 'rgba(128,203,196,0.12)'     },
  { key: 'supplysys_charge',    label: 'Supply Sys',     color: '#ce93d8', bg: 'rgba(206,147,216,0.12)'     },
  { key: 'mtrngsys_charge',     label: 'Metering Sys',   color: '#90caf9', bg: 'rgba(144,202,249,0.12)'     },
  { key: 'total_vat_charge',    label: 'VAT',            color: '#a5d6a7', bg: 'rgba(165,214,167,0.12)'     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === '') return null;
  const num = Number(n);
  return isNaN(num) ? null : num;
}

function formatPeso(n) {
  const v = fmt(n);
  if (v == null) return '—';
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChargePill({ label, amount, color, bg }) {
  const val = fmt(amount);
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl flex-shrink-0"
      style={{ background: bg, minWidth: 76 }}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
      <span className="font-headline font-bold text-[13px] text-on-surface">
        {val != null ? formatPeso(val) : '—'}
      </span>
    </div>
  );
}

function SpeechBubbleTip({ tip, index, videoUrl, align, objectPositionClass = 'object-center' }) {
  const glows = [
    'rgba(233,196,0,0.08)',
    'rgba(213,187,255,0.08)',
    'rgba(128,203,196,0.08)',
    'rgba(255,158,128,0.08)',
  ];

  // tip may be an object { title, description, savings_note } or a plain string
  const title       = typeof tip === 'string' ? `Tip ${index + 1}` : (tip?.title ?? `Tip ${index + 1}`);
  const description = typeof tip === 'string' ? tip : (tip?.description ?? '');
  const savings     = typeof tip === 'string' ? null : (tip?.savings_note ?? null);

  const isLeft = align === 'left';
  const bubbleRounded = isLeft ? 'rounded-[1.25rem] rounded-tl-sm' : 'rounded-[1.25rem] rounded-tr-sm';

  return (
    <div className={`flex items-start gap-3 w-full ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* The Cat Video */}
      <div 
        className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-full overflow-hidden relative flex items-center justify-center"
      >
        <video 
          src={videoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className={`w-full h-full object-cover ${objectPositionClass}`}
        />
      </div>

      {/* Speech Bubble */}
      <div
        className={`relative ${bubbleRounded} p-4 flex flex-col gap-0.5 group overflow-hidden flex-1`}
        style={{ background: 'rgba(180,150,230,0.12)', border: '1px solid rgba(180,150,230,0.2)' }}
      >
        {/* Subtle glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at ${isLeft ? '0%' : '100%'} 50%, ${glows[index % glows.length]} 0%, transparent 70%)` }}
        />
        
        {/* Text */}
        <div className="relative z-10 flex flex-col gap-0.5">
          <p className="font-bold text-on-surface text-sm leading-snug">{title}</p>
          {description && (
            <p className="text-secondary text-xs leading-relaxed opacity-80">{description}</p>
          )}
          {savings && (
            <p className="text-[10px] font-bold mt-1" style={{ color: '#80cbc4' }}>
              {savings}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ icon, label, value, color }) {
  return (
    <div
      className="flex-1 rounded-3xl p-5 flex flex-col justify-between gap-4 min-h-[130px]"
      style={{ background: 'rgba(180,150,230,0.12)' }}
    >
      <span
        className="material-symbols-outlined text-2xl"
        style={{ color }}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs text-secondary opacity-70 mb-1">{label}</p>
        <p className="font-headline font-bold text-xl text-on-surface">{value}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * CurrentInsights
 *
 * Props:
 *   receipt   – the active bill object (from save or from tapping a history row)
 *               Fields: billing_period, du_name, kwh_consumed, amount_due,
 *                       gen_charge, transdel_charge, system_loss_charge, distsys_charge,
 *                       supplysys_charge, mtrngsys_charge, total_vat_charge
 *   tips      – array of tip objects from POST /api/receipts/tips, or null
 *   history   – full receipts list (used for linear prediction from last 2 bills)
 */
export default function CurrentInsights({ receipt, tips, history = [] }) {
  // ── ALL hooks must run unconditionally (Rules of Hooks) ─────────────────────
  const { call } = useApi();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    call('GET', '/api/auth/profile').then(setUserProfile).catch(() => {});
  }, [call]);

  // Linear prediction from last 2 bills
  const prediction = useMemo(() => {
    if (!history || history.length < 2) return null;
    // history is ordered newest-first. We want the two most recent, ordered oldest-to-newest for the delta.
    const last2 = history.slice(0, 2).reverse();
    const kw1 = fmt(last2[0]?.kwh_consumed);
    const kw2 = fmt(last2[1]?.kwh_consumed);
    const am1 = fmt(last2[0]?.amount_due);
    const am2 = fmt(last2[1]?.amount_due);
    if (kw1 == null || kw2 == null || am1 == null || am2 == null) return null;
    const deltaKwh = kw2 - kw1;
    const deltaAmt = am2 - am1;
    return {
      kwh: Math.max(0, kw2 + deltaKwh).toFixed(1),
      amount: Math.max(0, am2 + deltaAmt).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [history]);

  // Normalise tips — may be array, may be raw string, may be null
  const tipsArray = useMemo(() => {
    let rawTips = tips;
    if (!rawTips && receipt?.tips_json) {
      try {
        rawTips = JSON.parse(receipt.tips_json);
      } catch (e) {
        console.error("Failed to parse historical tips", e);
      }
    }
    
    if (!rawTips) return [];
    if (Array.isArray(rawTips)) return rawTips.slice(0, 4);
    if (typeof rawTips === 'string') return [rawTips];
    return [];
  }, [tips, receipt]);

  // ── Early return after all hooks ─────────────────────────────────────────────
  if (!receipt) return null;

  const kwh       = fmt(receipt.kwh_consumed);
  const amountDue = fmt(receipt.amount_due);

  return (
    <div id="current-insights" className="flex flex-col gap-5 animate-card-in">

      {/* ── Section label ── */}
      <div>
        <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#ccc3d5' }}>
          Current Bill
        </p>
        <h2 className="font-headline text-2xl font-extrabold text-on-surface leading-tight mt-0.5">
          Receipt Insights
        </h2>
      </div>

      {/* ── Hero glass card: kWh + meta ── */}
      <section
        className="glass-panel rounded-[2.5rem] p-7 relative overflow-hidden"
        style={{
          background: 'rgba(180,150,230,0.13)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
        }}
      >
        {/* Decorative receipt icon top-right */}
        <div className="absolute top-0 right-0 p-5 select-none pointer-events-none">
          <span
            className="material-symbols-outlined text-7xl"
            style={{
              color: 'rgba(233,196,0,0.15)',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            receipt_long
          </span>
        </div>

        <div className="relative z-10">
          {/* kWh hero number */}
          <p className="text-sm text-secondary opacity-70 mb-1">Total Consumption</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span
              className="font-headline font-extrabold leading-none text-[3rem] sm:text-[3.5rem]"
              style={{ color: '#e9c400' }}
            >
              {kwh != null ? kwh.toLocaleString('en-PH', { maximumFractionDigits: 1 }) : '—'}
            </span>
            <span className="font-body text-xl font-medium text-secondary">kWh</span>
          </div>

          {/* Meta grid */}
          <div
            className="grid grid-cols-2 gap-5 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary opacity-60 mb-1">
                Billing Period
              </p>
              <p className="font-body font-semibold text-on-surface text-sm">
                {receipt.billing_period || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary opacity-60 mb-1">
                Utility (DU)
              </p>
              <p className="font-body font-semibold text-on-surface text-sm">
                {receipt.du_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary opacity-60 mb-1">
                Amount Due
              </p>
              <p className="font-headline font-bold text-primary text-base">
                {amountDue != null ? formatPeso(amountDue) : '—'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#E9C400', boxShadow: '0 0 6px #E9C400' }}
                />
                <p className="font-body font-semibold text-on-surface text-sm">Saved</p>
              </div>
            </div>
          </div>
          {/* Budget progress */}
          {userProfile?.budget_goal && amountDue != null && (
            <div className="pt-6 border-t border-white/10 mt-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-secondary opacity-60">
                  Monthly Budget Goal
                </p>
                <p className="text-xs font-bold" style={{ color: amountDue > userProfile.budget_goal ? '#ffb4ab' : '#a5d6a7' }}>
                  {formatPeso(userProfile.budget_goal)}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min(100, (amountDue / userProfile.budget_goal) * 100)}%`,
                    background: amountDue > userProfile.budget_goal ? '#ffb4ab' : '#a5d6a7'
                  }}
                />
              </div>
              {amountDue > userProfile.budget_goal && (
                <p className="text-[10px] text-[#ffb4ab] mt-1 text-right">You are over budget!</p>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ── Historical Trends ── */}
      {history && history.length > 1 && (
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60 mb-3">
            Historical Trends
          </p>
          <div className="glass-panel rounded-[2rem] p-5 h-[200px]" style={{ background: 'rgba(180,150,230,0.12)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...history].reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="billing_period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#ccc3d5' }} 
                  dy={10} 
                />
                <Tooltip 
                  contentStyle={{ background: '#2d2440', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#E9C400' }}
                  formatter={(val) => [`₱${val}`, 'Amount Due']}
                  labelStyle={{ color: '#ccc3d5', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount_due" 
                  stroke="#E9C400" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#E9C400', strokeWidth: 0 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Charge breakdown chips ── */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60 mb-3">
          Charge Breakdown
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {CHARGES.map((c) => (
            <ChargePill
              key={c.key}
              label={c.label}
              amount={receipt[c.key]}
              color={c.color}
              bg={c.bg}
            />
          ))}
        </div>
      </section>

      {/* ── AI Tips panel ── */}
      {tipsArray.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="material-symbols-outlined text-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lightbulb
            </span>
            <p className="font-headline font-bold text-on-surface">AI Energy Tips</p>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full ml-1"
              style={{ background: 'rgba(233,196,0,0.14)', color: '#E9C400' }}
            >
              {tipsArray.length} TIPS
            </span>
          </div>
          
          <div className="flex flex-col gap-4 mt-4">
            {tipsArray.map((tip, i) => {
              const videos = [cat1, cat2, cat3];
              const aligns = ['left', 'right', 'left'];
              const positions = ['object-center', 'object-[30%_center]', 'object-center'];
              return (
                <SpeechBubbleTip 
                  key={i} 
                  tip={tip} 
                  index={i} 
                  videoUrl={videos[i % 3]} 
                  align={aligns[i % 3]} 
                  objectPositionClass={positions[i % 3]}
                />
              );
            })}
          </div>

          {/* Show warning only when tips were just freshly generated */}
          {tips && (
            <div 
              className="mt-6 p-4 rounded-2xl flex items-start gap-3" 
              style={{ background: 'rgba(233,196,0,0.1)', border: '1px solid rgba(233,196,0,0.2)' }}
            >
              <span className="material-symbols-outlined mt-0.5 text-[#E9C400]" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
              <p className="text-sm text-[#E9C400] opacity-90 leading-relaxed">
                <strong>Tip limit reached.</strong> Your next scan today will no longer generate tips. Please wait 24 hours for your tip limit to reset.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Predicted Next Month ── */}
      {prediction && (
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60 mb-3">
            Predicted Next Month
          </p>
          <div className="flex gap-3">
            <PredictionCard
              icon="auto_graph"
              label="Estimated kWh"
              value={`${prediction.kwh} kWh`}
              color="#cfbfef"
            />
            <PredictionCard
              icon="payments"
              label="Estimated Cost"
              value={`₱${prediction.amount}`}
              color="#E9C400"
            />
          </div>
          <p className="text-[10px] text-secondary opacity-40 mt-2 text-center">
            Based on linear trend from last 2 bills
          </p>
        </section>
      )}

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-in { animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        /* hide scrollbar for chip row */
        #current-insights .flex::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

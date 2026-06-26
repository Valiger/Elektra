import React from 'react';
import GlassCard from '../GlassCard';
import { formatPeso, formatDate } from '../../utils/formatters';

function UserDUCard({ rate }) {
  if (!rate) {
    return (
      <GlassCard className="relative border border-primary/10">
        <p className="text-on-surface-variant text-sm text-center py-4">
          No cooperative set. Update your profile to see your rate.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="relative border border-primary/20 shadow-[0_0_40px_rgba(233,196,0,0.08)]">
      {/* "Your plan" badge */}
      <span className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30">
        Your Plan
      </span>

      {/* DU Name */}
      <h3 className="font-headline text-2xl font-bold text-on-surface mb-1 pr-24">
        {rate.du_name}
      </h3>

      {/* Rate — large golden */}
      <p className="font-headline text-4xl font-extrabold text-primary tracking-tight mt-2">
        {formatPeso(rate.rate_per_kwh)}
        <span className="text-lg font-semibold text-primary/70 ml-1">/ kWh</span>
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {rate.region && (
          <span className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
            <span className="material-symbols-outlined text-base">location_on</span>
            {rate.region}
          </span>
        )}
        {rate.effective_date && (
          <span className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            Effective {formatDate(rate.effective_date)}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

function DURateCard({ rate }) {
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-2 hover:border hover:border-primary/20 transition-all group overflow-hidden">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <p className="font-headline font-bold text-on-surface text-sm leading-tight flex-1 min-w-0 truncate">
          {rate.du_name}
        </p>
        {rate.region && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full shrink-0 max-w-[45%] overflow-hidden text-ellipsis whitespace-nowrap" title={rate.region}>
            {rate.region}
          </span>
        )}
      </div>

      <p className="font-headline text-xl font-extrabold text-primary">
        {formatPeso(rate.rate_per_kwh)}
        <span className="text-xs font-medium text-primary/60 ml-1">/ kWh</span>
      </p>

      {rate.effective_date && (
        <p className="text-on-surface-variant text-[10px]">
          {formatDate(rate.effective_date)}
        </p>
      )}
    </div>
  );
}

export default function InfoBoard({ userRate, allRates, loading }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';



  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span
          className="material-symbols-outlined text-primary text-5xl animate-spin"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          autorenew
        </span>
        <p className="text-on-surface-variant font-medium">Loading rates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 pt-6 pb-4">
      {/* Greeting */}
      <section>
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          {greeting} ⚡
        </h2>
        <p className="text-on-surface-variant text-sm font-medium mt-1">{today}</p>
      </section>

      {/* Your DU */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            electric_meter
          </span>
          <h3 className="font-headline font-bold text-on-surface uppercase tracking-widest text-xs">
            Your DU
          </h3>
        </div>
        <UserDUCard rate={userRate} />
      </section>

      {/* National Rates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              public
            </span>
            <h3 className="font-headline font-bold text-on-surface uppercase tracking-widest text-xs">
              National Rates
            </h3>
          </div>
          <span className="text-on-surface-variant text-[10px] font-medium">
            {allRates.length} DUs
          </span>
        </div>

        {allRates.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center py-8">
            No rate data available. Seed the database to populate rates.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allRates.map((rate, idx) => (
              <DURateCard key={rate.du_name + idx} rate={rate} />
            ))}
          </div>
        )}
      </section>

      {/* Footer blurb */}
      <p className="text-center text-on-surface-variant text-[10px] font-medium tracking-wide pb-2">
        Rates updated quarterly per ERC bulletin
      </p>
    </div>
  );
}

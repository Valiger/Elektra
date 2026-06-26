import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import FilterBar from '../components/insights/FilterBar';
import ChargeGraph from '../components/insights/ChargeGraph';
import MultiLineGraph from '../components/insights/MultiLineGraph';
import Spinner from '../components/Spinner';
import ErrorCard from '../components/ErrorCard';
import { useApi } from '../hooks/useApi';

// ── Section header ─────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-2">
      <span
        className="material-symbols-outlined text-base text-primary opacity-80"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-70">
        {title}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(139,104,200,0.15)' }} />
    </div>
  );
}

// ── Charge amounts multi-line series definition ────────────────────
const CHARGE_SERIES = [
  { field: 'gen_charge',         label: 'Gen. Charge' },
  { field: 'transdel_charge',    label: 'Trans. & Del.' },
  { field: 'system_loss_charge', label: 'System Loss' },
  { field: 'distsys_charge',     label: 'Dist. Sys.' },
  { field: 'supplysys_charge',   label: 'Supply Sys.' },
  { field: 'mtrngsys_charge',    label: 'Mtrng. Sys.' },
  { field: 'cb_surcharge',       label: 'CB Surcharge' },
];

// ── Rate multi-line series definition ─────────────────────────────
const RATE_SERIES = [
  { field: 'gen_charge_rate',       label: 'Gen. Rate' },
  { field: 'transdel_charge_rate',  label: 'Trans. Rate' },
  { field: 'system_loss_rate',      label: 'Sys. Loss Rate' },
  { field: 'distsys_charge_rate',   label: 'Dist. Rate' },
  { field: 'supplysys_charge_rate', label: 'Supply Rate' },
  { field: 'mtrngsys_charge_rate',  label: 'Mtrng. Rate' },
];

// ── Build series array with values from API data ───────────────────
function buildSeries(seriesDefs, graphs) {
  return seriesDefs.map((s) => ({
    ...s,
    values: graphs?.[s.field]?.values ?? [],
  }));
}

export default function InsightsPage() {
  const [filter, setFilter] = useState('monthly');
  const [insightsData, setInsightsData] = useState(null);
  const { call, loading, error } = useApi();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await call(
          'GET',
          `/api/receipts/stats?filter=${filter}`
        );
        setInsightsData(data);
      } catch {
        // error stored in useApi error state
      }
    };
    fetchInsights();
  }, [filter, call]);

  const hasData = insightsData && insightsData.periods?.length > 0;
  const periods = insightsData?.periods ?? [];
  const graphs = insightsData?.graphs ?? {};

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <FilterBar activeFilter={filter} setFilter={setFilter} />

      <div className="px-6 pb-28 pt-2">
        {loading && !insightsData ? (
          <Spinner fullPage label="Loading insights…" />
        ) : error ? (
          <div className="mt-6">
            <ErrorCard message="Could not load insights" hint={error} />
          </div>
        ) : !hasData ? (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center mt-4"
            style={{ background: 'rgba(180,150,230,0.08)' }}
          >
            <span
              className="material-symbols-outlined text-5xl opacity-30 text-secondary"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              bar_chart
            </span>
            <div>
              <p className="font-headline font-bold text-on-surface text-base">
                No data yet
              </p>
              <p className="text-secondary text-sm opacity-60 mt-1">
                Scan your first electric bill on the Receipts tab to see
                your usage trends.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* ── 1. Consumption ─────────────────────────────────── */}
            <SectionHeader icon="electric_bolt" title="Consumption" />
            <ChargeGraph
              title="kWh Consumed"
              field="kwh_consumed"
              unit="kWh"
              data={graphs.kwh_consumed?.values ?? []}
              periods={periods}
              aggregate={graphs.kwh_consumed?.aggregate ?? 0}
            />

            {/* ── 2. Total Bill ──────────────────────────────────── */}
            <SectionHeader icon="receipt_long" title="Total Bill" />
            <ChargeGraph
              title="Total Amt. After Due"
              field="total_amt_after_due"
              unit="₱"
              data={graphs.total_amt_after_due?.values ?? []}
              periods={periods}
              aggregate={graphs.total_amt_after_due?.aggregate ?? 0}
            />

            {/* ── 3. Charge Breakdown ────────────────────────────── */}
            <SectionHeader icon="bar_chart" title="Charge Breakdown" />
            <MultiLineGraph
              title="Charge Amounts"
              subtitle="Per billing period"
              series={buildSeries(CHARGE_SERIES, graphs)}
              periods={periods}
              unit="₱"
            />

            {/* ── 4. Rate History ────────────────────────────────── */}
            <SectionHeader icon="trending_up" title="Rate History" />
            <MultiLineGraph
              title="Charge Rates"
              subtitle="₱ per kWh"
              series={buildSeries(RATE_SERIES, graphs)}
              periods={periods}
              unit="₱/kWh"
            />

          </div>
        )}
      </div>
    </div>
  );
}

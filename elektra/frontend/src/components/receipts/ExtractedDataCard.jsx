import React, { useState } from 'react';

/**
 * BILL_FIELDS — ordered list of all editable fields shown after scan.
 * Grouped into: meta, amounts, rates, surcharges & total.
 */
const BILL_FIELDS = [
  // ── Meta ─────────────────────────────────────────────────────────
  { key: 'billing_period',       label: 'Billing Period',              unit: '',       type: 'text',   group: 'meta' },
  { key: 'du_name',              label: 'Distribution Utility',        unit: '',       type: 'text',   group: 'meta' },
  { key: 'kwh_consumed',        label: 'Consumption',                 unit: 'kWh',   type: 'number', group: 'meta' },

  // ── Charge amounts ────────────────────────────────────────────────
  { key: 'gen_charge',           label: 'Generation Charge',           unit: '₱',     type: 'number', group: 'amount' },
  { key: 'transdel_charge',      label: 'Trans. & Delivery Charge',    unit: '₱',     type: 'number', group: 'amount' },
  { key: 'system_loss_charge',   label: 'System Loss Charge',          unit: '₱',     type: 'number', group: 'amount' },
  { key: 'distsys_charge',       label: 'Distribution Sys. Charge',    unit: '₱',     type: 'number', group: 'amount' },
  { key: 'supplysys_charge',     label: 'Supply Sys. Charge',          unit: '₱',     type: 'number', group: 'amount' },
  { key: 'mtrngsys_charge',      label: 'Metering Sys. Charge',        unit: '₱',     type: 'number', group: 'amount' },
  { key: 'total_vat_charge',     label: 'Total VAT',                   unit: '₱',     type: 'number', group: 'amount' },

  // ── Charge rates (₱/kWh) ─────────────────────────────────────────
  { key: 'gen_charge_rate',      label: 'Gen. Charge Rate',            unit: '₱/kWh', type: 'number', group: 'rate' },
  { key: 'transdel_charge_rate', label: 'Trans. & Del. Rate',          unit: '₱/kWh', type: 'number', group: 'rate' },
  { key: 'system_loss_rate',     label: 'System Loss Rate',            unit: '₱/kWh', type: 'number', group: 'rate' },
  { key: 'distsys_charge_rate',  label: 'Distribution Sys. Rate',      unit: '₱/kWh', type: 'number', group: 'rate' },
  { key: 'supplysys_charge_rate',label: 'Supply Sys. Rate',            unit: '₱/kWh', type: 'number', group: 'rate' },
  { key: 'mtrngsys_charge_rate', label: 'Metering Sys. Rate',          unit: '₱/kWh', type: 'number', group: 'rate' },

  // ── Surcharges & totals ───────────────────────────────────────────
  { key: 'amount_due',           label: 'Current Bill',                unit: '₱',     type: 'number', group: 'total' },
  { key: 'cb_surcharge',         label: 'CB Surcharge',                unit: '₱',     type: 'number', group: 'total' },
  { key: 'cb_vat_surcharge',     label: 'CB VAT Surcharge',            unit: '₱',     type: 'number', group: 'total' },
  { key: 'total_amt_after_due',  label: 'Total Amt. After Due',        unit: '₱',     type: 'number', group: 'total' },
];

const HIGH_CONFIDENCE = 0.70;

const GROUP_LABELS = {
  meta: null,
  amount: 'Charge Breakdown',
  rate: 'Rates (₱ / kWh)',
  total: 'Bill Totals',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }) {
  const isHigh = (confidence ?? 0) >= HIGH_CONFIDENCE;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
      style={
        isHigh
          ? { background: 'rgba(50,200,100,0.15)', color: '#4ade80' }
          : { background: 'rgba(233,196,0,0.15)', color: '#E9C400' }
      }
    >
      {isHigh ? '✓' : '?'}
    </span>
  );
}

function FieldRow({ fieldMeta, value, confidence, onChange }) {
  const isHigh = (confidence ?? 0) >= HIGH_CONFIDENCE;
  const displayValue =
    value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: '#ccc3d5' }}
        >
          {fieldMeta.label}
        </span>
        <ConfidenceBadge confidence={confidence} />
      </div>

      <div
        className="rounded-xl flex items-center gap-2 transition-shadow duration-200"
        style={{
          background: isHigh
            ? 'rgba(200,170,240,0.12)'
            : 'rgba(200,170,240,0.14)',
          boxShadow: isHigh
            ? 'none'
            : '0 0 0 1.5px rgba(233,196,0,0.55)',
        }}
      >
        {fieldMeta.unit === '₱' && (
          <span className="pl-4 text-primary font-bold text-sm">₱</span>
        )}
        <input
          id={`bill-field-${fieldMeta.key}`}
          type={fieldMeta.type}
          step={fieldMeta.type === 'number' ? 'any' : undefined}
          value={displayValue}
          onChange={(e) => onChange(fieldMeta.key, e.target.value)}
          placeholder={`Enter ${fieldMeta.label.toLowerCase()}`}
          className="
            flex-1 bg-transparent py-2.5 text-sm text-on-surface font-semibold
            outline-none placeholder:text-secondary placeholder:opacity-40
            pr-4
          "
          style={{ paddingLeft: fieldMeta.unit === '₱' ? '4px' : '16px' }}
        />
        {(fieldMeta.unit === 'kWh' || fieldMeta.unit === '₱/kWh') && (
          <span className="pr-4 text-secondary text-xs opacity-60">
            {fieldMeta.unit}
          </span>
        )}
      </div>
    </div>
  );
}

function GroupSection({ label, children }) {
  if (!label) return <>{children}</>;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 mt-2">
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: '#8b68c8' }}
        >
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(139,104,200,0.2)' }} />
      </div>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ExtractedDataCard({
  scanResult,
  saving,
  saveError,
  onSave,
  onRescan,
}) {
  const [formData, setFormData] = useState(() => {
    const fields = scanResult?.data ?? {};
    return BILL_FIELDS.reduce((acc, f) => {
      acc[f.key] = fields[f.key] ?? null;
      return acc;
    }, {});
  });
  const [manuallyAdded, setManuallyAdded] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { id: Date.now(), key: '', value: '' }]);
  };

  const handleCustomFieldChange = (id, field, val) => {
    setCustomFields(prev => prev.map(cf => cf.id === id ? { ...cf, [field]: val } : cf));
  };

  const confidences = scanResult?.data?._confidences ?? {};

  const handleChange = (key, rawValue) => {
    setFormData((prev) => ({
      ...prev,
      [key]: rawValue === '' ? null : rawValue,
    }));
  };

  const handleSave = async () => {
    const payload = { image_filename: scanResult?.image_filename || null };
    BILL_FIELDS.forEach((f) => {
      const v = formData[f.key];
      if (f.type === 'number') {
        payload[f.key] = v === null || v === '' ? null : parseFloat(v);
      } else {
        payload[f.key] = v || null;
      }
    });

    const cFields = {};
    customFields.forEach(cf => {
      if (cf.key && cf.value !== '') {
        const num = parseFloat(cf.value);
        cFields[cf.key] = isNaN(num) ? cf.value : num;
      }
    });
    if (Object.keys(cFields).length > 0) {
      payload.custom_fields = cFields;
    }

    await onSave(payload);
  };

  const visibleFields = BILL_FIELDS.filter((f) => {
    const essential = ['billing_period', 'du_name', 'kwh_consumed', 'amount_due'];
    if (essential.includes(f.key) || manuallyAdded.includes(f.key)) return true;
    const val = scanResult?.data?.[f.key];
    return val !== null && val !== undefined;
  });

  const hiddenFields = BILL_FIELDS.filter(f => !visibleFields.includes(f));

  const lowCount = visibleFields.filter(
    (f) => (confidences[f.key] ?? 0) < HIGH_CONFIDENCE
  ).length;

  // Group fields
  const groups = ['meta', 'amount', 'rate', 'total'];

  return (
    <div className="w-full flex flex-col gap-4 animate-card-in">
      {/* ── Header ── */}
      <div className="glass-panel rounded-3xl px-5 pt-5 pb-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: '#ccc3d5' }}
            >
              Extracted Data
            </p>
            <h2 className="font-headline text-xl font-bold text-on-surface mt-0.5">
              Review Your Bill
            </h2>
          </div>
          <button
            id="rescan-btn"
            onClick={onRescan}
            disabled={saving}
            className="text-xs font-bold text-secondary underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity pt-1 disabled:pointer-events-none"
          >
            Re-scan
          </button>
        </div>

        {lowCount > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
            style={{ background: 'rgba(233,196,0,0.10)' }}
          >
            <span
              className="material-symbols-outlined text-base flex-shrink-0"
              style={{ color: '#E9C400', fontVariationSettings: "'FILL' 1" }}
            >
              edit_note
            </span>
            <p className="text-[11px] leading-snug" style={{ color: '#E9C400' }}>
              <strong>{lowCount} field{lowCount > 1 ? 's' : ''}</strong> may
              need correction — highlighted in gold below.
            </p>
          </div>
        )}

        {/* ── Field groups ── */}
        <div className="flex flex-col gap-3 pb-5">
          {groups.map((group) => {
            const groupFields = visibleFields.filter((f) => f.group === group);
            if (groupFields.length === 0) return null;
            return (
              <GroupSection key={group} label={GROUP_LABELS[group]}>
                {groupFields.map((field) => (
                  <FieldRow
                    key={field.key}
                    fieldMeta={field}
                    value={formData[field.key]}
                    confidence={confidences[field.key]}
                    onChange={handleChange}
                  />
                ))}
              </GroupSection>
            );
          })}
          
          {customFields.length > 0 && (
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-[rgba(139,104,200,0.2)]">
              <span
                className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: '#8b68c8' }}
              >
                Custom Fields
              </span>
              {customFields.map((cf) => (
                <div key={cf.id} className="flex flex-col gap-2 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="text"
                    value={cf.key}
                    onChange={(e) => handleCustomFieldChange(cf.id, 'key', e.target.value)}
                    placeholder="Field Name (e.g. Subsidy)"
                    className="bg-transparent text-sm text-on-surface font-semibold outline-none placeholder:text-secondary placeholder:opacity-40"
                  />
                  <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <input
                    type="text"
                    value={cf.value}
                    onChange={(e) => handleCustomFieldChange(cf.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="bg-transparent text-sm text-on-surface font-semibold outline-none placeholder:text-secondary placeholder:opacity-40"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {hiddenFields.length > 0 && (
              <select
                className="bg-[rgba(233,196,0,0.1)] hover:bg-[rgba(233,196,0,0.2)] transition-colors text-[#E9C400] font-bold text-xs outline-none border border-[rgba(233,196,0,0.3)] rounded-xl px-4 py-2 cursor-pointer"
                onChange={(e) => {
                  if (e.target.value) {
                    const val = e.target.value;
                    setManuallyAdded(prev => prev.includes(val) ? prev : [...prev, val]);
                  }
                }}
                value=""
              >
                <option value="" disabled>+ Add missing field</option>
                {hiddenFields.map(f => (
                  <option key={f.key} value={f.key} className="bg-[#2d2440] text-white">
                    {f.label}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAddCustomField}
              className="bg-[rgba(139,104,200,0.1)] hover:bg-[rgba(139,104,200,0.2)] transition-colors text-[#ce93d8] font-bold text-xs outline-none border border-[rgba(139,104,200,0.3)] rounded-xl px-4 py-2 cursor-pointer"
            >
              + Add Custom Field
            </button>
          </div>
        </div>
      </div>

      {/* ── Save error ── */}
      {saveError && (
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,100,100,0.10)' }}
        >
          <span
            className="material-symbols-outlined text-lg mt-0.5 flex-shrink-0"
            style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
          >
            error
          </span>
          <p className="text-sm" style={{ color: '#ffb4ab' }}>{saveError}</p>
        </div>
      )}

      {/* ── Save button ── */}
      <button
        id="save-receipt-btn"
        onClick={handleSave}
        disabled={saving}
        className="
          w-full rounded-2xl py-4 font-headline font-bold text-base
          flex items-center justify-center gap-2.5
          transition-all duration-200 active:scale-[0.97]
          disabled:opacity-60 disabled:pointer-events-none
        "
        style={{
          background: saving
            ? 'rgba(180,150,230,0.25)'
            : 'linear-gradient(135deg, #E9C400 0%, #665500 100%)',
          color: saving ? '#cfbfef' : '#3a3000',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(233,196,0,0.25)',
        }}
      >
        {saving ? (
          <>
            <span
              className="material-symbols-outlined text-xl animate-spin"
              style={{ fontVariationSettings: "'FILL' 1", animationDuration: '1.2s' }}
            >
              bolt
            </span>
            Saving &amp; getting tips…
          </>
        ) : (
          <>
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              save
            </span>
            Save Receipt
          </>
        )}
      </button>

      {/* Confidence legend */}
      <div className="flex items-center justify-center gap-4 pb-2 opacity-60">
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#4ade80' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
          High confidence
        </span>
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#E9C400' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: '#E9C400' }} />
          Review required
        </span>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-in { animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
    </div>
  );
}

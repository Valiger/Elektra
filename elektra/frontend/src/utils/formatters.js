/**
 * Format a peso value: ₱1,234.56
 */
export function formatPeso(val) {
  if (val == null) return '—';
  return `₱${Number(val).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/**
 * Format a kWh value: 1,234.56 kWh
 */
export function formatKwh(val) {
  if (val == null) return '—';
  return `${Number(val).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kWh`;
}

/**
 * Format an ISO date string: Jan 1, 2024
 */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

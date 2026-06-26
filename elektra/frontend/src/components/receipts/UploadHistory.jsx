import React, { useState, useEffect, useCallback } from 'react';
import ErrorCard from '../ErrorCard';

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  const v = Number(n);
  return isNaN(v) ? null : v;
}
function formatPeso(n) {
  const v = fmt(n);
  if (v == null) return '—';
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ receipt, onConfirm, onCancel, deleting }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(12,0,36,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: 'rgba(49,16,117,0.98)' }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(255,100,100,0.12)' }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
          >
            delete
          </span>
        </div>
        {/* Text */}
        <div className="text-center">
          <h3 className="font-headline font-bold text-on-surface text-lg">Delete Receipt?</h3>
          <p className="text-secondary text-sm opacity-70 mt-1">
            {receipt?.billing_period
              ? `${receipt.billing_period} · ${receipt.du_name || 'Unknown DU'}`
              : 'This receipt'}{' '}
            will be permanently removed.
          </p>
        </div>
        {/* Buttons */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-secondary transition-opacity"
            style={{ background: 'rgba(180,150,230,0.14)' }}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'rgba(255,100,100,0.18)', color: '#ffb4ab' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Receipt row ───────────────────────────────────────────────────────────────
function ReceiptRow({ receipt, onTap, onDeleteRequest, active }) {
  const kwh = fmt(receipt.kwh_consumed);

  return (
    <div
      id={`receipt-row-${receipt.id}`}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 cursor-pointer transition-all duration-200 relative"
      style={{
        background: active
          ? 'rgba(233,196,0,0.10)'
          : 'rgba(180,150,230,0.08)',
        boxShadow: active
          ? 'inset 0 0 0 1.5px rgba(233,196,0,0.30)'
          : 'none',
      }}
      onClick={() => onTap(receipt)}
    >
      {/* Thumbnail / icon */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: active ? 'rgba(233,196,0,0.16)' : 'rgba(180,150,230,0.14)' }}
      >
        {receipt.image_filename ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/uploads/${receipt.image_filename}`}
            alt="Bill thumbnail"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span
            className="material-symbols-outlined text-xl"
            style={{
              color: active ? '#E9C400' : '#cfbfef',
              fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            receipt_long
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-body font-semibold text-on-surface text-sm truncate">
          {receipt.billing_period || 'Unknown Period'}
        </p>
        <p className="text-[11px] text-secondary opacity-60 truncate">
          {receipt.du_name || 'Unknown DU'}
          {kwh != null && (
            <span className="ml-2 font-bold" style={{ color: active ? '#E9C400' : '#cfbfef' }}>
              {kwh.toLocaleString('en-PH', { maximumFractionDigits: 1 })} kWh
            </span>
          )}
        </p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <p
          className="font-headline font-bold text-sm"
          style={{ color: active ? '#E9C400' : '#e8ddff' }}
        >
          {formatPeso(receipt.amount_due)}
        </p>

        {/* Delete btn */}
        <button
          id={`delete-receipt-${receipt.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(receipt);
          }}
          aria-label="Delete receipt"
          className="p-1.5 rounded-md text-red-300 hover:bg-red-400/20 hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * UploadHistory
 *
 * Props:
 *   receipts        – full array of receipt objects (already fetched, newest-first after sort)
 *   activeReceiptId – id of the currently-displayed receipt (for highlight)
 *   onSelect(r)     – called when user taps a row; parent updates currentReceipt
 *   onDelete(id)    – calls deleteReceipt(id) from useReceipts + removes from UI
 *   loading         – bool (initial load spinner)
 */
export default function UploadHistory({
  receipts = [],
  activeReceiptId = null,
  onSelect,
  onDelete,
  loading = false,
  fetchError = null,
}) {
  // Sort newest-first (by scanned_at string or id fallback)
  const sorted = [...receipts].sort((a, b) => {
    const ta = a.scanned_at || '';
    const tb = b.scanned_at || '';
    return tb.localeCompare(ta) || b.id - a.id;
  });

  const [page, setPage]           = useState(1);
  const [confirmTarget, setConfirm] = useState(null); // receipt to confirm delete
  const [deleting, setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const visible = sorted.slice(0, page * PAGE_SIZE);
  const hasMore = sorted.length > visible.length;

  // Reset page when receipts list changes (e.g. after delete)
  useEffect(() => {
    setPage(1);
  }, [receipts.length]);

  const handleDeleteRequest = useCallback((r) => {
    setConfirm(r);
    setDeleteError(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(confirmTarget.id);
      setConfirm(null);
    } catch (err) {
      setDeleteError(err.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [confirmTarget, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    if (!deleting) setConfirm(null);
  }, [deleting]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <section id="upload-history" className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60">
              Scan History
            </p>
            <h2 className="font-headline font-bold text-on-surface text-lg leading-tight">
              Your Receipts
            </h2>
          </div>
          {sorted.length > 0 && (
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(180,150,230,0.14)', color: '#cfbfef' }}
            >
              {sorted.length} {sorted.length === 1 ? 'bill' : 'bills'}
            </span>
          )}
        </div>

        {/* Error banners */}
        {fetchError && (
          <ErrorCard message={fetchError} compact />
        )}
        {deleteError && (
          <ErrorCard message={deleteError} compact />
        )}

        {/* Loading skeleton */}
        {loading && receipts.length === 0 && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(180,150,230,0.10)' }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && receipts.length === 0 && (
          <div
            className="flex flex-col items-center gap-3 py-10 rounded-2xl"
            style={{ background: 'rgba(180,150,230,0.08)' }}
          >
            <span
              className="material-symbols-outlined text-4xl opacity-30 text-secondary"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              receipt_long
            </span>
            <p className="text-secondary text-sm opacity-60 text-center px-8">
              No receipts yet — scan your first bill above
            </p>
          </div>
        )}

        {/* List */}
        {!fetchError && visible.length > 0 && (
          <div className="flex flex-col gap-2">
            {visible.map((r) => (
              <ReceiptRow
                key={r.id}
                receipt={r}
                active={r.id === activeReceiptId}
                onTap={onSelect}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!fetchError && hasMore && (
          <button
            id="load-more-receipts-btn"
            className="w-full py-3 rounded-2xl font-bold text-sm text-secondary transition-all hover:opacity-80 active:scale-97"
            style={{ background: 'rgba(180,150,230,0.10)' }}
            onClick={() => setPage((p) => p + 1)}
          >
            Load More ({sorted.length - visible.length} remaining)
          </button>
        )}
      </section>

      {/* Confirm delete dialog */}
      {confirmTarget && (
        <ConfirmDialog
          receipt={confirmTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          deleting={deleting}
        />
      )}
    </>
  );
}

import { useState, useCallback } from 'react';
import api from './useApi';

/**
 * useReceipts — state and API calls for receipt CRUD.
 *
 * Exposed state:
 *   receipts       – paginated receipt list
 *   scanResult     – OCR result from POST /api/receipts/scan
 *   tips           – AI tips from POST /api/receipts/tips
 *   scanning       – true while OCR is in flight
 *   saving         – true while save + tips are in flight
 *   scanError      – error message from scan
 *   saveError      – error message from save/tips
 *   fetchError     – error message from fetching receipt list
 *
 * Exposed actions:
 *   scanBill(file)              – upload image, populate scanResult
 *   saveReceipt(billData)       – POST /api/receipts then POST /api/receipts/tips
 *   fetchReceipts(page, limit)  – GET /api/receipts (paginated)
 *   deleteReceipt(id)           – DELETE /api/receipts/:id
 *   resetScan()                 – clear scanResult + tips
 */
export function useReceipts() {
  const [receipts, setReceipts]     = useState([]);
  const [scanResult, setScanResult] = useState(null); // { fields, confidences }
  const [tips, setTips]             = useState(null);
  const [scanning, setScanning]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [scanError, setScanError]   = useState(null);
  const [saveError, setSaveError]   = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // ── Scan ────────────────────────────────────────────────────────────────
  const scanBill = useCallback(async (file) => {
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    setTips(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const data = await api.post('/api/receipts/scan', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScanResult(data.data);
      return data.data;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Scan failed. Please try again.';
      setScanError(msg);
      throw new Error(msg);
    } finally {
      setScanning(false);
    }
  }, []);

  // ── Save receipt then fetch AI tips ────────────────────────────────────
  const saveReceipt = useCallback(async (billData) => {
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Persist the bill
      const saved = await api.post('/api/receipts', billData);
      const billId = saved.data?.id;

      // 2. Get AI tips (non-blocking — no throw if tips fail)
      try {
        const tipsRes = await api.post('/api/receipts/tips', {
          bill_id: billId,
          ...billData,
        });
        setTips(tipsRes.data?.tips ?? tipsRes.data);
      } catch {
        // Tips are best-effort; don't block the flow
        setTips(null);
      }

      // 3. Refresh receipt list
      fetchReceipts();
      return saved.data;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Could not save receipt. Please try again.';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch paginated list ────────────────────────────────────────────────
  const fetchReceipts = useCallback(async (page = 1, limit = 10) => {
    setFetchError(null);
    try {
      const res = await api.get('/api/receipts', {
        params: { page, limit },
      });
      setReceipts(res.data?.items ?? res.data ?? []);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Could not load receipts. Please refresh.';
      setFetchError(msg);
    }
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────
  const deleteReceipt = useCallback(async (id) => {
    try {
      await api.delete(`/api/receipts/${id}`);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || 'Delete failed.';
      throw new Error(msg);
    }
  }, []);

  // ── Reset scan state ────────────────────────────────────────────────────
  const resetScan = useCallback(() => {
    setScanResult(null);
    setTips(null);
    setScanError(null);
    setSaveError(null);
  }, []);

  return {
    // state
    receipts,
    scanResult,
    tips,
    scanning,
    saving,
    scanError,
    saveError,
    fetchError,
    // actions
    scanBill,
    saveReceipt,
    fetchReceipts,
    deleteReceipt,
    resetScan,
  };
}

export default useReceipts;


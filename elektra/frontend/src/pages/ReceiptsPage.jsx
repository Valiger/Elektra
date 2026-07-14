import React, { useState, useEffect, useRef } from 'react';
import TopBar from '../components/TopBar';
import UploadZone from '../components/receipts/UploadZone';
import ExtractedDataCard from '../components/receipts/ExtractedDataCard';
import CurrentInsights from '../components/receipts/CurrentInsights';
import UploadHistory from '../components/receipts/UploadHistory';
import ApplianceLibrary from '../components/receipts/ApplianceLibrary';
import { useReceipts } from '../hooks/useReceipts';
import { useApi } from '../hooks/useApi';

/**
 * ReceiptsPage
 *
 * Vertical scroll layout:
 *   1. TopBar
 *   2. Upload / Scan section   (always visible — hides while reviewing)
 *   3. ExtractedDataCard       (only shown during 'review' view)
 *   4. CurrentInsights         (shown when a receipt is active)
 *   5. UploadHistory           (always visible)
 *   6. ComingSoonCards         (always visible)
 *
 * State machine:
 *   uploadView  'idle'    → UploadZone visible
 *               'review'  → ExtractedDataCard visible (UploadZone hidden)
 *
 * currentReceipt: the receipt shown in CurrentInsights
 *   — set from save result OR from tapping a history row
 */
export default function ReceiptsPage() {
  const [uploadView, setUploadView] = useState('idle'); // 'idle' | 'review'
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [userRate, setUserRate] = useState(null);
  const { call } = useApi();

  const insightsRef = useRef(null);

  const {
    receipts,
    scanResult,
    tips,
    scanning,
    saving,
    scanError,
    saveError,
    fetchError,
    scanBill,
    saveReceipt,
    fetchReceipts,
    deleteReceipt,
    resetScan,
  } = useReceipts();

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setHistoryLoading(true);
      try {
        await fetchReceipts(1, 100); // fetch up to 100 so history + prediction work
        const rateData = await call('GET', '/api/rates');
        setUserRate(rateData?.user_rate);
      } catch (err) {
        console.warn("Failed to fetch rates", err);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** Called by UploadZone → OCR finished, go to review */
  const handleScanSuccess = (result) => {
    if (result) setUploadView('review');
  };

  /** Called by ExtractedDataCard → save + tips, then show CurrentInsights */
  const handleSave = async (billData) => {
    const saved = await saveReceipt(billData);
    if (saved) {
      setCurrentReceipt({ ...billData, ...saved, isRecentScan: true }); // merge so we have id
      setUploadView('idle');                         // hide ExtractedDataCard, show UploadZone again
      // Scroll to CurrentInsights
      setTimeout(() => {
        insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };

  /** Re-scan button inside ExtractedDataCard */
  const handleRescan = () => {
    resetScan();
    setUploadView('idle');
  };

  /** Tap a row in UploadHistory → show that receipt in CurrentInsights */
  const handleSelectHistory = (receipt) => {
    setCurrentReceipt({ ...receipt, isRecentScan: false });
    setTimeout(() => {
      insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /** Delete receipt from UploadHistory */
  const handleDelete = async (id) => {
    await deleteReceipt(id);
    // If the deleted receipt was displayed in CurrentInsights, clear it
    if ((currentReceipt?.public_id || currentReceipt?.id) === id) {
      setCurrentReceipt(null);
    }
    // Refresh list
    await fetchReceipts(1, 100);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  // Get rate from user cooperative first, fallback to receipt math, fallback to 12
  const latestRate = userRate?.rate_per_kwh || (receipts?.[0]?.amount_due && receipts?.[0]?.kwh_consumed ? (receipts[0].amount_due / receipts[0].kwh_consumed) : 12.00);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <div className="flex-1 px-4 pt-6 pb-32 flex flex-col gap-8 max-w-[480px] w-full mx-auto">

        {/* ── Page header ── */}
        <div>
          <p
            className="text-[11px] font-bold tracking-widest uppercase"
            style={{ color: '#ccc3d5' }}
          >
            Monthly Analysis
          </p>
          <h1 className="font-headline text-4xl font-extrabold text-on-surface leading-tight mt-0.5">
            Receipt<br />Insights
          </h1>
        </div>

        {/* ── Remaining Scans Banner ── */}
        {scanResult && typeof scanResult.scans_remaining === 'number' && (
          <div className="flex justify-start -mt-2 animate-card-in">
            <div
              className="px-4 py-2 rounded-full text-xs font-bold tracking-wide flex items-center gap-2"
              style={{ background: 'rgba(233,196,0,0.15)', color: '#E9C400' }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
              {scanResult.scans_remaining}/3 scans remaining today
            </div>
          </div>
        )}

        {/* ── 2. Upload / Scan section ── */}
        {uploadView === 'idle' ? (
          <section id="upload-section" className="flex flex-col gap-3">
            <p className="text-sm text-secondary opacity-70 font-medium">
              Scan your electric bill to get personalised energy tips.
            </p>
            <UploadZone
              onScanSuccess={handleScanSuccess}
              scanning={scanning}
              scanError={scanError}
              onScan={scanBill}
            />
          </section>
        ) : (
          /* ── 3. ExtractedDataCard (review state) ── */
          <section id="review-section">
            <ExtractedDataCard
              key={scanResult?.image_filename ?? 'review'}
              scanResult={scanResult}
              saving={saving}
              saveError={saveError}
              onSave={handleSave}
              onRescan={handleRescan}
            />
          </section>
        )}

        {/* ── 4. CurrentInsights ── */}
        {currentReceipt && (
          <div ref={insightsRef}>
            <CurrentInsights
              receipt={currentReceipt}
              tips={currentReceipt.isRecentScan ? tips : null}
              history={receipts}
            />
          </div>
        )}

        {/* ── 5. Upload History ── */}
        <UploadHistory
          receipts={receipts}
          activeReceiptId={currentReceipt?.public_id || currentReceipt?.id || null}
          onSelect={handleSelectHistory}
          onDelete={handleDelete}
          loading={historyLoading}
          fetchError={fetchError}
        />

        {/* ── 6. Virtual Home ── */}
        <ApplianceLibrary latestRate={latestRate} />

      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-in {
          animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>
    </div>
  );
}

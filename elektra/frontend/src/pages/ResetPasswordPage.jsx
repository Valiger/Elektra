import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import logo from '../../../asset/logoelektra.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [done, setDone] = useState(false);

  const { call, loading, error } = useApi();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await call('POST', '/api/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setDone(true);
      // Auto-redirect to login after 2.5 s
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      // Error handled by useApi
    }
  };

  return (
    <div className="bg-background text-on-background font-body min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 flex justify-center overflow-hidden">
        <div className="absolute inset-0 bg-surface"></div>
        <div className="w-full max-w-[420px] h-full relative z-0">
          <div className="absolute top-0 -right-[10%] w-[120%] h-[100%] transform rotate-[15deg] opacity-80 drop-shadow-[0_0_25px_rgba(233,196,0,0.6)]">
            <div className="w-full h-full lightning-motif"></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 dotted-texture pointer-events-none"></div>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 w-full max-w-[420px] px-6 py-12 flex flex-col gap-10">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 flex items-center justify-center">
            <img src={logo} alt="Elektra Logo" className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(233,196,0,0.4)]" />
          </div>
          <div className="space-y-1">
            <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tighter uppercase">ELEKTRA</h1>
            <p className="text-on-surface-variant font-medium tracking-wide text-sm">Set a new password for your account</p>
          </div>
        </header>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
          {!token ? (
            /* Invalid / missing token */
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="material-symbols-outlined text-error text-3xl">link_off</span>
              </div>
              <div>
                <p className="text-on-surface font-bold text-lg mb-1">Invalid Reset Link</p>
                <p className="text-on-surface-variant text-sm">This link is missing a reset token. Please request a new one.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-2xl font-bold text-sm uppercase tracking-wider active:scale-95 transition-all"
              >
                Back to Login
              </button>
            </div>
          ) : done ? (
            /* Success state */
            <div className="flex flex-col items-center gap-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <span className="material-symbols-outlined text-3xl" style={{ color: '#4ade80' }}>check_circle</span>
              </div>
              <div>
                <p className="text-on-surface font-bold text-lg mb-1">Password Updated!</p>
                <p className="text-on-surface-variant text-sm">Your new password has been saved. Redirecting you to login…</p>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-primary animate-[shrink_2.5s_linear_forwards]" style={{ width: '100%', animation: 'progress-shrink 2.5s linear forwards' }}></div>
              </div>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center mb-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(233,196,0,0.12)', border: '1px solid rgba(233,196,0,0.3)' }}
                >
                  <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                </div>
                <p className="text-on-surface-variant text-xs">Enter your new password below.</p>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-primary font-bold text-xs uppercase tracking-widest px-1">New Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    type={newVisible ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-2xl py-4 pl-12 pr-12 text-on-surface placeholder:text-on-secondary-fixed-variant focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant" onClick={() => setNewVisible(!newVisible)}>
                    <span className="material-symbols-outlined text-xl">{newVisible ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-primary font-bold text-xs uppercase tracking-widest px-1">Confirm Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant group-focus-within:text-primary transition-colors">lock_open</span>
                  <input
                    type={confirmVisible ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                    className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-2xl py-4 pl-12 pr-12 text-on-surface placeholder:text-on-secondary-fixed-variant focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant" onClick={() => setConfirmVisible(!confirmVisible)}>
                    <span className="material-symbols-outlined text-xl">{confirmVisible ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Strength hints */}
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-yellow-400 px-1">⚠ Password too short (min. 8 characters)</p>
              )}
              {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-error px-1">✕ Passwords don't match</p>
              )}
              {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword === confirmPassword && (
                <p className="text-xs px-1" style={{ color: '#4ade80' }}>✓ Passwords match</p>
              )}

              {error && (
                <div className="glass-panel border-error/20 p-3 rounded-lg flex items-center justify-center bg-error/10">
                  <p className="text-error text-sm font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                className="mt-2 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(233,196,0,0.25)] hover:shadow-[0_15px_40px_rgba(233,196,0,0.35)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
              >
                {loading ? 'Saving…' : 'Save New Password'}
                {!loading && <span className="material-symbols-outlined font-bold">save</span>}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Decorative footer text */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden pointer-events-none h-32 flex items-end z-0">
        <div className="flex gap-4 px-6 pb-4 opacity-10">
          <span className="text-[80px] font-headline font-black leading-none text-primary select-none">ELEKTRA</span>
        </div>
      </div>
    </div>
  );
}

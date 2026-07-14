import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(10,0,30,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-[380px] rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col gap-6 text-center"
        style={{ background: 'linear-gradient(135deg,#1a0040,#2a0060)' }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Icon */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(233,196,0,0.12)', border: '1px solid rgba(233,196,0,0.3)' }}
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              lock_reset
            </span>
          </div>
          <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">
            Reset Password
          </h2>
          <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
            Contact Developer For password reset:
          </p>
          <p className="text-primary font-bold">
            valiger2026@gmail.com
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all uppercase tracking-wider mt-4"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { call, loading, error } = useApi();
  const navigate = useNavigate();

  // Listen for Biometric Success from Expo Wrapper
  useEffect(() => {
    const handleBiometricSuccess = async (e) => {
      const { email: savedEmail, password: savedPassword } = e.detail;
      try {
        const data = await call('POST', '/api/auth/login', { email: savedEmail, password: savedPassword });
        localStorage.setItem('elektra_token', data.access_token);
        localStorage.setItem('elektra_refresh_token', data.refresh_token);
        navigate('/');
      } catch {
        // Error handled by useApi
      }
    };

    window.addEventListener('BIOMETRIC_SUCCESS', handleBiometricSuccess);
    return () => window.removeEventListener('BIOMETRIC_SUCCESS', handleBiometricSuccess);
  }, [call, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await call('POST', '/api/auth/login', { email, password });
      localStorage.setItem('elektra_token', data.access_token);
      localStorage.setItem('elektra_refresh_token', data.refresh_token);
      
      // Tell Expo to save these credentials for future biometric logins
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SAVE_CREDENTIALS',
          email,
          password
        }));
      }

      navigate('/');
    } catch {
      // Error is captured and handled within useApi's error state.
    }
  };

  const requestBiometric = () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_BIOMETRIC' }));
    } else {
      alert("Biometric login is only available in the mobile app.");
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="flex flex-col gap-8 w-full max-w-[420px]">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-primary font-bold text-xs uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant group-focus-within:text-primary transition-colors">alternate_email</span>
                <input 
                  className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-secondary-fixed-variant focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  placeholder="name@energy.co" 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-primary font-bold text-xs uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  id="forgot-password-btn"
                  onClick={() => setShowForgot(true)}
                  className="text-primary/70 text-xs font-bold hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-secondary-fixed-variant focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  placeholder="••••••••" 
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-tertiary-fixed-variant" type="button" onClick={() => setPasswordVisible(!passwordVisible)}>
                  <span className="material-symbols-outlined text-xl">{passwordVisible ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="glass-panel border-error/20 p-3 rounded-lg flex items-center justify-center bg-error/10">
                <p className="text-error text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <button 
              className="mt-4 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(233,196,0,0.25)] hover:shadow-[0_15px_40px_rgba(233,196,0,0.35)] transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100 disabled:shadow-none" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Access Grid'}
              {!loading && <span className="material-symbols-outlined font-bold">arrow_forward</span>}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-on-surface-variant font-medium">
              Haven't signed up? 
              <button 
                type="button"
                className="text-primary font-extrabold ml-1 hover:underline underline-offset-4 decoration-2" 
                onClick={() => navigate('/signup')}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        {/* FOOTER BRANDING & BIOMETRIC */}
        <footer className="flex flex-col items-center gap-8 mt-4">
          <div className="flex items-center gap-3 opacity-60">
            <div className="h-[1px] w-12 bg-on-surface-variant/20"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Secure Energy Portal</span>
            <div className="h-[1px] w-12 bg-on-surface-variant/20"></div>
          </div>

          {/* BIOMETRIC HINT (EDITORIAL DETAIL) */}
          <button 
            onClick={requestBiometric}
            className="flex flex-col items-center gap-2 text-on-secondary-fixed-variant hover:text-primary transition-colors group"
          >
            <div className="p-3 rounded-full border border-on-secondary-fixed-variant/30 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-3xl">fingerprint</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Use FaceID</span>
          </button>
        </footer>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [establishmentType, setEstablishmentType] = useState('Residential');
  const [locationType, setLocationType] = useState('Mainland');
  
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  const [province, setProvince] = useState('');
  const [cooperative, setCooperative] = useState('');
  const [coopOptions, setCoopOptions] = useState([]);
  const [isCoopLoading, setIsCoopLoading] = useState(false);
  const [customCoop, setCustomCoop] = useState('');
  const [liveRate, setLiveRate] = useState(null);

  const { call, loading, error } = useApi();
  const navigate = useNavigate();

  // Fetch Live Rates for ALECO
  useEffect(() => {
    const activeCoop = coopOptions.length > 0 ? cooperative : customCoop;
    if (activeCoop && activeCoop.toUpperCase() === 'ALECO' && establishmentType && locationType) {
      const params = new URLSearchParams({
        establishment_type: establishmentType.toLowerCase().replace(' ', '_'),
        location_type: locationType.toLowerCase(),
      });
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/rates/aleco/live?${params}`)
        .then(r => {
            if (!r.ok) throw new Error('API Error');
            return r.json();
        })
        .then(data => setLiveRate(data.rate_per_kwh))
        .catch(() => setLiveRate(null));
    } else {
      setLiveRate(null);
    }
  }, [cooperative, customCoop, coopOptions, establishmentType, locationType]);

  // Debounced Province Lookup
  useEffect(() => {
    const fetchCoops = async () => {
      if (province.length < 2) {
        setCoopOptions([]);
        return;
      }
      setIsCoopLoading(true);
      try {
        const results = await call('GET', `/api/cooperatives?province=${encodeURIComponent(province)}`);
        setCoopOptions(results);
        if (results.length > 0) {
          setCooperative(results[0]);
        } else {
          setCooperative('');
        }
      } catch {
        setCoopOptions([]);
      } finally {
        setIsCoopLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchCoops();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [province, call]);

  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    
    const finalCoop = coopOptions.length === 0 ? customCoop : cooperative;
    if (!finalCoop) {
      setFormError("Cooperative is required");
      return;
    }

    try {
      const payload = {
        email,
        username: username || email.split('@')[0],
        password,
        confirm_password: confirmPassword,
        establishment_type: establishmentType,
        location_type: locationType,
        province,
        cooperative: finalCoop,
        tos_accepted_version: "v1.0",
        privacy_accepted_version: "v1.0",
        marketing_consent: marketingConsent
      };

      const data = await call('POST', '/api/auth/signup', payload);
      localStorage.setItem('elektra_token', data.access_token);
      localStorage.setItem('elektra_refresh_token', data.refresh_token);
      navigate('/');
    } catch {
      // handled by useApi
    }
  };

  const currentCoop = coopOptions.length > 0 ? cooperative : customCoop;
  const estTypes = ['Residential', 'Commercial', 'High Voltage', 'Low Voltage'];
  const locTypes = ['Mainland', 'Island'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Name and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Username</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
            placeholder="energizer123" 
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Email</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
            placeholder="energy@elektra.io" 
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Password & Confirm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Password</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
            placeholder="••••••••" 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Confirm Password</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
            placeholder="••••••••" 
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Establishment Type */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Establishment Type</label>
        <div className="flex flex-wrap gap-2">
          {estTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setEstablishmentType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${establishmentType === t ? 'bg-primary text-on-primary' : 'bg-[rgba(200,170,240,0.20)] text-secondary shadow-inner'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Location Type */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Location Type</label>
        <div className="flex flex-wrap gap-2">
          {locTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setLocationType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${locationType === t ? 'bg-primary text-on-primary' : 'bg-[rgba(200,170,240,0.20)] text-secondary shadow-inner'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Province & Cooperative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">Province</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
            placeholder="Enter Province..." 
            type="text"
            value={province}
            onChange={e => setProvince(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center text-sm font-bold text-on-tertiary-fixed ml-1 uppercase tracking-wider">
            Cooperative 
            {isCoopLoading && <span className="text-primary text-xs normal-case ml-2 animate-pulse">(Searching...)</span>}
          </label>
          {coopOptions.length > 0 ? (
            <select 
              className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary transition-all duration-300 outline-none appearance-none cursor-pointer"
              value={cooperative}
              onChange={e => setCooperative(e.target.value)}
            >
              {coopOptions.map(c => <option key={c} value={c} className="bg-surface text-on-surface">{c}</option>)}
            </select>
          ) : (
            <input 
              className="w-full bg-[rgba(200,170,240,0.20)] border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 outline-none" 
              placeholder={province.length < 2 ? "Waiting for province..." : "Enter Cooperative manually"} 
              type="text"
              value={customCoop}
              onChange={e => setCustomCoop(e.target.value)}
              required={coopOptions.length === 0}
            />
          )}



          {currentCoop && currentCoop.toUpperCase() === 'ALECO' && liveRate !== null && (
            <div className="glass-panel rounded-xl px-4 py-3 mt-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest font-bold">Current ALECO Rate</p>
                <p className="text-primary font-headline font-bold text-xl">
                  ₱{liveRate.toFixed(4)} / kWh
                </p>
                <p className="text-[10px] text-secondary opacity-60">
                  Live — scraped from web.alecoinc.com.ph
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(error || formError) && (
        <div className="glass-panel border-error/20 p-3 rounded-lg flex items-center justify-center bg-error/10">
          <p className="text-error text-sm font-bold">{error || formError}</p>
        </div>
      )}

      {/* Legal Agreements */}
      <div className="space-y-4 pt-4 border-t border-outline-variant/20">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-1">
            <input 
              type="checkbox" 
              className="peer appearance-none w-5 h-5 border-2 border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              required
            />
            <span className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold">check</span>
          </div>
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            I have read and agree to the <a href="/terms" target="_blank" className="text-primary hover:underline font-bold" onClick={(e) => e.stopPropagation()}>Terms of Service</a>
          </span>
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-1">
            <input 
              type="checkbox" 
              className="peer appearance-none w-5 h-5 border-2 border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              required
            />
            <span className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold">check</span>
          </div>
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            I have read and agree to the <a href="/privacy" target="_blank" className="text-primary hover:underline font-bold" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-1">
            <input 
              type="checkbox" 
              className="peer appearance-none w-5 h-5 border-2 border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <span className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold">check</span>
          </div>
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            I agree to receive occasional emails about product updates and offers (optional)
          </span>
        </label>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <button 
            className="w-full py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-extrabold text-lg rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 uppercase tracking-widest font-headline disabled:opacity-70 disabled:hover:scale-100" 
            type="submit"
            disabled={loading}
        >
            {loading ? 'INITIALIZING...' : 'Initialize Account'}
        </button>
      </div>

    </form>
  )
}

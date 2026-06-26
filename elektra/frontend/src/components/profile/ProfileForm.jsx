import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import Toast from '../Toast';

export default function ProfileForm({ userProfile, onProfileUpdate }) {
  const [username, setUsername] = useState(userProfile?.username || '');
  const [establishmentType, setEstablishmentType] = useState(userProfile?.establishment_type || 'Residential');
  const [locationType, setLocationType] = useState(userProfile?.location_type || 'Mainland');
  
  const [province, setProvince] = useState(userProfile?.province || '');
  const [cooperative, setCooperative] = useState(userProfile?.cooperative || '');
  const [coopOptions, setCoopOptions] = useState(userProfile?.cooperative ? [userProfile.cooperative] : []);
  const [isCoopLoading, setIsCoopLoading] = useState(false);
  const [customCoop, setCustomCoop] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { call, loading, error } = useApi();

  // Stable dismiss callback — avoids Rules-of-Hooks violation in JSX
  const dismissToast = useCallback(() => setToastMessage(null), []);

  // Re-initialize state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setEstablishmentType(userProfile.establishment_type || 'Residential');
      setLocationType(userProfile.location_type || 'Mainland');
      setProvince(userProfile.province || '');
      setCooperative(userProfile.cooperative || '');
      setCoopOptions(userProfile.cooperative ? [userProfile.cooperative] : []);
    }
  }, [userProfile]);

  // Debounced Province Lookup
  useEffect(() => {
    const fetchCoops = async () => {
      // Avoid refetching immediately if province was just initialized from userProfile and cooperative is set
      if (province.length < 2) {
        if (!userProfile) setCoopOptions([]);
        return;
      }
      setIsCoopLoading(true);
      try {
        const results = await call('GET', `/api/cooperatives?province=${encodeURIComponent(province)}`);
        setCoopOptions(results);
        
        // Only override cooperative if the previously selected one isn't in the new results
        if (results.length > 0 && !results.includes(cooperative)) {
          setCooperative(results[0]);
        } else if (results.length === 0) {
          setCooperative('');
        }
      } catch {
        setCoopOptions([]);
      } finally {
        setIsCoopLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      // Don't refetch on initial load if we just mapped user data perfectly
      if (userProfile?.province === province && coopOptions.includes(userProfile?.cooperative)) {
        return;
      }
      fetchCoops();
    }, 300);

    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, call]); // cooperative/userProfile/coopOptions omitted to prevent loop

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setToastMessage(null);
    
    // Password validation logic
    if (newPassword) {
      if (!currentPassword) {
        setFormError('Current password is required to set a new password');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setFormError('New passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setFormError('New password must be at least 8 characters');
        return;
      }
    }

    const finalCoop = coopOptions.length === 0 ? customCoop : cooperative;
    if (!finalCoop) {
      setFormError('Cooperative is required');
      return;
    }

    try {
      const payload = {
        username,
        establishment_type: establishmentType,
        location_type: locationType,
        province,
        cooperative: finalCoop
      };
      
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
        payload.confirm_new_password = confirmNewPassword;
      }

      const data = await call('PATCH', '/api/auth/profile', payload);
      
      setToastMessage('Changes saved successfully');
      setTimeout(() => setToastMessage(null), 3000);
      
      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      if (onProfileUpdate) {
        onProfileUpdate(data);
      }

    } catch {
      // Error is caught by useApi and displayed via its 'error' state.
    }
  };

  const estTypes = ['Residential', 'Commercial', 'High Voltage', 'Low Voltage'];
  const locTypes = ['Mainland', 'Island'];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Username */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Username</label>
          <input 
            className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
            placeholder="energizer123" 
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Establishment Type */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Establishment Type</label>
          <div className="flex flex-wrap gap-2 text-sm">
            {estTypes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setEstablishmentType(t)}
                className={`px-3 py-2 rounded-lg font-bold transition-all ${establishmentType === t ? 'bg-primary text-[#180048] shadow-[0_0_12px_rgba(233,196,0,0.3)]' : 'glass-panel text-secondary hover:opacity-80'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Location Type */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Location Type</label>
          <div className="flex flex-wrap gap-2 text-sm">
            {locTypes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setLocationType(t)}
                className={`px-3 py-2 rounded-lg font-bold transition-all ${locationType === t ? 'bg-primary text-[#180048] shadow-[0_0_12px_rgba(233,196,0,0.3)]' : 'glass-panel text-secondary hover:opacity-80'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Province & Cooperative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Province</label>
            <input 
              className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
              placeholder="Enter Province..." 
              type="text"
              value={province}
              onChange={e => setProvince(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
              Cooperative 
              {isCoopLoading && <span className="text-primary normal-case ml-2 animate-pulse text-xs">(Searching...)</span>}
            </label>
            {coopOptions.length > 0 ? (
              <select 
                className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm appearance-none cursor-pointer"
                value={cooperative}
                onChange={e => setCooperative(e.target.value)}
              >
                {coopOptions.map(c => <option key={c} value={c} className="bg-surface text-on-surface">{c}</option>)}
              </select>
            ) : (
              <input 
                className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
                placeholder={province.length < 2 ? "Waiting for province..." : "Enter Cooperative manually"} 
                type="text"
                value={customCoop}
                onChange={e => setCustomCoop(e.target.value)}
                required={coopOptions.length === 0}
              />
            )}
          </div>
        </div>

        <div className="bg-surface-container rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-primary text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
          <p className="text-secondary text-xs leading-relaxed opacity-80">
            Note: Changing your cooperative will update your base kWh rates on the Home Information Board automatically upon next visit.
          </p>
        </div>

        {/* Change Password */}
        <div className="pt-4 mt-6 border-t border-white/5 space-y-4">
          <h3 className="font-headline font-bold text-lg text-primary">Change Password</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Current Password</label>
              <input 
                className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
                placeholder="••••••••" 
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">New Password</label>
                <input 
                  className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
                  placeholder="••••••••" 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Confirm New Password</label>
                <input 
                  className="w-full bg-[rgba(200,170,240,0.15)] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none text-sm" 
                  placeholder="••••••••" 
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Errors */}
        {(error || formError) && (
          <div className="glass-panel border-error/20 p-3 rounded-lg flex items-center justify-center bg-error/10">
            <p className="text-error text-sm font-bold">{error || formError}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button 
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-[#180048] font-extrabold text-base rounded-xl shadow-lg shadow-[rgba(233,196,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-200 uppercase tracking-widest font-headline disabled:opacity-70 disabled:hover:scale-100" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type="success"
        onDismiss={dismissToast}
      />
    </>
  );
}

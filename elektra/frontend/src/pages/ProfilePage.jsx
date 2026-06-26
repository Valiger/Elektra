import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ProfileForm from '../components/profile/ProfileForm';
import Spinner from '../components/Spinner';
import ErrorCard from '../components/ErrorCard';
import { useApi } from '../hooks/useApi';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const { call, loading, error } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await call('GET', '/api/auth/profile');
        setUserProfile(data);
      } catch {
        // error stored in useApi error state
      }
    };
    
    fetchProfile();
  }, [call]);

  const handleLogout = () => {
    localStorage.removeItem('elektra_token');
    navigate('/login');
  };

  const getInitials = (username) => {
    if (!username) return 'E';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      
      {/* Content wrapper with scrollable area below standard TopBar */}
      <div className="px-6 pt-6 pb-28">
        
        {/* Profile Header (Avatar + Info) */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center shadow-[0_0_20px_rgba(233,196,0,0.15)] border-[1px] border-primary/20 mb-4 bg-[#2a1168]/40">
            {loading && !userProfile ? (
              <Spinner size="sm" />
            ) : (
              <span className="font-headline font-black text-3xl text-primary tracking-tighter">
                {getInitials(userProfile?.username)}
              </span>
            )}
          </div>
          
          <h1 className="font-headline font-black text-2xl text-on-surface mb-1">
            {loading && !userProfile ? 'Loading...' : userProfile?.username || '—'}
          </h1>
          <p className="text-secondary text-sm font-medium">
            {userProfile?.email || (loading ? '...' : '—')}
          </p>
        </div>

        {/* Error state — failed to load profile */}
        {error && !loading && !userProfile && (
          <div className="mb-6">
            <ErrorCard
              message="Could not load your profile"
              hint={error}
            />
          </div>
        )}

        {/* Form Container */}
        <div className="glass-panel rounded-3xl p-6 mb-8">
          <ProfileForm userProfile={userProfile} onProfileUpdate={setUserProfile} />
        </div>

        {/* Global Action: Log Out */}
        <div className="pb-4">
          <button 
            onClick={handleLogout}
            className="w-full py-4 glass-panel border border-error/30 text-error hover:bg-error/10 hover:border-error/50 font-bold text-base rounded-xl transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined flex-shrink-0">logout</span>
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}


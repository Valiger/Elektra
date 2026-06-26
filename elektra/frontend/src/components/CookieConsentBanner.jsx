import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('elektra_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('elektra_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('elektra_cookie_consent', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-[60] flex justify-center">
      <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-2xl max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex-grow z-10">
          <h3 className="text-on-surface font-headline font-bold text-lg mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">cookie</span>
            We use cookies
          </h3>
          <p className="text-on-surface-variant text-sm">
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. Read our <Link to="/cookie-policy" className="text-primary hover:underline font-bold">Cookie Policy</Link> for more information.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto shrink-0 z-10">
          <button 
            onClick={handleReject}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-variant transition-colors"
          >
            Reject All
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-primary text-on-primary font-bold shadow-[0_0_15px_rgba(233,196,0,0.4)] hover:shadow-[0_0_25px_rgba(233,196,0,0.6)] transition-all"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

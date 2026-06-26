import React from 'react';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/auth/SignupForm';
import logo from '../../../asset/logoelektra.png';

export default function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface min-h-screen flex flex-col font-body text-on-surface relative overflow-x-hidden">
      
      {/* Background Motifs */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute inset-0 bg-surface"></div>
        <div className="w-full max-w-[420px] h-full relative z-0">
          <div className="absolute top-0 -right-[10%] w-[120%] h-[100%] transform rotate-[15deg] opacity-80 drop-shadow-[0_0_25px_rgba(233,196,0,0.6)]">
            <div className="w-full h-full lightning-motif"></div>
          </div>
        </div>
        <div className="absolute inset-0 dotted-texture border-none opacity-40"></div>
      </div>

      <main className="flex-grow flex flex-col justify-center items-center p-6 md:p-12 relative z-10 my-8">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col items-center mb-12">
            <div className="mb-4 flex justify-center">
              <img src={logo} alt="Elektra Logo" className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(233,196,0,0.5)]" />
            </div>
            <h1 className="font-headline font-bold text-5xl md:text-6xl text-primary tracking-tighter text-center uppercase">SIGNUP</h1>
            <p className="text-secondary mt-2 font-medium tracking-wide">JOIN THE HIGH-VOLTAGE NETWORK</p>
          </div>

          <div className="glass-panel rounded-xl p-8 md:p-10 shadow-[0_-8px_30px_rgb(100,60,180,0.2)]">
            <SignupForm />

            <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
              <p className="text-on-surface-variant text-sm">
                Already part of the grid? 
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary font-bold hover:underline ml-1"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 px-4 opacity-60">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-primary mb-2">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">SECURE</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-primary mb-2">electric_bolt</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">FAST</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-primary mb-2">monitoring</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">PRECISE</span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-8 text-center relative z-10 pb-12">
        <p className="text-on-surface-variant text-[10px] font-medium tracking-[0.2em] uppercase mb-2">
          © 2026 Elektra Energy Powered by Valiger Technologies
        </p>
        <div className="flex justify-center gap-4 text-xs font-bold text-on-surface-variant">
          <a href="/privacy" target="_blank" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="/terms" target="_blank" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="/cookie-policy" target="_blank" className="hover:text-primary transition-colors">Cookie Policy</a>
        </div>
      </footer>
    </div>
  );
}

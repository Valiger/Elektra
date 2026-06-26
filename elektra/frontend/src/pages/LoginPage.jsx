import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import logo from '../../../asset/logoelektra.png';

export default function LoginPage() {
  return (
    <div className="bg-background text-on-background font-body min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 flex justify-center overflow-hidden">
        {/* Deep Purple Base */}
        <div className="absolute inset-0 bg-surface"></div>
        
        {/* Mobile Constrained Backgrounds */}
        <div className="w-full max-w-[420px] h-full relative z-0">
          {/* Yellow Lightning Motif with Glow */}
          <div className="absolute top-0 -right-[10%] w-[120%] h-[100%] transform rotate-[15deg] opacity-80 drop-shadow-[0_0_25px_rgba(233,196,0,0.6)]">
            <div className="w-full h-full lightning-motif"></div>
          </div>
        </div>
        
        {/* Secondary Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none"></div>
        {/* Dotted Texture Overlay */}
        <div className="absolute inset-0 dotted-texture pointer-events-none"></div>
      </div>

      {/* MAIN CONTENT CANVAS */}
      <main className="relative z-10 w-full max-w-[420px] px-6 py-12 flex flex-col gap-10">
        {/* HEADER SECTION */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 flex items-center justify-center">
            <img src={logo} alt="Elektra Logo" className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(233,196,0,0.4)]" />
          </div>
          <div className="space-y-1">
            <h1 className="font-headline text-5xl font-extrabold text-primary tracking-tighter uppercase">ELEKTRA</h1>
            <p className="text-on-surface-variant font-medium tracking-wide">Scan your bill. Understand your usage. Cut your costs.</p>
          </div>
        </header>

        {/* LOGIN FORM CONTAINER */}
        <LoginForm />

      </main>

      {/* DECORATIVE BOTTOM DETAIL */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden pointer-events-none h-32 flex items-end z-0">
        <div className="flex gap-4 px-6 md:px-12 pb-4 opacity-10">
          <span className="text-[80px] md:text-[120px] font-headline font-black leading-none text-primary select-none">ELEKTRA</span>
        </div>
      </div>

      <footer className="w-full p-8 text-center relative z-10 mt-auto">
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

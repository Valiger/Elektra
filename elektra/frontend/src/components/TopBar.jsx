import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../../asset/logoelektra.png';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-[#180048]/80 backdrop-blur-xl">
      <div className="flex justify-between items-center px-6 py-4 max-w-4xl mx-auto w-full">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 active:scale-95 transition-all duration-150"
        >
          <img src={logo} alt="Elektra Logo" className="h-8 w-auto object-contain" />
          <span className="font-headline font-bold tracking-tighter text-2xl text-primary">
            Elektra
          </span>
        </button>

        {/* Avatar placeholder */}
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full border-2 border-primary/20 bg-surface-container-high flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer"
          aria-label="Go to profile"
        >
          <span className="material-symbols-outlined text-secondary text-xl">person</span>
        </button>
      </div>
    </header>
  );
}

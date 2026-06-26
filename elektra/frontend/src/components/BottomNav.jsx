import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { path: '/', label: 'Home', icon: 'dashboard' },
    { path: '/receipts', label: 'Receipts', icon: 'receipt_long' },
    { path: '/insights', label: 'Insights', icon: 'auto_graph' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-3xl shadow-[0_-8px_32px_rgba(60,20,120,0.50)]" style={{ background: 'rgba(22, 8, 50, 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(180,150,230,0.15)' }}>
      <div className="flex justify-around items-center px-4 py-4 sm:px-8 max-w-[500px] mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 w-16 ${
                isActive 
                  ? 'text-primary scale-110 -translate-y-0.5' 
                  : 'text-secondary opacity-60 hover:opacity-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span 
                  className="material-symbols-outlined text-3xl transition-all"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className={`text-[10px] font-bold tracking-wide transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
                  {isActive ? item.label : ''}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

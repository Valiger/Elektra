import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ReceiptsPage from './pages/ReceiptsPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AccessibilityPage from './pages/AccessibilityPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BottomNav from './components/BottomNav';
import CookieConsentBanner from './components/CookieConsentBanner';
const ProtectedLayout = () => {
  const token = localStorage.getItem('elektra_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#180048]"></div>
        <div className="w-full max-w-[420px] h-full relative">
          <div className="absolute top-0 -right-[10%] w-[120%] h-[100%] transform rotate-[15deg] opacity-80 drop-shadow-[0_0_25px_rgba(233,196,0,0.6)]">
            <div className="w-full h-full lightning-motif"></div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="relative z-10 flex-grow max-w-[420px] w-full mx-auto pb-[100px]">
        <Outlet />
      </main>

      {/* Navigation */}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <>
      <CookieConsentBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;

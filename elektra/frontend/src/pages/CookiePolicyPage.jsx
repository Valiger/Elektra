import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CookiePolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface p-6 md:p-12 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-primary font-bold hover:underline">
          &larr; Back
        </button>
        <div className="glass-panel rounded-xl p-8 shadow-lg">
          <h1 className="font-headline font-bold text-4xl text-primary mb-2">Cookie Policy</h1>
          <p className="text-secondary text-sm mb-8">Last Updated: June 2026</p>
          
          <div className="space-y-6 text-on-surface-variant">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. What Are Cookies</h2>
              <p>Elektra is under sole proprietor registered Valiger Technologies. As is common practice with almost all professional websites this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it and why we sometimes need to store these cookies.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. How We Use Cookies</h2>
              <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. The Cookies We Set</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Account related cookies:</strong> If you create an account with us then we will use cookies for the management of the signup process and general administration.</li>
                <li><strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact.</li>
                <li><strong>Site preferences cookies:</strong> In order to provide you with a great experience on this site we provide the functionality to set your preferences for how this site runs when you use it.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Disabling Cookies</h2>
              <p>You can prevent the setting of cookies by adjusting the settings on your browser. Be aware that disabling cookies will affect the functionality of this and many other websites that you visit.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

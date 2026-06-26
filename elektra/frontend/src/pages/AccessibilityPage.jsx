import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessibilityPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface p-6 md:p-12 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-primary font-bold hover:underline">
          &larr; Back
        </button>
        <div className="glass-panel rounded-xl p-8 shadow-lg">
          <h1 className="font-headline font-bold text-4xl text-primary mb-2">Accessibility Statement</h1>
          <p className="text-secondary text-sm mb-8">Last Updated: June 2026</p>
          
          <div className="space-y-6 text-on-surface-variant">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">Our Commitment</h2>
              <p>Elektra is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone, and applying the relevant accessibility standards.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">Conformance Status</h2>
              <p>The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Elektra strives to be conformant with WCAG 2.1 level AA.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">Feedback</h2>
              <p>We welcome your feedback on the accessibility of Elektra. Please let us know if you encounter accessibility barriers on Elektra:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>E-mail: accessibility@elektra.io</li>
              </ul>
              <p className="mt-2">We try to respond to feedback within 5 business days.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

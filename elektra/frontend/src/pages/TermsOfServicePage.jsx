import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface p-6 md:p-12 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-primary font-bold hover:underline">
          &larr; Back
        </button>
        <div className="glass-panel rounded-xl p-8 shadow-lg">
          <h1 className="font-headline font-bold text-4xl text-primary mb-2">Terms of Service</h1>
          <p className="text-secondary text-sm mb-8">Last Updated: June 2026</p>
          
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Acceptance of Terms & Business Information</h2>
              <p>By accessing or using Elektra, you agree to be bound by these Terms of Service. Elektra is under sole proprietor registered Valiger Technologies, a formally registered business operating under the laws of the Republic of the Philippines. We maintain all required business licenses and tax registrations.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Eligibility & Account Responsibilities</h2>
              <p>You must be at least 18 years old to use our services. By agreeing to these Terms, you represent that you are of legal age. You are responsible for safeguarding your password and any activities or actions under your account. We reserve the right to suspend or terminate accounts that violate our policies or engage in prohibited uses.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. Prohibited Uses</h2>
              <p>You may use the service only for lawful purposes. You agree not to use the service for spamming, reverse engineering, distributing malware, or abusing our infrastructure. Any breach may result in immediate termination without refund.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Intellectual Property</h2>
              <p>All original code, designs, branding, trademarks, and content provided by Elektra are owned by or licensed to us. Our logo and brand assets may not be used without prior written permission. You retain ownership of the data (such as electric bills) you upload, but grant us a license to process it to provide our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Payments, Taxes, and Refunds</h2>
              <p>If applicable, all subscription billing terms, including renewals, cancellations, and proration, are disclosed before checkout. We collect and remit applicable taxes (such as VAT) as required by Philippine law. All refund and cancellation policies are clearly stated at the point of sale.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Disclaimers & Limitation of Liability</h2>
              <p>Elektra is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind. In no event shall Elektra be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or data.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Indemnification</h2>
              <p>You agree to defend, indemnify, and hold harmless Elektra and its licensee and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses resulting from your use and access of the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. Dispute Resolution & Class Action Waiver</h2>
              <p>Any dispute arising from these Terms will be resolved through binding arbitration in the Philippines, rather than in court. You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">9. Document Management & Updates</h2>
              <p>We reserve the right to modify these Terms at any time. Material changes will be communicated to you, and continued use of the service will constitute acceptance. Legal documents are version-controlled and reviewed annually or as laws change.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

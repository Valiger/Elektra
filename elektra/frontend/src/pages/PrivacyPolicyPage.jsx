import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface p-6 md:p-12 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-primary font-bold hover:underline">
          &larr; Back
        </button>
        <div className="glass-panel rounded-xl p-8 shadow-lg">
          <h1 className="font-headline font-bold text-4xl text-primary mb-2">Privacy Policy</h1>
          <p className="text-secondary text-sm mb-8">Last Updated: June 2026</p>
          
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Introduction & Scope</h2>
              <p>Welcome to Elektra, which is under sole proprietor registered Valiger Technologies. We value your privacy and are committed to protecting your personal data in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines</strong>, its Implementing Rules and Regulations, and other applicable privacy laws. This privacy notice explains how we collect, use, disclose, and safeguard your information.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. What Data We Collect & Why</h2>
              <p>We practice data minimization and only collect what is strictly necessary for our service:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Identity Data:</strong> Username and email address (Legal basis: Contractual necessity for account creation).</li>
                <li><strong>Energy Data:</strong> Cooperative, establishment type, location, and uploaded electric bills (Legal basis: Performance of service to provide insights).</li>
                <li><strong>Technical Data:</strong> IP address, cookies, and device information (Legal basis: Legitimate interest in securing and improving our platform).</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. Data Sharing & Sub-Processors</h2>
              <p>We do not sell your personal information. We only share data with trusted third-party processors (such as cloud hosting providers, analytics services, and secure email providers) under strict Data Processing Agreements (DPAs). Data is stored securely, and cross-border transfers are subject to appropriate safeguards.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Data Retention</h2>
              <p>Your personal data is retained only for as long as necessary to fulfill the purposes outlined in this policy. When you delete your account, your data undergoes an automated deletion or anonymization process within 30 days, unless a longer retention period is required by law.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Data Subject Rights (RA 10173)</h2>
              <p>Under the Philippine Data Privacy Act, you are entitled to the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Right to be Informed:</strong> To know what data is collected and how it is used.</li>
                <li><strong>Right to Access:</strong> To request a copy of the data we hold about you.</li>
                <li><strong>Right to Object:</strong> To withdraw consent or object to processing, including for marketing purposes.</li>
                <li><strong>Right to Erasure or Blocking:</strong> To request the deletion of your account and all associated data.</li>
                <li><strong>Right to Rectification:</strong> To correct inaccurate or outdated information.</li>
                <li><strong>Right to Data Portability:</strong> To obtain a copy of your data in a secure format.</li>
                <li><strong>Right to File a Complaint:</strong> With the National Privacy Commission (NPC) if your rights are violated.</li>
              </ul>
              <p className="mt-2">We will acknowledge all data subject requests within 72 hours and aim to fulfill them within 30 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Security & Breach Response</h2>
              <p>We implement robust technical and organizational measures to protect your data. In the unlikely event of a data breach, our incident response plan ensures we will notify affected users and the National Privacy Commission within 72 hours of discovery, as required by law.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Contact & Data Protection Officer</h2>
              <p>If you wish to exercise your rights, withdraw consent, or have questions about our privacy practices, please contact our Data Protection Officer at <strong>privacy@elektra.io</strong>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

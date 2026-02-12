import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link href="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 6, 2026</p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              PeerHeal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the PeerHeal platform, which connects surgical recovery patients with contributors who share their personal recovery experiences through recordings and live video calls. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="font-medium text-gray-900 mt-4 mb-2">Account Information</h3>
            <p>When you create an account, we collect your name, email address, and password. If you register as a contributor, we also collect your Stripe Connect payment information for payouts.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Profile Information</h3>
            <p>To provide accurate matching, we collect health-related information you voluntarily provide, including: procedure type, surgery date, age range, activity level, recovery goals, complicating factors, and lifestyle context. Contributors may also provide a bio, hourly rate, and availability schedule.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Payment Information</h3>
            <p>Payment processing is handled by Stripe. We do not store your full credit card number. We retain transaction records including amounts, dates, and Stripe transaction IDs for accounting purposes.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Content</h3>
            <p>Contributors upload audio and video recordings. We store this content on secure cloud infrastructure. Recordings may be transcribed for accessibility and search purposes.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Usage Data</h3>
            <p>We collect information about how you use the platform, including pages visited, recordings viewed, and features used. This helps us improve the service and, for subscribers, distribute revenue to contributors based on content views.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and maintain your account</li>
              <li>To match you with relevant contributors and content based on your profile</li>
              <li>To process payments and contributor payouts</li>
              <li>To send transactional emails (booking confirmations, payment receipts, call reminders)</li>
              <li>To track subscriber content views for fair contributor payout distribution</li>
              <li>To moderate content and enforce community standards</li>
              <li>To improve and develop new features for the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We share information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Between users:</strong> Your profile information (procedure type, age range, activity level) is visible to other users for matching purposes. You can control whether your real name is displayed via privacy settings.</li>
              <li><strong>Payment processors:</strong> We share necessary information with Stripe to process payments and payouts.</li>
              <li><strong>Service providers:</strong> We use third-party services for email delivery (Resend), cloud storage, and video calls. These providers only access data necessary to perform their services.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Health Information</h2>
            <p>
              The health-related information you provide (procedure type, surgery details, recovery goals) is voluntarily shared by you for the purpose of matching with relevant content and contributors. PeerHeal is not a healthcare provider and is not subject to HIPAA. However, we treat all health-related information with care and apply the same security measures as other personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including encryption of data in transit and at rest, secure authentication, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Payment records are retained as required for accounting and legal purposes. Contributor recordings remain available as long as the contributor&apos;s account is active. You may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information in your profile</li>
              <li>Delete your account and associated data</li>
              <li>Control your display name and privacy settings</li>
              <li>Opt out of non-essential emails</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:jacktuchner@me.com" className="text-teal-600 hover:text-teal-700">jacktuchner@me.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
            <p>
              PeerHeal is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2">
              Jack Tuchner<br />
              <a href="mailto:jacktuchner@me.com" className="text-teal-600 hover:text-teal-700">jacktuchner@me.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

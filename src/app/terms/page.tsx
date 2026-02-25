import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link href="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 12, 2026</p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Kizu (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. Kizu is operated by Jack Tuchner (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Platform Description</h2>
            <p>
              Kizu is a peer support platform that connects surgical recovery seekers with guides who share their personal recovery experiences. The Platform facilitates two types of connections: pre-recorded audio/video content and live 1-on-1 video calls. Kizu is not a healthcare provider and does not offer medical advice, diagnosis, or treatment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Not Medical Advice</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <p className="font-medium text-amber-800">
                All content on Kizu reflects personal experiences of individual guides and is NOT medical advice. Always follow your doctor&apos;s instructions and consult qualified healthcare professionals for medical decisions.
              </p>
            </div>
            <p>
              Guides share their personal recovery journey. Individual results vary significantly based on health, procedure specifics, and other factors. You should never delay seeking medical advice, disregard medical advice, or discontinue medical treatment because of information on this Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years old to use the Platform.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating your account and profile.</li>
              <li>You may not create multiple accounts or share your account with others.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Seekers</h2>
            <p className="mb-3">As a seeker, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide truthful profile information for accurate matching</li>
              <li>Treat guides with respect during calls</li>
              <li>Not record, redistribute, or share purchased content without permission</li>
              <li>Understand that content reflects personal experiences and is not medical advice</li>
              <li>Not solicit medical advice from guides</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Guides</h2>
            <p className="mb-3">As a guide, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Share only your own genuine recovery experiences</li>
              <li>Not provide medical advice, diagnoses, or treatment recommendations</li>
              <li>Clearly communicate that your experience is personal and may not apply to others</li>
              <li>Honor confirmed call bookings or cancel with reasonable notice</li>
              <li>Maintain a professional and supportive tone in all interactions</li>
              <li>Not upload content that is misleading, harmful, or violates others&apos; rights</li>
              <li>Comply with Stripe&apos;s terms of service for receiving payouts</li>
            </ul>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Anti-Solicitation Policy</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium text-amber-800 mb-2">
                Guides are strictly prohibited from:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-amber-800">
                <li>Sharing personal contact information (phone number, email, social media handles) with seekers</li>
                <li>Soliciting or encouraging seekers to communicate outside of the Kizu platform</li>
                <li>Bypassing the platform for payments, including offering private paid sessions or accepting direct payments</li>
                <li>Providing medical advice, diagnoses, or treatment recommendations in any form</li>
              </ul>
              <p className="font-medium text-amber-800 mt-3">
                Violations of this policy may result in immediate account termination and forfeiture of all pending earnings. By accepting the Guide Agreement, guides acknowledge and accept these terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Guide Verification</h2>
            <p className="mb-3">
              Kizu takes reasonable steps to verify guide identities and experiences through an application process that may include document review and video interviews. Guides who complete this process receive a &ldquo;Verified&rdquo; designation on their profile.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <p className="font-medium text-amber-800">
                The &ldquo;Verified&rdquo; designation indicates that a guide has completed our review process. It does not constitute a guarantee, endorsement, or certification of any guide&apos;s medical history, qualifications, or the accuracy of their content. We are not liable for any claims, losses, or damages arising from reliance on guide content, whether or not the guide is verified.
              </p>
            </div>
            <p>
              We reserve the right to revoke verification status at any time if we determine a guide has provided false information or violated our community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Payments</h2>
            <h3 className="font-medium text-gray-900 mt-4 mb-2">Free Content</h3>
            <p>All recordings, series, and recommendations on Kizu are free to access. No account is required to browse content.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Live Calls</h3>
            <p>Pricing for 1-on-1 calls is based on the guide&apos;s hourly rate and session duration. Payment is collected via Stripe at the time of booking.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Group Sessions</h3>
            <p>Group session pricing is set by the guide. Payment is collected via Stripe at the time of registration.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Guide Payouts</h3>
            <p>Guides receive 75% of call and group session revenue. The platform retains a 25% fee. Payouts are processed via Stripe Connect.</p>

            <h3 className="font-medium text-gray-900 mt-4 mb-2">Refunds</h3>
            <p>If you are unsatisfied with a purchase, contact us to discuss your situation. Refund requests are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Content Ownership</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Guides retain ownership of their recorded content.</li>
              <li>By uploading content, guides grant Kizu a non-exclusive license to host, display, and distribute the content on the Platform.</li>
              <li>Purchased content is licensed for personal, non-commercial use only. You may not redistribute, resell, or publicly display purchased content.</li>
              <li>We may remove content that violates these terms or our community guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Prohibited Conduct</h2>
            <p className="mb-3">You may not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate another person or misrepresent your identity</li>
              <li>Upload malicious software or attempt to compromise Platform security</li>
              <li>Scrape, crawl, or automatically collect data from the Platform</li>
              <li>Circumvent payment systems or access content without authorization</li>
              <li>Provide medical advice while posing as a peer support guide</li>
              <li>Share other users&apos; personal information without their consent</li>
              <li>Share personal contact information with seekers for off-platform communication (guides)</li>
              <li>Solicit or encourage users to communicate or transact outside of Kizu</li>
              <li>Offer or accept payments for services outside the Platform that bypass Kizu&apos;s payment system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Reporting and Moderation</h2>
            <p>
              Users can report content or behavior that violates these terms. We review reports and may take action including content removal, warnings, or account suspension. We strive to be fair but reserve the right to make final decisions on moderation matters.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Kizu and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. This includes but is not limited to damages arising from: reliance on content shared by guides, technical issues during live calls, or decisions made based on information obtained through the Platform.
            </p>
            <p className="mt-3">
              Our total liability for any claim arising from or related to these terms shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or that content will be accurate or reliable. We do not endorse or verify the medical accuracy of guide content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
            <p>
              We may modify these Terms of Service at any time. We will notify users of material changes by posting the updated terms on this page. Continued use of the Platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">15. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising from these terms or use of the Platform shall be resolved through good-faith negotiation, and if necessary, binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">16. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at:
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

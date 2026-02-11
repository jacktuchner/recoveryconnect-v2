import Link from "next/link";
import { PROCEDURE_TYPES, RECORDING_CATEGORIES, CHRONIC_PAIN_CONDITIONS } from "@/lib/constants";
import ContentPreviewSection from "@/components/ContentPreviewSection";
import HeroCTA from "@/components/HeroCTA";
import ContributorCTA from "@/components/ContributorCTA";
import FooterContributorLinks from "@/components/FooterContributorLinks";
import FooterPatientLinks from "@/components/FooterPatientLinks";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Guidance from people who&apos;ve
              <span className="text-teal-200"> actually been through it</span>
            </h1>
            <p className="text-lg sm:text-xl text-teal-100 mb-8 leading-relaxed">
              Your doctor tells you what to expect medically. We connect you with
              real people who match your age, activity level, and goals — so you
              know what it actually feels like.
            </p>
            <HeroCTA />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How RecoveryConnect Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Two tiers of peer support, designed to give you exactly the
              guidance you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 - Recordings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Watch Real Stories</h3>
              <p className="text-gray-600 mb-4">
                Browse structured voice and video recordings from real people,
                filtered to match your profile. Available anytime.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">&#10003;</span> Recovery and management timelines
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">&#10003;</span> Practical tips and lessons learned
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">&#10003;</span> Matched to your demographics and goals
                </li>
              </ul>
              <Link
                href="/watch"
                className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800"
              >
                Browse Recordings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Tier 2 - Calls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Book a Live Mentor Call</h3>
              <p className="text-gray-600 mb-4">
                Book a personal video call with someone who&apos;s been through the same thing.
                Ask questions, get specific advice, feel supported.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-500">&#10003;</span> 30 or 60 minute sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-500">&#10003;</span> Submit questions in advance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-500">&#10003;</span> Real-time, personal connection
                </li>
              </ul>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-800"
              >
                Find a Mentor
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Preview Section */}
      <ContentPreviewSection />

      {/* Profile Matching */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Same Condition, Different Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A 28-year-old runner recovering from ACL reconstruction needs different
              guidance than a 65-year-old returning to golf after a total knee replacement.
              Someone newly diagnosed with fibromyalgia needs different advice than
              someone managing CRPS for a decade. We match you with people in your situation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Condition type", icon: "\u{1F3E5}", desc: "Same condition, same context" },
              { label: "Age & activity", icon: "🏃", desc: "Similar physical profile" },
              { label: "Recovery goals", icon: "🎯", desc: "What 'recovered' means to you" },
              { label: "Life situation", icon: "🏠", desc: "Kids, job, living situation" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-semibold mb-1">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Verification */}
      <section className="bg-gradient-to-br from-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Every Contributor is Vetted</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We review every contributor before they can publish content or take calls.
              When you see the Verified badge, you know they&apos;ve been through our process.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Written Application</h4>
              <p className="text-sm text-gray-500">Contributors describe their experience and what they want to share</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Video Interview</h4>
              <p className="text-sm text-gray-500">A brief call with our team to verify their story and approach</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Verified Badge</h4>
              <p className="text-sm text-gray-500">Approved contributors display a Verified badge visible to all patients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Conditions */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Supported Conditions</h2>
            <p className="text-gray-600">Surgery recovery and autoimmune conditions, expanding based on demand.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Surgeries</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {PROCEDURE_TYPES.map((proc) => (
                  <Link
                    key={proc}
                    href={`/watch?procedure=${encodeURIComponent(proc)}`}
                    className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
                  >
                    {proc}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Autoimmune</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {CHRONIC_PAIN_CONDITIONS.map((cond) => (
                  <Link
                    key={cond}
                    href={`/watch?procedure=${encodeURIComponent(cond)}`}
                    className="bg-white border border-purple-200 rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-purple-400 hover:text-purple-700 transition-colors"
                  >
                    {cond}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Categories */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Structured Content</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Contributors record guided entries across six categories, so you
              find exactly the information you need.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {RECORDING_CATEGORIES.map((cat) => (
              <div
                key={cat.value}
                className="bg-gray-50 rounded-xl p-5 hover:bg-teal-50 transition-colors"
              >
                <h4 className="font-semibold mb-1">{cat.label}</h4>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Contributors */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Been through it? Help others navigate it.
          </h2>
          <p className="text-cyan-100 max-w-2xl mx-auto mb-8">
            Many contributors say that sharing their story is one of the most meaningful
            parts of their recovery — almost therapeutic. Get paid to record content on your
            own time or take live video calls. Whether you&apos;ve recovered from surgery or
            manage an autoimmune condition, someone out there needs to hear your story.
          </p>
          <ContributorCTA />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            RecoveryConnect provides peer-to-peer recovery experiences and is not a
            medical service. Content shared by contributors reflects personal
            experience and should not be considered medical advice. Always consult
            your healthcare provider for medical decisions. By using this platform,
            you agree to our Terms of Service and understand that individual
            recovery experiences vary.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RC</span>
                </div>
                <span className="text-white font-bold">RecoveryConnect</span>
              </div>
              <p className="text-sm">
                Peer recovery guidance from people who have been through it.
              </p>
            </div>
            <FooterPatientLinks />
            <div>
              <h4 className="text-white font-semibold mb-3">For Contributors</h4>
              <FooterContributorLinks />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            &copy; {new Date().getFullYear()} RecoveryConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

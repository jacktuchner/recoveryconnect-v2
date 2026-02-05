import Link from "next/link";
import { PROCEDURE_TYPES, RECORDING_CATEGORIES } from "@/lib/constants";
import ContentPreviewSection from "@/components/ContentPreviewSection";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Recovery guidance from people who've
              <span className="text-teal-200"> actually experienced it</span>
            </h1>
            <p className="text-lg sm:text-xl text-teal-100 mb-8 leading-relaxed">
              Your doctor tells you what to expect medically. We connect you with
              real people who match your age, activity level, and goals — so you
              know what recovery actually feels like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/watch"
                className="inline-flex items-center justify-center border-2 border-teal-300 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors"
              >
                Watch Stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How RecoveryConnect Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Two tiers of peer recovery support, designed to give you exactly the
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
              <h3 className="text-xl font-bold mb-2">Watch Recovery Stories</h3>
              <p className="text-gray-600 mb-4">
                Browse structured voice and video recordings from past patients,
                filtered to match your profile. Available anytime.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">&#10003;</span> Week-by-week recovery timelines
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
                Book a personal video call with someone who had the same procedure.
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
              Same Surgery, Different Recovery
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A 28-year-old competitive runner recovering from ACL reconstruction
              needs different guidance than a 65-year-old who wants to walk
              pain-free. We match you with people in your situation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Procedure type", icon: "🏥", desc: "Same surgery, same technique" },
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

      {/* Procedures */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Supported Procedures</h2>
            <p className="text-gray-600">Starting with high-volume orthopedic surgeries, expanding based on demand.</p>
          </div>
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
      </section>

      {/* Content Categories */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Structured Recovery Content</h2>
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
            Had surgery? Help others through it.
          </h2>
          <p className="text-cyan-100 max-w-2xl mx-auto mb-8">
            Get paid to share your recovery experience. Record content on your own
            time, or set up availability for live video calls. Your experience is
            valuable — and someone out there needs to hear it.
          </p>
          <Link
            href="/auth/register?role=contributor"
            className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Become a Contributor
          </Link>
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
            <div>
              <h4 className="text-white font-semibold mb-3">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/watch" className="hover:text-white">Watch Stories</Link></li>
                <li><Link href="/mentors" className="hover:text-white">Book a Mentor</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">For Contributors</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/register?role=contributor" className="hover:text-white">Become a Contributor</Link></li>
                <li><Link href="/dashboard/contributor" className="hover:text-white">Contributor Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
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

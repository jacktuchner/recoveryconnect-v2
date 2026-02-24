"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function HowItWorksPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isContributorRole = userRole === "GUIDE" || userRole === "BOTH" || userRole === "ADMIN";
  const defaultTab = isContributorRole ? "contributor" : "patient";
  const [activeTab, setActiveTab] = useState<"patient" | "contributor">(defaultTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            How Kizu Works
          </h1>
          <p className="text-lg sm:text-xl text-teal-100 max-w-2xl mx-auto">
            {activeTab === "patient"
              ? "Get matched with real people who\u2019ve been through the same thing. Learn from their experience through recordings or live calls."
              : "Sharing your story is powerful — for you and for others. Many guides find it deeply meaningful. Set your own prices and schedule."}
          </p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("patient")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "patient"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              For Seekers
            </button>
            <button
              onClick={() => setActiveTab("contributor")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "contributor"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              For Guides
            </button>
          </div>
        </div>
      </div>

      {/* ==================== PATIENT TAB ==================== */}
      {activeTab === "patient" && (
        <>
          {/* 3-Step Flow */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-200 to-transparent -translate-x-1/2"></div>
                </div>
                <div className="bg-teal-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create Your Profile</h3>
                <p className="text-gray-600">
                  Tell us about your surgery or condition, age, activity level, and goals.
                  This helps us match you with guides who truly understand your situation.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-200 to-transparent -translate-x-1/2"></div>
                </div>
                <div className="bg-cyan-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Find Your Match</h3>
                <p className="text-gray-600">
                  Browse guides who&apos;ve been through the same thing. Filter by surgery or condition, age,
                  activity level, and see match scores showing how similar their situation is to yours.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Watch or Talk</h3>
                <p className="text-gray-600">
                  Watch free recordings on your schedule, or book a live 1-on-1 video call
                  for personalized advice and real-time Q&A with your mentor.
                </p>
              </div>
            </div>
          </div>

          {/* Ways to Connect Section */}
          <div className="bg-white py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Ways to Connect
              </h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Multiple ways to learn from others and support each other through recovery.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Recordings Card */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Watch Real Stories</h3>
                  <p className="text-gray-600 mb-6">
                    Pre-recorded audio and video from guides sharing their journey.
                    Watch anytime, completely free.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Recovery and management timelines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Practical tips and lessons learned</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Available 24/7 on your schedule</span>
                    </li>
                  </ul>
                  <Link
                    href="/watch"
                    className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Browse Recordings
                  </Link>
                </div>

                {/* Calls Card */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Book a Live Call</h3>
                  <p className="text-gray-600 mb-6">
                    1-on-1 video calls with a matched guide. Ask your specific questions and
                    get personalized advice in real-time.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Real-time Q&A with your guide</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Personalized to your situation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">30 or 60 minute sessions</span>
                    </li>
                  </ul>
                  <Link
                    href="/guides"
                    className="inline-flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Find a Guide
                  </Link>
                </div>

                {/* Group Sessions Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Group Sessions</h3>
                  <p className="text-gray-600 mb-6">
                    Join live group video sessions led by a guide. Learn alongside others
                    going through the same thing.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Shared experience with peers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">More affordable than 1-on-1 calls</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Priced per session by the guide</span>
                    </li>
                  </ul>
                  <Link
                    href="/group-sessions"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Browse Sessions
                  </Link>
                </div>

                {/* Community Forum Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Forum</h3>
                  <p className="text-gray-600 mb-6">
                    Free peer support organized by condition. Ask questions, share tips,
                    and connect with others on the same journey.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Free for all members</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Organized by surgery or condition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Guides participate with verified badges</span>
                    </li>
                  </ul>
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Visit Community
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div id="pricing" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Simple, Transparent Pricing</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                All recordings and stories are completely free. Live calls and group sessions
                are priced per session, set by each guide.
              </p>
            </div>
          </div>

          {/* Patient FAQ */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Common Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Who are the guides?</h3>
                <p className="text-gray-600">
                  Guides are real people who have been through surgery recovery or live with autoimmune conditions themselves.
                  Every guide goes through our vetting process — a written application, optional proof documents, and a
                  video interview with our team — before they can publish content or take calls.
                  Approved guides display a Verified badge on their profile.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is this medical advice?</h3>
                <p className="text-gray-600">
                  No. Kizu provides peer support, not medical advice. Guides share
                  their personal experiences and what worked for them, but you should always follow
                  your doctor&apos;s instructions and consult healthcare professionals for medical decisions.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How does matching work?</h3>
                <p className="text-gray-600">
                  We match you based on your surgery or condition, age range, activity level, and goals.
                  The more complete your profile, the better your matches. Match scores show you how
                  similar a guide&apos;s situation is to yours.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What if I&apos;m not satisfied with a call?</h3>
                <p className="text-gray-600">
                  We want you to have a positive experience. If you&apos;re not satisfied with a
                  call, contact our support team and we&apos;ll work with you to make it right.
                </p>
              </div>
            </div>
          </div>

          {/* Patient CTA */}
          <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-teal-100 mb-8">
                {session
                  ? "Browse recordings and find guides who understand your situation."
                  : "Create your free profile and get matched with guides who understand your situation."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <>
                    <Link
                      href="/dashboard/seeker"
                      className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      href="/watch"
                      className="inline-flex items-center justify-center gap-2 bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors border border-teal-500"
                    >
                      Browse Recordings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      href="/watch"
                      className="inline-flex items-center justify-center gap-2 bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors border border-teal-500"
                    >
                      Browse Content First
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== CONTRIBUTOR TAB ==================== */}
      {activeTab === "contributor" && (
        <>
          {/* 3-Step Flow */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-200 to-transparent -translate-x-1/2"></div>
                </div>
                <div className="bg-teal-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Apply & Get Verified</h3>
                <p className="text-gray-600">
                  Submit a short application about your experience, then complete a brief video
                  interview with our team. Once approved, set up your profile and connect Stripe
                  to get paid.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-200 to-transparent -translate-x-1/2"></div>
                </div>
                <div className="bg-cyan-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Share Your Story</h3>
                <p className="text-gray-600">
                  Record audio or video about your experience — many guides say it feels
                  almost therapeutic. Create series, recommend products and providers, and set
                  your availability for live calls.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Earn & Help</h3>
                <p className="text-gray-600">
                  Your free recordings build your audience. Seekers book paid calls with you.
                  You earn 75% of every call and group session.
                </p>
              </div>
            </div>
          </div>

          {/* Ways to Earn & Engage */}
          <div className="bg-white py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Ways to Earn & Engage
              </h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Earn from your content and calls, or connect with seekers for free in the community.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Recordings */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Recordings</h3>
                  <p className="text-gray-600 mb-4">
                    Your free recordings are your marketing. They build visibility and
                    drive seekers to book paid calls with you.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Build your audience and reputation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Group into free series</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Drive seekers to book calls with you</span>
                    </li>
                  </ul>
                </div>

                {/* Live Calls */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Live Calls</h3>
                  <p className="text-gray-600 mb-4">
                    Set your hourly rate and availability. Seekers book 30 or 60 minute
                    video calls. You earn 75% of each booking.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Set your own hourly rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Control your availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">1-on-1 personalized sessions</span>
                    </li>
                  </ul>
                </div>

                {/* Group Sessions */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Group Sessions</h3>
                  <p className="text-gray-600 mb-4">
                    Host group sessions for multiple seekers at once.
                    You set the price and max capacity.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Set price per attendee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Choose your max group size</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Higher earning potential per session</span>
                    </li>
                  </ul>
                </div>

                {/* Community Forum */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Community Forum</h3>
                  <p className="text-gray-600 mb-4">
                    See what seekers are asking about, answer questions, and build your
                    presence. Your posts display a verified guide badge.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Understand what seekers need</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Build trust with verified badge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Pin helpful threads for seekers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contributor FAQ */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Guide FAQ
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How do I get paid?</h3>
                <p className="text-gray-600">
                  We use Stripe Connect for all payouts. You earn 75% of every call booking
                  and group session. Your free recordings serve as marketing &mdash; they build trust
                  and drive seekers to book paid calls. Payouts are processed automatically to
                  your connected bank account.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What do I need to record?</h3>
                <p className="text-gray-600">
                  Share your timeline, practical tips, mental health strategies &mdash; whatever
                  helped you through it. Seekers are looking for real, honest experiences
                  from someone who&apos;s been in their shoes.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I set my own prices?</h3>
                <p className="text-gray-600">
                  You control your hourly rate for calls and your group session pricing.
                  Recordings are free to maximize your audience reach.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What about recommendations?</h3>
                <p className="text-gray-600">
                  You can recommend products, providers, and services that helped you.
                  Multiple endorsements from different guides boost visibility, helping seekers
                  find the most trusted recommendations.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is there a minimum commitment?</h3>
                <p className="text-gray-600">
                  No &mdash; contribute as much or as little as you want. Record one story or a hundred.
                  Take calls when it fits your schedule. There are no minimums or obligations.
                </p>
              </div>
            </div>
          </div>

          {/* Contributor CTA */}
          <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Share Your Story?</h2>
              <p className="text-lg text-teal-100 mb-8">
                {isContributorRole
                  ? "Head to your guide dashboard to start recording, set up calls, and manage your profile."
                  : "Your experience matters — to others and to you. Many guides say sharing their story helps them process their own recovery."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isContributorRole ? (
                  <Link
                    href="/dashboard/guide"
                    className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href={session ? "/guide-application" : "/auth/register"}
                    className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                  >
                    Become a Guide
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

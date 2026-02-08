"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { SUBSCRIPTION_MONTHLY_PRICE, SUBSCRIPTION_ANNUAL_PRICE } from "@/lib/constants";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function HowItWorksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;
  const isContributorRole = userRole === "CONTRIBUTOR";
  const defaultTab = isContributorRole ? "contributor" : "patient";
  const [activeTab, setActiveTab] = useState<"patient" | "contributor">(defaultTab);

  async function handleSubscribe(plan: "monthly" | "annual") {
    if (!session?.user) {
      router.push("/auth/register");
      return;
    }
    setSubscribing(plan);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            How RecoveryConnect Works
          </h1>
          <p className="text-lg sm:text-xl text-teal-100 max-w-2xl mx-auto">
            {activeTab === "patient"
              ? "Get matched with real people who\u2019ve been through your exact surgery. Learn from their experience through recordings or live calls."
              : "Share your recovery story, help others heal, and earn money doing it. Set your own prices and schedule."}
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
              For Patients
            </button>
            <button
              onClick={() => setActiveTab("contributor")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "contributor"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              For Contributors
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
                  Tell us about your surgery, age, activity level, and recovery goals.
                  This helps us match you with contributors who truly understand your situation.
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
                  Browse contributors who&apos;ve had your surgery. Filter by procedure, age,
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
                  Purchase recordings to watch on your schedule, or book a live 1-on-1 video call
                  for personalized advice and real-time Q&A with your mentor.
                </p>
              </div>
            </div>
          </div>

          {/* Two Options Section */}
          <div className="bg-white py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Two Ways to Connect
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Recordings Card */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Watch Recovery Stories</h3>
                  <p className="text-gray-600 mb-6">
                    Pre-recorded audio and video from contributors sharing their recovery journey.
                    Buy once, watch anytime.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Week-by-week recovery timelines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Practical tips and lessons learned</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Mental health and coping strategies</span>
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
                    1-on-1 video calls with a matched mentor. Ask your specific questions and
                    get personalized advice in real-time.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Real-time Q&A with your mentor</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Personalized to your specific situation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">30 or 60 minute sessions available</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Submit questions in advance</span>
                    </li>
                  </ul>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Find a Mentor
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Subscribe for unlimited recording access, or purchase recordings individually.
              Live calls are always priced per session.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Individual Purchase */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Individual</h3>
                <p className="text-sm text-gray-500 mb-4">Pay per recording</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">$4.99+</p>
                <p className="text-sm text-gray-500 mb-6">per recording</p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    Buy only what you need
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    Lifetime access to purchased recordings
                  </li>
                </ul>
                <Link
                  href="/watch"
                  className="block text-center bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Browse Recordings
                </Link>
              </div>

              {/* Monthly Subscription */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-500 rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly</h3>
                <p className="text-sm text-gray-500 mb-4">Unlimited recordings</p>
                <p className="text-3xl font-bold text-teal-700 mb-1">${SUBSCRIPTION_MONTHLY_PRICE.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mb-6">per month</p>
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    Unlimited recording access
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    Cancel anytime
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    New content added regularly
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={subscribing === "monthly"}
                  className="w-full bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm disabled:opacity-50"
                >
                  {subscribing === "monthly" ? "Loading..." : "Subscribe Monthly"}
                </button>
              </div>

              {/* Annual Subscription */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Annual</h3>
                <p className="text-sm text-gray-500 mb-4">Best value</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">${SUBSCRIPTION_ANNUAL_PRICE.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mb-1">per year</p>
                <p className="text-xs text-green-600 font-medium mb-5">Save ~$90/year vs monthly</p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    Everything in Monthly
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    ~$12.50/month equivalent
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe("annual")}
                  disabled={subscribing === "annual"}
                  className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
                >
                  {subscribing === "annual" ? "Loading..." : "Subscribe Annually"}
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              Live calls are priced per session, set by each contributor.
            </p>
          </div>

          {/* Patient FAQ */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Common Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Who are the contributors?</h3>
                <p className="text-gray-600">
                  Contributors are real people who have been through surgical recovery themselves.
                  They share their experiences to help others going through similar situations.
                  All contributors are verified and share their actual recovery journey.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is this medical advice?</h3>
                <p className="text-gray-600">
                  No. RecoveryConnect provides peer support, not medical advice. Contributors share
                  their personal experiences and what worked for them, but you should always follow
                  your doctor&apos;s instructions and consult healthcare professionals for medical decisions.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How does matching work?</h3>
                <p className="text-gray-600">
                  We match you based on procedure type, age range, activity level, and recovery goals.
                  The more complete your profile, the better your matches. Match scores show you how
                  similar a contributor&apos;s situation is to yours.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What if I&apos;m not satisfied with a purchase?</h3>
                <p className="text-gray-600">
                  We want you to have a positive experience. If you&apos;re not satisfied with a recording
                  or call, contact our support team and we&apos;ll work with you to make it right.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How does the subscription work?</h3>
                <p className="text-gray-600">
                  A subscription gives you unlimited access to all recordings on RecoveryConnect.
                  Watch as many recovery stories as you want, anytime. You can cancel at any time
                  and keep access until the end of your billing period. Live calls are priced separately.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do contributors still get paid with subscriptions?</h3>
                <p className="text-gray-600">
                  Yes! Subscription revenue is distributed to contributors based on how much their content
                  is watched by subscribers. Contributors with popular, helpful content earn more. This ensures
                  contributors are fairly compensated while keeping access affordable for patients.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I still buy individual recordings?</h3>
                <p className="text-gray-600">
                  Absolutely. Both options are available. If you only need one or two specific recordings,
                  individual purchases may be more cost-effective. If you want to explore many recovery stories,
                  the subscription offers the best value.
                </p>
              </div>
            </div>
          </div>

          {/* Patient CTA */}
          <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Recovery Journey?</h2>
              <p className="text-lg text-teal-100 mb-8">
                {session
                  ? "Browse recordings and find contributors who understand your situation."
                  : "Create your free profile and get matched with contributors who understand your situation."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <>
                    <Link
                      href="/dashboard/patient"
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sign Up & Set Up</h3>
                <p className="text-gray-600">
                  Create your contributor profile, add your procedures and recovery details,
                  and connect Stripe so you can get paid.
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
                  Record audio or video of your recovery journey. Create series, recommend products
                  and providers, and set your availability for live calls.
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
                  Get paid when patients watch your recordings, buy your series, or book calls with you.
                  You earn 75% of every sale.
                </p>
              </div>
            </div>
          </div>

          {/* Ways to Earn */}
          <div className="bg-white py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Ways to Earn
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Recordings */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Recordings</h3>
                  <p className="text-gray-600 mb-4">
                    Record your recovery story. You set the price, earn 75% of each sale.
                    Subscribers can watch unlimited, and you earn based on views.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Set your own price per recording</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Bundle into series for higher value</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Earn from subscriber views too</span>
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
                    Set your hourly rate and availability. Patients book 30 or 60 minute
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
                    Host group recovery sessions for multiple patients at once.
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
              </div>
            </div>
          </div>

          {/* Contributor FAQ */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Contributor FAQ
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How do I get paid?</h3>
                <p className="text-gray-600">
                  We use Stripe Connect for all payouts. You earn 75% of every individual sale &mdash; recordings,
                  series, calls, and group sessions. For subscribers who watch your content, subscription
                  revenue is distributed based on how much your recordings are watched relative to other
                  contributors. The more patients engage with your content, the more you earn. Payouts are
                  processed automatically to your connected bank account.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What do I need to record?</h3>
                <p className="text-gray-600">
                  Share your recovery timeline, practical tips, mental health strategies &mdash; whatever
                  helped you through your recovery. Patients are looking for real, honest experiences
                  from someone who&apos;s been in their shoes.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I set my own prices?</h3>
                <p className="text-gray-600">
                  Yes! You have full control over pricing for your recordings, series, live calls,
                  and group sessions. Set prices that reflect the value of your experience.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What about recommendations?</h3>
                <p className="text-gray-600">
                  You can recommend products, providers, and services that helped during your recovery.
                  Multiple endorsements from different contributors boost visibility, helping patients
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
                {session
                  ? "Head to your contributor dashboard to start recording, set up calls, and manage your profile."
                  : "Sign up as a contributor and start helping others while earning money from your recovery experience."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <Link
                    href="/dashboard/contributor"
                    className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                  >
                    Become a Contributor
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

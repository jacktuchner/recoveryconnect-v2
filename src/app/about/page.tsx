import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Our Story
            </h1>
            <p className="text-lg sm:text-xl text-teal-100 leading-relaxed">
              Recovery Connect was born from years of surgeries, autoimmune conditions, and the
              realization that sometimes the people who understand you best are strangers
              who have walked the same path.
            </p>
          </div>
        </div>
      </section>

      {/* Jack&apos;s Story */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Hi, I&apos;m Jack</h2>

          <div className="prose prose-lg text-gray-600 space-y-6">
            <p>
              I&apos;m 26 now, and I&apos;ve been living with autoimmune issues since I was 15. What started
              as something I thought I could push through became a defining part of my life,
              leading me through years of rheumatology appointments and multiple surgeries.
            </p>

            <p>
              In March 2021, I had my first shoulder SLAP repair. Two years later, in
              April 2023, I went through it again on the other side. In 2017, my foot
              got run over by a car and I broke all five metatarsals. And as I write this,
              I&apos;m preparing for another surgery in March 2026 — a rhomboid repair with
              trapezius advancement.
            </p>

            <p>
              Each surgery taught me something new. Not just about my body, but about
              the emotional weight of recovery. The isolation. The frustration of
              feeling like a burden. The loneliness of lying awake at 3 AM wondering
              if what you&apos;re feeling is normal.
            </p>
          </div>

          {/* Photo Journey */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">My Journey</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/images/post-op-shoulder.jpg"
                    alt="Post-op shoulder after first SLAP repair surgery in 2021"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium text-gray-700">March 2021</span> — First shoulder surgery
                </p>
              </div>
              <div className="space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/images/surgery-day.jpg"
                    alt="In the hospital after second shoulder surgery in April 2023"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium text-gray-700">April 2023</span> — Second surgery, other shoulder
                </p>
              </div>
              <div className="space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/images/physical-therapy.jpg"
                    alt="Doing physical therapy and rehab exercises in 2025"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium text-gray-700">2025</span> — Still putting in the work
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Isolation */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">The Hardest Part Wasn&apos;t Physical</h2>

          <div className="prose prose-lg text-gray-600 space-y-6">
            <p>
              Here&apos;s what I learned: the physical pain is only part of it. The hardest
              part of recovery is the emotional isolation.
            </p>

            <p>
              Your friends and family love you. They want to help. But they don&apos;t
              <em> get it</em>. They haven&apos;t felt the specific fear of &quot;did I just
              tear my repair?&quot; when you move wrong. They don&apos;t know the frustration
              of being three weeks post-op and feeling like you should be further along.
              They can&apos;t understand the mental battle of wanting to be positive while
              secretly wondering if you&apos;ll ever feel normal again.
            </p>

            <p>
              Sometimes, you don&apos;t want to talk to the people closest to you. Not because
              they aren&apos;t supportive — but because you need someone who truly understands.
              Someone who has been exactly where you are. Someone who can say &quot;I felt that
              too, and here&apos;s what helped me&quot; instead of &quot;I&apos;m sure it&apos;ll get better.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* The Why */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Why Recovery Connect Exists</h2>

          <div className="prose prose-lg text-gray-600 space-y-6">
            <p>
              I looked for what I needed and couldn&apos;t find it. Medical information?
              Everywhere. Clinical recovery timelines? Easy to find. But real stories
              from real people who matched my situation? Nearly impossible.
            </p>

            <p>
              I wanted to hear from someone my age, with similar goals, who had the
              same surgery. I wanted to know what week three actually felt like. I
              wanted someone to tell me that the mental struggles were normal. I wanted
              connection, not just information.
            </p>

            <p>
              That&apos;s why I built Recovery Connect. To create the community I wish
              existed when I was lying in that hospital bed, scrolling through forums
              at 2 AM, desperate to find someone who understood.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We&apos;re building an emotional support community that connects you with
              people who truly understand your journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Emotional Support</h3>
              <p className="text-gray-600">
                Recovery isn&apos;t just physical. We provide a space for the emotional
                journey — the fears, the frustrations, and the small victories.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Real Peer Experiences</h3>
              <p className="text-gray-600">
                Not medical advice. Real stories from real people who have been
                through it. The stuff you can&apos;t find in a pamphlet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Meaningful Matches</h3>
              <p className="text-gray-600">
                Connect with people who match your situation — surgery, condition, age,
                activity level, and goals. Not random strangers — kindred spirits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hope & CTA */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">You&apos;re Not Alone</h2>
          <p className="text-teal-100 text-lg mb-4">
            Recovery is possible. The pain you&apos;re feeling right now? It gets better.
            The isolation? It doesn&apos;t have to be this way.
          </p>
          <p className="text-teal-100 text-lg mb-4">
            There&apos;s a whole community of people who have walked this road before you,
            and they&apos;re ready to walk it with you.
          </p>
          <p className="text-teal-100 text-lg mb-8">
            And if you&apos;re further along in your journey, sharing your story can be
            one of the most rewarding things you do. Contributors often say it
            feels almost therapeutic — a way to make meaning out of what they went through.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Join the Community
            </Link>
            <Link
              href="/auth/register?role=contributor"
              className="inline-flex items-center justify-center border-2 border-teal-300 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Share Your Story
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Quote */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <blockquote className="text-xl text-gray-600 italic">
            &quot;Sometimes the most comforting voice isn&apos;t the one with answers —
            it&apos;s the one that says &apos;I&apos;ve been there too.&apos;&quot;
          </blockquote>
          <p className="mt-4 text-gray-500">— Jack Tuchner, Founder</p>
        </div>
      </section>
    </div>
  );
}

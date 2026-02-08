"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
};

const patientLinks: NavLink[] = [
  { href: "/watch", label: "Watch Stories" },
  { href: "/mentors", label: "Book a Mentor" },
  { href: "/group-sessions", label: "Group Sessions" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

const contributorLinks: NavLink[] = [
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const userRole = (session?.user as any)?.role;

  // Determine which links to show based on role
  const getNavLinks = (): NavLink[] => {
    if (!session) return patientLinks;
    if (userRole === "CONTRIBUTOR") return contributorLinks;
    // PATIENT, BOTH, ADMIN all see patient links
    return patientLinks;
  };

  // Determine dashboard path based on role
  const getDashboardPath = (): string => {
    if (userRole === "CONTRIBUTOR" || userRole === "BOTH") {
      return "/dashboard/contributor";
    }
    return "/dashboard/patient";
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Recovery<span className="text-teal-600">Connect</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-5">
            {session && (
              <Link
                href={getDashboardPath()}
                className="text-gray-600 hover:text-teal-600 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {/* Show Admin link for admins */}
            {session && userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Admin
              </Link>
            )}
            {/* Show public profile link for contributors */}
            {session && (userRole === "CONTRIBUTOR" || userRole === "BOTH") && (
              <Link
                href={`/contributors/${(session.user as any)?.id}`}
                className="text-gray-600 hover:text-teal-600 transition-colors"
              >
                My Profile
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-teal-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Sign Out
                </button>
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-700 text-sm font-medium">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            {session && (
              <Link
                href={getDashboardPath()}
                className="block py-2 text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {/* Show Admin link for admins (mobile) */}
            {session && userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="block py-2 text-purple-600 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            {/* Show public profile link for contributors (mobile) */}
            {session && (userRole === "CONTRIBUTOR" || userRole === "BOTH") && (
              <Link
                href={`/contributors/${(session.user as any)?.id}`}
                className="block py-2 text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <button onClick={() => signOut()} className="block py-2 text-gray-600">Sign Out</button>
            ) : (
              <>
                <Link href="/auth/signin" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="block py-2 text-teal-600 font-medium" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

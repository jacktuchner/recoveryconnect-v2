"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

type NavLink = {
  href: string;
  label: string;
};

const browseLinks: NavLink[] = [
  { href: "/watch", label: "Watch Stories" },
  { href: "/guides", label: "Find a Guide" },
  { href: "/group-sessions", label: "Group Sessions" },
  { href: "/recommendations", label: "Recommended Products" },
  { href: "/community", label: "Community" },
];

function Dropdown({ label, links, onNavigate }: { label: string; links: NavLink[]; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
              onClick={() => { setOpen(false); onNavigate?.(); }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesLink({ onClick }: { onClick?: () => void }) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    async function fetchUnread() {
      try {
        const res = await fetch("/api/messages/unread");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <Link
      href="/messages"
      className="relative text-gray-600 hover:text-teal-600 transition-colors"
      onClick={onClick}
    >
      Messages
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-3 bg-teal-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isBoth = userRole === "BOTH" || userRole === "ADMIN";
  const isGuide = userRole === "GUIDE";

  const dashboardHref = isBoth
    ? "/dashboard"
    : isGuide
      ? "/dashboard/guide"
      : "/dashboard/seeker";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo_v2.png"
              alt="Kizu"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-5">
            {session ? (
              <>
                <Link href={dashboardHref} className="text-gray-600 hover:text-teal-600 transition-colors">
                  Dashboard
                </Link>
                <Dropdown label="Browse" links={browseLinks} />
                <MessagesLink />
                {userRole === "ADMIN" && (
                  <Link href="/admin" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/settings" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Settings
                </Link>
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
                <Dropdown label="Browse" links={browseLinks} />
                <Link href="/how-it-works" className="text-gray-600 hover:text-teal-600 transition-colors">
                  How It Works
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-teal-600 transition-colors">
                  About
                </Link>
                <Link href="/auth/signin" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-1">
            {session ? (
              <>
                <Link href={dashboardHref} className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">Browse</p>
                {browseLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block py-2 pl-3 text-gray-600" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/messages" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  Messages
                </Link>
                {userRole === "ADMIN" && (
                  <Link href="/admin" className="block py-2 text-purple-600 font-medium" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link href="/settings" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <button onClick={() => signOut()} className="block py-2 text-gray-600 pt-3">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">Browse</p>
                {browseLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block py-2 pl-3 text-gray-600" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/how-it-works" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  How It Works
                </Link>
                <Link href="/about" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
                <Link href="/auth/signin" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/auth/register" className="block py-2 text-teal-600 font-medium" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

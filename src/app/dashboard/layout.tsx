"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const roleTabs = [
  { href: "/dashboard/seeker", label: "My Recovery", prefix: "/dashboard/seeker" },
  { href: "/dashboard/guide", label: "My Guide Profile", prefix: "/dashboard/guide" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role;
  const showTabs = role === "BOTH" || role === "ADMIN";

  if (!showTabs) {
    return <>{children}</>;
  }

  return (
    <div>
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0 -mb-px">
            {roleTabs.map((tab) => {
              const isActive = pathname.startsWith(tab.prefix);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}

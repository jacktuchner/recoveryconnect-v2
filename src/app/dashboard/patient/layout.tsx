"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const tabs = [
  { href: "/dashboard/patient", label: "Dashboard" },
  { href: "/dashboard/patient/settings", label: "Settings" },
];

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const role = (session?.user as any)?.role;
  const hasAccess = role === "PATIENT" || role === "BOTH" || role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && !hasAccess) router.push("/dashboard/contributor");
  }, [status, hasAccess, router]);

  if (status === "loading" || (status === "authenticated" && !hasAccess)) {
    return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  }

  function isActive(href: string) {
    if (href === "/dashboard/patient") {
      return pathname === "/dashboard/patient";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
      </div>

      <div className="mb-8 border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive(tab.href)
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "contributor" ? "CONTRIBUTOR" : "PATIENT";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in (and not mid-registration), redirect to appropriate dashboard
  useEffect(() => {
    if (loading) return; // Don't redirect during form submission — handleSubmit handles it
    if (status !== "authenticated" || !session?.user) return;
    const role = (session.user as any)?.role;
    const cs = (session.user as any)?.contributorStatus;
    if (role === "ADMIN") {
      router.push("/admin");
    } else if (role === "CONTRIBUTOR" || role === "BOTH") {
      if (cs === "PENDING_REVIEW") {
        router.push("/contributor-application");
      } else {
        router.push("/dashboard/contributor");
      }
    } else {
      router.push("/dashboard/patient");
    }
  }, [status, session, router, loading]);

  // Show loading while checking session / redirecting
  if (status === "loading" || status === "authenticated") {
    return <div className="min-h-[80vh] flex items-center justify-center">Loading...</div>;
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign in
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        setLoading(false);
        return;
      }

      // Hard redirect to avoid race with session useEffect
      window.location.href = form.role === "CONTRIBUTOR" ? "/contributor-application" : "/dashboard/patient";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-gray-600 mt-2">Join PeerHeal to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateForm("role", "PATIENT")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  form.role === "PATIENT"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Find recovery guidance
              </button>
              <button
                type="button"
                onClick={() => updateForm("role", "CONTRIBUTOR")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  form.role === "CONTRIBUTOR"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Share my experience
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => updateForm("confirmPassword", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

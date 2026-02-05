"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  pendingRecordings: number;
  publishedRecordings: number;
  totalUsers: number;
  totalContributors: number;
  pendingReports: number;
  totalCalls: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/recordings" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
          <p className="text-sm text-gray-500">Pending Recordings</p>
          <p className="text-3xl font-bold text-yellow-600">{stats?.pendingRecordings || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Published Recordings</p>
          <p className="text-3xl font-bold text-green-600">{stats?.publishedRecordings || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Live on platform</p>
        </div>

        <Link href="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-teal-600">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.totalContributors || 0} contributors</p>
        </Link>

        <Link href="/admin/reports" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
          <p className="text-sm text-gray-500">Pending Reports</p>
          <p className="text-3xl font-bold text-red-600">{stats?.pendingReports || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Need attention</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/recordings"
            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-2xl">🎙️</span>
            <div>
              <p className="font-medium text-gray-900">Review Recordings</p>
              <p className="text-sm text-gray-500">Approve or reject pending content</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">View and edit user roles</p>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span className="text-2xl">🚩</span>
            <div>
              <p className="font-medium text-gray-900">Handle Reports</p>
              <p className="text-sm text-gray-500">Review flagged content</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

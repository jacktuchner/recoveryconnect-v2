"use client";

import { useState, useEffect } from "react";

interface PaymentStats {
  totalRevenue: number;
  recordingSales: number;
  callPayments: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/payments");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load payment stats:", err);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            ${(stats?.totalRevenue || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Recording Sales</p>
          <p className="text-3xl font-bold text-teal-600">
            ${(stats?.recordingSales || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Call Payments</p>
          <p className="text-3xl font-bold text-blue-600">
            ${(stats?.callPayments || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Guide Payouts</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">Pending Payouts</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${(stats?.pendingPayouts || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">Completed Payouts</p>
            <p className="text-2xl font-bold text-green-600">
              ${(stats?.completedPayouts || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6 text-center text-gray-500">
        <p>Detailed payment history coming soon</p>
      </div>
    </div>
  );
}

"use client";

import VideoCall from "@/components/VideoCall";

interface CallRequestsSectionProps {
  calls: any[];
  onCallUpdate: (callId: string, updated: any) => void;
}

export default function CallRequestsSection({ calls, onCallUpdate }: CallRequestsSectionProps) {
  async function updateCallStatus(callId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onCallUpdate(callId, updated);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Call Requests</h2>
      {calls.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No call requests yet.</p>
      ) : (
        <div className="space-y-4">
          {calls.map((call: any) => {
            const isUpcoming = call.status === "CONFIRMED" && new Date(call.scheduledAt) > new Date(Date.now() - call.durationMinutes * 60 * 1000);
            const canJoinCall = isUpcoming && call.videoRoomUrl;

            return (
              <div key={call.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div>
                    <p className="font-medium">{call.patient?.name || "Patient"}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(call.scheduledAt).toLocaleDateString()} at{" "}
                      {new Date(call.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" "}&middot; {call.durationMinutes} min &middot; ${call.contributorPayout.toFixed(2)} payout
                    </p>
                    {call.questionsInAdvance && (
                      <p className="text-sm text-gray-400 mt-1">Questions: {call.questionsInAdvance}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {call.status === "REQUESTED" && (
                      <>
                        <button onClick={() => updateCallStatus(call.id, "CONFIRMED")} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium">Confirm</button>
                        <button onClick={() => updateCallStatus(call.id, "CANCELLED")} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium">Decline</button>
                      </>
                    )}
                    {call.status === "CONFIRMED" && (
                      <button onClick={() => updateCallStatus(call.id, "COMPLETED")} className="text-xs bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-200 font-medium">Mark Completed</button>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${call.status === "CONFIRMED" ? "bg-green-100 text-green-700" : call.status === "REQUESTED" ? "bg-yellow-100 text-yellow-700" : call.status === "COMPLETED" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>{call.status}</span>
                  </div>
                </div>
                {canJoinCall && (
                  <div className="p-4 border-t border-gray-200">
                    <VideoCall roomUrl={call.videoRoomUrl} callId={call.id} scheduledAt={new Date(call.scheduledAt)} durationMinutes={call.durationMinutes} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

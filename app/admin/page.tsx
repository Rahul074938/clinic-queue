"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Check, X, Users, Clock, CheckCircle2, UserMinus } from "lucide-react";

interface QueueEntry {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  scheduledAt: string;
  status: "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED";
  checkInToken: string;
  checkInTime: string;
  position: number;
  doctor: {
    name: string;
    room: string;
  };
}

interface Stats {
  total: number;
  completed: number;
  waiting: number;
  inProgress: number;
  cancelled: number;
  avgWaitMinutes: number;
}

export default function QueueManagementPage() {
  const queryClient = useQueryClient();

  // 1. Fetch live queue entries
  const { data: queue = [], isLoading: loadingQueue } = useQuery<QueueEntry[]>({
    queryKey: ["live-queue"],
    queryFn: async () => {
      const res = await fetch("/api/queue");
      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds as fallback to keep board synced
  });

  // 2. Fetch today's stats summary
  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ["today-stats"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      return data.today;
    },
    refetchInterval: 5000,
  });

  // 3. Call next patient mutation
  const callNextMutation = useMutation({
    mutationFn: async (doctorId?: string) => {
      const res = await fetch("/api/queue/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Failed to call next patient");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Called ${data.patientName} for ${data.doctor.name} in ${data.doctor.room}!`);
      void queryClient.invalidateQueries({ queryKey: ["live-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["today-stats"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 4. Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Appointment marked as ${variables.status.toLowerCase()}`);
      void queryClient.invalidateQueries({ queryKey: ["live-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["today-stats"] });
    },
    onError: () => {
      toast.error("Failed to update status.");
    },
  });

  const handleCallNext = () => {
    callNextMutation.mutate(undefined);
  };

  const handleComplete = (id: string) => {
    updateStatusMutation.mutate({ id, status: "COMPLETED" });
  };

  const handleNoShow = (id: string) => {
    updateStatusMutation.mutate({ id, status: "NO_SHOW" });
  };

  const handleCancel = (id: string) => {
    updateStatusMutation.mutate({ id, status: "CANCELLED" });
  };

  const waitingPatients = queue.filter((p) => p.status === "CHECKED_IN");
  const servingPatients = queue.filter((p) => p.status === "IN_PROGRESS");

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Queue Dashboard</h1>
          <p className="text-sm text-slate-400">Manage patient arrivals, consult rooms and queue progression</p>
        </div>

        {/* Global queue button */}
        <button
          onClick={handleCallNext}
          disabled={callNextMutation.isPending || waitingPatients.length === 0}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Call Next Patient</span>
        </button>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Waiting Lobby</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            {loadingStats ? "..." : stats?.waiting ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Play className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            {loadingStats ? "..." : stats?.inProgress ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            {loadingStats ? "..." : stats?.completed ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Wait Time</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            {loadingStats ? "..." : stats?.avgWaitMinutes === 0 ? "0m" : `${stats?.avgWaitMinutes}m`}
          </span>
        </div>

      </div>

      {/* Main Waitlist / Consultation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Waiting Lobby Column */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
            <h3 className="font-bold text-white text-base uppercase tracking-wider">Waiting Lobby</h3>
            <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded">
              {waitingPatients.length} Checked In
            </span>
          </div>

          {loadingQueue ? (
            <div className="flex-grow flex items-center justify-center">
              <Clock className="w-6 h-6 animate-spin text-teal-400" />
            </div>
          ) : waitingPatients.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600">
              <Users className="w-10 h-10 opacity-30 mb-2" />
              <span className="text-xs uppercase tracking-wider font-semibold">No patients waiting</span>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingPatients.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-slate-900/50 border border-slate-850 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-400">#{entry.position}</span>
                      <h4 className="font-bold text-white text-sm">{entry.patientName}</h4>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Doctor: {entry.doctor.name.split(" ").slice(-1)[0]}</span>
                      <span className="text-slate-700">•</span>
                      <span>Room: {entry.doctor.room}</span>
                    </div>
                    <span className="inline-block mt-2 font-mono text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded border border-slate-800/80">
                      TOKEN: {entry.checkInToken}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: entry.id, status: "IN_PROGRESS" })}
                      className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition cursor-pointer"
                      title="Call to Room"
                    >
                      <Play className="w-4 h-4 fill-purple-400" />
                    </button>
                    <button
                      onClick={() => handleNoShow(entry.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Mark as No Show"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consulting Rooms Column */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
            <h3 className="font-bold text-white text-base uppercase tracking-wider">In consultation</h3>
            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded">
              {servingPatients.length} Active
            </span>
          </div>

          {loadingQueue ? (
            <div className="flex-grow flex items-center justify-center">
              <Clock className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : servingPatients.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600">
              <Play className="w-10 h-10 opacity-30 mb-2" />
              <span className="text-xs uppercase tracking-wider font-semibold">No active consultations</span>
            </div>
          ) : (
            <div className="space-y-3">
              {servingPatients.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{entry.patientName}</h4>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-purple-400 font-semibold">{entry.doctor.room}</span>
                      <span className="text-slate-700">•</span>
                      <span>Physician: {entry.doctor.name}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleComplete(entry.id)}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition cursor-pointer"
                      title="Finish Consultation"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancel(entry.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                      title="Cancel Appointment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Clock, Users, ShieldAlert, ArrowLeft, Bell, Play, CheckCircle } from "lucide-react";
import { formatWaitTime, STATUS_LABELS } from "@/lib/utils";

interface QueueState {
  id: string;
  patientName: string;
  doctor: {
    name: string;
    specialty: string;
    room: string;
  };
  status: string;
  checkInToken: string;
  position: number;
  estimatedWaitMinutes: number;
  checkInTime: string | null;
}

export default function QueueTrackerPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<QueueState | null>(null);

  // Sound alert for called patient
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  };

  useEffect(() => {
    // 1. Initial REST fetch
    const fetchQueueInfo = async () => {
      try {
        const res = await fetch(`/api/queue/${token}`);
        if (!res.ok) {
          setError("Invalid check-in token. Please verify the code.");
        } else {
          const resData = await res.json();
          setData(resData);
        }
      } catch {
        setError("Network error fetching queue details.");
      } finally {
        setLoading(false);
      }
    };
    void fetchQueueInfo();

    // 2. Real-time updates via Server-Sent Events (SSE)
    const sse = new EventSource("/api/queue/stream");

    sse.onmessage = (event) => {
      try {
        const queueList = JSON.parse(event.data) as Array<{
          id: string;
          status: string;
          checkInToken: string;
          position: number;
          estimatedWaitMinutes: number;
        }>;

        const matched = queueList.find((item) => item.checkInToken === token);
        if (matched) {
          setData((prev) => {
            // Trigger audio alert when status changes from CHECKED_IN to IN_PROGRESS
            if (prev && prev.status === "CHECKED_IN" && matched.status === "IN_PROGRESS") {
              toast.success(`You are being called! Please proceed to ${prev.doctor.room}.`, {
                duration: 10000,
              });
              playAlert();
            }
            return {
              ...(prev as QueueState),
              status: matched.status,
              position: matched.position,
              estimatedWaitMinutes: matched.estimatedWaitMinutes,
            };
          });
        } else {
          // If not in the active waitlist, refetch to check if completed
          void fetchQueueInfo();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    sse.onerror = () => {
      console.warn("SSE connection error. Retrying in background...");
    };

    return () => {
      sse.close();
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 text-slate-100">
        <Clock className="w-8 h-8 animate-spin text-teal-400 mb-4" />
        <span className="text-sm text-slate-400">Loading your live queue spot...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 bg-slate-950 text-slate-100">
        <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-xs">{error || "Access token is invalid."}</p>
        <button
          onClick={() => router.push("/checkin")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Check-In</span>
        </button>
      </div>
    );
  }

  const isWaiting = data.status === "CHECKED_IN";
  const isServing = data.status === "IN_PROGRESS";
  const isCompleted = data.status === "COMPLETED";

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100 font-sans">
      
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            ClinicQueue
          </span>
          <span className="block text-xs text-slate-400">Live Waitlist Tracker</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden">
          
          {/* Header Panel */}
          <div className="p-6 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                Patient Status
              </span>
              <h3 className="font-bold text-white text-lg">{data.patientName}</h3>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
              isServing ? "bg-purple-400/20 text-purple-400 border border-purple-400/30" :
              isCompleted ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30" :
              "bg-teal-400/20 text-teal-400 border border-teal-400/30"
            }`}>
              {STATUS_LABELS[data.status] ?? data.status}
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-8">

            {/* Waiting State Details */}
            {isWaiting && (
              <div className="text-center space-y-6">
                
                {/* Large Queue Position Card */}
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-teal-500/10 blur-xl rounded-full" />
                  <div className="relative w-36 h-36 rounded-full border-4 border-slate-800 border-t-teal-400 flex flex-col items-center justify-center bg-slate-900 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ahead</span>
                    <span className="text-4xl font-extrabold text-white my-1">{data.position - 1}</span>
                    <span className="text-[10px] text-slate-400">Patients</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col justify-center">
                    <Clock className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Wait</span>
                    <span className="font-bold text-white text-lg mt-0.5">
                      {formatWaitTime(data.estimatedWaitMinutes)}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col justify-center">
                    <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Doctor Spot</span>
                    <span className="font-bold text-white text-lg mt-0.5">#{data.position}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl text-left flex items-start gap-4">
                  <div className="p-2 bg-slate-800 text-teal-400 rounded-xl font-bold text-sm">
                    {data.doctor.room}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{data.doctor.name}</h4>
                    <p className="text-xs text-slate-500">{data.doctor.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-900/20 py-2 rounded-xl border border-slate-900">
                  <Bell className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
                  <span>Keep this screen open to track position live</span>
                </div>

              </div>
            )}

            {/* Serving State Details */}
            {isServing && (
              <div className="text-center space-y-6 py-6">
                <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20 animate-pulse">
                  <Play className="w-10 h-10 fill-purple-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Name is Called!</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Please proceed immediately to <strong className="text-purple-400">{data.doctor.room}</strong>
                  </p>
                </div>

                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-left flex items-center gap-4 max-w-sm mx-auto">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl font-bold text-base">
                    {data.doctor.room}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{data.doctor.name}</h4>
                    <p className="text-xs text-slate-400">{data.doctor.specialty}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed State Details */}
            {isCompleted && (
              <div className="text-center space-y-6 py-6">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white">Appointment Finished</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                    Thank you for visiting today. Safe travels!
                  </p>
                </div>

                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Return to Home
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

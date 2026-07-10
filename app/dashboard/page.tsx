"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Clock, Users, ArrowRight, Volume2, Monitor, ShieldAlert } from "lucide-react";
import { formatWaitTime } from "@/lib/utils";

interface QueueEntry {
  id: string;
  patientName: string;
  doctor: {
    name: string;
    specialty: string;
    room: string;
    avatarColor: string;
  };
  status: "CHECKED_IN" | "IN_PROGRESS";
  checkInToken: string;
  position: number;
  estimatedWaitMinutes: number;
  checkInTime: string;
}

export default function PublicDashboardPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [calledNotice, setCalledNotice] = useState<{
    patientName: string;
    room: string;
    doctorName: string;
  } | null>(null);

  // Sound alert for calling patients
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio Context playback failed", e);
    }
  };

  // Privacy helper: Obfuscate name (e.g. Jane Doe -> J. Doe)
  const formatPrivacyName = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length <= 1) return name;
    const last = parts.slice(-1)[0];
    const initial = parts[0]?.[0];
    return `${initial}. ${last}`;
  };

  useEffect(() => {
    // Connect to SSE stream
    const sse = new EventSource("/api/queue/stream");

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(true);
          return;
        }

        const newQueue = data as QueueEntry[];

        // Check if anyone was just called (moved from CHECKED_IN to IN_PROGRESS)
        setQueue((prev) => {
          const wasWaiting = prev.filter((p) => p.status === "CHECKED_IN");
          const isServingNow = newQueue.filter((p) => p.status === "IN_PROGRESS");

          // Find if anyone in isServingNow was previously in wasWaiting
          const newlyCalled = isServingNow.find((s) => wasWaiting.some((w) => w.id === s.id));
          if (newlyCalled) {
            setCalledNotice({
              patientName: newlyCalled.patientName,
              room: newlyCalled.doctor.room,
              doctorName: newlyCalled.doctor.name,
            });
            playAlert();

            // Clear notice after 10 seconds
            setTimeout(() => {
              setCalledNotice(null);
            }, 10000);
          }

          return newQueue;
        });

        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    sse.onerror = () => {
      setError(true);
      setLoading(false);
    };

    return () => {
      sse.close();
    };
  }, []);

  const waitingPatients = queue.filter((p) => p.status === "CHECKED_IN");
  const servingPatients = queue.filter((p) => p.status === "IN_PROGRESS");

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans p-6 md:p-10 relative overflow-hidden min-h-screen">
      
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Board */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-900 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent uppercase">
              Clinic Waitlist Status
            </h1>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
              <Monitor className="w-3.5 h-3.5 text-teal-400" />
              <span>Lobby Public Monitor · Live Updates</span>
            </span>
          </div>
        </div>

        {/* Current Time Clock */}
        <div className="text-right">
          <span className="block text-xl font-bold font-mono text-white">
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>Live connection lost. Attempting auto-reconnect... Wait times might display delayed data.</span>
        </div>
      )}

      {/* Main Board Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Waiting List (Left/Center) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Queue Waitlist</h2>
              </div>
              <span className="px-3 py-1 bg-slate-800 border border-slate-750 text-slate-300 rounded-full text-xs font-bold font-mono">
                {waitingPatients.length} Waiting
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Clock className="w-8 h-8 animate-spin text-teal-400" />
              </div>
            ) : waitingPatients.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <Users className="w-12 h-12 mb-3 opacity-20" />
                <span className="text-sm italic uppercase tracking-wider font-medium">Lobby Waitlist is Empty</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2">
                {waitingPatients.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-2xl flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-mono font-bold text-slate-400 border border-slate-850">
                        #{appt.position}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">
                          {formatPrivacyName(appt.patientName)}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Assigned: Dr. {appt.doctor.name.split(" ").slice(-1)[0]}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Est. Wait
                      </span>
                      <span className="block font-bold text-teal-400 font-mono text-sm mt-0.5">
                        {formatWaitTime(appt.estimatedWaitMinutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Currently Serving (Right) */}
        <div className="flex flex-col">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">Currently Serving</h2>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Clock className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : servingPatients.length === 0 ? (
                <div className="py-12 text-center text-slate-600">
                  <span className="text-xs uppercase tracking-wider font-semibold italic">No patient in room</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {servingPatients.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-extrabold text-white text-lg">
                          {formatPrivacyName(appt.patientName)}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Dr. {appt.doctor.name.split(" ").slice(-1)[0]}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Proceed to
                        </span>
                        <span className="block text-purple-400 font-extrabold text-lg mt-0.5">
                          {appt.doctor.room}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lobby Announcements footer */}
            <div className="mt-8 pt-6 border-t border-slate-900 text-slate-500 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                Lobby Announcement
              </p>
              <p className="text-[11px] leading-relaxed">
                Please listen for the chime when your name is called. Ensure your check-in code matches the lobby list.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CALL ANNOUNCEMENT OVERLAY MODAL */}
      {calledNotice && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-purple-500" />
            
            <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto border border-purple-500/30 animate-bounce">
              <Volume2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Now Calling</span>
              <h2 className="text-4xl font-black text-white mt-2 mb-4 tracking-wide">
                {formatPrivacyName(calledNotice.patientName)}
              </h2>
              <p className="text-sm text-slate-400 leading-normal">
                Assigned with <strong className="text-white">{calledNotice.doctorName}</strong>
              </p>
            </div>

            {/* Room Direction Target */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                Please proceed to
              </span>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-extrabold text-2xl tracking-wide">{calledNotice.room}</span>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </div>
            </div>

            <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
              Chime sounded · Alert will auto-dismiss shortly
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

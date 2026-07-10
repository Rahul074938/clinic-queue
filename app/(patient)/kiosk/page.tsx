"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Stethoscope, ArrowRight, Loader2, RefreshCw, UserCheck } from "lucide-react";

export default function KioskPage() {
  const [step, setStep] = useState<"welcome" | "input" | "success">("welcome");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [patientData, setPatientData] = useState<{
    name: string;
    doctorName: string;
    room: string;
  } | null>(null);

  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleReset = () => {
    setStep("welcome");
    setToken("");
    setPatientData(null);
  };

  // In success screen, run a 15s idle timer to auto-reset to welcome screen
  useEffect(() => {
    if (step !== "success") {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      return;
    }

    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!);
          handleReset();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [step]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to check in.");
      } else {
        setPatientData({
          name: data.appointment.patientName,
          doctorName: data.appointment.doctor.name,
          room: data.appointment.doctor.room,
        });
        setCountdown(15);
        setStep("success");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100 font-sans min-h-screen">
      
      {/* Kiosk Brand Header */}
      <div className="flex items-center gap-2 mb-10">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <Stethoscope className="w-10 h-10" />
        </div>
        <div>
          <span className="font-sans font-bold text-3xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            ClinicQueue
          </span>
          <span className="block text-sm text-slate-400">Self-Service Check-In Kiosk</span>
        </div>
      </div>

      <div className="w-full max-w-xl">
        <div className="glass rounded-3xl border-2 border-slate-800 bg-slate-950/80 shadow-2xl p-8 min-h-[350px] flex flex-col justify-between">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === "welcome" && (
            <div className="text-center py-6 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-white mb-3">Welcome to our Clinic</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Have an appointment scheduled today? Tap below to verify your arrival in under 30 seconds.
                </p>
              </div>

              <div className="my-8">
                <button
                  onClick={() => setStep("input")}
                  className="w-full max-w-sm py-4 px-6 rounded-2xl text-lg font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <span>Start Check-In</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Need to book? Ask receptionist for scheduling help.
              </div>
            </div>
          )}

          {/* STEP 2: TOKEN INPUT FORM */}
          {step === "input" && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Details</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Please enter the arrival security code sent to you
                </p>

                <form onSubmit={handleCheckIn} className="space-y-6">
                  <div>
                    <label htmlFor="token" className="block text-sm font-semibold text-slate-300 mb-2">
                      Appointment Token Code
                    </label>
                    <input
                      id="token"
                      type="text"
                      required
                      className="block w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-xl font-mono tracking-widest text-center"
                      placeholder="ENTER CODE"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl text-md font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Checking in...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Check-In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-white text-xs font-semibold hover:underline"
                >
                  Cancel and Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHECK-IN SUCCESS */}
          {step === "success" && patientData && (
            <div className="text-center py-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Checked In!</h2>
                <p className="text-slate-300 text-sm font-semibold max-w-xs mx-auto">
                  Welcome, {patientData.name}.
                </p>
              </div>

              {/* Patient Doctor Placement info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 my-6 max-w-md mx-auto w-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Physician</span>
                    <h4 className="font-bold text-white text-sm mt-0.5">{patientData.doctorName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Room Assignment</span>
                    <span className="block text-teal-400 font-bold text-sm mt-0.5">{patientData.room}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-left leading-normal">
                  Please have a seat in the waiting lobby. We will call your name shortly when the doctor is ready to serve you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Kiosk resets automatically in {countdown}s</span>
                </div>
                
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Done (Next Patient)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

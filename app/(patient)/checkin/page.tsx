"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Stethoscope, CheckSquare, ArrowRight, ArrowLeft, Loader2, QrCode } from "lucide-react";

export default function CheckInPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Please enter your appointment token.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to check in. Check your token.");
      } else {
        if (data.alreadyCheckedIn) {
          toast.info("You are already checked in. Redirecting to your queue tracker...");
        } else {
          toast.success("Check-in successful! Welcome to the clinic.");
        }
        router.push(`/queue/${token.trim()}`);
      }
    } catch {
      toast.error("An unexpected error occurred during check-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100 font-sans">
      
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            ClinicQueue
          </span>
          <span className="block text-xs text-slate-400">Patient Services</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="glass card-padding rounded-2xl shadow-2xl border border-slate-800 bg-slate-950/80">
          <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center mb-6 border border-teal-500/20">
            <CheckSquare className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Digital Check-In</h2>
          <p className="text-sm text-slate-400 mb-8">
            Enter your appointment token to mark yourself as arrived and see your queue spot
          </p>

          <form onSubmit={handleCheckIn} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-2">
                Appointment Token / Code
              </label>
              <input
                id="token"
                type="text"
                required
                className="block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-mono tracking-wider"
                placeholder="e.g. cly1234567890..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <span className="block text-[11px] text-slate-500 mt-2">
                You can find this code in your booking confirmation email or SMS.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking in...</span>
                </>
              ) : (
                <>
                  <span>Check In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* QR Code Demo Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-start gap-4">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
              <QrCode className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1">Clinic Check-in Station</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                If you are at the clinic kiosk, you can also scan your confirmation QR code directly to sign in automatically.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

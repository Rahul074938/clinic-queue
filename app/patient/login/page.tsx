"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserCircle2, Home } from "lucide-react";

export default function PatientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string; name?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Login failed.");
      } else {
        toast.success(`Welcome back, ${data.name ?? ""}!`);
        router.push("/patient/dashboard");
      }
    } catch {
      toast.error("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-slate-950 min-h-screen relative">
      {/* Top Navigation Back to Home */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home Dashboard</span>
        </a>
      </div>

      {/* Neon glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/8 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />

      {/* Brand */}
      <div className="flex items-center gap-2 mb-10 relative z-10">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <UserCircle2 className="w-7 h-7" />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            Patient Portal
          </span>
          <span className="block text-xs text-slate-500">ClinicQueue · Manage Your Appointments</span>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Sign in to your account</h1>
          <p className="text-sm text-slate-400 mb-8">
            View bookings, check-in tokens, and manage appointments
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="patient-login-btn"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500 bg-slate-900/70 px-3">
              <span className="bg-slate-900/70 px-2">New patient?</span>
            </div>
          </div>

          <a
            href="/patient/register"
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 transition"
          >
            Create a Patient Account
          </a>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Staff or admin?{" "}
          <a href="/auth/login" className="text-slate-400 hover:text-white underline underline-offset-2">
            Staff Portal →
          </a>
        </p>
      </div>
    </div>
  );
}

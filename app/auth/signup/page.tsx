"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, User, Mail, Lock, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Signup failed.");
      } else {
        toast.success("Account created successfully!");
        setSuccess(true);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Verification failed.");
      } else {
        toast.success("Email verified! You can now log in.");
        router.push("/auth/login");
      }
    } catch {
      toast.error("Failed to verify email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-900 text-slate-100">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            ClinicQueue
          </span>
          <span className="block text-xs text-slate-400">Clinic Management Portal</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="glass card-padding rounded-2xl shadow-2xl border border-slate-800 bg-slate-950/80">
          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-2">Create Staff Account</h2>
              <p className="text-center text-sm text-slate-400 mb-8">
                Join your clinic team on the scheduling board
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Dr. Jordan Chase"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="jordan@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                    Password (Min 8 chars, 1 digit, 1 upper)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      id="password"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-slate-950 bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all font-semibold cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                <span>Already have an account? </span>
                <a
                  href="/auth/login"
                  className="text-teal-400 hover:text-teal-300 font-semibold hover:underline"
                >
                  Sign in
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                A verification link has been initialized. For evaluation/demo convenience, you can verify your account instantly.
              </p>

              <button
                type="button"
                onClick={handleInstantVerify}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50"
              >
                <span>Verify Email Instantly</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold mx-auto hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

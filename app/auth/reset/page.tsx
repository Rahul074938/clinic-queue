"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Mail, Lock, ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function PasswordResetPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [loading, setLoading] = useState(false);
  const [demoToken, setDemoToken] = useState("");

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to request reset token.");
      } else {
        toast.success("Instructions sent!");
        if (data.demoToken) {
          setDemoToken(data.demoToken);
          setToken(data.demoToken); // prefill for easy demo
        }
        setStep("verify");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reset password.");
      } else {
        toast.success("Password reset successfully!");
        setStep("success");
      }
    } catch {
      toast.error("An unexpected error occurred.");
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
          {step === "request" && (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-2">Reset Password</h2>
              <p className="text-center text-sm text-slate-400 mb-8">
                Enter your email address and we will initiate the secure reset flow
              </p>

              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
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
                      placeholder="name@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-slate-950 bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all font-semibold cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Requesting..." : "Send Reset Token"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white font-semibold hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </a>
              </div>
            </>
          )}

          {step === "verify" && (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-2">Enter New Password</h2>
              <p className="text-center text-sm text-slate-400 mb-6">
                Fill in the security token sent to your email to set a new password
              </p>

              {demoToken && (
                <div className="mb-6 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs text-teal-400">
                  <p className="font-semibold mb-1">💡 Sandbox Info (Demo Reset Token):</p>
                  <code className="break-all bg-slate-900 p-1 block rounded border border-slate-800">{demoToken}</code>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-1">
                    Security Token
                  </label>
                  <input
                    id="token"
                    type="text"
                    required
                    className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    placeholder="Enter security token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      id="password"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
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
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
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
                  {loading ? "Saving..." : "Change Password"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="mt-6 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold mx-auto hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Resend Token
              </button>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Done</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Your password has been successfully updated. You can now access your staff portal.
              </p>

              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

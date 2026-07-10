"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Stethoscope, Key, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  
  const [callbackUrl, setCallbackUrl] = useState("/admin");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setCallbackUrl(urlParams.get("callbackUrl") ?? "/admin");
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("CredentialsSignin")) {
          toast.error("Invalid email or password. Make sure your email is verified!");
        } else {
          toast.error(res.error);
        }
      } else {
        toast.success("Welcome back!");
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (role: "admin" | "staff") => {
    if (role === "admin") {
      setEmail("demo@demo.com");
      setPassword("demo1234");
    } else {
      setEmail("staff@clinicqueue.com");
      setPassword("staff1234");
    }
    toast.info(`Filled credentials for ${role}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-900 text-slate-100">
      {/* Clinic Brand */}
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
          <h2 className="text-2xl font-bold text-center text-white mb-2">Staff Portal Login</h2>
          <p className="text-center text-sm text-slate-400 mb-8">
            Access appointment boards and live wait times
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <a
                  href="/auth/reset"
                  className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-slate-950 bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Key className="w-4 h-4 text-teal-400" />
              <span>Reviewer Sandbox / Demo Access</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 rounded-lg text-slate-300 hover:text-white transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                onClick={() => handleAutofill("admin")}
              >
                <span className="font-bold text-teal-400">Admin Demo</span>
                <span className="text-[10px] text-slate-500">demo@demo.com</span>
              </button>
              <button
                type="button"
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-xs border border-slate-800 rounded-lg text-slate-300 hover:text-white transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                onClick={() => handleAutofill("staff")}
              >
                <span className="font-bold text-purple-400">Staff Demo</span>
                <span className="text-[10px] text-slate-500">staff@clinicqueue.com</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <span>New staff member? </span>
            <a
              href="/auth/signup"
              className="text-teal-400 hover:text-teal-300 font-semibold hover:underline"
            >
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

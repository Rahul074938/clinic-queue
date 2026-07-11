"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Stethoscope, LogOut, User } from "lucide-react";
import { toast } from "sonner";

interface PatientSession {
  id: string;
  email: string;
  name: string;
}

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<PatientSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth check on login/register pages
    if (pathname === "/patient/login" || pathname === "/patient/register") {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch("/api/patient/me");
        if (res.ok) {
          const data = await res.json() as PatientSession;
          setSession(data);
        } else {
          router.replace("/patient/login");
        }
      } catch {
        router.replace("/patient/login");
      } finally {
        setLoading(false);
      }
    };

    void checkSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/patient/logout", { method: "POST" });
      toast.success("Signed out successfully.");
      router.push("/patient/login");
    } catch {
      toast.error("Logout failed.");
    }
  };

  const isDashboard = !pathname.includes("/login") && !pathname.includes("/register");

  if (loading && isDashboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <Stethoscope className="w-10 h-10 animate-pulse text-teal-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Top header bar */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              ClinicQueue
            </span>
          </a>

          {/* Right side */}
          {isDashboard && session ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="p-1 bg-teal-500/20 text-teal-400 rounded-md">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px]">
                  {session.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-1.5 px-3 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-900/50 rounded-lg border border-slate-800 hover:border-red-500/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/patient/login"
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Sign In
              </a>
              <a
                href="/patient/register"
                className="text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 px-3 py-1.5 rounded-lg transition"
              >
                Create Account
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

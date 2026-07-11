"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { Stethoscope, LayoutDashboard, Calendar, Users, BarChart3, LogOut, Menu, X, User, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect to login if unauthenticated — must be in useEffect, not render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  // Show loading skeleton while session resolves or while redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-100 min-h-screen">
        <div className="text-center space-y-4">
          <Stethoscope className="w-10 h-10 animate-pulse text-teal-400 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Verifying Staff Session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Live Queue", href: "/admin", icon: LayoutDashboard },
    { name: "Appointments", href: "/admin/appointments", icon: Calendar },
    { name: "Doctors", href: "/admin/doctors", icon: Users, adminOnly: true },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Patient Lookup", href: "/admin/patient-lookup", icon: Search },
  ];

  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "STAFF";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully.");
    router.push("/auth/login");
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-950 text-slate-100 min-h-screen font-sans">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden h-16 border-b border-slate-900 bg-slate-950/90 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-white">ClinicQueue</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between p-6 fixed inset-y-0 left-0 z-30 transform md:transform-none transition-transform duration-200 ${
        mobileOpen ? "translate-x-0 pt-20" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="space-y-8">
          
          {/* Logo (Hidden on mobile open since mobile top bar is present) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">ClinicQueue</span>
          </div>

          {/* User profile brief */}
          <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-teal-400 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">{session?.user?.name}</span>
              <span className="block text-[10px] text-teal-400 font-bold uppercase mt-0.5">{userRole}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && userRole !== "ADMIN") return null;
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm font-semibold transition ${
                    active
                      ? "bg-teal-400 text-slate-950"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-2 px-3 text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-900/30 rounded-lg transition border border-transparent hover:border-red-500/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        <div className="flex-1 p-6 md:p-10">{children}</div>
      </main>

    </div>
  );
}

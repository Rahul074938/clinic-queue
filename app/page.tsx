import { Stethoscope, Calendar, CheckSquare, Monitor, LayoutDashboard, ChevronRight, Clock, ShieldCheck, FileSpreadsheet, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-slate-950 font-sans">
      
      {/* Premium Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              ClinicQueue
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <a
              href="/auth/login"
              className="text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              Staff Sign In
            </a>
            <a
              href="/patient/login"
              className="text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 px-4 py-2 rounded-lg transition"
            >
              Patient Login
            </a>
          </nav>

        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32">
          {/* Neon Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-teal-400 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Clinic Management System</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Ditch the clipboard. <br />
                <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
                  Simplify your wait.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Contactless digital check-in, real-time wait-time tracking, and automated queue management for modern, high-volume clinics.
              </p>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-16">
                
                {/* Patient Portal */}
                <a
                  href="/patient/login"
                  className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900/80 transition flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition duration-300 mb-4">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-1">Patient Scheduling</h3>
                    <p className="text-xs text-slate-400">Sign in to book visits and manage your appointments</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-teal-400 mt-4 group-hover:translate-x-1 transition duration-200">
                    <span>Patient Login</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Check In */}
                <a
                  href="/checkin"
                  className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80 transition flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition duration-300 mb-4">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-1">Digital Check-In</h3>
                    <p className="text-xs text-slate-400">Enter appointment token to join the live waitlist</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-purple-400 mt-4 group-hover:translate-x-1 transition duration-200">
                    <span>Check In Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Staff Dashboard */}
                <a
                  href="/admin"
                  className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 transition flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition duration-300 mb-4">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-1">Staff Dashboard</h3>
                    <p className="text-xs text-slate-400">Manage arrivals, call patients, and view analytics</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 mt-4 group-hover:translate-x-1 transition duration-200">
                    <span>Admin Panel</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </a>

              </div>

              {/* Secondary Actions */}
              <div className="flex justify-center flex-wrap gap-4 text-xs font-semibold text-slate-400">
                <a
                  href="/kiosk"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4 text-teal-400" />
                  <span>Kiosk Tablet Mode</span>
                </a>
                <a
                  href="/dashboard"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Live TV Dashboard</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-t border-slate-900 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-16">
              Clinical Workflow, Upgraded
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Real-Time Estimations</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Automatic wait-time math keeps patients informed at home or on-site, decreasing waiting room congestion and stress.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Role-Based Operations</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Admin vs Staff credentials restrict access to sensitive patient clinical logs, data modifications, and doctor status toggles.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Immutable Audit Trails</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every booking creation, arrival check-in, call next, and completion triggers a timestamped log capturing actor actions.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            © 2026 ClinicQueue. Built for the Digital Heroes developer trial.
          </div>
          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <a href="/auth/login" className="hover:text-white transition">Staff Sign In</a>
            <span className="text-slate-800">|</span>
            <a href="/patient/login" className="hover:text-white transition">Patient Portal</a>
            <span className="text-slate-800">|</span>
            <a href="/checkin" className="hover:text-white transition">Check-In</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

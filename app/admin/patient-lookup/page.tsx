"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search, Mail, Loader2, Calendar, Copy, UserCircle2, CheckCircle2,
  Clock, XCircle, BadgeCheck, Stethoscope, AlertCircle, Ticket, User,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarColor: string;
  room: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  checkInToken: string;
  status: string;
  scheduledAt: string;
  notes: string | null;
  doctor: Doctor;
}

interface PatientAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface LookupResult {
  appointments: Appointment[];
  patientAccount: PatientAccount | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20", icon: <Clock className="w-3 h-3" /> },
  CHECKED_IN: { label: "Checked In", color: "bg-teal-500/10 text-teal-400 border border-teal-500/20", icon: <BadgeCheck className="w-3 h-3" /> },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-500/10 text-purple-400 border border-purple-500/20", icon: <Stethoscope className="w-3 h-3" /> },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border border-red-500/20", icon: <XCircle className="w-3 h-3" /> },
  NO_SHOW: { label: "No Show", color: "bg-orange-500/10 text-orange-400 border border-orange-500/20", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function PatientLookupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setResult(null);
    setSearched(false);

    try {
      const res = await fetch(`/api/admin/patient-lookup?email=${encodeURIComponent(email.trim())}`);
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Lookup failed.");
      } else {
        const data = await res.json() as LookupResult;
        setResult(data);
        setSearched(true);
        if (data.appointments.length === 0) {
          toast.info("No appointments found for this email.");
        }
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (token: string) => {
    void navigator.clipboard.writeText(token);
    toast.success("Token copied!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Patient Lookup</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search all appointments and check-in tokens for a specific patient by their email address.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Mail className="w-4 h-4" />
          </span>
          <input
            id="patient-email-search"
            type="email"
            required
            placeholder="patient@example.com"
            className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          id="patient-lookup-search-btn"
          disabled={loading}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Search</span>
        </button>
      </form>

      {/* Results */}
      {searched && result && (
        <div className="space-y-6">
          {/* Patient account card */}
          <div className={`p-5 rounded-2xl border ${result.patientAccount ? "bg-slate-900/40 border-slate-800" : "bg-slate-900/20 border-slate-800/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${result.patientAccount ? "bg-teal-500/15 text-teal-400" : "bg-slate-800 text-slate-500"}`}>
                <UserCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Patient Account</p>
                {result.patientAccount ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-white">{result.patientAccount.name}</span>
                    <span className="text-sm text-slate-400">{result.patientAccount.email}</span>
                    <span className="text-xs text-slate-500">
                      Registered {new Date(result.patientAccount.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Registered Account
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No registered patient account — appointments booked as guest.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">
                Appointments
                <span className="ml-2 text-sm text-slate-500 font-normal">
                  ({result.appointments.length} total)
                </span>
              </h2>
            </div>

            {result.appointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
                <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No appointments found for this email.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Doctor</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Check-In Token</th>
                      <th className="p-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.appointments.map((appt) => {
                      const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG["SCHEDULED"]!;
                      const scheduled = new Date(appt.scheduledAt);
                      return (
                        <tr
                          key={appt.id}
                          className="border-b border-slate-900/50 hover:bg-slate-900/20 transition"
                        >
                          {/* Date */}
                          <td className="p-4">
                            <p className="font-semibold text-white text-xs">
                              {scheduled.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-slate-500">
                              {scheduled.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </td>

                          {/* Doctor */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px]"
                                style={{ backgroundColor: appt.doctor.avatarColor }}
                              >
                                {appt.doctor.name.split(" ").slice(-1)[0]?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{appt.doctor.name}</p>
                                <p className="text-slate-500">{appt.doctor.room}</p>
                              </div>
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>{appt.patientName}</span>
                            </div>
                            <p className="text-slate-500 mt-0.5">{appt.patientPhone}</p>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${statusCfg.color}`}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* Check-in Token */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                              <span className="font-mono text-xs text-white bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[140px]">
                                {appt.checkInToken}
                              </span>
                              <button
                                onClick={() => copyToken(appt.checkInToken)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-teal-400 transition cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="p-4 max-w-[180px]">
                            <span className="text-slate-400 italic text-xs line-clamp-2">
                              {appt.notes ?? "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

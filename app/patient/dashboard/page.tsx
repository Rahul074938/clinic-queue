"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar, Clock, Copy, CheckCircle2, XCircle, Loader2,
  Stethoscope, ArrowRight, ArrowLeft, User, Phone, Mail,
  FileText, LayoutDashboard, BookOpen, Ticket, AlertCircle,
  BadgeCheck, RefreshCw, UserCheck, ShieldAlert,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarColor: string;
  room: string;
}

interface Slot {
  time: string;
  available: boolean;
  label: string;
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

interface PatientSession {
  id: string;
  email: string;
  name: string;
  phone?: string;
  pendingEmail?: string | null;
  pendingPhone?: string | null;
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    icon: <Clock className="w-3 h-3" />,
  },
  CHECKED_IN: {
    label: "Checked In",
    color: "bg-teal-500/15 text-teal-400 border border-teal-500/25",
    icon: <BadgeCheck className="w-3 h-3" />,
  },
  IN_PROGRESS: {
    label: "In Consultation",
    color: "bg-purple-500/15 text-purple-400 border border-purple-500/25",
    icon: <Stethoscope className="w-3 h-3" />,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-500/15 text-red-400 border border-red-500/25",
    icon: <XCircle className="w-3 h-3" />,
  },
  NO_SHOW: {
    label: "No Show",
    color: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function PatientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "book" | "profile">("bookings");
  const [session, setSession] = useState<PatientSession | null>(null);

  // Bookings state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Booking flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [notes, setNotes] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    checkInToken: string;
    scheduledAt: string;
  } | null>(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileVerifyCode, setProfileVerifyCode] = useState("");
  const [profilePhoneVerifyCode, setProfilePhoneVerifyCode] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // ─── Load session ──────────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/patient/me");
    if (res.ok) {
      const data = await res.json() as PatientSession;
      setSession(data);
      
      // Initialize profile form values
      setProfileName(data.name);
      setProfilePhone(data.phone || "");
      setProfileEmail(data.email);
    } else {
      router.replace("/patient/login");
    }
  }, [router]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  // ─── Load appointments ─────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await fetch("/api/patient/appointments");
      if (res.ok) {
        const data = await res.json() as Appointment[];
        setAppointments(data);
      }
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  // ─── Load doctors ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json() as Doctor[];
          setDoctors(data);
        }
      } catch {
        toast.error("Failed to load doctors.");
      } finally {
        setLoadingDoctors(false);
      }
    };
    void fetchDoctors();
  }, []);

  // ─── Load slots ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime("");
      try {
        const res = await fetch(`/api/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json() as Slot[];
          setSlots(data);
        }
      } catch {
        toast.error("Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    };
    void fetchSlots();
  }, [selectedDoctor, selectedDate]);

  // ─── Cancel appointment ────────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/patient/appointments/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        toast.success("Appointment cancelled.");
        void fetchAppointments();
      } else {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Failed to cancel.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setCancellingId(null);
    }
  };

  // ─── Booking submit ────────────────────────────────────────────────────────
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedDoctor || !selectedDate || !selectedTime) return;
    if (!session.phone) {
      toast.error("Please add and verify your phone number in Profile Settings first.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Please enter the reason for your visit.");
      return;
    }

    setBookingLoading(true);
    try {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: session.name,
          patientPhone: session.phone,
          patientEmail: session.email,
          doctorId: selectedDoctor.id,
          scheduledAt: scheduledDateTime.toISOString(),
          notes,
        }),
      });
      const data = await res.json() as { id?: string; checkInToken?: string; scheduledAt?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Booking failed.");
      } else {
        toast.success("Appointment booked! Details sent to your email.");
        setConfirmedBooking({
          id: data.id!,
          checkInToken: data.checkInToken!,
          scheduledAt: data.scheduledAt!,
        });
        setStep(4);
        void fetchAppointments();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── Profile Update submit ────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setUpdatingProfile(true);

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Profile update failed.");
      } else {
        if (data.emailVerifyInitiated && data.phoneVerifyInitiated) {
          toast.success("Profile updated. Verification codes sent to both new email and phone!");
        } else if (data.emailVerifyInitiated) {
          toast.success("Profile updated. Verification code sent to new email address!");
        } else if (data.phoneVerifyInitiated) {
          toast.success("Profile updated. Verification OTP sent to new phone number!");
        } else {
          toast.success("Profile updated successfully!");
        }
        void fetchSession();
      }
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ─── Email Verification submit ────────────────────────────────────────────
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileVerifyCode) return;
    setVerifyingEmail(true);

    try {
      const res = await fetch("/api/patient/profile/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: profileVerifyCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Verification failed.");
      } else {
        toast.success("Email address verified successfully!");
        setProfileVerifyCode("");
        void fetchSession();
      }
    } catch {
      toast.error("Failed to verify email.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  // ─── Phone Verification submit ────────────────────────────────────────────
  const handleVerifyPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhoneVerifyCode) return;
    setVerifyingPhone(true);

    try {
      const res = await fetch("/api/patient/profile/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: profilePhoneVerifyCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Verification failed.");
      } else {
        toast.success("Phone number verified successfully!");
        setProfilePhoneVerifyCode("");
        void fetchSession();
      }
    } catch {
      toast.error("Failed to verify phone number.");
    } finally {
      setVerifyingPhone(false);
    }
  };

  const copyToken = (token: string) => {
    void navigator.clipboard.writeText(token);
    toast.success("Check-in token copied!");
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0]!;
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setNotes("");
    setConfirmedBooking(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome header */}
        {session && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, <span className="bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">{session.name.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage your clinic appointments and profile settings in one place.</p>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "bookings"
                ? "bg-teal-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            My Bookings
          </button>
          <button
            onClick={() => { setActiveTab("book"); resetBooking(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "book"
                ? "bg-teal-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-teal-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Profile Settings
          </button>
        </div>

        {/* ═══════════════════════════ MY BOOKINGS TAB ═══════════════════════════ */}
        {activeTab === "bookings" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Your Appointments</h2>
              <button
                onClick={() => void fetchAppointments()}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {loadingAppointments ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="font-bold text-slate-400 mb-2">No appointments yet</h3>
                <p className="text-sm text-slate-600 mb-6">Book your first appointment to get started.</p>
                <button
                  onClick={() => setActiveTab("book")}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG["SCHEDULED"]!;
                  const scheduled = new Date(appt.scheduledAt);
                  const isPast = scheduled < new Date();
                  const canCancel = appt.status === "SCHEDULED" && !isPast;

                  return (
                    <div
                      key={appt.id}
                      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Doctor avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-lg"
                          style={{ backgroundColor: appt.doctor.avatarColor }}
                        >
                          {appt.doctor.name.split(" ").slice(-1)[0]?.[0]}
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-white">{appt.doctor.name}</span>
                            <span className="text-xs text-slate-500">{appt.doctor.specialty}</span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </div>

                          <p className="text-sm text-slate-300 mb-2">
                            {scheduled.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {scheduled.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          {/* Check-in token */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
                              <Ticket className="w-3.5 h-3.5 text-teal-400" />
                              <span className="text-xs text-slate-400 font-medium">Token:</span>
                              <span className="font-mono text-sm font-bold text-white tracking-wider">
                                {appt.checkInToken.slice(0, 12)}...
                              </span>
                            </div>
                            <button
                              onClick={() => copyToken(appt.checkInToken)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-teal-400 transition cursor-pointer"
                              title="Copy full token"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {appt.notes && (
                            <p className="text-xs text-slate-500 mt-2 italic">
                              Note: {appt.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 sm:items-end shrink-0">
                          <span className="text-xs text-slate-500 font-mono">
                            {appt.doctor.room}
                          </span>
                          {canCancel && (
                            <button
                              onClick={() => void handleCancel(appt.id)}
                              disabled={cancellingId === appt.id}
                              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                            >
                              {cancellingId === appt.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Cancel
                            </button>
                          )}
                          {appt.status === "SCHEDULED" && (
                            <button
                              onClick={() => router.push(`/checkin?token=${appt.checkInToken}`)}
                              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-teal-400 border border-teal-500/25 hover:bg-teal-500/10 transition cursor-pointer"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════ BOOK APPOINTMENT TAB ═══════════════════════════ */}
        {activeTab === "book" && (
          <div className="max-w-2xl">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">

              {/* Step breadcrumbs */}
              {step < 4 && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-7 text-xs font-semibold text-slate-500">
                  {[
                    { n: 1, label: "Doctor" },
                    { n: 2, label: "Schedule" },
                    { n: 3, label: "Details" },
                  ].map((s, i, arr) => (
                    <div key={s.n} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (s.n === 1) setStep(1);
                          if (s.n === 2 && selectedDoctor) setStep(2);
                        }}
                        disabled={s.n > step}
                        className={`flex items-center gap-1.5 pb-0.5 transition cursor-pointer disabled:opacity-40 ${
                          step === s.n ? "text-teal-400 border-b-2 border-teal-400" : ""
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step >= s.n ? "bg-teal-400 text-slate-950" : "bg-slate-800 text-slate-500"
                        }`}>
                          {s.n}
                        </span>
                        {s.label}
                      </button>
                      {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700" />}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 1: Pick Doctor */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Select a Doctor</h2>
                  <p className="text-sm text-slate-400 mb-6">Choose a physician for your consultation</p>
                  {loadingDoctors ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doctors.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                          className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer group"
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 group-hover:scale-105 transition"
                            style={{ backgroundColor: doc.avatarColor }}
                          >
                            {doc.name.split(" ").slice(-1)[0]?.[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{doc.name}</h4>
                            <p className="text-xs text-slate-500">{doc.specialty}</p>
                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                              {doc.room}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Date & Time */}
              {step === 2 && selectedDoctor && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setStep(1)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-white">Select Date & Time</h2>
                      <p className="text-xs text-slate-400">With {selectedDoctor.name}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                        Appointment Date
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Calendar className="w-5 h-5" />
                        </span>
                        <input
                          id="date"
                          type="date"
                          min={getTomorrowString()}
                          required
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Available Slots (9:00 AM - 12:00 PM)
                        </label>
                        {loadingSlots ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                          </div>
                        ) : slots.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No slots available for this day.</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  selectedTime === slot.time
                                    ? "bg-teal-400 border-teal-400 text-slate-950"
                                    : "bg-slate-900 border-slate-800 hover:border-slate-650 hover:bg-slate-850"
                                }`}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => { if (selectedDate && selectedTime) setStep(3); else toast.error("Select a date and time."); }}
                      disabled={!selectedDate || !selectedTime}
                      className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Patient Details */}
              {step === 3 && selectedDoctor && session && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setStep(2)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-white">Confirm Details</h2>
                      <p className="text-xs text-slate-400">
                        {selectedDoctor.name} · {selectedDate} @ {selectedTime}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Pre-filled from session — read only */}
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
                        Booking As (linked to your account)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <User className="w-4 h-4 text-slate-500" />
                          <span>{session.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{session.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{session.phone || "No verified phone"}</span>
                        </div>
                      </div>
                    </div>

                    {!session.phone && (
                      <div className="p-4 bg-red-500/10 border border-red-500/35 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-400">Verified Phone Number Required</p>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            You must link and verify your phone number under the <strong>Profile Settings</strong> tab before booking an appointment.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Reason for Visit
                      </label>
                      <div className="relative">
                        <span className="absolute top-3 left-3 text-slate-500">
                          <FileText className="w-4 h-4" />
                        </span>
                        <textarea
                          id="notes"
                          rows={3}
                          required
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                          placeholder="Briefly describe the reason for your visit..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 transition cursor-pointer disabled:opacity-50"
                    >
                      {bookingLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Confirm Appointment</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 4: Confirmed */}
              {step === 4 && confirmedBooking && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Appointment Confirmed!</h2>
                  <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
                    Your booking is confirmed. We have sent the appointment details to your email address.
                  </p>

                  {/* Token display */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                    <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
                      Your Check-In Token
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                        {confirmedBooking.checkInToken}
                      </span>
                      <button
                        onClick={() => copyToken(confirmedBooking.checkInToken)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-teal-400 transition cursor-pointer"
                        title="Copy token"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-3 italic">
                      This token also appears in your "My Bookings" tab.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => { setActiveTab("bookings"); resetBooking(); }}
                      className="py-2.5 px-5 rounded-xl text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer"
                    >
                      View My Bookings
                    </button>
                    <button
                      onClick={() => router.push(`/checkin?token=${confirmedBooking.checkInToken}`)}
                      className="py-2.5 px-5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                    >
                      Go to Check-In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ PROFILE SETTINGS TAB ═══════════════════════════ */}
        {activeTab === "profile" && session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Edit details form */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-2">Edit Profile Settings</h2>
              <p className="text-xs text-slate-400 mb-6">Keep your contact details up to date.</p>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Full name */}
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="profile-name"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Phone className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="profile-phone"
                      type="tel"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="profile-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="profile-email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                >
                  {updatingProfile ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Profile Details"
                  )}
                </button>
              </form>
            </div>

            {/* Email verification alert/flow sidebar */}
            <div className="space-y-6">
              {session.pendingEmail && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-yellow-400 text-sm">Verify New Email</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        We sent a 6-digit verification code to <strong>{session.pendingEmail}</strong>. Enter it below to complete your email change.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        className="block w-full text-center tracking-widest font-mono text-lg py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                        value={profileVerifyCode}
                        onChange={(e) => setProfileVerifyCode(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={verifyingEmail}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-yellow-400 hover:bg-yellow-300 transition cursor-pointer disabled:opacity-50"
                    >
                      {verifyingEmail ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
                      ) : (
                        "Verify and Update Email"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {session.pendingPhone && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-teal-400 text-sm">Verify Phone OTP</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        We sent a 6-digit OTP to <strong>{session.pendingPhone}</strong>. Check your console log to retrieve it.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyPhoneSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        className="block w-full text-center tracking-widest font-mono text-lg py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                        value={profilePhoneVerifyCode}
                        onChange={(e) => setProfilePhoneVerifyCode(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={verifyingPhone}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50"
                    >
                      {verifyingPhone ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
                      ) : (
                        "Verify and Update Phone"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Account Status Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-sm mb-4">Account Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Current Login Email</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[150px]">{session.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Verified Email Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Calendar, User, Phone, Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Copy, FileText } from "lucide-react";

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

export default function BookingPage() {
  const router = useRouter();

  // Booking Flow Steps: 1: Doctor, 2: Date & Time, 3: Patient Info, 4: Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Doctors list
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Slots list
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selected Booking details
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Confirmed booking response
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    checkInToken: string;
    scheduledAt: string;
  } | null>(null);

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        } else {
          toast.error("Failed to load doctor schedules.");
        }
      } catch {
        toast.error("Failed to fetch clinic directory.");
      } finally {
        setLoadingDoctors(false);
      }
    };
    void fetchDoctors();
  }, []);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime("");
      try {
        const res = await fetch(`/api/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data);
        } else {
          toast.error("Failed to load available time slots.");
        }
      } catch {
        toast.error("Failed to fetch slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    void fetchSlots();
  }, [selectedDoctor, selectedDate]);

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setStep(2);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };

  const handleProceedToInfo = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both a date and time slot.");
      return;
    }
    setStep(3);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !patientEmail || !notes.trim()) {
      toast.error("Please fill in all required fields including Reason for Visit.");
      return;
    }

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientPhone,
          patientEmail,
          doctorId: selectedDoctor?.id,
          scheduledAt: scheduledDateTime.toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to complete appointment booking.");
      } else {
        toast.success("Appointment booked successfully!");
        setConfirmedBooking({
          id: data.id,
          checkInToken: data.checkInToken,
          scheduledAt: data.scheduledAt,
        });
        setStep(4);
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (!confirmedBooking) return;
    void navigator.clipboard.writeText(confirmedBooking.checkInToken);
    toast.success("Check-in token copied to clipboard!");
  };

  // Get tomorrow's date string for input limits
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
      
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            ClinicQueue
          </span>
          <span className="block text-xs text-slate-400">Appointment Scheduler</span>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <div className="glass rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl p-6 md:p-8">
          
          {/* Steps Breadcrumbs (Only if not step 4) */}
          {step < 4 && (
            <div className="flex items-center justify-between border-b border-slate-900 pb-6 mb-8 text-xs font-semibold text-slate-500">
              <button
                onClick={() => setStep(1)}
                className={`pb-1 ${step === 1 ? "text-teal-400 border-b-2 border-teal-400" : ""}`}
              >
                1. Pick Doctor
              </button>
              <ArrowRight className="w-3.5 h-3.5" />
              <button
                onClick={() => {
                  if (selectedDoctor) setStep(2);
                }}
                disabled={!selectedDoctor}
                className={`pb-1 ${step === 2 ? "text-teal-400 border-b-2 border-teal-400" : ""} disabled:opacity-40`}
              >
                2. Schedule Time
              </button>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className={`pb-1 ${step === 3 ? "text-teal-400 border-b-2 border-teal-400" : ""}`}>
                3. Your Details
              </span>
            </div>
          )}

          {/* STEP 1: Select Doctor */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Select a Doctor</h2>
              <p className="text-sm text-slate-400 mb-6">Choose a physician or department for your consultation</p>

              {loadingDoctors ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoctor(doc)}
                      className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-teal-500/50 hover:bg-slate-900 transition flex items-center gap-4 cursor-pointer"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                        style={{ backgroundColor: doc.avatarColor }}
                      >
                        {doc.name.split(" ").slice(-1)[0]?.[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{doc.name}</h4>
                        <p className="text-xs text-slate-400">{doc.specialty}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
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
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">Select Date & Time</h2>
                  <p className="text-xs text-slate-400">Booking with {selectedDoctor.name}</p>
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
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Available Slots
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No available times found for this day.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => handleSelectTime(slot.time)}
                            className={`py-2 px-1 text-center text-xs font-semibold rounded-lg border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
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
                  onClick={handleProceedToInfo}
                  disabled={!selectedDate || !selectedTime}
                  className="flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Patient Information */}
          {step === 3 && selectedDoctor && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setStep(2)}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">Your Information</h2>
                  <p className="text-xs text-slate-400">
                    Dr. {selectedDoctor.name.split(" ").slice(-1)[0]} · {selectedDate} @ {selectedTime}
                  </p>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
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
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Jane Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone className="w-5 h-5" />
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        required
                        className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        placeholder="+1 555-0199"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
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
                        className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        placeholder="jane.doe@email.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
                    Reason for Visit
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-3 text-slate-500">
                      <FileText className="w-5 h-5" />
                    </span>
                    <textarea
                      id="notes"
                      rows={3}
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                      placeholder="Briefly describe the reason for your visit..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Booking Appointment...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Appointment</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: Confirmed & Check-in Token */}
          {step === 4 && confirmedBooking && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Appointment Scheduled!</h2>
              <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
                Your reservation is verified. Write down this token, you will need it to check-in on arrival.
              </p>

              {/* Token Code Display Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Arrival Check-In Token
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-widest bg-slate-950 px-4 py-2 rounded-lg border border-slate-850">
                    {confirmedBooking.checkInToken}
                  </span>
                  <button
                    onClick={copyToken}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                    title="Copy Token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <span className="block text-[10px] text-slate-500 mt-3 italic">
                  Keep this token safe. You can check-in on a clinic tablet or from your phone.
                </span>
              </div>

              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  onClick={() => router.push(`/checkin?token=${confirmedBooking.checkInToken}`)}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition cursor-pointer"
                >
                  Go to Check-In Page
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

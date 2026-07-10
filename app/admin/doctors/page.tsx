"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, UserCheck, UserMinus, Loader2 } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarColor: string;
  room: string;
  isActive: boolean;
}

export default function DoctorsPage() {
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add Doctor Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [room, setRoom] = useState("");
  const [avatarColor, setAvatarColor] = useState("#06b6d4");

  // Fetch doctors (both active and inactive)
  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["doctors-full"],
    queryFn: async () => {
      const res = await fetch("/api/doctors");
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const list = await res.json();
      return list;
    },
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, room, avatarColor }),
      });
      if (!res.ok) throw new Error("Failed to create doctor");
      return res.json();
    },
    onSuccess: () => {
      toast.success("New doctor added successfully!");
      setShowAddForm(false);
      setName("");
      setSpecialty("");
      setRoom("");
      void queryClient.invalidateQueries({ queryKey: ["doctors-full"] });
    },
    onError: () => {
      toast.error("Failed to add doctor.");
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Doctor directory listing ${variables.isActive ? "activated" : "deactivated"}.`
      );
      void queryClient.invalidateQueries({ queryKey: ["doctors-full"] });
    },
    onError: () => {
      toast.error("Failed to update status.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty || !room) return;
    createDoctorMutation.mutate();
  };

  const handleToggleStatus = (id: string, current: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !current });
  };

  const colors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctors Directory</h1>
          <p className="text-sm text-slate-400">Manage doctor consultation room schedules</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className={`p-6 rounded-2xl bg-slate-900/40 border transition flex flex-col justify-between min-h-[180px] ${
                doc.isActive ? "border-slate-850" : "border-slate-900 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-lg flex-shrink-0"
                  style={{ backgroundColor: doc.avatarColor }}
                >
                  {doc.name.split(" ").slice(-1)[0]?.[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{doc.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.specialty}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-teal-400 rounded-md border border-slate-750">
                      {doc.room}
                    </span>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      doc.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {doc.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-900/60 flex justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => handleToggleStatus(doc.id, doc.isActive)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border transition cursor-pointer ${
                    doc.isActive
                      ? "bg-slate-900 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                      : "bg-teal-400 border-teal-400 text-slate-950 hover:bg-teal-300"
                  }`}
                >
                  {doc.isActive ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Add Doctor Listing</h3>
              <p className="text-xs text-slate-400">Add a new consultation physician to the clinic waitlist database</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Doctor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Austin Carter"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Specialty
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Orthopedics"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Room Assignment
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Room 8"
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Directory Icon Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        avatarColor === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end text-xs font-semibold pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2.5 px-4 bg-slate-950 border border-slate-800 text-slate-350 rounded-lg hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-lg transition font-bold cursor-pointer disabled:opacity-50"
                >
                  {createDoctorMutation.isPending ? "Adding..." : "Add Physician"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

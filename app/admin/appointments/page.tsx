"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Trash2, AlertCircle, Clock } from "lucide-react";
import { formatDateTime, STATUS_LABELS } from "@/lib/utils";

interface Doctor {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  scheduledAt: string;
  status: string;
  createdAt: string;
  doctor: {
    name: string;
  };
}

interface PaginatedResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AppointmentsListPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("scheduledAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Fetch doctors list for filter
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error("Error loading doctors:", err);
      }
    };
    void fetchDocs();
  }, []);

  // Fetch appointments with full filters
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["appointments", page, search, statusFilter, doctorFilter, dateFilter, sortBy, sortOrder],
    queryFn: async () => {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
        ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(doctorFilter && doctorFilter !== "all" ? { doctorId: doctorFilter } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      });
      const res = await fetch(`/api/appointments?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load appointments");
      return res.json();
    },
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Bulk operation mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Execute parallel delete API requests for simulation of bulk operation
      const promises = ids.map((id) =>
        fetch(`/api/appointments/${id}`, {
          method: "DELETE",
        })
      );
      const results = await Promise.all(promises);
      if (results.some((r) => !r.ok)) throw new Error("Some deletions failed");
    },
    onSuccess: () => {
      toast.success("Successfully deleted selected appointments.");
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => {
      toast.error("Failed to delete all selected items.");
    },
  });

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.appointments) {
      setSelectedIds(new Set(data.appointments.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleCSVExport = () => {
    const q = new URLSearchParams({
      ...(dateFilter ? { date: dateFilter } : {}),
    });
    window.open(`/api/export/appointments?${q.toString()}`, "_blank");
    toast.success("CSV export initialized.");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-slate-400">View and manage the schedule records</p>
        </div>
        <button
          onClick={handleCSVExport}
          className="flex items-center gap-2 py-2 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-900/30 border border-slate-900 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patient..."
            className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <select
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>

        <div>
          <select
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={doctorFilter}
            onChange={(e) => {
              setDoctorFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Bulk actions status */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Selected {selectedIds.size} appointments for modification.</span>
          </div>
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="flex items-center gap-1.5 py-1 px-3 bg-red-500 hover:bg-red-650 text-slate-950 font-bold rounded cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Table Box */}
      <div className="bg-slate-900/10 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-900">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      data?.appointments.length ? selectedIds.size === data.appointments.length : false
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-800 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort("patientName")}>
                  <div className="flex items-center gap-1.5">
                    <span>Patient</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Doctor</th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort("scheduledAt")}>
                  <div className="flex items-center gap-1.5">
                    <span>Scheduled At</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <Clock className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-2" />
                    <span>Loading appointment archives...</span>
                  </td>
                </tr>
              ) : !data || data.appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 italic">
                    No appointments matches your query.
                  </td>
                </tr>
              ) : (
                data.appointments.map((appt) => {
                  const selected = selectedIds.has(appt.id);
                  return (
                    <tr
                      key={appt.id}
                      className={`border-b border-slate-900/50 hover:bg-slate-900/10 transition ${
                        selected ? "bg-slate-900/30" : ""
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleSelectRow(appt.id)}
                          className="rounded border-slate-800 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-bold text-white block text-sm">{appt.patientName}</span>
                          <span className="text-xs text-slate-500 block">{appt.patientEmail}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{appt.doctor.name}</td>
                      <td className="p-4 text-slate-300">{formatDateTime(appt.scheduledAt)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          appt.status === "COMPLETED" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" :
                          appt.status === "CANCELLED" ? "bg-slate-800 text-slate-400 border-slate-850" :
                          appt.status === "IN_PROGRESS" ? "bg-purple-400/10 text-purple-400 border-purple-400/20" :
                          appt.status === "CHECKED_IN" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" :
                          "bg-blue-400/10 text-blue-400 border-blue-400/20"
                        }`}>
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Keyset / Pagination Footer */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-900/20 border-t border-slate-900 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 bg-slate-950 border border-slate-850 rounded hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 bg-slate-950 border border-slate-850 rounded hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM BULK DELETE MODAL */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/25 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Confirm Bulk Deletion</span>
            </h3>
            <p className="text-sm text-slate-400 leading-normal">
              You are about to permanently delete <strong>{selectedIds.size}</strong> appointments. This action is irreversible and will delete all associated audit logs.
            </p>
            <div className="flex gap-3 justify-end text-xs font-semibold">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="py-2 px-4 bg-slate-950 border border-slate-800 text-slate-300 rounded hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
                disabled={bulkDeleteMutation.isPending}
                className="py-2 px-4 bg-red-500 text-slate-950 rounded hover:bg-red-400 transition cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

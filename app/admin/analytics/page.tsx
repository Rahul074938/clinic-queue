"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Clock, Users, TrendingUp, Calendar } from "lucide-react";

interface HistoryData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  avgWaitMinutes: number;
}

interface DoctorStat {
  id: string;
  name: string;
  specialty: string;
  room: string;
  avatarColor: string;
  total: number;
  completed: number;
  inProgress: number;
  waiting: number;
}

interface AnalyticsResponse {
  today: {
    total: number;
    completed: number;
    checkedIn: number;
    inProgress: number;
    cancelled: number;
    waiting: number;
    avgWaitMinutes: number;
  };
  history: HistoryData[];
  doctors: DoctorStat[];
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?days=7");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center py-24">
        <Clock className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  // Format date labels for chart (e.g. 2026-07-10 -> Jul 10)
  const chartData = data.history.map((h) => {
    const d = new Date(h.date);
    return {
      ...h,
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400">Performances, wait times and physician load reports</p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden">
          <div className="absolute top-6 right-6 p-2 bg-teal-500/10 text-teal-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Lobby Turnout (Today)
          </span>
          <span className="text-3xl font-extrabold text-white mt-4 block">
            {data.today.total} Patients
          </span>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Includes scheduled, arrived & completed visits</span>
          </p>
        </div>

        <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden">
          <div className="absolute top-6 right-6 p-2 bg-purple-500/10 text-purple-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Avg Waiting Window
          </span>
          <span className="text-3xl font-extrabold text-white mt-4 block">
            {data.today.avgWaitMinutes} Minutes
          </span>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Measured check-in to consultation room transition</span>
          </p>
        </div>

        <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden">
          <div className="absolute top-6 right-6 p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Completion Rate
          </span>
          <span className="text-3xl font-extrabold text-white mt-4 block">
            {data.today.total > 0
              ? Math.round((data.today.completed / data.today.total) * 100)
              : 0}
            %
          </span>
          <p className="text-xs text-slate-500 mt-2">
            <span>{data.today.completed} completed, {data.today.cancelled} cancelled today</span>
          </p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Patient Volume History */}
        <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl">
          <h3 className="font-bold text-white text-base mb-6 uppercase tracking-wider">Patient Volume (7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                  itemStyle={{ color: "#2dd4bf" }}
                />
                <Area type="monotone" dataKey="total" stroke="#0d9488" fillOpacity={1} fill="url(#colorTotal)" name="Total Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wait Times History */}
        <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl">
          <h3 className="font-bold text-white text-base mb-6 uppercase tracking-wider">Average Wait Time Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                  formatter={(val) => [`${val} min`, "Avg Wait"]}
                />
                <Bar dataKey="avgWaitMinutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Wait Time" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Doctor workload metrics */}
      <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 shadow-xl">
        <h3 className="font-bold text-white text-base mb-6 uppercase tracking-wider">
          Physician Consultation Loads (Today)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-900">
                <th className="p-4">Physician</th>
                <th className="p-4">Room</th>
                <th className="p-4">Total Appts</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Waiting</th>
                <th className="p-4">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.doctors.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                  <td className="p-4 font-bold text-white flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                      style={{ backgroundColor: doc.avatarColor }}
                    >
                      {doc.name.split(" ").slice(-1)[0]?.[0]}
                    </div>
                    <div>
                      <span>{doc.name}</span>
                      <span className="block text-[10px] text-slate-500 font-normal">{doc.specialty}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-mono font-bold">{doc.room}</td>
                  <td className="p-4 text-slate-350">{doc.total}</td>
                  <td className="p-4 text-slate-350">{doc.completed}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      doc.waiting > 0 ? "bg-yellow-400/10 text-yellow-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {doc.waiting} Waiting
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      doc.inProgress > 0 ? "bg-purple-500/10 text-purple-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {doc.inProgress > 0 ? "Active" : "Idle"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

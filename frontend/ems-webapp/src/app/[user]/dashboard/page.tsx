"use client";

import React, { useState, useContext } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import {
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  PlusCircle,
  Zap,
  Activity,
  Battery,
  TrendingUp,
  Calendar,
  ChevronDown,
  Bell
} from "lucide-react";

import { Card } from "@/components/Card";
import { AuthContext } from "@/lib/AuthContext";
import Header from "@/components/Header";

// Mock Data for the charts
const consumptionData = [
  { time: "00:00", usage: 45, cost: 1.2
 },
  { time: "04:00", usage: 30, cost: 0.8 },
  { time: "08:00", usage: 85, cost: 2.5 },
  { time: "12:00", usage: 120, cost: 4.1 },
  { time: "16:00", usage: 95, cost: 3.2 },
  { time: "20:00", usage: 110, cost: 3.8 },
  { time: "23:59", usage: 60, cost: 1.9 },
];

const deviceData = [
  { name: "HVAC System", value: 45 },
  { name: "Lighting", value: 15 },
  { name: "Server Room", value: 25 },
  { name: "EV Charging", value: 10 },
  { name: "Others", value: 5 },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("24h");
  const { user } = useContext(AuthContext) as { user: any };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header/>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <Card></Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Consumption Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-gray-900">Consumption Trends</h3>
                <select
                  className="bg-gray-50 border border-gray-200 text-sm text-black rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionData}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="usage"
                      stroke="#f97316"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsage)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Device Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-8">Usage by Category</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      width={100}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

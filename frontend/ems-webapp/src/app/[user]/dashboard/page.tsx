"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { Card } from "@/components/Card";
import NewNav from "@/components/NewNav";
import Header from "@/components/Header";


// Mock Data for the charts
const consumptionData = [
  { time: "00:00", usage: 45, cost: 1.2 },
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

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("24h");

  return (
    <main className="flex-1 flex flex-row overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Stats Grid */}
            <Card />

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side: Recent Activity */}
              <div className="w-full lg:w-[350px] shrink-0">
                <NewNav />
              </div>

              {/* Right Side: Charts */}
              <div className="flex-1 space-y-8">
                {/* Main Consumption Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-gray-900">Energy Consumption Trends</h3>
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
<div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">

  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-bold text-gray-900">
        Usage by Category
      </h3>

      <p className="text-gray-500 mt-1 text-sm">
        Real-time energy distribution
      </p>
    </div>

    <div className="bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
      Live Data
    </div>
  </div>

  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">

    {/* Donut Chart */}
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={deviceData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={5}
            dataKey="value"
            cornerRadius={10}
            stroke="none"
            label={({ percent }) =>
              `${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {deviceData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          {/* Center Icon */}
          <text
            x="50%"
            y="43%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-orange-500 text-sm"
          >
            ⚡
          </text>

          {/* Center Text */}
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan className="fill-gray-900 text-3xl font-bold">
              2.4 kW
            </tspan>

            <tspan
              x="50%"
              dy="22"
              className="fill-gray-400 text-[10px] font-bold tracking-[3px]"
            >
              CURRENT USAGE
            </tspan>
          </text>

          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              padding: "10px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>

                    {/* Right Side Cards */}
                    <div className="space-y-5">
                      {deviceData.map((item, index) => (
                        <div
                          key={index}
                          className="border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            {/* Left */}
                            <div className="flex items-center gap-4">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                                style={{ backgroundColor: COLORS[index] }}
                              >
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-gray-900">
                                  {item.name}
                                </h4>
                                <div className="w-52 bg-gray-100 h-3 rounded-full mt-3 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${item.value}%`,
                                      backgroundColor: COLORS[index],
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Right */}
                            <div className="text-right">
                              <p
                                className="text-3xl font-bold"
                                style={{ color: COLORS[index] }}
                              >
                                {item.value}%
                              </p>
                              <p className="text-gray-400 mt-1 text-sm">
                                {(item.value * 0.024).toFixed(2)} kWh
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

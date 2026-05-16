import { Battery, TrendingUp, Zap, Activity, LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import React from "react";

interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

const DEFAULT_STATS: StatItem[] = [
  { label: "Current Usage", value: "2.4 kW", icon: Zap, color: "text-orange-600", bg: "bg-orange-50", trend: "+2.5%", trendUp: true },
  { label: "Daily Cost", value: "$12.40", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", trend: "-0.8%", trendUp: false },
  { label: "Active Devices", value: "12", icon: Battery, color: "text-blue-500", bg: "bg-blue-50", trend: "Stable", trendUp: true },
  { label: "System Health", value: "98%", icon: Activity, color: "text-purple-500", bg: "bg-purple-50", trend: "Optimal", trendUp: true },
];

interface CardProps {
  stats?: StatItem[];
}

export function Card({ stats = DEFAULT_STATS }: CardProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-start">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 w-full md:w-44"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            {stat.trend && (
              <span className={`ml-auto flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              }`}>
                {stat.trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {stat.trend}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium truncate">{stat.label}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-0.5 truncate">{stat.value}</h3>
        </div>
      ))}
    </div>
  );
}
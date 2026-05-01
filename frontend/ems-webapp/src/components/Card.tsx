import { Battery, TrendingUp, Zap, Activity, LucideIcon } from "lucide-react";

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
  { label: "Current Usage", value: "2.4 kW", icon: Zap, color: "text-orange-500", bg: "bg-orange-50", trend: "+2.5%", trendUp: true },
  { label: "Daily Cost", value: "$12.40", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", trend: "+1.2%", trendUp: true },
  { label: "Active Devices", value: "12", icon: Battery, color: "text-blue-500", bg: "bg-blue-50", trend: "Stable", trendUp: true },
  { label: "System Health", value: "98%", icon: Activity, color: "text-purple-500", bg: "bg-purple-50", trend: "Optimal", trendUp: true },
];

interface CardProps {
  stats?: StatItem[];
}

export function Card({ stats = DEFAULT_STATS }: CardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            {stat.trend && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              }`}>
                {stat.trend}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium truncate">{stat.label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</h3>
        </div>
      ))}
    </div>
  );
}
import { Battery, TrendingUp, Zap, Activity } from "lucide-react";

export function Card() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Current Usage", value: "2.4 kW", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Daily Cost", value: "$12.40", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
        { label: "Active Devices", value: "12", icon: Battery, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "System Health", value: "98%", icon: Activity, color: "text-purple-500", bg: "bg-purple-50" },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
        </div>
      ))}
    </div>
  );
}
'use client';
import Image from 'next/image';
import { CheckCircle, AlertTriangle, Zap, Activity, ChevronRight } from 'lucide-react';

export default function NewNav() {
  const activities = [
    { title: "HVAC System checked", desc: "All systems normal", time: "2m ago", color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-100", badgeColor: "text-green-600", Icon: CheckCircle },
    { title: "High usage detected", desc: "Server Room", time: "15m ago", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-100", badgeColor: "text-orange-600", Icon: AlertTriangle },
    { title: "New device connected", desc: "EV Charging Station", time: "1h ago", color: "text-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-100", badgeColor: "text-blue-600", Icon: Zap },
    { title: "Daily report generated", desc: "Energy usage report", time: "3h ago", color: "text-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-100", badgeColor: "text-purple-600", Icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[350px] px-6 pb-6 pt-0 border-x border-b border-gray-200 rounded-b-2xl shadow-sm min-h-[700px]">
      {/* 1. GREETING */}
      <div className="text-left pt-6">
        <h2 className="text-2xl font-bold text-gray-900">Good morning, Roshel!👋</h2>
        <p className="text-gray-500">Here's what's happening with your energy system today.</p>
      </div>

      {/* 2. ILLUSTRATION */}
      <div className="flex justify-start py-4">
        <Image 
          src="/energy_saving_image.png" 
          alt="Energy Dashboard Illustration" 
          width={350} 
          height={250} 
          priority
          className="object-contain"
        />
      </div>

      {/* 3. RECENT ACTIVITY CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          <button className="text-orange-500 text-sm font-medium flex items-center hover:underline">
            View All <ChevronRight size={14} className="ml-1" />
          </button>
        </div>

        <div className="space-y-5">
          {activities.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${item.bgColor} border ${item.borderColor}`}>
                <item.Icon className={item.color} size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.bgColor} ${item.badgeColor}`}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
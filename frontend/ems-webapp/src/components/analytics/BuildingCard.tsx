import { Building2, Cpu, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { Building, Module } from "@/lib/DeviceBuildingContext";
import Link from "next/link";
import { useParams } from "next/navigation";

const TIME_PERIODS = ['12H', '24H', '3D','7D', '1M', '1Y'];

/** Mini stat inside a building card */
const MiniStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="flex flex-col gap-0.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <span className="text-sm font-extrabold text-gray-900">{value}</span>
    </div>
);

/** Custom Tooltip for LineChart */
const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50 relative">
                <p className="text-xs font-bold text-gray-800 mb-2">{label}</p>
                {viewMode === 'building' ? (
                    payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-[10px] text-gray-500 w-24">{p.name}:</span>
                            <span className="text-xs font-bold text-gray-900">{p.value}</span>
                        </div>
                    ))
                ) : (
                    payload.map((p: any, i: number) => {
                        const mId = p.dataKey;
                        const data = p.payload;
                        return (
                            <div key={i} className="mb-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0 last:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                                </div>
                                <div className="pl-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                    <span className="text-[9px] text-gray-500">Power: <strong className="text-gray-900">{data[mId]} kW</strong></span>
                                    <span className="text-[9px] text-gray-500">Voltage: <strong className="text-gray-900">{data[`${mId}_v`]} V</strong></span>
                                    <span className="text-[9px] text-gray-500">Current: <strong className="text-gray-900">{data[`${mId}_c`]} A</strong></span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        );
    }
    return null;
};



/** Per-building card */
export const BuildingCard = ({ building, modules, allDeviceData }: { building: Building, modules: Module[], allDeviceData: any[] }) => {
    const [period, setPeriod] = useState('24H');
    const [viewMode, setViewMode] = useState<'building' | 'device'>('building');
    const params = useParams();
    const user = params?.user as string;

    const { barData, totalLoad, avgVoltage, chartData } = useMemo(() => {
        let loadSum = 0;
        let voltSum = 0;
        let count = 0;

        const latestData = new Map();
        allDeviceData.forEach(d => {
            if (!latestData.has(d.device_id)) {
                latestData.set(d.device_id, d);
            }
        });

        const bData = modules.map(m => {
            const deviceStats = latestData.get(m.module_id);
            const power = deviceStats?.power || 0;
            const voltage = deviceStats?.voltage || 0;
            
            loadSum += power;
            if (voltage > 0) {
                voltSum += voltage;
                count++;
            }

            return { 
                name: m.module_name, 
                value: power 
            };
        });

        const timeMap = new Map();
        const moduleIds = modules.map(m => m.module_id);
        
        // Filter by time range
        const now = new Date();
        const cutoff = new Date();
        switch (period) {
            case '12H':
                cutoff.setHours(now.getHours() - 12);
                break;
            case '24H':
                cutoff.setHours(now.getHours() - 24);
                break;
            case '3D':
                cutoff.setDate(now.getDate() - 3);
                break;
            case '7D':
                cutoff.setDate(now.getDate() - 7);
                break;
            case '1M':
                cutoff.setMonth(now.getMonth() - 1);
                break;
            case '1Y':
                cutoff.setFullYear(now.getFullYear() - 1);
                break;
            default:
                cutoff.setDate(now.getDate() - 1);
        }

        const buildingData = allDeviceData.filter(d => {
            const isModule = moduleIds.includes(d.device_id);
            const isRecent = d.time ? new Date(d.time) >= cutoff : false;
            return isModule && isRecent;
        });

        const sortedData = [...buildingData].sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime());

        sortedData.forEach(d => {
            if (!d.time) return;
            const date = new Date(d.time);
            let t = "";
            if (period === '12H' || period === '24H') {
                t = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            } else {
                t = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            }
            
            if (!timeMap.has(t)) {
                timeMap.set(t, { time: t, rawTime: date.getTime(), load: 0, voltageSum: 0, vCount: 0, currentSum: 0, cCount: 0, energy: 0 });
            }
            const entry = timeMap.get(t);
            entry.load += (d.power || 0);
            entry.voltageSum += (d.voltage || 0);
            if (d.voltage) entry.vCount += 1;
            entry.currentSum += (d.current || 0);
            if (d.current) entry.cCount += 1;
            
            entry[d.device_id] = d.power || 0;
            entry[`${d.device_id}_v`] = d.voltage || 0;
            entry[`${d.device_id}_c`] = d.current || 0;
        });

        const cData = Array.from(timeMap.values())
            .sort((a, b) => a.rawTime - b.rawTime)
            .map(e => ({
                ...e,
                voltage: e.vCount > 0 ? (e.voltageSum / e.vCount).toFixed(1) : 0,
                current: e.cCount > 0 ? (e.currentSum / e.cCount).toFixed(1) : 0,
                energy: (e.load * 2.4).toFixed(1)
            }));

        return {
            barData: bData,
            totalLoad: loadSum.toFixed(2),
            avgVoltage: count > 0 ? (voltSum / count).toFixed(1) : "--",
            chartData: cData
        };
    }, [modules, allDeviceData, period]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 hover:border-orange-200 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                    <Building2 size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">{building.building_name}</h3>
                    <p className="text-xs text-gray-400">{building.address}</p>
                </div>
            </div>

            {modules.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Cpu size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-500">No modules registered</p>
                    <p className="text-[10px] text-gray-400">Add a module to see analytics</p>
                </div>
            ) : (
                <>
                    {/* Mini KPIs */}
                    <div className="grid grid-cols-4 gap-2 border-b border-gray-50 pb-4">
                        <MiniStat label="Total Load" value={`${totalLoad} kW`} color="text-orange-500" />
                        <MiniStat label="Daily Energy" value="-- kWh" color="text-blue-500" />
                        <MiniStat label="Avg. Voltage" value={`${avgVoltage} V`} color="text-purple-500" />
                        <MiniStat label="Peak Demand" value="-- kW" color="text-orange-600" />
                    </div>

                    {/* Device bar chart */}
                    <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)', fontSize: 12 }}
                                    cursor={{ fill: '#fff7ed' }}
                                />
                                <Bar dataKey="value" fill="#f97316" radius={[5, 5, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Consumption Trend */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-bold text-gray-700">Consumption Trend</span>
                            <div className="flex gap-2 items-center">
                                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setViewMode('building')}
                                        className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${viewMode === 'building' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Building
                                    </button>
                                    <button
                                        onClick={() => setViewMode('device')}
                                        className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${viewMode === 'device' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Device
                                    </button>
                                </div>
                                <div className="flex gap-1">
                                    {TIME_PERIODS.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${period === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {viewMode === 'building' ? (
                            <div className="flex items-center gap-4 mb-2">
                                {[
                                    { key: 'load', label: 'Total Load (kW)', color: '#ef4444' },
                                    { key: 'energy', label: 'Daily Energy (kWh)', color: '#3b82f6' },
                                    { key: 'voltage', label: 'Avg. Voltage (V)', color: '#8b5cf6' },
                                    { key: 'current', label: 'Avg. Current (A)', color: '#10b981' },
                                ].map(l => (
                                    <div key={l.key} className="flex items-center gap-1">
                                        <span className="inline-block w-5 h-0.5 rounded" style={{ background: l.color }} />
                                        <span className="text-[9px] text-gray-400">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-2 flex-wrap max-h-8 overflow-hidden">
                                {modules.map((m, i) => {
                                    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
                                    const color = colors[i % colors.length];
                                    return (
                                        <div key={m.module_id} className="flex items-center gap-1">
                                            <span className="inline-block w-5 h-0.5 rounded" style={{ background: color }} />
                                            <span className="text-[9px] text-gray-400">{m.module_name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <YAxis yAxisId="lv" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <YAxis yAxisId="rv" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                                    {viewMode === 'building' ? (
                                        <>
                                            <Line yAxisId="lv" type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={2} dot={false} name="Total Load (kW)" />
                                            <Line yAxisId="lv" type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} dot={false} name="Daily Energy (kWh)" />
                                            <Line yAxisId="rv" type="monotone" dataKey="voltage" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Avg. Voltage (V)" />
                                            <Line yAxisId="rv" type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} dot={false} name="Avg. Current (A)" />
                                        </>
                                    ) : (
                                        modules.map((m, i) => {
                                            const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
                                            return (
                                                <Line key={m.module_id} yAxisId="lv" type="monotone" dataKey={m.module_id} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} name={m.module_name} />
                                            );
                                        })
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* Footer */}
            <Link href={`/${user}/analytics/${encodeURIComponent(building.building_name)}`} className="flex items-center gap-1.5 text-orange-500 text-xs font-bold hover:gap-2.5 transition-all">
                View Details <ArrowRight size={14} />
            </Link>
        </div>
    );
};
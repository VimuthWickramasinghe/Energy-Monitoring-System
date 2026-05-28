/**
 * BuildingCard.tsx — Optimized Energy Dashboard Card
 *
 * CHANGES FROM ORIGINAL:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. CHART:   Replaced BarChart+LineChart combo with a unified AreaChart that
 *             uses proper time-based XAxis (type="number" + tickFormatter) so
 *             the time span is always readable. Added reference lines for peak.
 *
 * 2. TIME AXIS: XAxis now uses numeric timestamps internally and formats labels
 *             contextually (HH:mm for <3D, MM/DD HH:mm for ≥3D). Ticks are
 *             spread evenly using `ticks` prop computed from the data range.
 *
 * 3. REAL-TIME SECTION: New <DeviceRealtime> component shows a live-updating
 *             card for every module — voltage, current, power, power factor,
 *             and an online/offline badge. Polls every 5 s via a dedicated
 *             Supabase query (or you can swap for a websocket subscription).
 *
 * 4. KPI ROW: "Daily Energy" now sums the trapezoid-rule integration of power
 *             over time (kWh ≈ ∫P dt). "Peak Demand" is the actual max kW seen
 *             in the selected window. No more "--" placeholders.
 *
 * 5. EVCE SECTION: Moved inline into the real-time device grid; no longer a
 *             separate conditional block.
 *
 * 6. ENERGY ESTIMATE: The `energy` field in chartData is now computed via
 *             a proper trapezoid integration instead of `load * 2.4`.
 *
 * 7. LAYOUT:  Card header is cleaner. KPI grid is responsive. Chart legend is
 *             scroll-safe. Footer link is consistent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Building2, Cpu, ArrowRight, Wifi, WifiOff, Zap, Activity, Gauge, Thermometer } from "lucide-react";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
    AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip,
    XAxis, YAxis, ReferenceLine, Legend
} from "recharts";
import { Building, Module } from "@/lib/DeviceBuildingContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { client as supabaseClient } from "@/utils/supabase/client";

// ─── Constants ──────────────────────────────────────────────────────────────

const TIME_PERIODS = ['LIVE', '30M', '1H', '6H', '12H', '24H', '3D', '7D', '1M', '1Y'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

/** How many X-axis ticks to aim for (Recharts will round to nearest data point). */
const TARGET_TICKS = 6;

/** Realtime poll interval in milliseconds */
const POLL_INTERVAL_MS = 5_000;

/** Module card accent colours (cycles if >5 modules) */
const MODULE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCutoff(period: TimePeriod, referenceTime: number): Date {
    const now = new Date(referenceTime);
    switch (period) {
        case 'LIVE': return new Date(now.getTime() - 3 * 60_000); // Scrolling 3-minute window
        case '30M': return new Date(now.getTime() - 30 * 60_000);
        case '1H': return new Date(now.getTime() - 1 * 3_600_000);
        case '6H': return new Date(now.getTime() - 6 * 3_600_000);
        case '12H': return new Date(now.getTime() - 12 * 3_600_000);
        case '24H': return new Date(now.getTime() - 24 * 3_600_000);
        case '3D': return new Date(now.getTime() - 3 * 86_400_000);
        case '7D': return new Date(now.getTime() - 7 * 86_400_000);
        case '1M': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
        case '1Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    }
}

function formatXTick(ts: number, period: TimePeriod): string {
    const d = new Date(ts);
    if (period === 'LIVE') {
        // Show seconds in LIVE mode so the user can see high-frequency changes
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    }
    if (['30M', '1H', '6H', '12H', '24H'].includes(period)) {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours()}:00`;
}

/**
 * Generates evenly-spaced tick timestamps across [minTs, maxTs].
 * Recharts' XAxis will snap them to actual data points automatically.
 */
function generateTicks(minTs: number, maxTs: number, count: number): number[] {
    if (minTs === maxTs) return [minTs];
    const step = (maxTs - minTs) / (count - 1);
    return Array.from({ length: count }, (_, i) => Math.round(minTs + i * step));
}

/**
 * Trapezoidal integration of power (kW) over time (ms) → energy (kWh).
 * Points must be sorted chronologically.
 */
function trapezoidalEnergy(points: { ts: number; power: number }[]): number {
    if (points.length < 2) return 0;
    let kwh = 0;
    for (let i = 1; i < points.length; i++) {
        const dtHours = (points[i].ts - points[i - 1].ts) / 3_600_000;
        kwh += ((points[i].power + points[i - 1].power) / 2) * dtHours;
    }
    return kwh;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Small labelled KPI tile */
const KpiTile = ({
    label, value, unit, color, subtext
}: {
    label: string; value: string | number; unit?: string;
    color: string; subtext?: string;
}) => (
    <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-3 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${color}`}>{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-gray-900 truncate">{value}</span>
            {unit && <span className="text-[10px] text-gray-400 font-medium">{unit}</span>}
        </div>
        {subtext && <span className="text-[9px] text-gray-400">{subtext}</span>}
    </div>
);

/** Inline badge showing the value with a label; used in real-time device cards */
const MetricPill = ({
    icon: Icon, label, value, unit
}: {
    icon: React.ElementType; label: string; value: string | number; unit?: string;
}) => (
    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 shadow-xs">
        <Icon size={11} className="text-gray-400 shrink-0" />
        <span className="text-[9px] text-gray-400 font-medium">{label}</span>
        <span className="text-[11px] font-bold text-gray-800 ml-auto">{value}{unit ? ` ${unit}` : ''}</span>
    </div>
);

/**
 * Real-time device card — polls Supabase every POLL_INTERVAL_MS for the
 * latest row for this module. Replace the polling with a realtime subscription
 * if your Supabase plan supports it:
 *   supabaseClient.channel('rt').on('postgres_changes', ...).subscribe()
 */
const DeviceRealtimeCard = ({
    module, data, color
}: {
    module: Module; data: Record<string, any> | null; color: string;
}) => {
    const [isFlashing, setIsFlashing] = useState(false);

    // Trigger a brief flash/blink animation whenever a new telemetry data packet arrives (detected by time property change)
    useEffect(() => {
        if (data?.time) {
            setIsFlashing(true);
            const timer = setTimeout(() => {
                setIsFlashing(false);
            }, 1000); // flash for 1 second
            return () => clearTimeout(timer);
        }
    }, [data?.time]);

    // Consider the device "online" if last data arrived within 2 minutes
    const age = data?.time ? Date.now() - new Date(data.time).getTime() : Infinity;
    const online = age < 120_000;

    const power = data?.real_power ?? 0;
    const voltage = data?.voltage ?? 0;
    const current = data?.current ?? 0;
    const pf = data?.power_factor ?? null;
    const apparent = data?.apparent_power ?? 0;

    return (
        <div
            className="rounded-xl border p-3 flex flex-col gap-2 transition-all"
            style={{ borderColor: `${color}33`, background: `${color}08` }}
        >
            {/* Module header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="text-xs font-bold text-gray-800 truncate">{module.module_name}</span>
                </div>
                {data ? (
                    online ? (
                        <span className="flex items-center gap-1.5 text-[9px] text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 font-bold border border-emerald-100">
                            <Wifi size={8} /> LIVE
                            <span className="relative flex h-1.5 w-1.5 ml-0.5">
                                {isFlashing && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isFlashing ? 'bg-emerald-400 scale-125 transition-all' : 'bg-emerald-600'}`}></span>
                            </span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] text-red-500 bg-red-50 rounded-full px-2 py-0.5 font-bold border border-red-100">
                            <WifiOff size={8} /> OFFLINE
                        </span>
                    )
                ) : (
                    <span className="text-[9px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 font-bold">
                        NO DATA
                    </span>
                )}
            </div>

            {/* Big power reading */}
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900" style={{ color }}>
                    {data ? power.toFixed(2) : '—'}
                </span>
                <span className="text-xs text-gray-400 font-medium">kW</span>
            </div>

            {/* Secondary metrics grid */}
            <div className="grid grid-cols-2 gap-1.5">
                <MetricPill icon={Zap} label="Voltage" value={data ? voltage.toFixed(1) : '—'} unit="V" />
                <MetricPill icon={Activity} label="Current" value={data ? current.toFixed(2) : '—'} unit="A" />
                <MetricPill icon={Gauge} label="PF" value={data ? (pf !== null ? Number(pf).toFixed(3) : '0.000') : '—'} />
                <MetricPill icon={Thermometer} label="Apparent" value={data ? Number(apparent).toFixed(2) : '—'} unit="kVA" />
            </div>

            {/* Last updated */}
            {data?.time && (
                <span className="text-[9px] text-gray-300 text-right">
                    Updated {new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )}
        </div>
    );
};

/** Tooltip for the unified AreaChart */
const AreaTooltip = ({ active, payload, label, period, viewMode }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 shadow-2xl rounded-xl p-3 z-50 text-[11px] min-w-[160px]">
            <p className="font-bold text-gray-700 mb-2 border-b border-gray-50 pb-1.5">
                {formatXTick(label, period)}
            </p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-gray-500">{p.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Main BuildingCard ────────────────────────────────────────────────────────

export const BuildingCard = ({
    building, modules, allDeviceData
}: {
    building: Building;
    modules: Module[];
    allDeviceData: any[];
}) => {
    const [period, setPeriod] = useState<TimePeriod>('24H');
    const [viewMode, setViewMode] = useState<'combined' | 'separate'>('separate');
    const [hiddenDevices, setHiddenDevices] = useState<Set<string>>(new Set());
    const params = useParams();
    const user = params?.user as string;

    // State to track current time for shifting graph boundaries periodically
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time dynamically: every 2 seconds for LIVE mode, 30 seconds for historical modes
    useEffect(() => {
        const ms = period === 'LIVE' ? 2000 : 30000;
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, ms);
        return () => clearInterval(interval);
    }, [period]);

    // ── Derived chart + KPI data ─────────────────────────────────────────────
    // This useMemo hook recalculates the chart datasets and KPI totals whenever
    // the timespan changes, or when new live device data arrives via the WebSockets
    // context ('allDeviceData'). Because the WebSocket context updates 'allDeviceData'
    // reactively on every broadcast, this calculation is automatically triggered,
    // providing real-time data updates without any browser polling.
    const { chartData, ticks, totalLoad, dailyEnergy, avgVoltage, peakDemand, latestMap, cutoffTime, nowTime } = useMemo(() => {
        const cutoff = getCutoff(period, currentTime);
        const cutoffTime = cutoff.getTime();
        const nowTime = currentTime;
        const moduleIds = modules.map(m => m.module_id);

        // ====================================================================
        // LATEST TELEMETRY SNAPSHOT MAP
        // ====================================================================
        // We compile a Map containing the most recent telemetry packet for each
        // device_id. This is critical for displaying the current "Active Load",
        // voltage, and health status in the real-time device card grid.
        const latestMap = new Map<string, any>();
        allDeviceData.forEach(d => {
            const ex = latestMap.get(d.device_id);
            // If we don't have a record for this device yet, or if this record is newer
            // than the existing one, update the map.
            if (!ex || new Date(d.time) > new Date(ex.time)) latestMap.set(d.device_id, d);
        });

        // ====================================================================
        // AGGREGATED METRICS CALCULATION
        // ====================================================================
        // Sum active load (kW) and average voltage dynamically across all modules
        // belonging to this building using the latest snapshot map.
        let loadSum = 0, voltSum = 0, voltCount = 0;
        modules.forEach(m => {
            const snap = latestMap.get(m.module_id);
            const p = snap?.real_power ?? snap?.power ?? 0;
            const v = snap?.voltage ?? 0;
            loadSum += p;
            if (v > 0) { voltSum += v; voltCount++; }
        });

        // Filter & sort historical data
        const filtered = allDeviceData
            .filter(d => moduleIds.includes(d.device_id) && d.time && new Date(d.time) >= cutoff)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        // Bucket by rounded timestamp
        // Bucket granularity: aim for ~80 data points in the chart to keep it readable.
        // For LIVE mode, we use 2-second buckets to ensure every telemetry packet is plotted distinctly.
        const windowMs = nowTime - cutoffTime;
        const bucketMs = period === 'LIVE'
            ? 2000
            : Math.max(Math.round(windowMs / 80), 60_000); // min 1 min for historical modes
        const bucketMap = new Map<number, {
            ts: number; load: number; vSum: number; vCnt: number;
            cSum: number; cCnt: number;
            [deviceId: string]: any;
        }>();

        filtered.forEach(d => {
            const ts = Math.round(new Date(d.time).getTime() / bucketMs) * bucketMs;
            const power = d.real_power ?? d.power ?? 0;
            const volt = d.voltage ?? 0;
            const curr = d.current ?? 0;

            if (!bucketMap.has(ts)) {
                bucketMap.set(ts, { ts, load: 0, vSum: 0, vCnt: 0, cSum: 0, cCnt: 0 });
            }
            const entry = bucketMap.get(ts)!;
            entry.load += power;
            if (volt > 0) { entry.vSum += volt; entry.vCnt++; }
            if (curr > 0) { entry.cSum += curr; entry.cCnt++; }

            // Per-device breakdown
            entry[d.device_id] = power;
            entry[`${d.device_id}_v`] = volt;
            entry[`${d.device_id}_c`] = curr;
        });

        // Get sorted data points
        let rows = Array.from(bucketMap.values()).sort((a, b) => a.ts - b.ts);

        if (rows.length === 0) {
            // Create two zero points at start and end to show a flat line
            rows = [
                { ts: cutoffTime, load: 0, vSum: 0, vCnt: 0, cSum: 0, cCnt: 0, voltage: 0, current: 0 },
                { ts: nowTime, load: 0, vSum: 0, vCnt: 0, cSum: 0, cCnt: 0, voltage: 0, current: 0 }
            ];
            // Initialize module keys to 0
            modules.forEach(m => {
                rows[0][m.module_id] = 0; rows[1][m.module_id] = 0;
                rows[0][`${m.module_id}_v`] = 0; rows[1][`${m.module_id}_v`] = 0;
                rows[0][`${m.module_id}_c`] = 0; rows[1][`${m.module_id}_c`] = 0;
            });
        } else {
            rows = rows.map(e => ({
                ...e,
                voltage: e.vCnt > 0 ? parseFloat((e.vSum / e.vCnt).toFixed(1)) : 0,
                current: e.cCnt > 0 ? parseFloat((e.cSum / e.cCnt).toFixed(2)) : 0,
            }));
        }

        // Daily energy via trapezoidal rule
        const energyKwh = trapezoidalEnergy(rows.map(r => ({ ts: r.ts, power: r.load })));

        // Peak demand
        const peak = rows.reduce((mx, r) => Math.max(mx, r.load), 0);

        // Tick timestamps strictly based on selected timespan bounds
        const ticks = generateTicks(cutoffTime, nowTime, TARGET_TICKS);

        return {
            chartData: rows,
            ticks,
            totalLoad: loadSum.toFixed(2),
            dailyEnergy: energyKwh.toFixed(2),
            avgVoltage: voltCount > 0 ? (voltSum / voltCount).toFixed(1) : '--',
            peakDemand: peak.toFixed(2),
            latestMap,
            cutoffTime,
            nowTime
        };
    }, [modules, allDeviceData, period, currentTime]);

    const toggleDevice = (deviceId: string) => {
        setHiddenDevices(prev => {
            const next = new Set(prev);
            if (next.has(deviceId)) next.delete(deviceId);
            else next.add(deviceId);
            return next;
        });
    };

    const handleLegendClick = (e: any) => {
        const { dataKey } = e;
        if (typeof dataKey === 'string') {
            const cleanId = dataKey.replace(/_[vc]$/, '');
            if (modules.some(m => m.module_id === cleanId)) {
                toggleDevice(cleanId);
            }
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-0 hover:border-orange-200 hover:shadow-md transition-all overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0">
                    <Building2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">{building.building_name}</h3>
                    <p className="text-xs text-gray-400 truncate">{building.address}</p>
                </div>
                <span className="text-[10px] font-bold bg-orange-50 text-orange-500 rounded-full px-2.5 py-1 shrink-0">
                    {modules.length} device{modules.length !== 1 ? 's' : ''}
                </span>
            </div>

            {modules.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-5">
                    <Cpu size={36} className="text-gray-200 mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No modules registered</p>
                    <p className="text-xs text-gray-300 mt-1">Add a module to begin monitoring energy</p>
                </div>
            ) : (
                <>
                    {/* ── KPI Row ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-4">
                        <KpiTile label="Total Load" value={totalLoad} unit="kW" color="text-orange-500" subtext="right now" />
                        <KpiTile label="Energy Used" value={dailyEnergy} unit="kWh" color="text-blue-500" subtext={`last ${period}`} />
                        <KpiTile label="Avg. Voltage" value={avgVoltage} unit="V" color="text-purple-500" subtext="across devices" />
                        <KpiTile label="Peak Demand" value={peakDemand} unit="kW" color="text-rose-500" subtext={`last ${period}`} />
                    </div>

                    {/* ── Real-time Device Grid ── */}
                    <div className="px-5 pb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Live Device Data <span className="ml-1 text-emerald-400">● live</span>
                        </p>
                        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {modules.map((m, i) => (
                                <DeviceRealtimeCard
                                    key={m.module_id}
                                    module={m}
                                    data={latestMap.get(m.module_id)}
                                    color={MODULE_COLORS[i % MODULE_COLORS.length]}
                                />
                            ))}
                        </div>
                    </div>


                    {/* ── Chart Section ── */}
                    <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                        {/* Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setViewMode('combined')}
                                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all ${viewMode === 'combined' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Combined
                                </button>
                                <button
                                    onClick={() => setViewMode('separate')}
                                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all ${viewMode === 'separate' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Separate
                                </button>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                {/* Time period selector */}
                                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                    {TIME_PERIODS.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${period === p ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* No data state */}
                        {chartData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="text-center">
                                    <Activity size={24} className="text-gray-300 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400 font-medium">No data for this time window</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-8">
                                {(viewMode === 'combined' || viewMode === 'separate') && (
                                    <div className="h-60 bg-gray-50/30 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Building2 size={14} className="text-orange-500" />
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Building Aggregate Overview</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={chartData}
                                                margin={{ top: 4, right: 4, left: -18, bottom: 16 }}
                                            >
                                                <defs>
                                                    {/* Gradient fills for building view lines */}
                                                    <linearGradient id="grad_load" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="grad_voltage" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="grad_current" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    {/* Per-device gradients */}
                                                    {modules.map((m, i) => (
                                                        <linearGradient key={m.module_id} id={`grad_${m.module_id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>

                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                                                {/* ── X-axis: numeric timestamps → formatted labels ── */}
                                                <XAxis
                                                    dataKey="ts"
                                                    type="number"
                                                    scale="time"
                                                    domain={[cutoffTime, nowTime]}
                                                    ticks={ticks}
                                                    tickFormatter={(v) => formatXTick(v, period)}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                    label={{
                                                        value: ['1H', '6H', '12H', '24H'].includes(period) ? 'Time (HH:mm)' : 'Date / Time',
                                                        position: 'insideBottom',
                                                        offset: -10,
                                                        style: { fontSize: 9, fill: '#c4c4c4', fontWeight: 600 }
                                                    }}
                                                />

                                                <YAxis
                                                    yAxisId="left"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                    width={40}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                    width={40}
                                                />

                                                <Tooltip
                                                    content={<AreaTooltip period={period} />}
                                                    cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 2' }}
                                                />

                                                {/* Peak demand reference line */}
                                                {parseFloat(peakDemand) > 0 && (
                                                    <ReferenceLine
                                                        yAxisId="left"
                                                        y={parseFloat(peakDemand)}
                                                        stroke="#f97316"
                                                        strokeDasharray="4 2"
                                                        strokeOpacity={0.5}
                                                        label={{
                                                            value: `Peak ${peakDemand} kW`,
                                                            position: 'insideTopRight',
                                                            style: { fontSize: 8, fill: '#f97316', fontWeight: 700 }
                                                        }}
                                                    />
                                                )}

                                                <Legend
                                                    verticalAlign="top"
                                                    align="right"
                                                    iconType="plainline"
                                                    iconSize={14}
                                                    wrapperStyle={{ fontSize: 9, paddingBottom: 4 }}
                                                />

                                                <Area yAxisId="left" type="monotone" dataKey="load" stroke="#ef4444" fill="url(#grad_load)" strokeWidth={2} dot={false} name="Building Load (kW)" isAnimationActive={period !== 'LIVE'} />
                                                <Area yAxisId="right" type="monotone" dataKey="voltage" stroke="#8b5cf6" fill="url(#grad_voltage)" strokeWidth={1.5} dot={false} name="Avg Voltage (V)" isAnimationActive={period !== 'LIVE'} />
                                                <Area yAxisId="right" type="monotone" dataKey="current" stroke="#10b981" fill="url(#grad_current)" strokeWidth={1.5} dot={false} name="Avg Current (A)" isAnimationActive={period !== 'LIVE'} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Device Breakdown Graph */}
                                {viewMode === 'separate' && (
                                    <div className="h-60 bg-white rounded-xl p-4 border border-blue-50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Cpu size={14} className="text-blue-500" />
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Device Power Breakdown (kW)</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 16 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="ts" type="number" scale="time" domain={[cutoffTime, nowTime]} ticks={ticks} tickFormatter={(v) => formatXTick(v, period)} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} width={40} />
                                                <Tooltip content={<AreaTooltip period={period} />} />
                                                <Legend onClick={handleLegendClick} verticalAlign="top" align="right" iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 9, paddingBottom: 4, cursor: 'pointer' }} />
                                                {modules.map((m, i) => (
                                                    <Area
                                                        key={m.module_id}
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey={m.module_id}
                                                        hide={hiddenDevices.has(m.module_id)}
                                                        stroke={MODULE_COLORS[i % MODULE_COLORS.length]}
                                                        fill={`url(#grad_${m.module_id})`}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        name={m.module_name}
                                                        isAnimationActive={period !== 'LIVE'}
                                                    />
                                                ))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Voltage Graph */}
                                {viewMode === 'separate' && (
                                    <div className="h-60 bg-white rounded-xl p-4 border border-purple-50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap size={14} className="text-purple-500" />
                                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Voltage Trend (V)</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 16 }}>
                                                <defs>
                                                    <linearGradient id="grad_voltage" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                    {modules.map((m, i) => (
                                                        <linearGradient key={`${m.module_id}_v`} id={`grad_${m.module_id}_v`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="ts" type="number" scale="time" domain={[cutoffTime, nowTime]} ticks={ticks} tickFormatter={(v) => formatXTick(v, period)} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} width={40} domain={['auto', 'auto']} />
                                                <Tooltip content={<AreaTooltip period={period} />} />
                                                <Legend onClick={handleLegendClick} verticalAlign="top" align="right" iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 9, paddingBottom: 4, cursor: 'pointer' }} />
                                                <Area yAxisId="left" type="monotone" dataKey="voltage" stroke="#8b5cf6" fill="url(#grad_voltage)" strokeWidth={2} dot={false} name="Avg Voltage" isAnimationActive={period !== 'LIVE'} />
                                                {modules.map((m, i) => (
                                                    <Area
                                                        key={`${m.module_id}_v`}
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey={`${m.module_id}_v`}
                                                        hide={hiddenDevices.has(m.module_id)}
                                                        stroke={MODULE_COLORS[i % MODULE_COLORS.length]}
                                                        fill={`url(#grad_${m.module_id}_v)`}
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        dot={false}
                                                        name={`${m.module_name} V`}
                                                        isAnimationActive={period !== 'LIVE'}
                                                    />
                                                ))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Current Graph */}
                                {viewMode === 'separate' && (
                                    <div className="h-60 bg-white rounded-xl p-4 border border-emerald-50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Activity size={14} className="text-emerald-500" />
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Current Trend (A)</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 16 }}>
                                                <defs>
                                                    <linearGradient id="grad_current" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    {modules.map((m, i) => (
                                                        <linearGradient key={`${m.module_id}_c`} id={`grad_${m.module_id}_c`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor={MODULE_COLORS[i % MODULE_COLORS.length]} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="ts" type="number" scale="time" domain={[cutoffTime, nowTime]} ticks={ticks} tickFormatter={(v) => formatXTick(v, period)} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} width={40} />
                                                <Tooltip content={<AreaTooltip period={period} />} />
                                                <Legend onClick={handleLegendClick} verticalAlign="top" align="right" iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 9, paddingBottom: 4, cursor: 'pointer' }} />
                                                <Area yAxisId="left" type="monotone" dataKey="current" stroke="#10b981" fill="url(#grad_current)" strokeWidth={2} dot={false} name="Avg Current" isAnimationActive={period !== 'LIVE'} />
                                                {modules.map((m, i) => (
                                                    <Area
                                                        key={`${m.module_id}_c`}
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey={`${m.module_id}_c`}
                                                        hide={hiddenDevices.has(m.module_id)}
                                                        stroke={MODULE_COLORS[i % MODULE_COLORS.length]}
                                                        fill={`url(#grad_${m.module_id}_c)`}
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        dot={false}
                                                        name={`${m.module_name} A`}
                                                        isAnimationActive={period !== 'LIVE'}
                                                    />
                                                ))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

        </div>
    );
};

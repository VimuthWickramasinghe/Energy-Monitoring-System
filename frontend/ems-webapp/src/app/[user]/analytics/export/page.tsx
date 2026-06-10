"use client";

import React, { useContext, useState, useEffect } from "react";
import Header from "@/components/Header";
import { DeviceBuildingContext } from "@/lib/DeviceBuildingContext";

export default function ExportPage() {
    const { buildings, modules, fetchBuildings, fetchModules } = useContext(DeviceBuildingContext) || { buildings: [], modules: [], fetchBuildings: async () => {}, fetchModules: async () => {} };
    
    const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
    const [selectedModule, setSelectedModule] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [format, setFormat] = useState<"csv" | "pdf">("csv");
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchBuildings();
        fetchModules();
    }, []);

    const filteredModules = selectedBuilding === "all" 
        ? modules 
        : modules.filter(m => m.building_id === selectedBuilding);

    const handleDownload = async () => {
        if (!startDate || !endDate) {
            alert("Please select a date range.");
            return;
        }

        setIsDownloading(true);
        try {
            // Mock fetching data and processing file download
            console.log("Fetching data for:", {
                building: selectedBuilding,
                module: selectedModule,
                startDate,
                endDate,
                format
            });
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const dummyData = `Report from ${startDate} to ${endDate}\nBuilding: ${selectedBuilding}\nDevice: ${selectedModule}\nStatus: Mock Data successfully generated in ${format.toUpperCase()} format.`;
            
            // Create a Blob and trigger download
            const blob = new Blob([dummyData], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `EMS_Export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <Header 
                title="Data Export" 
                subtitle="Download your telemetry and analytics data"
            />
            
            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Export Configuration</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Building Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Building</label>
                            <select 
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={selectedBuilding}
                                onChange={(e) => {
                                    setSelectedBuilding(e.target.value);
                                    setSelectedModule("all");
                                }}
                            >
                                <option value="all">All Buildings</option>
                                {buildings.map(b => (
                                    <option key={b.building_id} value={b.building_id}>
                                        {b.building_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Device Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Device</label>
                            <select 
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                            >
                                <option value="all">All Devices</option>
                                {filteredModules.map(m => (
                                    <option key={m.module_id} value={m.module_id}>
                                        {m.module_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
                            <input 
                                type="date" 
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                            <input 
                                type="date" 
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        
                        {/* Format Selection */}
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Export Format</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="format" 
                                        value="csv" 
                                        checked={format === "csv"}
                                        onChange={() => setFormat("csv")}
                                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-gray-900">CSV Spreadsheet</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="format" 
                                        value="pdf" 
                                        checked={format === "pdf"}
                                        onChange={() => setFormat("pdf")}
                                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-gray-900">PDF Document</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all flex items-center gap-2
                                ${isDownloading 
                                    ? 'bg-blue-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm hover:shadow-blue-500/25'
                                }`}
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Download {format.toUpperCase()}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";
import React from 'react';
import { useBuilding } from '@/lib/DeviceBuildingContext';
import { useNotification } from '@/lib/NotificationContext';
import Header from '@/components/Header';
import { Loader2, Plus } from 'lucide-react';

export default function RegisterTestPage() {
  const { registerModule, loading } = useBuilding();

  const handleTestRegister = async () => {
    try {
      // Hardcoded test values
      const testName = "esp-ems-002" ;
      const testBuildingId = "0ebf0a65-ad07-4ba5-adf6-2b867703cac5";
      const testPhase = 1;

      await registerModule(testName, testBuildingId, testPhase);
      alert("Module registered successfully!");
    } catch (error: any) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-white">
      <Header title="Test Tools" subtitle="Internal testing for module registration" />
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Register Module Test</h2>
          <p className="text-gray-500 text-sm mb-8">
            Clicking the button below will trigger the <code>registerModule</code> function from the context with test parameters.
          </p>
          <button
            onClick={handleTestRegister}
            className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            <Plus size={20} />
            Test registerModule()
          </button>
        </div>
      </div>
    </main>
  );
}

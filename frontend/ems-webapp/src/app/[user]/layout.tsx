import React from "react";
import type { Metadata } from "next";
import UserNav from "@/components/UserNav";
import DeviceBuildingProvider from "@/lib/DeviceBuildingContext";
import { DeviceDataProvider } from "@/lib/DeviceDataContext";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <DeviceBuildingProvider>
                <DeviceDataProvider>
                    <UserNav />
                    {children}
                </DeviceDataProvider>
            </DeviceBuildingProvider>
        </div>
    );
}

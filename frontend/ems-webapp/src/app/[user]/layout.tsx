import React from "react";
import UserNav from "@/components/UserNav";
import DeviceBuildingProvider from "@/lib/DeviceBuldingContext";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <DeviceBuildingProvider>
                <UserNav />
                {children}
            </DeviceBuildingProvider>
        </div>
    );
}
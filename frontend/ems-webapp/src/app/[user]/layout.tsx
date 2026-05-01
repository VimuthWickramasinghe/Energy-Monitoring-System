import React from "react";
import UserNav from "@/components/UserNav";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <UserNav />
                    {children}
        </div>
    );
}
"use client"
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Notification {
    id: number;
    message: string;
    type: "info" | "success" | "error";
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type?: "info" | "success" | "error", duration?: number) => void;
    removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: number) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const addNotification = useCallback((message: string, type: "info" | "success" | "error" = "info", duration = 5000) => {
        const id = Date.now();
        const newNotification: Notification = { id, message, type };

        setNotifications((prev) => [...prev, newNotification]);

        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            {/* Simple Notification Overlay */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 rounded shadow-lg text-white min-w-[250px] flex justify-between items-center transition-all duration-300 ${
                            notification.type === "error" ? "bg-red-500" : 
                            notification.type === "success" ? "bg-green-500" : "bg-blue-500"
                        }`}
                    >
                        <span>{notification.message}</span>
                        <button 
                            onClick={() => removeNotification(notification.id)}
                            className="ml-4 font-bold hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        // Return a fallback to prevent crashes during initialization or when used outside provider
        return {
            notifications: [],
            addNotification: () => {},
            removeNotification: () => {}
        };
    }
    return context;
};

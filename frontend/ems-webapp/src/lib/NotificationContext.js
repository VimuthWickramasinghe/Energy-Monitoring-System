"use client"
import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = "info", duration = 5000) => {
        const id = Date.now();
        const newNotification = { id, message, type };

        setNotifications((prev) => [...prev, newNotification]);

        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

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
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};

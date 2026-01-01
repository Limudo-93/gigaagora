"use client";

import * as React from "react";
import { NotificationCard } from "./notification-card";
import { createContext, useContext } from "react";

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const showNotification = React.useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { ...notification, id }]);
    },
    [],
  );

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationCardProps {
  type: NotificationType;
  title: string;
  message?: string;
  onClose?: () => void;
  duration?: number; // em milissegundos, 0 = não fecha automaticamente
  className?: string;
}

const notificationConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    iconColor: "text-green-600 dark:text-green-400",
    textColor: "text-green-900 dark:text-green-100",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    iconColor: "text-red-600 dark:text-red-400",
    textColor: "text-red-900 dark:text-red-100",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    textColor: "text-blue-900 dark:text-blue-100",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    textColor: "text-yellow-900 dark:text-yellow-100",
  },
};

export function NotificationCard({
  type,
  title,
  message,
  onClose,
  duration = 5000,
  className,
}: NotificationCardProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const Icon = notificationConfig[type].icon;
  const config = notificationConfig[type];

  React.useEffect(() => {
    if (duration > 0 && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        "border-2 shadow-lg",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-semibold text-sm mb-1", config.textColor)}>
              {title}
            </h4>
            {message && (
              <p className={cn("text-sm", config.textColor, "opacity-80")}>
                {message}
              </p>
            )}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


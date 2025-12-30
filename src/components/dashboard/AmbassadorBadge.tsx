"use client";

import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AmbassadorBadge({ 
  size = "sm",
  showText = true 
}: { 
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  };

  const textSizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white border-2 border-white shadow-lg ${textSizes[size]} font-bold flex items-center gap-1`}
      style={{
        boxShadow: "0 2px 8px rgba(251, 191, 36, 0.4)",
      }}
    >
      <Crown className={sizeClasses[size]} fill="currentColor" />
      {showText && <span>Embaixador</span>}
    </Badge>
  );
}


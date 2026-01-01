"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Star, Shield, TrendingUp } from "lucide-react";

type BadgeType = "verified" | "active" | "top_rated" | "reliable" | "popular";

interface BadgeDisplayProps {
  badges: Array<{
    badge_type: BadgeType;
    earned_at: string;
    expires_at?: string | null;
  }>;
  size?: "sm" | "md" | "lg";
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  verified: {
    label: "Verificado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-blue-500 text-white",
  },
  active: {
    label: "Ativo",
    icon: <Zap className="h-3 w-3" />,
    color: "bg-green-500 text-white",
  },
  top_rated: {
    label: "Top Avaliado",
    icon: <Star className="h-3 w-3" />,
    color: "bg-yellow-500 text-white",
  },
  reliable: {
    label: "Confiável",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-purple-500 text-white",
  },
  popular: {
    label: "Popular",
    icon: <TrendingUp className="h-3 w-3" />,
    color: "bg-orange-500 text-white",
  },
};

export default function BadgeDisplay({
  badges,
  size = "md",
}: BadgeDisplayProps) {
  const activeBadges = badges.filter(
    (badge) => !badge.expires_at || new Date(badge.expires_at) > new Date(),
  );

  if (activeBadges.length === 0) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {activeBadges.map((badge, idx) => {
        const config = BADGE_CONFIG[badge.badge_type];
        if (!config) return null;

        return (
          <Badge
            key={idx}
            className={`${config.color} ${sizeClasses[size]} flex items-center gap-1`}
            title={`Badge: ${config.label}`}
          >
            {config.icon}
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}

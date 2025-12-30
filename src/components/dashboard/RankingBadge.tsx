"use client";

import { Badge } from "@/components/ui/badge";
import { Medal, Trophy, Gem } from "lucide-react";

type RankingTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface RankingBadgeProps {
  tier: RankingTier;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const TIER_CONFIG: Record<RankingTier, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    icon: <Medal className="h-4 w-4" />
  },
  silver: {
    label: 'Prata',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: <Medal className="h-4 w-4" />
  },
  gold: {
    label: 'Ouro',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: <Trophy className="h-4 w-4" />
  },
  platinum: {
    label: 'Platina',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    icon: <Gem className="h-4 w-4" />
  },
};

const SIZE_CONFIG = {
  sm: {
    icon: "h-3 w-3",
    text: "text-[10px] px-1.5 py-0.5",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-xs px-2 py-1",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-sm px-2.5 py-1",
  },
};

export default function RankingBadge({ tier, size = "sm", showText = true }: RankingBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <Badge 
      className={`${config.bgColor} ${config.color} ${config.borderColor} border-2 ${sizeConfig.text} font-bold flex items-center gap-1 shadow-sm`}
    >
      <div className={sizeConfig.icon}>
        {config.icon}
      </div>
      {showText && <span>{config.label}</span>}
    </Badge>
  );
}


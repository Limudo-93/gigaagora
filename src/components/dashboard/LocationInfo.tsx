"use client";

import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LocationInfoProps {
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  municipality?: string | null;
  distanceKm?: number | null;
  estimatedTravelTimeMinutes?: number | null;
  showDistance?: boolean;
}

export default function LocationInfo({
  city,
  state,
  neighborhood,
  municipality,
  distanceKm,
  estimatedTravelTimeMinutes,
  showDistance = true,
}: LocationInfoProps) {
  const locationParts = [neighborhood, municipality || city, state].filter(
    Boolean,
  );

  return (
    <div className="space-y-2">
      {/* Localização */}
      {locationParts.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="truncate">{locationParts.join(", ")}</span>
        </div>
      )}

      {/* Distância e Tempo */}
      {showDistance &&
        ((distanceKm !== null && distanceKm !== undefined) ||
          (estimatedTravelTimeMinutes !== null &&
            estimatedTravelTimeMinutes !== undefined)) && (
          <div className="flex items-center gap-3 flex-wrap">
            {distanceKm !== null && distanceKm !== undefined && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {distanceKm.toFixed(1)} km
              </Badge>
            )}
            {estimatedTravelTimeMinutes !== null &&
              estimatedTravelTimeMinutes !== undefined && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />~
                  {estimatedTravelTimeMinutes} min
                </Badge>
              )}
          </div>
        )}
    </div>
  );
}

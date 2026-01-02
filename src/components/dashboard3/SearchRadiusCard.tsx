"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

export default function SearchRadiusCard({ userId }: { userId: string }) {
  const [searchRadius, setSearchRadius] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchRadius > 50) {
      setSearchRadius(50);
    }
  }, [searchRadius]);

  useEffect(() => {
    const loadRadius = async () => {
      try {
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("strengths_counts")
          .eq("user_id", userId)
          .single();

        if (musicianProfile?.strengths_counts) {
          const metadata = musicianProfile.strengths_counts as any;
          if (metadata.searchRadius) {
            const loadedRadius = Math.min(Number(metadata.searchRadius), 50);
            setSearchRadius(loadedRadius);
          }
        }
      } catch (error) {
        console.error("Error loading search radius:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRadius();
  }, [userId]);

  const handleRadiusChange = async (newRadius: number) => {
    const finalRadius = Math.min(newRadius, 50);
    setSearchRadius(finalRadius);
    setSaving(true);

    try {
      const { data: musicianProfile } = await supabase
        .from("musician_profiles")
        .select("strengths_counts")
        .eq("user_id", userId)
        .single();

      const currentMetadata = (musicianProfile?.strengths_counts as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        searchRadius: finalRadius,
      };

      await supabase
        .from("musician_profiles")
        .update({
          strengths_counts: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error saving search radius:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 bg-gradient-to-br from-background to-muted/20 backdrop-blur-xl shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Raio de Busca</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">0 km</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {searchRadius} km
                </span>
                {saving && (
                  <span className="text-xs text-muted-foreground">
                    Salvando...
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">50 km</span>
            </div>

            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(searchRadius / 50) * 100}%, hsl(var(--muted)) ${(searchRadius / 50) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />

            <p className="text-xs text-muted-foreground">
              Você receberá convites para trabalhos dentro de{" "}
              <strong className="text-foreground">{searchRadius} km</strong> da
              sua localização
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

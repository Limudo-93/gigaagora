"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

export default function SearchRadiusSlider() {
  const [searchRadius, setSearchRadius] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar raio salvo
  useEffect(() => {
    const loadRadius = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar perfil de músico
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("strengths_counts")
          .eq("user_id", user.id)
          .single();

        if (musicianProfile?.strengths_counts) {
          const metadata = musicianProfile.strengths_counts as any;
          if (metadata.searchRadius) {
            setSearchRadius(metadata.searchRadius);
          }
        }
      } catch (error) {
        console.error("Error loading search radius:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRadius();
  }, []);

  // Salvar raio quando mudar
  const handleRadiusChange = async (newRadius: number) => {
    setSearchRadius(newRadius);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil atual
      const { data: musicianProfile } = await supabase
        .from("musician_profiles")
        .select("strengths_counts")
        .eq("user_id", user.id)
        .single();

      const currentMetadata = (musicianProfile?.strengths_counts as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        searchRadius: newRadius,
      };

      // Atualizar no banco
      await supabase
        .from("musician_profiles")
        .update({
          strengths_counts: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving search radius:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="border-white/20 backdrop-blur-xl bg-white/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          Raio de Busca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">0 km</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-orange-600">
                {searchRadius} km
              </span>
              {saving && (
                <span className="text-xs text-gray-500">Salvando...</span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">200 km</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={searchRadius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:border-none"
            style={{
              background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${(searchRadius / 200) * 100}%, rgb(229 231 235) ${(searchRadius / 200) * 100}%, rgb(229 231 235) 100%)`
            }}
          />
          <p className="text-xs text-gray-600">
            Você receberá convites para trabalhos dentro de <strong className="text-orange-600">{searchRadius} km</strong> da sua localização
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


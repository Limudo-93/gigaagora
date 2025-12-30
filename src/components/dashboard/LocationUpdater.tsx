"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { updateUserLocation } from "@/app/actions/location";

/**
 * Componente que atualiza a localização do usuário após login
 * Roda apenas no cliente e solicita permissão de geolocalização
 */
export default function LocationUpdater() {
  const hasUpdatedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    const updateLocation = async () => {
      // Evitar múltiplas chamadas simultâneas
      if (isUpdatingRef.current || hasUpdatedRef.current) {
        return;
      }

      // Verificar se o navegador suporta geolocalização
      if (!navigator.geolocation) {
        console.log("Geolocalização não suportada");
        return;
      }

      // Verificar se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return;
      }

      // Verificar se já atualizou recentemente (últimas 24 horas)
      try {
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("latitude, longitude, updated_at")
          .eq("user_id", user.id)
          .single();

        // Se já tem localização e foi atualizada recentemente (últimas 24 horas), não atualiza
        if (musicianProfile?.updated_at) {
          const lastUpdate = new Date(musicianProfile.updated_at);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          // Se foi atualizado há menos de 24 horas, não atualiza novamente (evita atualizações muito frequentes)
          if (hoursSinceUpdate < 24 && musicianProfile.latitude && musicianProfile.longitude) {
            console.log("Localização atualizada recentemente, pulando atualização");
            hasUpdatedRef.current = true;
            return;
          }
        }
      } catch (err) {
        console.error("Error checking existing location:", err);
      }

      isUpdatingRef.current = true;

      // Solicitar localização
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Atualizar via server action
            const result = await updateUserLocation(lat, lng);

            if (result.success) {
              console.log("Localização atualizada com sucesso");
              hasUpdatedRef.current = true;
            } else {
              console.error("Erro ao atualizar localização:", result.error);
            }
          } catch (error: any) {
            console.error("Error updating location:", error);
          } finally {
            isUpdatingRef.current = false;
          }
        },
        (error) => {
          // Erro ao obter localização (usuário negou, timeout, etc)
          console.log("Erro ao obter localização:", error.message);
          isUpdatingRef.current = false;
          // Não marca como atualizado, permite tentar novamente na próxima vez
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Sempre obter localização atual
        }
      );
    };

    // Pequeno delay para garantir que o componente está montado
    const timeoutId = setTimeout(() => {
      updateLocation();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Este componente não renderiza nada
  return null;
}


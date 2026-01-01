"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server action para atualizar a localização do usuário
 */
export async function updateUserLocation(latitude: number, longitude: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Usuário não autenticado",
    };
  }

  try {
    // Atualizar localização no perfil do músico
    const { error: updateError } = await supabase
      .from("musician_profiles")
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating location:", updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    // Opcional: também atualizar no perfil básico (profiles) se houver campos lá
    // Mas por enquanto vamos focar no musician_profiles

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Exception updating location:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido",
    };
  }
}

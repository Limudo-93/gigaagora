"use server";

import { createClient } from "@/lib/supabase/server";
import { computeRegionLabel } from "@/lib/geo";
import { reverseGeocode } from "@/app/actions/geocoding";

/**
 * Server action para criar uma gig com cálculo automático de region_label
 */
export async function createGigWithRegion(data: {
  contractor_id: string;
  title: string;
  description?: string | null;
  location_name?: string | null;
  address_text?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  start_time: string;
  end_time: string;
  show_minutes: number;
  break_minutes: number;
  status: string;
  created_by_musician: boolean;
  privacy_level?: "approx";
}) {
  const supabase = await createClient();

  // Buscar localização do contratante se não foi fornecida
  let finalLatitude = data.latitude;
  let finalLongitude = data.longitude;
  let finalCity = data.city;
  let finalState = data.state;
  let finalRegionLabel: string | null = null;

  // Se temos coordenadas mas não temos cidade/estado, fazer reverse geocoding
  if ((finalLatitude && finalLongitude) && (!finalCity || !finalState)) {
    try {
      const geocodeResult = await reverseGeocode(finalLatitude, finalLongitude);
      
      if (!geocodeResult.error) {
        // Usar dados do geocoding se não foram fornecidos
        if (!finalCity && geocodeResult.city) {
          finalCity = geocodeResult.city;
        }
        if (!finalState && geocodeResult.state) {
          finalState = geocodeResult.state;
        }
        // Usar region_label do geocoding se disponível
        if (geocodeResult.region_label) {
          finalRegionLabel = geocodeResult.region_label;
        }
      }
    } catch (error) {
      console.error("Erro ao fazer reverse geocoding:", error);
      // Continua sem reverse geocoding se der erro
    }
  }

  // Se ainda não temos localização, buscar do perfil do contratante
  if (!finalLatitude || !finalLongitude || !finalCity || !finalState) {
    const { data: contractorProfile } = await supabase
      .from("profiles")
      .select("last_known_latitude, last_known_longitude, last_known_city, last_known_state")
      .eq("user_id", data.contractor_id)
      .single();

    if (contractorProfile) {
      // Copiar localização do contratante se não foi fornecida
      if (!finalLatitude && contractorProfile.last_known_latitude) {
        finalLatitude = contractorProfile.last_known_latitude;
      }
      if (!finalLongitude && contractorProfile.last_known_longitude) {
        finalLongitude = contractorProfile.last_known_longitude;
      }
      if (!finalCity && contractorProfile.last_known_city) {
        finalCity = contractorProfile.last_known_city;
      }
      if (!finalState && contractorProfile.last_known_state) {
        finalState = contractorProfile.last_known_state;
      }
    }
  }

  // Calcular region_label (usar o do geocoding se disponível, senão calcular)
  const regionLabel = finalRegionLabel || computeRegionLabel(
    finalState,
    finalCity,
    finalLatitude ?? undefined,
    finalLongitude ?? undefined
  );

  // Inserir a gig
  const { data: gigData, error: gigError } = await supabase
    .from("gigs")
    .insert({
      contractor_id: data.contractor_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      location_name: data.location_name?.trim() || null,
      address_text: data.address_text?.trim() || null,
      city: finalCity?.trim() || null,
      state: finalState?.trim() || null,
      latitude: finalLatitude,
      longitude: finalLongitude,
      timezone: data.timezone,
      start_time: data.start_time,
      end_time: data.end_time,
      show_minutes: data.show_minutes,
      break_minutes: data.break_minutes,
      status: data.status,
      created_by_musician: data.created_by_musician,
      privacy_level: data.privacy_level || "approx",
      region_label: regionLabel, // Será recalculado pelo trigger, mas definimos aqui também
    })
    .select()
    .single();

  if (gigError) {
    console.error("Error creating gig:", gigError);
    return { data: null, error: gigError };
  }

  return { data: gigData, error: null };
}

/**
 * Server action para atualizar uma gig com recálculo automático de region_label
 */
export async function updateGigWithRegion(
  gigId: string,
  data: {
    title?: string;
    description?: string | null;
    location_name?: string | null;
    address_text?: string | null;
    city?: string | null;
    state?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string;
    start_time?: string;
    end_time?: string;
    show_minutes?: number;
    break_minutes?: number;
    status?: string;
    privacy_level?: "approx";
  }
) {
  const supabase = await createClient();

  // Buscar gig atual para obter valores existentes
  const { data: currentGig } = await supabase
    .from("gigs")
    .select("city, state, latitude, longitude")
    .eq("id", gigId)
    .single();

  // Usar valores fornecidos ou manter os existentes
  let finalCity = data.city !== undefined ? data.city : currentGig?.city;
  let finalState = data.state !== undefined ? data.state : currentGig?.state;
  let finalLatitude =
    data.latitude !== undefined ? data.latitude : currentGig?.latitude;
  let finalLongitude =
    data.longitude !== undefined ? data.longitude : currentGig?.longitude;
  let finalRegionLabel: string | null = null;

  // Se temos coordenadas mas não temos cidade/estado (ou coordenadas mudaram), fazer reverse geocoding
  const coordsChanged = 
    (data.latitude !== undefined && data.latitude !== currentGig?.latitude) ||
    (data.longitude !== undefined && data.longitude !== currentGig?.longitude);

  if ((finalLatitude && finalLongitude) && ((!finalCity || !finalState) || coordsChanged)) {
    try {
      const geocodeResult = await reverseGeocode(finalLatitude, finalLongitude);
      
      if (!geocodeResult.error) {
        // Usar dados do geocoding se não foram fornecidos ou se coordenadas mudaram
        if ((!finalCity || coordsChanged) && geocodeResult.city) {
          finalCity = geocodeResult.city;
        }
        if ((!finalState || coordsChanged) && geocodeResult.state) {
          finalState = geocodeResult.state;
        }
        // Usar region_label do geocoding se disponível
        if (geocodeResult.region_label) {
          finalRegionLabel = geocodeResult.region_label;
        }
      }
    } catch (error) {
      console.error("Erro ao fazer reverse geocoding:", error);
      // Continua sem reverse geocoding se der erro
    }
  }

  // Recalcular region_label se location mudou (usar o do geocoding se disponível, senão calcular)
  const regionLabel = finalRegionLabel || computeRegionLabel(
    finalState,
    finalCity,
    finalLatitude ?? undefined,
    finalLongitude ?? undefined
  );

  // Preparar dados de atualização
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined)
    updateData.description = data.description?.trim() || null;
  if (data.location_name !== undefined)
    updateData.location_name = data.location_name?.trim() || null;
  if (data.address_text !== undefined)
    updateData.address_text = data.address_text?.trim() || null;
  if (data.city !== undefined || coordsChanged) updateData.city = finalCity?.trim() || null;
  if (data.state !== undefined || coordsChanged) updateData.state = finalState?.trim() || null;
  if (data.latitude !== undefined) updateData.latitude = finalLatitude;
  if (data.longitude !== undefined) updateData.longitude = finalLongitude;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.start_time !== undefined) updateData.start_time = data.start_time;
  if (data.end_time !== undefined) updateData.end_time = data.end_time;
  if (data.show_minutes !== undefined) updateData.show_minutes = data.show_minutes;
  if (data.break_minutes !== undefined) updateData.break_minutes = data.break_minutes;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.privacy_level !== undefined) updateData.privacy_level = data.privacy_level;

  // Sempre atualizar region_label (o trigger também fará isso, mas garantimos aqui)
  updateData.region_label = regionLabel;

  // Atualizar a gig
  const { data: gigData, error: gigError } = await supabase
    .from("gigs")
    .update(updateData)
    .eq("id", gigId)
    .select()
    .single();

  if (gigError) {
    console.error("Error updating gig:", gigError);
    return { data: null, error: gigError };
  }

  return { data: gigData, error: null };
}


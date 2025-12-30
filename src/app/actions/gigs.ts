"use server";

import { createClient } from "@/lib/supabase/server";
import { computeRegionLabel } from "@/lib/geo";

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

  // Calcular region_label
  const regionLabel = computeRegionLabel(
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
  const finalCity = data.city !== undefined ? data.city : currentGig?.city;
  const finalState = data.state !== undefined ? data.state : currentGig?.state;
  const finalLatitude =
    data.latitude !== undefined ? data.latitude : currentGig?.latitude;
  const finalLongitude =
    data.longitude !== undefined ? data.longitude : currentGig?.longitude;

  // Recalcular region_label se location mudou
  const regionLabel = computeRegionLabel(
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
  if (data.city !== undefined) updateData.city = finalCity?.trim() || null;
  if (data.state !== undefined) updateData.state = finalState?.trim() || null;
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


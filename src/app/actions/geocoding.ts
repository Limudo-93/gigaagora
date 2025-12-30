"use server";

/**
 * Server action para fazer reverse geocoding usando Google Maps Geocoding API
 * Converte coordenadas (latitude, longitude) em endereço e região
 */

interface GeocodingResult {
  city: string | null;
  state: string | null;
  region_label: string | null;
  formatted_address: string | null;
  error?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY não configurada. Usando fallback.");
    return {
      city: null,
      state: null,
      region_label: null,
      formatted_address: null,
      error: "API key não configurada",
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR&region=br`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn("Geocoding API retornou:", data.status);
      return {
        city: null,
        state: null,
        region_label: null,
        formatted_address: null,
        error: `Status: ${data.status}`,
      };
    }

    const result = data.results[0];
    const formattedAddress = result.formatted_address;

    // Extrair componentes do endereço
    let city: string | null = null;
    let state: string | null = null;
    let neighborhood: string | null = null;
    let sublocality: string | null = null;
    let administrativeAreaLevel2: string | null = null; // Município
    let administrativeAreaLevel1: string | null = null; // Estado

    for (const component of result.address_components) {
      const types = component.types;

      if (types.includes("administrative_area_level_2")) {
        administrativeAreaLevel2 = component.long_name;
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        administrativeAreaLevel1 = component.short_name; // UF (SP, RJ, etc)
        state = component.short_name;
      }
      if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
        sublocality = component.long_name;
      }
      if (types.includes("neighborhood")) {
        neighborhood = component.long_name;
      }
      // Fallback: usar locality se não tiver administrative_area_level_2
      if (!city && types.includes("locality")) {
        city = component.long_name;
      }
    }

    // Calcular região aproximada (usar lógica similar a computeRegionLabel)
    const regionLabel = computeRegionLabelFromCoords(
      latitude,
      longitude,
      city,
      state
    );

    return {
      city: city || administrativeAreaLevel2 || null,
      state: state || administrativeAreaLevel1 || null,
      region_label: regionLabel,
      formatted_address: formattedAddress,
    };
  } catch (error: any) {
    console.error("Erro ao fazer reverse geocoding:", error);
    return {
      city: null,
      state: null,
      region_label: null,
      formatted_address: null,
      error: error.message || "Erro desconhecido",
    };
  }
}

/**
 * Calcula o rótulo da região baseado em coordenadas
 * Replica a lógica de computeRegionLabel mas focada em coordenadas
 */
function computeRegionLabelFromCoords(
  lat: number,
  lng: number,
  city: string | null,
  state: string | null
): string {
  const cityNormalized = (city || "").trim().toUpperCase();
  const stateNormalized = (state || "").trim().toUpperCase();

  // São Paulo Capital
  if (
    stateNormalized === "SP" &&
    (cityNormalized.includes("SÃO PAULO") ||
      cityNormalized.includes("SAO PAULO") ||
      cityNormalized === "SP" ||
      (lat > -24 && lat < -23.3 && lng > -47 && lng < -46.2))
  ) {
    if (lat > -23.5 && lng < -46.6) {
      return "São Paulo — Zona Norte";
    } else if (lat < -23.6 && lng > -46.7) {
      return "São Paulo — Zona Sul";
    } else if (lat > -23.5 && lng > -46.5) {
      return "São Paulo — Zona Leste";
    } else if (lat < -23.5 && lng < -46.7) {
      return "São Paulo — Zona Oeste";
    } else {
      return "São Paulo — Centro";
    }
  }

  // Rio de Janeiro Capital
  if (
    stateNormalized === "RJ" &&
    (cityNormalized.includes("RIO DE JANEIRO") ||
      cityNormalized.includes("RIO") ||
      cityNormalized === "RJ" ||
      (lat > -23.1 && lat < -22.7 && lng > -43.8 && lng < -43.1))
  ) {
    if (lat > -22.9) {
      return "Rio de Janeiro — Zona Norte";
    } else if (lat < -23.0 && lng > -43.2) {
      return "Rio de Janeiro — Zona Sul";
    } else if (lng < -43.4) {
      return "Rio de Janeiro — Zona Oeste";
    } else {
      return "Rio de Janeiro — Centro";
    }
  }

  // Belo Horizonte
  if (
    stateNormalized === "MG" &&
    (cityNormalized.includes("BELO HORIZONTE") ||
      cityNormalized.includes("BH") ||
      (lat > -20.1 && lat < -19.8 && lng > -44.1 && lng < -43.8))
  ) {
    return "Minas Gerais — Região Metropolitana de BH";
  }

  // Outras capitais/metrópoles podem ser adicionadas aqui

  // Fallback: usar cidade e estado
  if (cityNormalized && stateNormalized) {
    return `${cityNormalized} — ${stateNormalized}`;
  } else if (stateNormalized) {
    return stateNormalized;
  } else {
    return "Localização não especificada";
  }
}


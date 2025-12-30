/**
 * Funções utilitárias para cálculos geográficos
 */

/**
 * Calcula a distância em quilômetros entre dois pontos usando a fórmula de Haversine
 * @param lat1 Latitude do primeiro ponto
 * @param lng1 Longitude do primeiro ponto
 * @param lat2 Latitude do segundo ponto
 * @param lng2 Longitude do segundo ponto
 * @returns Distância em quilômetros
 */
export function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Converte graus para radianos
   */
  function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
  
  /**
   * Estima o tempo de deslocamento em minutos baseado na distância
   * Usa heurística: velocidade média de 30 km/h em áreas urbanas
   * @param distanceKm Distância em quilômetros
   * @returns Tempo estimado em minutos (mínimo 10, máximo 180)
   */
  export function estimateTravelMin(distanceKm: number): number {
    // Velocidade média estimada: 30 km/h
    const avgSpeedKmh = 30;
    const timeHours = distanceKm / avgSpeedKmh;
    const timeMinutes = timeHours * 60;
  
    // Limites: mínimo 10 min, máximo 180 min (3 horas)
    return Math.max(10, Math.min(180, Math.round(timeMinutes)));
  }
  
  /**
   * Calcula o rótulo da região aproximada baseado em estado, cidade e coordenadas
   * Esta função replica a lógica da função SQL compute_region_label
   * @param state Estado (UF)
   * @param city Cidade
   * @param lat Latitude (opcional)
   * @param lng Longitude (opcional)
   * @returns Rótulo da região (ex: "São Paulo — Zona Leste")
   */
  export function computeRegionLabel(
    state: string | null | undefined,
    city: string | null | undefined,
    lat: number | null | undefined,
    lng: number | null | undefined
  ): string {
    const cityNormalized = (city || "").trim().toUpperCase();
    const stateNormalized = (state || "").trim().toUpperCase();
  
    // Se tiver latitude/longitude, tentar determinar zona de capital
    if (lat != null && lng != null) {
      // São Paulo Capital
      if (
        stateNormalized === "SP" &&
        (cityNormalized.includes("SÃO PAULO") ||
          cityNormalized.includes("SAO PAULO") ||
          cityNormalized === "SP")
      ) {
        // Bounding boxes aproximados para zonas de SP
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
          cityNormalized === "RJ")
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
    }
  
    // Se não for capital ou não tiver lat/lng, usar macro-regiões por estado
    // Importar mapeamento de macro-regiões
    const macroRegion = getMacroRegion(stateNormalized, cityNormalized);
    if (macroRegion) {
      return macroRegion;
    }
  
    // Fallback: retornar cidade e estado ou apenas estado
    if (cityNormalized) {
      return `${cityNormalized} — ${stateNormalized}`;
    } else {
      return stateNormalized || "Localização não especificada";
    }
  }
  
  /**
   * Obtém a macro-região baseado em estado e cidade
   * Esta função será expandida com o mapeamento completo de regionMaps.ts
   */
  function getMacroRegion(state: string, city: string): string | null {
    // Minas Gerais
    if (state === "MG") {
      if (
        city.includes("BELO HORIZONTE") ||
        city.includes("BH") ||
        city.includes("CONTAGEM") ||
        city.includes("BETIM") ||
        city.includes("NOVA LIMA") ||
        city.includes("SABARÁ")
      ) {
        return "Minas Gerais — Região Metropolitana de BH";
      } else if (
        city.includes("UBERLÂNDIA") ||
        city.includes("UBERLANDIA") ||
        city.includes("ARAXÁ") ||
        city.includes("ARAXA") ||
        city.includes("FRUTAL") ||
        city.includes("ITUIUTABA")
      ) {
        return "Minas Gerais — Triângulo Mineiro";
      } else if (
        city.includes("VARGINHA") ||
        city.includes("POUSO ALEGRE") ||
        city.includes("ITAJUBÁ") ||
        city.includes("ITAJUBA") ||
        city.includes("SANTA RITA DO SAPUCAÍ") ||
        city.includes("SANTA RITA DO SAPUCAI")
      ) {
        return "Minas Gerais — Sul de Minas";
      } else if (
        city.includes("JUIZ DE FORA") ||
        city.includes("CATAGUASES") ||
        city.includes("LEOPOLDINA") ||
        city.includes("MURIAÉ") ||
        city.includes("MURIAE")
      ) {
        return "Minas Gerais — Zona da Mata";
      } else if (
        city.includes("MONTES CLAROS") ||
        city.includes("JANAÚBA") ||
        city.includes("JANAUBA") ||
        city.includes("SALINAS")
      ) {
        return "Minas Gerais — Norte de Minas";
      }
    }
  
    // Paraná
    if (state === "PR") {
      if (
        city.includes("CURITIBA") ||
        city.includes("SÃO JOSÉ DOS PINHAIS") ||
        city.includes("SAO JOSE DOS PINHAIS") ||
        city.includes("COLOMBO") ||
        city.includes("PINHAIS")
      ) {
        return "Paraná — Região Metropolitana de Curitiba";
      } else if (
        city.includes("LONDRINA") ||
        city.includes("MARINGÁ") ||
        city.includes("MARINGA") ||
        city.includes("APUCARANA") ||
        city.includes("CAMPO MOURÃO") ||
        city.includes("CAMPO MOURAO")
      ) {
        return "Paraná — Norte do Paraná";
      } else if (
        city.includes("CASCAVEL") ||
        city.includes("FOZ DO IGUAÇU") ||
        city.includes("FOZ DO IGUACU") ||
        city.includes("TOLEDO") ||
        city.includes("FRANCISCO BELTRÃO") ||
        city.includes("FRANCISCO BELTRAO")
      ) {
        return "Paraná — Oeste do Paraná";
      } else if (
        city.includes("PARANAGUÁ") ||
        city.includes("PARANAGUA") ||
        city.includes("GUARATUBA") ||
        city.includes("MATINHOS") ||
        city.includes("PONTAL DO PARANÁ") ||
        city.includes("PONTAL DO PARANA")
      ) {
        return "Paraná — Litoral";
      }
    }
  
    // Rio Grande do Sul
    if (state === "RS") {
      if (
        city.includes("PORTO ALEGRE") ||
        city.includes("CANOAS") ||
        city.includes("NOVO HAMBURGO") ||
        city.includes("SÃO LEOPOLDO") ||
        city.includes("SAO LEOPOLDO") ||
        city.includes("GRAVATAÍ") ||
        city.includes("GRAVATAI")
      ) {
        return "Rio Grande do Sul — Região Metropolitana de Porto Alegre";
      } else if (
        city.includes("CAXIAS DO SUL") ||
        city.includes("GRAMADO") ||
        city.includes("CANELA") ||
        city.includes("BENTO GONÇALVES") ||
        city.includes("BENTO GONCALVES") ||
        city.includes("GARIBALDI")
      ) {
        return "Rio Grande do Sul — Serra Gaúcha";
      } else if (
        city.includes("SANTA MARIA") ||
        city.includes("URUGUAIANA") ||
        city.includes("PASSO FUNDO") ||
        city.includes("ERECHIM") ||
        city.includes("BAGÉ") ||
        city.includes("BAGE")
      ) {
        return "Rio Grande do Sul — Norte do RS";
      }
    }
  
    // Bahia
    if (state === "BA") {
      if (
        city.includes("SALVADOR") ||
        city.includes("LAURO DE FREITAS") ||
        city.includes("CAMAÇARI") ||
        city.includes("CAMACARI") ||
        city.includes("SIMÕES FILHO") ||
        city.includes("SIMOES FILHO")
      ) {
        return "Bahia — Salvador / RMS";
      } else if (
        city.includes("FEIRA DE SANTANA") ||
        city.includes("CACHOEIRA") ||
        city.includes("SÃO FÉLIX") ||
        city.includes("SAO FELIX") ||
        city.includes("MARAGOGIPE")
      ) {
        return "Bahia — Recôncavo Baiano";
      } else if (
        city.includes("ILHÉUS") ||
        city.includes("ILHEUS") ||
        city.includes("ITABUNA") ||
        city.includes("PORTO SEGURO") ||
        city.includes("EUNÁPOLIS") ||
        city.includes("EUNAPOLIS")
      ) {
        return "Bahia — Sul da Bahia";
      } else if (
        city.includes("BARREIRAS") ||
        city.includes("LUÍS EDUARDO MAGALHÃES") ||
        city.includes("LUIS EDUARDO MAGALHAES") ||
        city.includes("BOM JESUS DA LAPA")
      ) {
        return "Bahia — Oeste da Bahia";
      }
    }
  
    return null;
  }
  
  
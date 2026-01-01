/**
 * Mapeamentos de regiões geográficas para cálculo automático de região aproximada
 */

/**
 * Bounding boxes para zonas da capital de São Paulo
 * Formato: { minLat, maxLat, minLng, maxLng }
 */
export const SP_CAPITAL_ZONES_BBOX = {
  zonaNorte: {
    minLat: -23.4,
    maxLat: -23.3,
    minLng: -46.8,
    maxLng: -46.5,
  },
  zonaSul: {
    minLat: -23.7,
    maxLat: -23.5,
    minLng: -46.8,
    maxLng: -46.6,
  },
  zonaLeste: {
    minLat: -23.5,
    maxLat: -23.4,
    minLng: -46.4,
    maxLng: -46.2,
  },
  zonaOeste: {
    minLat: -23.6,
    maxLat: -23.4,
    minLng: -46.8,
    maxLng: -46.6,
  },
  centro: {
    minLat: -23.6,
    maxLat: -23.5,
    minLng: -46.7,
    maxLng: -46.6,
  },
};

/**
 * Bounding boxes para zonas da capital do Rio de Janeiro
 */
export const RJ_CAPITAL_ZONES_BBOX = {
  zonaNorte: {
    minLat: -22.8,
    maxLat: -22.9,
    minLng: -43.3,
    maxLng: -43.1,
  },
  zonaSul: {
    minLat: -23.1,
    maxLat: -22.9,
    minLng: -43.3,
    maxLng: -43.1,
  },
  zonaOeste: {
    minLat: -23.0,
    maxLat: -22.9,
    minLng: -43.5,
    maxLng: -43.3,
  },
  centro: {
    minLat: -22.9,
    maxLat: -22.9,
    minLng: -43.3,
    maxLng: -43.1,
  },
};

/**
 * Mapeamento de cidades para macro-regiões por estado
 */
export const MACRO_REGIONS_BY_STATE: Record<
  string,
  Record<string, string[]>
> = {
  MG: {
    "Região Metropolitana de BH": [
      "BELO HORIZONTE",
      "BH",
      "CONTAGEM",
      "BETIM",
      "NOVA LIMA",
      "SABARÁ",
      "SABARA",
      "RIBEIRÃO DAS NEVES",
      "RIBEIRAO DAS NEVES",
      "SANTA LUZIA",
      "IBIRITÉ",
      "IBIRITE",
    ],
    "Triângulo Mineiro": [
      "UBERLÂNDIA",
      "UBERLANDIA",
      "ARAXÁ",
      "ARAXA",
      "FRUTAL",
      "ITUIUTABA",
      "UBERABA",
      "PATOS DE MINAS",
    ],
    "Sul de Minas": [
      "VARGINHA",
      "POUSO ALEGRE",
      "ITAJUBÁ",
      "ITAJUBA",
      "SANTA RITA DO SAPUCAÍ",
      "SANTA RITA DO SAPUCAI",
      "LAVRAS",
      "TRÊS CORAÇÕES",
      "TRES CORACOES",
    ],
    "Zona da Mata": [
      "JUIZ DE FORA",
      "CATAGUASES",
      "LEOPOLDINA",
      "MURIAÉ",
      "MURIAE",
      "VICOSA",
    ],
    "Norte de Minas": [
      "MONTES CLAROS",
      "JANAÚBA",
      "JANAUBA",
      "SALINAS",
      "DIAMANTINA",
    ],
  },
  PR: {
    "Região Metropolitana de Curitiba": [
      "CURITIBA",
      "SÃO JOSÉ DOS PINHAIS",
      "SAO JOSE DOS PINHAIS",
      "COLOMBO",
      "PINHAIS",
      "ARAUCÁRIA",
      "ARAU CARIA",
      "PIRAQUARA",
    ],
    "Norte do Paraná": [
      "LONDRINA",
      "MARINGÁ",
      "MARINGA",
      "APUCARANA",
      "CAMPO MOURÃO",
      "CAMPO MOURAO",
      "PARANAVAÍ",
      "PARANAVAI",
    ],
    "Oeste do Paraná": [
      "CASCAVEL",
      "FOZ DO IGUAÇU",
      "FOZ DO IGUACU",
      "TOLEDO",
      "FRANCISCO BELTRÃO",
      "FRANCISCO BELTRAO",
      "MEDIANEIRA",
    ],
    Litoral: [
      "PARANAGUÁ",
      "PARANAGUA",
      "GUARATUBA",
      "MATINHOS",
      "PONTAL DO PARANÁ",
      "PONTAL DO PARANA",
    ],
  },
  RS: {
    "Região Metropolitana de Porto Alegre": [
      "PORTO ALEGRE",
      "CANOAS",
      "NOVO HAMBURGO",
      "SÃO LEOPOLDO",
      "SAO LEOPOLDO",
      "GRAVATAÍ",
      "GRAVATAI",
      "CACHOEIRINHA",
      "ALVORADA",
    ],
    "Serra Gaúcha": [
      "CAXIAS DO SUL",
      "GRAMADO",
      "CANELA",
      "BENTO GONÇALVES",
      "BENTO GONCALVES",
      "GARIBALDI",
      "NOVA PETRÓPOLIS",
      "NOVA PETROPOLIS",
    ],
    "Norte do RS": [
      "SANTA MARIA",
      "URUGUAIANA",
      "PASSO FUNDO",
      "ERECHIM",
      "BAGÉ",
      "BAGE",
      "SANTA CRUZ DO SUL",
    ],
  },
  BA: {
    "Salvador / RMS": [
      "SALVADOR",
      "LAURO DE FREITAS",
      "CAMAÇARI",
      "CAMACARI",
      "SIMÕES FILHO",
      "SIMOES FILHO",
      "DIAS D'ÁVILA",
      "DIAS D'AVILA",
    ],
    "Recôncavo Baiano": [
      "FEIRA DE SANTANA",
      "CACHOEIRA",
      "SÃO FÉLIX",
      "SAO FELIX",
      "MARAGOGIPE",
      "SÃO FRANCISCO DO CONDE",
      "SAO FRANCISCO DO CONDE",
    ],
    "Sul da Bahia": [
      "ILHÉUS",
      "ILHEUS",
      "ITABUNA",
      "PORTO SEGURO",
      "EUNÁPOLIS",
      "EUNAPOLIS",
      "TEIXEIRA DE FREITAS",
    ],
    "Oeste da Bahia": [
      "BARREIRAS",
      "LUÍS EDUARDO MAGALHÃES",
      "LUIS EDUARDO MAGALHAES",
      "BOM JESUS DA LAPA",
      "JUAZEIRO",
    ],
  },
};

/**
 * Verifica se uma cidade pertence a uma macro-região
 */
export function getMacroRegionForCity(
  state: string,
  city: string,
): string | null {
  const stateNormalized = state.trim().toUpperCase();
  const cityNormalized = city.trim().toUpperCase();

  const stateRegions = MACRO_REGIONS_BY_STATE[stateNormalized];
  if (!stateRegions) {
    return null;
  }

  for (const [regionName, cities] of Object.entries(stateRegions)) {
    for (const cityInRegion of cities) {
      if (
        cityNormalized.includes(cityInRegion) ||
        cityInRegion.includes(cityNormalized)
      ) {
        return `${stateNormalized} — ${regionName}`;
      }
    }
  }

  return null;
}

/**
 * Verifica se um ponto (lat, lng) está dentro de um bounding box
 */
export function isPointInBBox(
  lat: number,
  lng: number,
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lng >= bbox.minLng &&
    lng <= bbox.maxLng
  );
}

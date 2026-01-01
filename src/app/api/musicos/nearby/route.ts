import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { haversineKm } from "@/lib/geo";

type PublicMusician = {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  bio?: string | null;
  instruments?: string[] | null;
  genres?: string[] | null;
  skills?: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null;
  is_trusted?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat/lng são obrigatórios" },
      { status: 400 },
    );
  }

  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const instrument = (searchParams.get("instrument") || "").trim();
  const city = (searchParams.get("city") || "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") || 80), 120);

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, photo_url, city, state, user_type")
    .eq("user_type", "musician")
    .order("display_name", { ascending: true })
    .limit(200);

  const profileList = profiles || [];
  const ids = profileList.map((profile) => profile.user_id);
  const { data: musicianProfiles } = ids.length
    ? await supabase
        .from("musician_profiles")
        .select(
          "user_id, bio, instruments, genres, skills, avg_rating, rating_count, is_trusted, latitude, longitude",
        )
        .in("user_id", ids)
    : { data: [] };

  const profileMap = new Map(
    (musicianProfiles || []).map((profile) => [profile.user_id, profile]),
  );

  let results: PublicMusician[] = profileList.map((profile) => {
    const musician = profileMap.get(profile.user_id);
    return {
      user_id: profile.user_id,
      display_name: profile.display_name,
      photo_url: profile.photo_url,
      city: profile.city,
      state: profile.state,
      bio: musician?.bio ?? null,
      instruments: musician?.instruments ?? null,
      genres: musician?.genres ?? null,
      skills: musician?.skills ?? null,
      avg_rating: musician?.avg_rating ?? null,
      rating_count: musician?.rating_count ?? null,
      is_trusted: musician?.is_trusted ?? null,
      latitude: (musician as any)?.latitude ?? null,
      longitude: (musician as any)?.longitude ?? null,
      distance_km: null,
    };
  });

  if (q) {
    results = results.filter((musician) =>
      (musician.display_name || "").toLowerCase().includes(q),
    );
  }

  if (city) {
    results = results.filter((musician) =>
      (musician.city || "").toLowerCase().includes(city),
    );
  }

  if (instrument) {
    results = results.filter((musician) =>
      musician.instruments?.includes(instrument),
    );
  }

  results = results.map((musician) => {
    if (musician.latitude != null && musician.longitude != null) {
      return {
        ...musician,
        distance_km: haversineKm(
          lat,
          lng,
          musician.latitude,
          musician.longitude,
        ),
      };
    }
    return musician;
  });

  results.sort((a, b) => {
    if (a.distance_km == null && b.distance_km == null) return 0;
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });

  return NextResponse.json({ items: results.slice(0, limit) });
}

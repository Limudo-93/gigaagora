import { createClient } from "@/lib/supabase/server";
import { INSTRUMENT_OPTIONS } from "@/lib/instruments";
import HomeHeader from "@/components/HomeHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import MusiciansSearch from "@/components/musicos/MusiciansSearch";

type SearchParams = {
  q?: string;
  instrument?: string;
  city?: string;
};

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
  is_verified?: boolean;
  badges?: Array<{
    badge_type: string;
    earned_at: string;
    expires_at?: string | null;
  }>;
};

export default async function MusicosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const q = (searchParams.q || "").trim();
  const instrument = (searchParams.instrument || "").trim();
  const city = (searchParams.city || "").trim();

  let query = supabase
    .from("profiles")
    .select("user_id, display_name, photo_url, city, state, user_type")
    .eq("user_type", "musician")
    .order("display_name", { ascending: true })
    .limit(80);

  if (q) {
    query = query.ilike("display_name", `%${q}%`);
  }

  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data: profiles } = await query;
  const profileList = profiles || [];
  const ids = profileList.map((profile) => profile.user_id);

  const { data: musicianProfiles } = ids.length
    ? await supabase
        .from("musician_profiles")
        .select(
          "user_id, bio, instruments, genres, skills, avg_rating, rating_count, is_trusted",
        )
        .in("user_id", ids)
    : { data: [] };

  const profileMap = new Map(
    (musicianProfiles || []).map((profile) => [profile.user_id, profile]),
  );

  // Buscar badges para todos os músicos
  const { data: badgesData } = ids.length
    ? await supabase
        .from("user_badges")
        .select("user_id, badge_type, earned_at, expires_at")
        .in("user_id", ids)
        .or("expires_at.is.null,expires_at.gt.now()")
    : { data: [] };

  // Criar mapa de badges por usuário
  const badgesMap = new Map<
    string,
    Array<{ badge_type: string; earned_at: string; expires_at?: string | null }>
  >();
  if (badgesData) {
    badgesData.forEach((badge: any) => {
      if (!badgesMap.has(badge.user_id)) {
        badgesMap.set(badge.user_id, []);
      }
      badgesMap.get(badge.user_id)!.push(badge);
    });
  }

  // Buscar informações de verificação (CPF) para filtrar badge "verified"
  const { data: profilesWithCpf } = ids.length
    ? await supabase.from("profiles").select("user_id, cpf").in("user_id", ids)
    : { data: [] };

  const verifiedUsers = new Set(
    (profilesWithCpf || [])
      .filter((p: any) => p.cpf)
      .map((p: any) => p.user_id),
  );

  let results: PublicMusician[] = profileList.map((profile) => {
    const musician = profileMap.get(profile.user_id);
    const userBadges = badgesMap.get(profile.user_id) || [];
    // Filtrar badge "verified" se o usuário tem CPF (isVerified)
    const isVerified = verifiedUsers.has(profile.user_id);
    const filteredBadges = userBadges.filter((b) => {
      // Se já está mostrando badge "Verificado" baseado em CPF, não mostrar badge "verified" do sistema
      if (isVerified && b.badge_type === "verified") {
        return false;
      }
      return true;
    });

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
      is_verified: isVerified,
      badges: filteredBadges,
    };
  });

  if (instrument) {
    results = results.filter((musician) =>
      musician.instruments?.includes(instrument),
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HomeHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                Explorar músicos
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
                Encontre músicos prontos para sua gig
              </h1>
              <p className="text-sm text-foreground/60 mt-2 max-w-2xl">
                Perfis públicos com repertório, avaliações e disponibilidade.
                Salve seus favoritos e convide quando precisar.
              </p>
              <form
                className="mt-6 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_auto]"
                method="get"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar por nome"
                    className="w-full rounded-full border border-amber-100 bg-white/80 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#ffb347]/40"
                  />
                </div>
                <div>
                  <select
                    name="instrument"
                    defaultValue={instrument}
                    className="w-full rounded-full border border-amber-100 bg-white/80 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#ffb347]/40"
                  >
                    <option value="">Instrumento</option>
                    {INSTRUMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    name="city"
                    defaultValue={city}
                    placeholder="Cidade"
                    className="w-full rounded-full border border-amber-100 bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#ffb347]/40"
                  />
                </div>
                <Button className="btn-gradient px-8">Buscar</Button>
              </form>
            </div>
          </div>

          <MusiciansSearch
            initialResults={results}
            filters={{ q, instrument, city }}
            basePath="/musicos"
          />
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

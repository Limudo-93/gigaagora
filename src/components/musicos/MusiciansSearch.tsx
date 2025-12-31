"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sparkles, Star } from "lucide-react";
import { buildMusicianSlug } from "@/lib/slug";

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
  distance_km?: number | null;
};

type Filters = {
  q?: string;
  instrument?: string;
  city?: string;
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "CM";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MusiciansSearch({
  initialResults,
  filters,
  basePath = "/musicos",
}: {
  initialResults: PublicMusician[];
  filters: Filters;
  basePath?: string;
}) {
  const [results, setResults] = useState<PublicMusician[]>(initialResults);
  const [usingLocation, setUsingLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.instrument) params.set("instrument", filters.instrument);
    if (filters.city) params.set("city", filters.city);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const params = new URLSearchParams(queryString);
        params.set("lat", String(position.coords.latitude));
        params.set("lng", String(position.coords.longitude));
        const response = await fetch(`/api/musicos/nearby?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.items || []);
          setUsingLocation(true);
        }
        setLoadingLocation(false);
      },
      () => {
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [queryString]);

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span>{results.length} músicos encontrados</span>
        {loadingLocation && <span>Detectando sua localização...</span>}
        {usingLocation && !loadingLocation && <span>Ordenado por proximidade</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <Card className="card-glass md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-foreground/70">
                Nenhum músico encontrado com esses filtros. Tente ajustar a busca ou explore outros instrumentos.
              </p>
            </CardContent>
          </Card>
        ) : (
          results.map((musician) => (
            <Card key={musician.user_id} className="card-glass hover:shadow-xl transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-white/70">
                    <AvatarImage src={musician.photo_url || ""} />
                    <AvatarFallback className="gradient-music text-white font-semibold">
                      {getInitials(musician.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-foreground truncate">
                        {musician.display_name || "Músico"}
                      </h2>
                      {musician.is_trusted && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          confiável
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/60 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[musician.city, musician.state].filter(Boolean).join(", ") || "Brasil"}
                      </span>
                      {musician.distance_km != null && (
                        <span className="text-foreground/40">
                          • {musician.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    {musician.avg_rating && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70 mt-2">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{musician.avg_rating.toFixed(1)}</span>
                        <span className="text-foreground/50">
                          ({musician.rating_count || 0})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {musician.bio && (
                  <p className="text-sm text-foreground/70 line-clamp-3">
                    {musician.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {(musician.instruments || []).slice(0, 3).map((instrument) => (
                    <Badge key={instrument} variant="secondary" className="bg-white/70 border-white/70">
                      {instrument}
                    </Badge>
                  ))}
                  {(musician.instruments?.length || 0) > 3 && (
                    <Badge variant="secondary" className="bg-white/70 border-white/70">
                      +{(musician.instruments?.length || 0) - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild className="btn-gradient flex-1">
                    <Link
                      href={
                        `${basePath}/${buildMusicianSlug(musician.display_name || "musico", musician.user_id)}` as any
                      }
                    >
                      Ver perfil
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1 bg-white/80 border-white/70">
                    <Link href="/signup">Convidar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

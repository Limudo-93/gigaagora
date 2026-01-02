"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Calendar, MapPin, Clock, Music, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface UpcomingGig {
  id: string;
  title: string;
  start_time: string;
  location_name: string;
  city: string;
  state: string;
  instrument?: string;
}

export default function UpcomingGigsSection({ userId }: { userId: string }) {
  const [gigs, setGigs] = useState<UpcomingGig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingGigs();
  }, [userId]);

  const loadUpcomingGigs = async () => {
    try {
      const { data, error } = await supabase.rpc(
        "rpc_list_upcoming_confirmed_gigs"
      );

      if (error && error.code !== "42883") {
        // Se a RPC não existir, tentar query direta
        const { data: directData } = await supabase
          .from("confirmations")
          .select(
            `
            id,
            invites!inner(
              gig_id,
              gigs!inner(
                id,
                title,
                start_time,
                location_name,
                city,
                state,
                gig_roles!inner(
                  instrument
                )
              )
            )
          `
          )
          .eq("invites.musician_id", userId)
          .gte("invites.gigs.start_time", new Date().toISOString())
          .order("invites.gigs.start_time", { ascending: true })
          .limit(3);

        if (directData) {
          const transformed = directData.map((conf: any) => ({
            id: conf.invites.gigs.id,
            title: conf.invites.gigs.title,
            start_time: conf.invites.gigs.start_time,
            location_name: conf.invites.gigs.location_name,
            city: conf.invites.gigs.city,
            state: conf.invites.gigs.state,
            instrument:
              conf.invites.gigs.gig_roles?.[0]?.instrument || "Música",
          }));
          setGigs(transformed);
        }
      } else if (data) {
        const transformed = (data || []).slice(0, 3).map((gig: any) => ({
          id: gig.gig_id,
          title: gig.title,
          start_time: gig.start_time,
          location_name: gig.location_name,
          city: gig.city,
          state: gig.state,
          instrument: gig.instrument || "Música",
        }));
        setGigs(transformed);
      }
    } catch (error) {
      console.error("Error loading upcoming gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start snap-always">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always py-12">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Próximos Shows
          </h2>
          <p className="text-muted-foreground">
            Suas gigs confirmadas que estão chegando
          </p>
        </div>

        {gigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <Card
                key={gig.id}
                className="border-2 border-border hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg line-clamp-2 flex-1">
                        {gig.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0">
                        <Music className="h-3 w-3 mr-1" />
                        {gig.instrument}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(gig.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(gig.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {gig.location_name}, {gig.city}
                        {gig.state && ` - ${gig.state}`}
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/gigs/${gig.id}` as any}>
                      Ver Detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                Nenhum show agendado
              </h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não tem gigs confirmadas nos próximos dias
              </p>
              <Button asChild>
                <Link href={"/dashboard/gigs" as any}>
                  Explorar Gigs Disponíveis
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {gigs.length > 0 && (
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href={"/dashboard/agenda" as any}>
                Ver Agenda Completa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

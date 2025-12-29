"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import RatingDialog from "./RatingDialog";

type CompletedGigRow = {
  confirmation_id: string;
  invite_id: string;
  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  instrument: string | null;
  flyer_url: string | null;
  contractor_id: string | null;
  musician_id: string | null;
};

function formatDateTimeBR(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ?? "";
  }
}

function buildLocationText(r: CompletedGigRow) {
  const parts = [
    r.location_name,
    r.address_text,
    r.city,
    r.state ? `- ${r.state}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

export default function CompletedGigsToRate({ userId }: { userId: string }) {
  const [items, setItems] = useState<CompletedGigRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingGig, setRatingGig] = useState<{
    inviteId: string;
    gigId: string;
    contractorId: string;
    musicianId: string;
    raterType: 'musician' | 'contractor';
    ratedType: 'musician' | 'contractor';
    ratedUserId: string;
  } | null>(null);
  const [hasRated, setHasRated] = useState<Set<string>>(new Set());
  const [userType, setUserType] = useState<'musician' | 'contractor' | null>(null);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Primeiro, verificar o tipo de usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", userId)
        .single();

      if (profile) {
        setUserType(profile.user_type as 'musician' | 'contractor');
      }

      // Buscar gigs confirmadas que já passaram
      // Primeiro busca confirmações onde o usuário é músico
      const { data: musicianData, error: musicianError } = await supabase
        .from("confirmations")
        .select(`
          id,
          created_at,
          invite_id,
          invites!inner(
            id,
            gig_id,
            contractor_id,
            musician_id,
            gigs!inner(
              id,
              title,
              start_time,
              end_time,
              location_name,
              address_text,
              city,
              state,
              flyer_url,
              gig_roles!inner(
                instrument
              )
            )
          )
        `)
        .eq("invites.musician_id", userId)
        .lt("invites.gigs.start_time", new Date().toISOString());

      // Depois busca confirmações onde o usuário é contratante
      const { data: contractorData, error: contractorError } = await supabase
        .from("confirmations")
        .select(`
          id,
          created_at,
          invite_id,
          invites!inner(
            id,
            gig_id,
            contractor_id,
            musician_id,
            gigs!inner(
              id,
              title,
              start_time,
              end_time,
              location_name,
              address_text,
              city,
              state,
              flyer_url,
              gig_roles!inner(
                instrument
              )
            )
          )
        `)
        .eq("invites.contractor_id", userId)
        .lt("invites.gigs.start_time", new Date().toISOString());

      if (musicianError || contractorError) {
        console.error("Query error:", musicianError || contractorError);
        setErrorMsg(
          `Erro ao carregar gigs concluídas: ${(musicianError || contractorError)?.message}`
        );
        setItems([]);
        setLoading(false);
        return;
      }

      // Combina os resultados
      const directData = [...(musicianData || []), ...(contractorData || [])];

      // Transforma os dados
      const transformed = (directData ?? []).map((conf: any) => ({
        confirmation_id: conf.id,
        invite_id: conf.invites?.id ?? null,
        gig_id: conf.invites?.gig_id ?? null,
        gig_title: conf.invites?.gigs?.title ?? null,
        start_time: conf.invites?.gigs?.start_time ?? null,
        end_time: conf.invites?.gigs?.end_time ?? null,
        location_name: conf.invites?.gigs?.location_name ?? null,
        address_text: conf.invites?.gigs?.address_text ?? null,
        city: conf.invites?.gigs?.city ?? null,
        state: conf.invites?.gigs?.state ?? null,
        instrument: conf.invites?.gigs?.gig_roles?.[0]?.instrument ?? null,
        flyer_url: conf.invites?.gigs?.flyer_url ?? null,
        contractor_id: conf.invites?.contractor_id ?? null,
        musician_id: conf.invites?.musician_id ?? null,
      }));

      // Verificar quais já foram avaliadas pelo usuário atual
      const inviteIds = transformed.map((g: CompletedGigRow) => g.invite_id).filter(Boolean);
      if (inviteIds.length > 0) {
        // Buscar TODAS as avaliações do usuário atual para essas gigs
        // Verificar tanto como músico quanto como contratante
        const { data: ratingsData } = await supabase
          .from("ratings")
          .select("invite_id, rater_type, musician_id, contractor_id")
          .in("invite_id", inviteIds)
          .or(`musician_id.eq.${userId},contractor_id.eq.${userId}`);

        if (ratingsData && ratingsData.length > 0) {
          // Criar um Set com os invite_ids que já foram avaliados pelo usuário atual
          // Verificar se o usuário é o avaliador (não o avaliado)
          const ratedSet = new Set<string>();
          
          for (const rating of ratingsData) {
            // Se o usuário é o músico avaliador OU o contratante avaliador
            if (
              (rating.rater_type === 'musician' && rating.musician_id === userId) ||
              (rating.rater_type === 'contractor' && rating.contractor_id === userId)
            ) {
              ratedSet.add(rating.invite_id);
            }
          }
          
          setHasRated(ratedSet);
          
          // Filtrar apenas as que ainda não foram avaliadas pelo usuário atual
          const unrated = transformed.filter((g: CompletedGigRow) => 
            !ratedSet.has(g.invite_id)
          );
          setItems(unrated);
        } else {
          setItems(transformed);
        }
      } else {
        setItems(transformed);
      }

      setLoading(false);
    } catch (e: any) {
      console.error("fetchCompleted exception:", e);
      setErrorMsg(e?.message ?? "Erro inesperado ao carregar gigs concluídas.");
      setItems([]);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void fetchCompleted();
    } else {
      setErrorMsg("Usuário não identificado.");
      setLoading(false);
    }
  }, [userId, fetchCompleted]);

  const handleRate = (gig: CompletedGigRow) => {
    if (!gig.invite_id || !gig.gig_id) return;

    // Determinar quem está avaliando baseado nos dados da gig
    // Se o userId é o musician_id da gig, então o usuário é o músico avaliando o contratante
    // Se o userId é o contractor_id da gig, então o usuário é o contratante avaliando o músico
    const isUserMusician = gig.musician_id === userId;
    const isUserContractor = gig.contractor_id === userId;

    if (!isUserMusician && !isUserContractor) {
      setErrorMsg("Você não pode avaliar esta gig. Você não participou dela.");
      return;
    }

    // Determinar quem está sendo avaliado
    const ratedUserId = isUserMusician 
      ? (gig.contractor_id || '')  // Se é músico, avalia o contratante
      : (gig.musician_id || '');  // Se é contratante, avalia o músico

    if (!ratedUserId) {
      setErrorMsg("Não foi possível identificar o usuário a ser avaliado.");
      return;
    }

    // Determinar os tipos
    const actualRaterType = isUserMusician ? 'musician' : 'contractor';
    const actualRatedType = isUserMusician ? 'contractor' : 'musician';

    setRatingGig({
      inviteId: gig.invite_id,
      gigId: gig.gig_id,
      contractorId: gig.contractor_id || '',
      musicianId: gig.musician_id || '',
      raterType: actualRaterType,
      ratedType: actualRatedType,
      ratedUserId: ratedUserId,
    });
    setRatingDialogOpen(true);
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Gigs Concluídas - Avaliar</h2>
      </div>

      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Erro:</p>
          <p className="mt-1">{errorMsg}</p>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground">
                Nenhuma gig pendente de avaliação
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Todas as suas gigs concluídas já foram avaliadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.slice(0, 3).map((gig) => {
                const when = formatDateTimeBR(gig.start_time);
                const location = buildLocationText(gig);

                return (
                  <Card key={gig.confirmation_id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Flyer ou logo */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          {gig.flyer_url ? (
                            <img
                              src={gig.flyer_url}
                              alt={gig.gig_title || "Flyer"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                              <Image
                                src="/logo.png"
                                alt="Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-foreground truncate">
                                {gig.gig_title || "Show"}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary">
                                  {gig.instrument || "Música"}
                                </Badge>
                                <Badge className="bg-green-500 text-white text-xs">
                                  Concluída
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {when && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>{when}</span>
                              </div>
                            )}
                            {location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{location}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <Button
                              onClick={() => handleRate(gig)}
                              size="sm"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Avaliar {userType === 'musician' ? 'Contratante' : 'Músico'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Avaliação */}
      {ratingGig && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          gigId={ratingGig.gigId}
          inviteId={ratingGig.inviteId}
          raterId={userId}
          ratedUserId={ratingGig.ratedUserId}
          raterType={ratingGig.raterType}
          ratedType={ratingGig.ratedType}
          onSuccess={() => {
            // Adicionar à lista de avaliados
            setHasRated((prev) => new Set([...prev, ratingGig.inviteId]));
            // Remover o item da lista imediatamente
            setItems((prev) => prev.filter((item) => item.invite_id !== ratingGig.inviteId));
            setRatingDialogOpen(false);
            setRatingGig(null);
            // Recarregar lista para garantir sincronização
            void fetchCompleted();
          }}
        />
      )}
    </section>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, X, Clock, Download, Eye, Star, Calendar, MapPin } from "lucide-react";
import InviteDetailsDialog from "./InviteDetailsDialog";
import RatingDialog from "./RatingDialog";

type ConfirmedGigRow = {
  confirmation_id: string;
  invite_id: string;
  created_at: string | null;

  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;

  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;

  instrument: string | null;
  flyer_url?: string | null;
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

function buildLocationText(r: ConfirmedGigRow) {
  const parts = [
    r.location_name,
    r.address_text,
    r.city,
    r.state ? `- ${r.state}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

function calculateTimeRemaining(startTime: string | null, currentTime: Date): string {
  if (!startTime) return "";
  
  try {
    const start = new Date(startTime);
    const diff = start.getTime() - currentTime.getTime();
    
    if (diff < 0) return "Já passou";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} ${days === 1 ? "dia" : "dias"}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else {
      return "Agora";
    }
  } catch {
    return "";
  }
}

export default function UpcomingConfirmedGigs({ userId }: { userId: string }) {
  const [items, setItems] = useState<ConfirmedGigRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingInvite, setRatingInvite] = useState<{ inviteId: string; gigId: string; contractorId: string } | null>(null);
  const [hasRated, setHasRated] = useState<Set<string>>(new Set());

  const fetchConfirmed = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_upcoming_confirmed_gigs");

      if (rpcError) {
        console.error("RPC fetchConfirmed error:", rpcError);
        console.error("Error details:", {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
        });

        // Se a RPC não existir, tenta query direta
        if (rpcError.code === "42883" || rpcError.code === "P0001") {
          console.log("RPC não disponível, tentando query direta...");
          
          const { data: directData, error: directError } = await supabase
            .from("confirmations")
            .select(`
              id,
              created_at,
              invite_id,
              invites!inner(
                id,
                gig_id,
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
            .gte("invites.gigs.start_time", new Date().toISOString())
            .order("invites.gigs.start_time", { ascending: true });

          if (directError) {
            console.error("Direct query error:", directError);
            setErrorMsg(
              `Erro ao carregar gigs confirmadas: ${directError.message}${directError.hint ? ` (${directError.hint})` : ""}`
            );
            setItems([]);
            setLoading(false);
            return;
          }

          // Transforma os dados
          const transformed = (directData ?? []).map((conf: any) => ({
            confirmation_id: conf.id,
            invite_id: conf.invite_id,
            created_at: conf.created_at,
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
          }));

          console.log("UpcomingConfirmedGigs loaded (direct):", transformed.length, "gigs");
          // Ordena do mais próximo para o mais longe
          const sorted = transformed.sort((a, b) => {
            if (!a.start_time) return 1;
            if (!b.start_time) return -1;
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          });
          setItems(sorted);
          setLoading(false);
          return;
        }

        setErrorMsg(
          `Erro ao carregar gigs confirmadas: ${rpcError.message}${rpcError.hint ? ` (${rpcError.hint})` : ""}`
        );
        setItems([]);
        setLoading(false);
        return;
      }

      console.log("UpcomingConfirmedGigs loaded (RPC):", rpcData?.length ?? 0, "gigs");
      // Ordena do mais próximo para o mais longe
      const sorted = (rpcData ?? []).sort((a: ConfirmedGigRow, b: ConfirmedGigRow) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
      setItems(sorted as ConfirmedGigRow[]);
      setLoading(false);
    } catch (e: any) {
      console.error("fetchConfirmed exception:", e);
      setErrorMsg(e?.message ?? "Erro inesperado ao carregar gigs confirmadas.");
      setItems([]);
      setLoading(false);
    }
  }, [userId]);

  const checkExistingRatings = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:219',message:'checkExistingRatings called',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:222',message:'User fetched',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (!user) return;

      // Buscar avaliações onde o usuário é o AVALIADOR (não o avaliado)
      // Se o usuário é músico, buscar onde rater_type = 'musician' e musician_id = user.id
      // Se o usuário é contratante, buscar onde rater_type = 'contractor' e contractor_id = user.id
      // Primeiro, determinar o tipo do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();
      
      let ratings: any[] = [];
      
      if (profile?.user_type === 'musician') {
        // Se é músico, buscar apenas avaliações onde ele é o avaliador (rater_type = 'musician')
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("invite_id, rater_type, musician_id, contractor_id")
          .eq("rater_type", "musician")
          .eq("musician_id", user.id);
        ratings = ratingsData || [];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:240',message:'Ratings query for musician',data:{ratingsCount:ratings.length,ratingsError:ratingsError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H8'})}).catch(()=>{});
        // #endregion
      } else if (profile?.user_type === 'contractor') {
        // Se é contratante, buscar apenas avaliações onde ele é o avaliador (rater_type = 'contractor')
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("invite_id, rater_type, musician_id, contractor_id")
          .eq("rater_type", "contractor")
          .eq("contractor_id", user.id);
        ratings = ratingsData || [];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:250',message:'Ratings query for contractor',data:{ratingsCount:ratings.length,ratingsError:ratingsError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H8'})}).catch(()=>{});
        // #endregion
      }
      
      const ratingsError = null; // Já tratado acima
      
      if (ratings && ratings.length > 0) {
        const ratedSet = new Set(ratings.map((r: any) => r.invite_id));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:232',message:'Setting hasRated',data:{ratedSetSize:ratedSet.size,ratedInviteIds:Array.from(ratedSet).slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setHasRated(ratedSet);
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:236',message:'Error checking ratings',data:{error:err?.message,stack:err?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      console.error("Error checking ratings:", err);
    }
  }, [userId]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:useEffect',message:'useEffect triggered',data:{userId,hasFetchConfirmed:!!fetchConfirmed,hasCheckRatings:!!checkExistingRatings},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    if (userId) {
      void fetchConfirmed();
      checkExistingRatings();
    } else {
      setErrorMsg("Usuário não identificado.");
      setLoading(false);
    }
  }, [userId, fetchConfirmed, checkExistingRatings]);

  // Atualiza o tempo restante a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  const cancelConfirmation = useCallback(async (confirmationId: string, inviteId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta gig confirmada?")) {
      return;
    }

    setBusyId(confirmationId);
    setErrorMsg(null);

    try {
      // Buscar informações do invite antes de deletar
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .select(`
          id,
          contractor_id,
          gig_id,
          musician_id,
          gigs!inner(
            title
          )
        `)
        .eq("id", inviteId)
        .single();

      if (inviteError || !inviteData) {
        console.error("Error fetching invite data:", inviteError);
        setErrorMsg("Erro ao buscar informações do convite.");
        setBusyId(null);
        return;
      }

      const contractorId = inviteData.contractor_id;
      const gigId = inviteData.gig_id;
      const gigTitle = (inviteData.gigs as any)?.title || "a gig";

      // Buscar nome do músico
      const { data: { user } } = await supabase.auth.getUser();
      let musicianName = "Músico";
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        musicianName = profileData?.display_name || "Músico";
      }

      // Primeiro, deleta a confirmação
      const { error: deleteError } = await supabase
        .from("confirmations")
        .delete()
        .eq("id", confirmationId);

      if (deleteError) {
        console.error("Error deleting confirmation:", deleteError);
        setErrorMsg(`Erro ao cancelar: ${deleteError.message}`);
        setBusyId(null);
        return;
      }

      // Atualiza o invite para declined
      const { error: updateError } = await supabase
        .from("invites")
        .update({ status: "declined" })
        .eq("id", inviteId);

      if (updateError) {
        console.error("Error updating invite:", updateError);
        // Não falha se o update do invite der erro, já que a confirmação foi deletada
      }

      // Enviar mensagem no chat para o contratante
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:318',message:'Attempting dynamic import',data:{contractorId,inviteId,gigId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        const { startConversation, sendMessageToConversation } = await import("@/lib/messages");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:321',message:'Dynamic import successful',data:{hasStartConversation:!!startConversation,hasSendMessage:!!sendMessageToConversation},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        const conversationId = await startConversation(contractorId, inviteId, gigId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:323',message:'Conversation created',data:{conversationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        if (conversationId) {
          await sendMessageToConversation(
            conversationId,
            contractorId,
            `Olá! Infelizmente preciso cancelar minha participação na gig "${gigTitle}". Peço desculpas pelo inconveniente.`
          );
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:330',message:'Message sent successfully',data:{conversationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
          // #endregion
        }
      } catch (msgError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:332',message:'Error sending message',data:{error:msgError?.message,stack:msgError?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        console.error("Error sending cancellation message:", msgError);
        // Não falha o cancelamento se a mensagem não for enviada
      }

      // Criar notificação de cancelamento
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:336',message:'Calling rpc_create_cancellation_notification',data:{contractorId,gigId,inviteId,musicianId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
        // #endregion
        const { data: notifData, error: notifError } = await supabase.rpc("rpc_create_cancellation_notification", {
          p_contractor_id: contractorId,
          p_gig_id: gigId,
          p_invite_id: inviteId,
          p_musician_id: user?.id || null,
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:343',message:'RPC result',data:{notifData,notifError:notifError?.message,notifErrorCode:notifError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
        // #endregion

        if (notifError) {
          console.error("Error creating cancellation notification:", notifError);
          // Não falha o cancelamento se a notificação não for criada
        }
      } catch (notifError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpcomingConfirmedGigs.tsx:350',message:'Exception creating notification',data:{error:notifError?.message,stack:notifError?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
        // #endregion
        console.error("Error creating cancellation notification:", notifError);
        // Não falha o cancelamento se a notificação não for criada
      }

      // Remove da lista local
      setItems((prev) => prev.filter((x) => x.confirmation_id !== confirmationId));
      setBusyId(null);
    } catch (err: any) {
      console.error("cancelConfirmation exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao cancelar.");
      setBusyId(null);
    }
  }, []);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Gigs Confirmadas</h2>
      </div>

      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar gigs confirmadas:</p>
          <p className="mt-1">{errorMsg}</p>
          <p className="mt-2 text-xs opacity-75">
            Verifique o console do navegador (F12) para mais detalhes.
          </p>
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
              <p className="text-sm font-medium text-foreground">
                Nenhuma gig confirmada futura
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você não tem gigs confirmadas agendadas.
              </p>
            </div>
          ) : (
          <div className="space-y-3">
            {items.slice(0, 3).map((r) => {
              const when = formatDateTimeBR(r.start_time);
              const location = buildLocationText(r);
              const timeRemaining = calculateTimeRemaining(r.start_time, now);

              // Extrair data para mostrar grande
              const dateParts = when ? when.split(" ") : null;
              const dayMonth = dateParts
                ? dateParts[0].split("/").slice(0, 2).join(" ")
                : null;
              const monthName = dateParts
                ? new Date(r.start_time || "").toLocaleDateString("pt-BR", {
                    month: "short",
                  }).toUpperCase()
                : null;

              const handleDownloadFlyer = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!r.flyer_url) return;
                
                // Cria um link temporário para download
                const link = document.createElement("a");
                link.href = r.flyer_url;
                link.download = `${r.gig_title || "flyer"}-${r.gig_id}.jpg`;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              const dateParts = when ? when.split(" ") : [];
              const dateStr = dateParts[0] || "";
              const timeStr = dateParts[1] || "";

              return (
                <Card 
                  key={r.confirmation_id}
                  className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-0">
                    {/* Flyer do evento ou logo padrão */}
                    <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
                      {r.flyer_url ? (
                        <img
                          src={r.flyer_url}
                          alt={r.gig_title || "Flyer do evento"}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={handleDownloadFlyer}
                          title="Clique para baixar o flyer"
                        />
                      ) : (
                        <div className="relative w-32 h-32">
                          <Image
                            src="/logo.png"
                            alt="Logo Chama o Músico"
                            fill
                            className="object-contain opacity-50"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Título */}
                      <div>
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                          {r.gig_title || "Gig sem título"}
                        </h3>

                        {/* Instrumento */}
                        {r.instrument && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {r.instrument}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Informações principais - Reorganizadas para escaneabilidade */}
                      <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                        {/* Região - Destacada */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground truncate">{location || "Local não informado"}</p>
                          </div>
                        </div>

                        {/* Data e Hora - Em linha única para escaneabilidade */}
                        <div className="flex items-center gap-4 text-sm">
                          {dateStr && (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{dateStr}</span>
                            </div>
                          )}
                          {timeStr && (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{timeStr}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges de status */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge className="text-xs bg-green-500 text-white border-0 font-medium">
                          ✓ Confirmada
                        </Badge>
                        {timeRemaining && (
                          <Badge className="text-xs bg-blue-500 text-white border-0 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeRemaining}
                          </Badge>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col gap-2.5 pt-4 border-t-2 border-border/30">
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-2 hover:bg-accent/50"
                            onClick={async () => {
                              try {
                                const { data: inviteData, error: inviteError } = await supabase
                                  .from("invites")
                                  .select("*")
                                  .eq("id", r.invite_id)
                                  .single();

                                if (inviteError) throw inviteError;
                                if (!inviteData) throw new Error("Convite não encontrado");

                                const { data: gigData, error: gigError } = await supabase
                                  .from("gigs")
                                  .select("*")
                                  .eq("id", inviteData.gig_id)
                                  .single();

                                if (gigError) throw new Error("Erro ao carregar dados da gig");

                                const { data: roleData, error: roleError } = await supabase
                                  .from("gig_roles")
                                  .select("*")
                                  .eq("id", inviteData.gig_role_id)
                                  .single();

                                if (roleError) throw new Error("Erro ao carregar dados da vaga");

                                const formattedInvite = {
                                  ...inviteData,
                                  gig: gigData,
                                  role: roleData,
                                };
                                
                                setSelectedInvite(formattedInvite);
                                setDialogOpen(true);
                              } catch (err: any) {
                                console.error("Error loading invite details:", err);
                                setErrorMsg(`Erro ao carregar detalhes: ${err.message}`);
                              }
                            }}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="border-2 hover:bg-accent/50"
                            title="Chat"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {r.start_time && new Date(r.start_time) < new Date() && !hasRated.has(r.invite_id) && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-2 hover:bg-accent/50"
                              onClick={async () => {
                                try {
                                  const { data: inviteData } = await supabase
                                    .from("invites")
                                    .select("contractor_id, gig_id")
                                    .eq("id", r.invite_id)
                                    .single();
                                  
                                  if (inviteData) {
                                    setRatingInvite({
                                      inviteId: r.invite_id,
                                      gigId: inviteData.gig_id,
                                      contractorId: inviteData.contractor_id,
                                    });
                                    setRatingDialogOpen(true);
                                  }
                                } catch (err) {
                                  console.error("Error loading invite for rating:", err);
                                }
                              }}
                              title="Avaliar"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          className="w-full border-2 font-medium"
                          onClick={() => cancelConfirmation(r.confirmation_id, r.invite_id)}
                          disabled={busyId === r.confirmation_id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar Gig
                        </Button>
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

      <InviteDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invite={selectedInvite}
        onAccept={() => {
          setDialogOpen(false);
        }}
        onDecline={() => {
          setDialogOpen(false);
        }}
      />

      {/* Dialog de Avaliação */}
      {ratingInvite && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          gigId={ratingInvite.gigId}
          inviteId={ratingInvite.inviteId}
          raterId={userId}
          ratedUserId={ratingInvite.contractorId}
          raterType="musician"
          ratedType="contractor"
          onSuccess={() => {
            setHasRated((prev) => new Set([...prev, ratingInvite.inviteId]));
            setRatingDialogOpen(false);
            setRatingInvite(null);
          }}
        />
      )}
    </section>
  );
}

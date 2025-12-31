"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GigCard from "./GigCard";
import GigDetailsDialog from "./GigDetailsDialog";

type ConfirmedMusician = {
  musician_id: string;
  musician_name: string | null;
  musician_photo_url: string | null;
  instrument: string;
};

type GigRow = {
  id: string;
  title: string | null;
  location_name: string | null;
  address_text: string | null;
  timezone: string | null;
  start_time: string | null;
  end_time: string | null;
  show_minutes: number | null;
  break_minutes: number | null;
  status: string | null;
  flyer_url?: string | null;
  min_cache?: number | null;
  max_cache?: number | null;
  confirmed_musicians?: ConfirmedMusician[];
};

type TabKey = "draft" | "upcoming" | "past" | "canceled";

export default function GigsTabs({ userId }: { userId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<GigRow[]>([]);
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Busca gigs onde o usuário é o contractor (criador da gig)
        // Primeiro busca as gigs
        let q = supabase
          .from("gigs")
          .select(
            "id,title,location_name,address_text,timezone,start_time,end_time,show_minutes,break_minutes,status,flyer_url"
          )
          .eq("contractor_id", userId);

        // filtros por aba
        if (tab === "draft") {
          q = q.eq("status", "draft");
        } else if (tab === "canceled") {
          // O enum no banco usa "cancelled" (com dois 'l')
          q = q.eq("status", "cancelled");
        } else if (tab === "upcoming") {
          // Abertos: status publicado
          // IMPORTANTE: Mostrar TODAS as gigs publicadas, independente de:
          // - Ter músicos confirmados ou não
          // - Ter data futura ou não (se não tiver data, também deve aparecer)
          // Não filtrar por músicos confirmados - todas as gigs publicadas devem aparecer
          // Remover filtro de data para mostrar todas as gigs publicadas
          q = q.in("status", ["published", "open", "active"]);
        } else if (tab === "past") {
          // Concluídos: data passada (ou status completed se existir)
          // IMPORTANTE: Mostrar todas as gigs com data passada, independente de status
          // Não filtrar por status aqui, apenas por data
          q = q.lt("start_time", new Date().toISOString());
        }

        const { data, error } = await q.order("start_time", { ascending: true, nullsFirst: true });

        console.log("GigsTabs query result:", { 
          dataCount: data?.length || 0, 
          error, 
          tab, 
          userId,
          gigs: data?.map((g: any) => ({ id: g.id, title: g.title, status: g.status, start_time: g.start_time }))
        });

        if (error) {
          console.error("GigsTabs load error:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          setErrorMsg(
            `Erro ao carregar gigs: ${error.message}${error.hint ? ` (${error.hint})` : ""}`
          );
          setRows([]);
          return;
        }

        // Filtrar por data futura APENAS se start_time não for NULL (para aba upcoming)
        // Isso garante que gigs publicadas sem data também apareçam
        let filteredData = data ?? [];
        if (tab === "upcoming") {
          const now = new Date();
          filteredData = filteredData.filter((gig: any) => {
            // Se não tem start_time, inclui (gig publicada sem data)
            if (!gig.start_time) return true;
            // Se tem start_time, só inclui se for futura ou hoje
            return new Date(gig.start_time) >= now;
          });
          console.log("GigsTabs: Gigs filtradas por data futura ou sem data:", filteredData.length, "de", data?.length || 0);
        }

        if (!filteredData || filteredData.length === 0) {
          console.log("GigsTabs: Nenhuma gig encontrada para:", { tab, userId });
          // Verificar se há gigs com outros status para debug
          const { data: allGigs } = await supabase
            .from("gigs")
            .select("id, title, status, start_time")
            .eq("contractor_id", userId)
            .order("start_time", { ascending: true, nullsFirst: true });
          console.log("GigsTabs: Todas as gigs do contratante (para debug):", allGigs);
          
          // Verificar especificamente gigs publicadas
          if (tab === "upcoming") {
            const { data: publishedGigs } = await supabase
              .from("gigs")
              .select("id, title, status, start_time")
              .eq("contractor_id", userId)
              .in("status", ["published", "open", "active"])
              .order("start_time", { ascending: true, nullsFirst: true });
            console.log("GigsTabs: Gigs publicadas do contratante:", publishedGigs);
          }
        }

        // Busca os valores de cache das roles e músicos confirmados para cada gig
        const gigsWithCache = await Promise.all(
          (filteredData ?? []).map(async (gig) => {
            const { data: rolesData } = await supabase
              .from("gig_roles")
              .select("cache")
              .eq("gig_id", gig.id)
              .not("cache", "is", null);

            const cacheValues = (rolesData ?? [])
              .map((r) => r.cache)
              .filter((c): c is number => c !== null && c !== undefined);

            // Busca músicos confirmados para esta gig
            const { data: confirmedData } = await supabase.rpc(
              "rpc_list_confirmed_musicians_for_gig",
              { p_gig_id: gig.id }
            );

            return {
              ...gig,
              min_cache: cacheValues.length > 0 ? Math.min(...cacheValues) : null,
              max_cache: cacheValues.length > 0 ? Math.max(...cacheValues) : null,
              confirmed_musicians: (confirmedData || []).map((m: any) => ({
                musician_id: m.musician_id,
                musician_name: m.musician_name,
                musician_photo_url: m.musician_photo_url,
                instrument: m.instrument,
              })),
            };
          })
        );

        console.log("GigsTabs loaded:", gigsWithCache.length, "gigs");
        setRows(gigsWithCache as GigRow[]);
      } catch (e: any) {
        console.error("GigsTabs load exception:", e);
        setErrorMsg(e?.message ?? "Erro ao carregar gigs.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      load();
    } else {
      setErrorMsg("Usuário não identificado.");
      setLoading(false);
    }

    // Configurar subscription para atualizar quando houver mudanças nas gigs
    const channel = supabase
      .channel(`gigs-tabs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gigs',
          filter: `contractor_id=eq.${userId}`,
        },
        () => {
          // Recarregar quando houver mudanças nas gigs do contratante
          console.log('Mudança detectada em gigs, recarregando...');
          load();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscription ativa para gigs-tabs');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Erro na subscription gigs-tabs');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tab]);

  const filtered = rows; // já filtrado na query

  const handleOpenGig = (gigId: string) => {
    setSelectedGigId(gigId);
    setDialogOpen(true);
  };

  const handleEditGig = (gigId: string) => {
    // Redireciona para a página de edição
    window.location.href = `/dashboard/gigs/${gigId}/edit`;
  };

  const handleCancelGig = async (gigId: string) => {
    setCancellingId(gigId);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("gigs")
        .update({ status: "cancelled" })
        .eq("id", gigId)
        .eq("contractor_id", userId); // Garantir que só cancela suas próprias gigs

      if (error) {
        console.error("Error cancelling gig:", error);
        setErrorMsg(`Erro ao cancelar gig: ${error.message}`);
        setCancellingId(null);
        return;
      }

      // Remove da lista local ou atualiza o status
      setRows((prev) => prev.filter((g) => g.id !== gigId));
      setCancellingId(null);
    } catch (err: any) {
      console.error("cancelGig exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao cancelar gig.");
      setCancellingId(null);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Meus Gigs</h2>
        <Button asChild>
          <Link href={"/dashboard/gigs/new" as any}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Nova Gig
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="w-full justify-start bg-muted">
          <TabsTrigger value="draft">Rascunho</TabsTrigger>
          <TabsTrigger value="upcoming">Abertos</TabsTrigger>
          <TabsTrigger value="past">Concluídos</TabsTrigger>
          <TabsTrigger value="canceled">Cancelados</TabsTrigger>
        </TabsList>

        <div className="mt-3">
          {errorMsg && (
            <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-semibold">Erro ao carregar gigs:</p>
              <p className="mt-1">{errorMsg}</p>
              <p className="mt-2 text-xs opacity-75">
                Verifique o console do navegador (F12) para mais detalhes.
              </p>
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="px-4 py-6 text-center text-sm text-muted-foreground">
                Carregando gigs...
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="px-4 py-6 text-center">
                <p className="text-sm font-medium text-foreground">Nenhuma gig encontrada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tab === "draft"
                    ? "Nenhuma gig em rascunho."
                    : tab === "upcoming"
                    ? "Nenhuma gig aberta."
                    : tab === "past"
                    ? "Nenhuma gig concluída."
                    : "Nenhuma gig cancelada."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.slice(0, 3).map((g) => (
                <GigCard 
                  key={g.id} 
                  gig={g} 
                  onOpen={handleOpenGig}
                  onEdit={handleEditGig}
                  onCancel={handleCancelGig}
                  isCancelling={cancellingId === g.id}
                />
              ))}
              {filtered.length > 3 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/gigs")}
                  >
                    Ver todas as {filtered.length} gigs
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* só pra manter TabsContent compatível com shadcn se você usar em outro lugar */}
        <TabsContent value={tab} />
      </Tabs>

      <GigDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gigId={selectedGigId}
      />
    </section>
  );
}

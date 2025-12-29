"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import GigCard from "./GigCard";
import GigDetailsDialog from "./GigDetailsDialog";

type GigRow = {
  id: string;
  title: string | null;
  location_name: string | null;
  address_text: string | null;
  start_time: string | null; // ISO
  status: string | null;
  flyer_url?: string | null;
};

function parseTime(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 400) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const d = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  d.cancel = () => t && clearTimeout(t);
  return d as T & { cancel: () => void };
}

export default function MyGigs() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inFlightRef = useRef(false);

  const fetchMyGigs = useCallback(async (contractorUserId: string) => {
    const { data, error } = await supabase
      .from("gigs")
      .select("id,title,location_name,address_text,start_time,status,flyer_url")
      .eq("contractor_id", contractorUserId)
      .order("start_time", { ascending: true, nullsFirst: false });

    if (error) throw error;
    return (data ?? []) as GigRow[];
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setErrorMsg(null);
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const userId = sessionData.session?.user?.id;
        if (!userId) {
          setGigs([]);
          setErrorMsg("Usuário não autenticado.");
          return;
        }

        // 🔑 No seu schema: gigs.contractor_id = auth.user.id
        const rows = await fetchMyGigs(userId);
        setGigs(rows);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar suas gigs.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [fetchMyGigs]
  );

  useEffect(() => {
    load();

    const reload = debounce(() => {
      if (!inFlightRef.current) load({ silent: true });
    }, 400);

    const channel = supabase
      .channel("rt-my-gigs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gigs" },
        () => reload()
      )
      .subscribe();

    return () => {
      reload.cancel();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const partitions = useMemo(() => {
    const now = Date.now();

    const drafts: GigRow[] = [];
    const upcoming: GigRow[] = [];
    const past: GigRow[] = [];
    const cancelled: GigRow[] = [];
    const other: GigRow[] = [];

    for (const g of gigs) {
      const s = normalizeStatus(g.status);
      const t = parseTime(g.start_time);

      if (s === "draft") {
        drafts.push(g);
        continue;
      }
      if (s === "cancelled" || s === "canceled") {
        cancelled.push(g);
        continue;
      }
      if (s === "completed") {
        past.push(g);
        continue;
      }

      if (t === null) {
        other.push(g);
        continue;
      }

      if (t >= now) upcoming.push(g);
      else past.push(g);
    }

    return { drafts, upcoming, past, cancelled, other, all: gigs };
  }, [gigs]);

  const emptyState = (text: string) => (
    <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );

  const handleOpenGig = (gigId: string) => {
    setSelectedGigId(gigId);
    setDialogOpen(true);
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Minhas Gigs</h1>
            <p className="mt-1 text-sm text-white/85">
              Gerencie suas gigs e acompanhe seus status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/15"
              onClick={() => load({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>

            <Button
              onClick={() => router.push("/dashboard/gigs/new")}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Gig
            </Button>
          </div>
        </div>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-red-600">
          {errorMsg}
        </div>
      ) : null}

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Passadas</TabsTrigger>
          <TabsTrigger value="drafts">Rascunhos</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {loading ? emptyState("Carregando gigs...") : null}
          {!loading && partitions.upcoming.length === 0
            ? emptyState("Nenhuma gig próxima.")
            : partitions.upcoming.map((gig) => (
                <GigCard key={gig.id} gig={gig} onOpen={handleOpenGig} />
              ))}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {loading ? emptyState("Carregando gigs...") : null}
          {!loading && partitions.past.length === 0
            ? emptyState("Nenhuma gig passada.")
            : partitions.past.map((gig) => (
                <GigCard key={gig.id} gig={gig} onOpen={handleOpenGig} />
              ))}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-3">
          {loading ? emptyState("Carregando gigs...") : null}
          {!loading && partitions.drafts.length === 0
            ? emptyState("Nenhum rascunho.")
            : partitions.drafts.map((gig) => (
                <GigCard key={gig.id} gig={gig} onOpen={handleOpenGig} />
              ))}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-3">
          {loading ? emptyState("Carregando gigs...") : null}
          {!loading && partitions.cancelled.length === 0
            ? emptyState("Nenhuma gig cancelada.")
            : partitions.cancelled.map((gig) => (
                <GigCard key={gig.id} gig={gig} onOpen={handleOpenGig} />
              ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {loading ? emptyState("Carregando gigs...") : null}
          {!loading && partitions.all.length === 0
            ? emptyState("Nenhuma gig encontrada.")
            : partitions.all.map((gig) => (
                <GigCard key={gig.id} gig={gig} onOpen={handleOpenGig} />
              ))}

          {!loading && partitions.other.length > 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-muted-foreground">
              Observação: {partitions.other.length} gig(s) sem{" "}
              <code>start_time</code> aparecem em “Todas”.
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <GigDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gigId={selectedGigId}
      />
    </section>
  );
}

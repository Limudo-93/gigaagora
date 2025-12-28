"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import GigCard from "./GigCard";

type DbGigStatus = "draft" | "open" | "in_progress" | "completed" | "cancelled" | string;

export type GigRow = {
  id: string;
  contractor_id: string;

  title: string | null;
  location_name: string | null;
  address_text: string | null;
  timezone: string | null;
  start_time: string | null; // timestamptz
  end_time: string | null; // timestamptz
  show_minutes: number | null;
  break_minutes: number | null;

  status: DbGigStatus | null;
  created_at?: string | null;
};

type ContractorProfileRow = {
  contractor_id: string; // ✅ NÃO É "id"
  user_id: string;
  project_name: string | null;
};

const TABS = [
  { value: "rascunho", label: "Rascunho", db: "draft" },
  { value: "abertos", label: "Abertos", db: "open" },
  { value: "andamento", label: "Em andamento", db: "in_progress" },
  { value: "concluidos", label: "Concluídos", db: "completed" },
  { value: "cancelados", label: "Cancelados", db: "cancelled" },
] as const;

export default function GigsTabs({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchContractorId(uid: string) {
    const { data, error } = await supabase
      .from("contractor_profiles")
      .select("contractor_id,user_id,project_name")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;

    const row = data as ContractorProfileRow | null;
    return row?.contractor_id ?? null;
  }

  async function fetchMyGigs(cId: string) {
    const { data, error } = await supabase
      .from("gigs")
      .select(
        "id,contractor_id,title,location_name,address_text,timezone,start_time,end_time,show_minutes,break_minutes,status,created_at"
      )
      .eq("contractor_id", cId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as GigRow[];
  }

  async function refresh() {
    if (!userId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cId = contractorId ?? (await fetchContractorId(userId));

      if (!cId) {
        setContractorId(null);
        setGigs([]);
        setErrorMsg("Complete seu perfil de contratante para criar e ver gigs.");
        return;
      }

      setContractorId(cId);

      const rows = await fetchMyGigs(cId);
      setGigs(rows);
    } catch (e: any) {
      console.error("GigsTabs refresh error:", e);
      setErrorMsg(e?.message ?? "Erro ao carregar gigs.");
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // realtime (opcional): atualiza quando mudar gig do contractor
  useEffect(() => {
    if (!contractorId) return;

    const ch = supabase
      .channel(`rt:gigs:${contractorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gigs",
          filter: `contractor_id=eq.${contractorId}`,
        },
        async () => {
          await refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId]);

  const byTab = useMemo(() => {
    const m = new Map<string, GigRow[]>();
    for (const t of TABS) m.set(t.value, []);

    for (const g of gigs) {
      const status = (g.status ?? "").toString();
      const tab = TABS.find((t) => t.db === status)?.value ?? "rascunho";
      m.get(tab)!.push(g);
    }
    return m;
  }, [gigs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.value] = (byTab.get(t.value) ?? []).length;
    return c;
  }, [byTab]);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Meus Gigs</h2>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/15"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>

          <Button onClick={() => (window.location.href = "/gigs/new")}>
            + Criar Nova Gig
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          {errorMsg}
        </div>
      ) : null}

      <Tabs defaultValue="rascunho">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {counts[tab.value] ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-2 text-[11px] font-semibold text-black">
                  {counts[tab.value]}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => {
          const list = byTab.get(tab.value) ?? [];
          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando gigs...</p>
              ) : list.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma gig aqui.</p>
              ) : (
                <div className="space-y-3">
                  {list.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

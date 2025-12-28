"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import GigCard from "./GigCard";

type GigRow = {
  id: string;
  title: string | null;
  location_name: string | null;
  address_text: string | null;
  start_time: string | null; // timestamptz
  status: string | null; // USER-DEFINED (enum)
};

type TabDef = {
  value: string; // ui value
  label: string;
  dbStatus: string; // status value in DB
};

const TABS: TabDef[] = [
  { value: "rascunho", label: "Rascunho", dbStatus: "draft" },
  { value: "abertos", label: "Abertos", dbStatus: "open" },
  { value: "andamento", label: "Em andamento", dbStatus: "in_progress" },
  { value: "concluidos", label: "Concluídos", dbStatus: "completed" },
  { value: "cancelados", label: "Cancelados", dbStatus: "cancelled" },
];

export default function GigsTabs() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);

  const [userId, setUserId] = useState<string | null>(null);

  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const active = useMemo(() => {
    return TABS.find((t) => t.value === activeTab) ?? TABS[0];
  }, [activeTab]);

  async function ensureUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setUserId(null);
      setErrorMsg("Faça login novamente para carregar gigs.");
      return null;
    }
    const uid = data?.user?.id ?? null;
    setUserId(uid);
    if (!uid) setErrorMsg("Faça login novamente para carregar gigs.");
    return uid;
  }

  async function fetchGigs(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;

    if (!silent) setLoading(true);
    else setRefreshing(true);

    setErrorMsg(null);

    const uid = userId ?? (await ensureUser());
    if (!uid) {
      if (!silent) setLoading(false);
      else setRefreshing(false);
      return;
    }

    // 🔥 IMPORTANTE:
    // Aqui a gente assume (pelo seu schema) que:
    // gigs.contractor_id = profiles.id (ou seja, o próprio user.id)
    const { data, error } = await supabase
      .from("gigs")
      .select("id,title,location_name,address_text,start_time,status")
      .eq("contractor_id", uid)
      .eq("status", active.dbStatus)
      .order("created_at", { ascending: false });

    if (error) {
      setGigs([]);
      setErrorMsg(error.message ?? "Erro ao carregar gigs.");
    } else {
      setGigs((data ?? []) as GigRow[]);
    }

    if (!silent) setLoading(false);
    else setRefreshing(false);
  }

  // pega user e carrega a primeira vez + quando troca aba
  useEffect(() => {
    (async () => {
      const uid = await ensureUser();
      if (!uid) {
        setLoading(false);
        return;
      }
      await fetchGigs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Meus Gigs</h2>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/15"
            onClick={() => fetchGigs({ silent: true })}
            disabled={loading || refreshing}
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>

          <Button
            className="bg-white text-black hover:bg-white/90"
            onClick={() => router.push("/gigs/new")}
          >
            + Criar Nova Gig
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          {errorMsg}
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="bg-black/10">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {loading ? (
              <p className="text-sm text-white/60">Carregando gigs...</p>
            ) : gigs.length === 0 ? (
              <p className="text-sm text-white/60">Nenhuma gig aqui.</p>
            ) : (
              <div className="space-y-3">
                {gigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type GigRow = {
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
  status: string | null; // enum/text
  created_at?: string | null;
  updated_at?: string | null;
};

type TabKey = "draft" | "open" | "in_progress" | "completed" | "cancelled";

// Mapeia os nomes bonitos das abas -> status no banco
const TAB_LABELS: Record<TabKey, string> = {
  draft: "Rascunho",
  open: "Abertos",
  in_progress: "Em andamento",
  completed: "Concluídos",
  cancelled: "Cancelados",
};

function fmtDateBR(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function fmtTimeBR(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Se você tem “gigs.created_by_musician” e quer mostrar pro músico também,
// dá pra ampliar o filtro. Por enquanto: “meus gigs” = contractor_id = userId.
export default function MyGigs(props: { userId: string }) {
  const { userId } = props;

  const [tab, setTab] = useState<TabKey>("draft");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [rows, setRows] = useState<GigRow[]>([]);

  const filtered = useMemo(() => {
    return rows.filter((g) => (g.status ?? "") === tab);
  }, [rows, tab]);

  async function fetchMyGigs() {
    if (!userId) return;

    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("gigs")
      .select(
        `
        id,
        contractor_id,
        title,
        location_name,
        address_text,
        timezone,
        start_time,
        end_time,
        show_minutes,
        break_minutes,
        status,
        created_at,
        updated_at
      `
      )
      .eq("contractor_id", userId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("fetchMyGigs error:", error);
      setRows([]);
      setErrorMsg("Não foi possível carregar seus gigs. Faça login novamente e tente de novo.");
      setLoading(false);
      return;
    }

    setRows((data ?? []) as GigRow[]);
    setLoading(false);
  }

  async function cancelGig(gigId: string) {
    try {
      setBusyId(gigId);
      setErrorMsg(null);

      // ✅ RPC recomendada (ver SQL abaixo)
      const { data, error } = await supabase.rpc("rpc_cancel_gig", {
        p_gig_id: gigId,
      });

      if (error) throw error;

      // Atualiza no state sem refetch pesado
      setRows((prev) =>
        prev.map((g) => (g.id === gigId ? { ...g, status: "cancelled" } : g))
      );

      return data;
    } catch (e: any) {
      console.error("cancelGig error:", e);
      setErrorMsg("Não foi possível cancelar este gig.");
      throw e;
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    if (!userId) return;
    fetchMyGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Meus Gigs</h2>

        <Button
          variant="secondary"
          className="bg-white/10 text-white hover:bg-white/15"
          onClick={fetchMyGigs}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Atualizar"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-white/5 p-2">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-white text-black"
                  : "bg-white/0 text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {TAB_LABELS[k]}
            </button>
          );
        })}
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-white/60">Carregando gigs...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/60">Nenhum gig neste status.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const title = g.location_name ?? "Local não informado";
            const date = fmtDateBR(g.start_time);
            const time = fmtTimeBR(g.start_time);
            const showTitle = g.title ?? "Show";

            return (
              <div
                key={g.id}
                className="rounded-2xl border border-white/10 bg-black/10 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        {showTitle}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        {TAB_LABELS[(g.status as TabKey) ?? "draft"] ?? (g.status ?? "—")}
                      </span>
                    </div>

                    <div className="text-lg font-semibold text-white">{title}</div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70">
                      <span>📅 {date}</span>
                      <span>🕘 {time}</span>
                      {g.address_text ? <span>📍 {g.address_text}</span> : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 md:justify-end">
                    <Button
                      variant="secondary"
                      className="bg-white/10 text-white hover:bg-white/15"
                      onClick={() => {
                        // TODO: navegação real
                        // router.push(`/gigs/${g.id}/edit`)
                        console.log("editar", g.id);
                      }}
                    >
                      Editar
                    </Button>

                    <Button
                      variant="secondary"
                      className="bg-white/10 text-white hover:bg-white/15"
                      onClick={() => {
                        // TODO: navegar para candidatos
                        console.log("candidatos", g.id);
                      }}
                    >
                      Candidatos
                    </Button>

                    <Button
                      variant="secondary"
                      className="bg-white/10 text-white hover:bg-white/15"
                      onClick={() => {
                        // TODO: navegar para chat
                        console.log("chat", g.id);
                      }}
                    >
                      Chat
                    </Button>

                    {/* Cancelar só faz sentido quando NÃO está cancelado/concluído */}
                    {g.status !== "cancelled" && g.status !== "completed" ? (
                      <Button
                        className="bg-[#7b2b24] text-white hover:bg-[#8a332b]"
                        onClick={() => cancelGig(g.id)}
                        disabled={busyId === g.id}
                      >
                        {busyId === g.id ? "..." : "Cancelar"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

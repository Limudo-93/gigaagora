"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type GigRow = {
  id: string;
  title: string | null;
  location_name: string | null;
  address_text: string | null;
  timezone: string | null;
  start_time: string | null; // timestamptz
  end_time: string | null; // timestamptz
  show_minutes: number | null;
  break_minutes: number | null;
  status: string | null;
};

type GigRoleRow = {
  id: string;
  instrument: string | null;
  quantity: number | null;
  desired_genres: string[] | null; // text[]
  desired_skills: string[] | null; // text[]
  desired_setup: string | null;
  desired_return: string | null;
  notes: string | null;
};

export type PendingInviteVM = {
  id: string;
  gig_id: string;
  gig_role_id: string;
  contractor_id: string;
  musician_id: string;
  status: string; // invite_status enum
  invited_at: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  warned_short_gap: boolean | null;
  warned_short_gap_minutes: number | null;

  // populated client-side (optional)
  gigs?: GigRow | null;
  gig_roles?: GigRoleRow | null;
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

export default function PendingInvites(props: {
  userId?: string; // pode vir do server
  initialInvites?: PendingInviteVM[];
}) {
  const mountedRef = useRef(true);

  // ✅ se vier [] do server, tratamos como "não tem initial real"
  const hasInitial =
    Array.isArray(props.initialInvites) && props.initialInvites.length > 0;

  const [invites, setInvites] = useState<PendingInviteVM[]>(
    props.initialInvites ?? []
  );
  const [loading, setLoading] = useState<boolean>(!hasInitial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<PendingInviteVM | null>(null);

  // auth/session state
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const effectiveUserId = props.userId || sessionUserId;

  const [authRequired, setAuthRequired] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const count = invites.length;

  const orderedInvites = useMemo(() => {
    return [...invites].sort((a, b) => {
      const da = a.invited_at ? new Date(a.invited_at).getTime() : 0;
      const db = b.invited_at ? new Date(b.invited_at).getTime() : 0;
      return db - da;
    });
  }, [invites]);

  const hydrateDetails = useCallback(
    async (baseInvites: PendingInviteVM[]) => {
      // tenta enriquecer com gigs/gig_roles em chamadas separadas (evita join quebrar por RLS)
      const gigIds = Array.from(
        new Set(baseInvites.map((i) => i.gig_id).filter(Boolean))
      );
      const roleIds = Array.from(
        new Set(baseInvites.map((i) => i.gig_role_id).filter(Boolean))
      );

      let gigsMap = new Map<string, GigRow>();
      let rolesMap = new Map<string, GigRoleRow>();

      if (gigIds.length) {
        const { data: gigsData, error: gigsErr } = await supabase
          .from("gigs")
          .select(
            "id,title,location_name,address_text,timezone,start_time,end_time,show_minutes,break_minutes,status"
          )
          .in("id", gigIds);

        // se der RLS aqui, a gente só ignora e segue com invites crus
        if (!gigsErr && gigsData) {
          for (const g of gigsData as GigRow[]) gigsMap.set(g.id, g);
        }
      }

      if (roleIds.length) {
        const { data: rolesData, error: rolesErr } = await supabase
          .from("gig_roles")
          .select(
            "id,instrument,quantity,desired_genres,desired_skills,desired_setup,desired_return,notes"
          )
          .in("id", roleIds);

        if (!rolesErr && rolesData) {
          for (const r of rolesData as GigRoleRow[]) rolesMap.set(r.id, r);
        }
      }

      return baseInvites.map((i) => ({
        ...i,
        gigs: gigsMap.get(i.gig_id) ?? i.gigs ?? null,
        gig_roles: rolesMap.get(i.gig_role_id) ?? i.gig_roles ?? null,
      }));
    },
    []
  );

  const fetchPendingInvites = useCallback(async () => {
    if (!effectiveUserId) return;

    setLoading(true);
    setErrorMsg(null);
    setAuthRequired(false);

    // segurança: confirma sessão válida (se não tiver, mostra "faça login")
    const { data: sessionRes } = await supabase.auth.getSession();
    const authedId = sessionRes?.session?.user?.id ?? null;
    if (!authedId) {
      if (mountedRef.current) {
        setAuthRequired(true);
        setInvites([]);
        setLoading(false);
      }
      return;
    }

    // Query mínima (NUNCA quebra por join)
    const { data, error } = await supabase
      .from("invites")
      .select(
        `
        id,
        gig_id,
        gig_role_id,
        contractor_id,
        musician_id,
        status,
        invited_at,
        responded_at,
        accepted_at,
        cancelled_at,
        warned_short_gap,
        warned_short_gap_minutes
      `
      )
      .eq("status", "pending")
      .or(`musician_id.eq.${effectiveUserId},contractor_id.eq.${effectiveUserId}`)
      .order("invited_at", { ascending: false });

    if (error) {
      // IMPORTANT: log completo
      console.error("fetchPendingInvites error raw:", error);
      console.error(
        "fetchPendingInvites error JSON:",
        JSON.stringify(error, null, 2)
      );
      console.error("fetchPendingInvites error fields:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });

      if (mountedRef.current) {
        // se for RLS / permission denied, mostra msg amigável
        const msg =
          (error as any)?.message ||
          (error as any)?.details ||
          "Erro ao carregar convites.";
        setErrorMsg(msg);
        // heurística: se parecer auth
        if (
          String((error as any)?.code || "").includes("401") ||
          String(msg).toLowerCase().includes("jwt") ||
          String(msg).toLowerCase().includes("unauthorized")
        ) {
          setAuthRequired(true);
        }
        setInvites([]);
        setLoading(false);
      }
      return;
    }

    const baseInvites = (data ?? []) as PendingInviteVM[];

    // Enriquecer com detalhes (sem quebrar se gigs/gig_roles tiverem RLS)
    const hydrated = await hydrateDetails(baseInvites);

    if (mountedRef.current) {
      setInvites(hydrated);
      setLoading(false);
    }
  }, [effectiveUserId, hydrateDetails]);

  async function acceptInvite(inviteId: string) {
    try {
      setBusyId(inviteId);
      const { error } = await supabase.rpc("rpc_accept_invite", {
        p_invite_id: inviteId,
      });
      if (error) throw error;
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e) {
      console.error("acceptInvite error:", e);
      throw e;
    } finally {
      setBusyId(null);
    }
  }

  async function declineInvite(inviteId: string) {
    try {
      setBusyId(inviteId);
      const { error } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
      });
      if (error) throw error;
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e) {
      console.error("declineInvite error:", e);
      throw e;
    } finally {
      setBusyId(null);
    }
  }

  function openDetails(invite: PendingInviteVM) {
    setSelected(invite);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelected(null);
  }

  // session + user id
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const id = data?.session?.user?.id ?? null;
      if (!mountedRef.current) return;
      setSessionUserId(id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const id = session?.user?.id ?? null;
      if (!mountedRef.current) return;
      setSessionUserId(id);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // initial load
  useEffect(() => {
    if (!effectiveUserId) return;

    // se não veio initial OU veio vazio, faz fetch
    if (!props.initialInvites || props.initialInvites.length === 0) {
      fetchPendingInvites();
    } else {
      // veio do server
      setInvites(props.initialInvites);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  // Realtime: só liga quando tiver user id
  useEffect(() => {
    if (!effectiveUserId) return;

    const chMusician = supabase
      .channel(`rt:invites:musician:${effectiveUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invites",
          filter: `musician_id=eq.${effectiveUserId}`,
        },
        async () => {
          await fetchPendingInvites();
        }
      )
      .subscribe();

    const chContractor = supabase
      .channel(`rt:invites:contractor:${effectiveUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invites",
          filter: `contractor_id=eq.${effectiveUserId}`,
        },
        async () => {
          await fetchPendingInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chMusician);
      supabase.removeChannel(chContractor);
    };
  }, [effectiveUserId, fetchPendingInvites]);

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Convites Pendentes</h2>
            {count > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-2 text-xs font-semibold text-black">
                {count}
              </span>
            )}
          </div>

          <Button
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/15"
            onClick={() => fetchPendingInvites()}
            disabled={loading || !effectiveUserId}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {authRequired ? (
          <p className="text-sm text-white/60">
            Faça login novamente para carregar convites.
          </p>
        ) : loading ? (
          <p className="text-sm text-white/60">Carregando convites...</p>
        ) : errorMsg ? (
          <p className="text-sm text-white/60">
            Erro ao carregar convites: <span className="text-white">{errorMsg}</span>
          </p>
        ) : orderedInvites.length === 0 ? (
          <p className="text-sm text-white/60">Nenhum convite pendente.</p>
        ) : (
          <div className="space-y-4">
            {orderedInvites.map((invite) => {
              const gig = invite.gigs ?? null;
              const role = invite.gig_roles ?? null;

              const genre = role?.desired_genres?.[0] ?? "Evento";
              const title = gig?.location_name ?? "Local não informado";
              const date = fmtDateBR(gig?.start_time);
              const time = fmtTimeBR(gig?.start_time);

              const warn =
                invite.warned_short_gap && invite.warned_short_gap_minutes
                  ? `${invite.warned_short_gap_minutes}h`
                  : null;

              return (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-white/10 bg-black/10 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          {genre}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          {gig?.title ?? "Show"}
                        </span>

                        {warn && (
                          <span className="ml-auto rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
                            {warn}
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-semibold text-white">{title}</div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70">
                        <span>📅 {date}</span>
                        <span>🕘 {time}</span>
                        {role?.instrument ? <span>🎸 {role.instrument}</span> : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:pt-1">
                      <Button
                        className="bg-white text-black hover:bg-white/90"
                        onClick={() => acceptInvite(invite.id)}
                        disabled={busyId === invite.id}
                      >
                        {busyId === invite.id ? "..." : "Aceitar"}
                      </Button>

                      <Button
                        variant="secondary"
                        className="bg-white/10 text-white hover:bg-white/15"
                        onClick={() => declineInvite(invite.id)}
                        disabled={busyId === invite.id}
                      >
                        {busyId === invite.id ? "..." : "Recusar"}
                      </Button>

                      <button
                        className="px-2 text-sm font-semibold text-white/80 hover:text-white"
                        onClick={() => openDetails(invite)}
                        type="button"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL */}
      {detailsOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1020] p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-semibold">Detalhes do Convite</div>
                <div className="mt-1 text-sm text-white/60">
                  ID: <span className="font-mono">{selected.id}</span>
                </div>
              </div>

              <button
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                onClick={closeDetails}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/80">Gig</div>
                <div className="mt-2 text-base font-semibold">
                  {selected.gigs?.title ?? "—"}
                </div>
                <div className="mt-2 text-sm text-white/70">
                  <div>📍 {selected.gigs?.location_name ?? "—"}</div>
                  <div className="mt-1">🗺️ {selected.gigs?.address_text ?? "—"}</div>
                  <div className="mt-1">
                    📅 {fmtDateBR(selected.gigs?.start_time)} • 🕘{" "}
                    {fmtTimeBR(selected.gigs?.start_time)}
                  </div>
                  {selected.gigs?.show_minutes != null && (
                    <div className="mt-1">⏱️ Show: {selected.gigs.show_minutes} min</div>
                  )}
                  {selected.gigs?.break_minutes != null && (
                    <div className="mt-1">
                      ☕ Intervalo: {selected.gigs.break_minutes} min
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/80">Vaga / Requisitos</div>
                <div className="mt-2 text-sm text-white/70">
                  <div>🎸 Instrumento: {selected.gig_roles?.instrument ?? "—"}</div>
                  <div className="mt-1">👥 Quantidade: {selected.gig_roles?.quantity ?? "—"}</div>

                  {selected.gig_roles?.desired_genres?.length ? (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-white/60">Gêneros</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.gig_roles.desired_genres.map((g) => (
                          <span key={g} className="rounded-full bg-white/10 px-2 py-1 text-xs">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selected.gig_roles?.desired_skills?.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-white/60">Skills</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.gig_roles.desired_skills.map((s) => (
                          <span key={s} className="rounded-full bg-white/10 px-2 py-1 text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selected.gig_roles?.notes ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-white/60">Notas</div>
                      <div className="mt-1 rounded-lg bg-black/20 p-3 text-sm text-white/80">
                        {selected.gig_roles.notes}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/60">
                Status: <span className="font-semibold text-white">{selected.status}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={async () => {
                    await acceptInvite(selected.id);
                    closeDetails();
                  }}
                  disabled={busyId === selected.id}
                >
                  {busyId === selected.id ? "..." : "Aceitar"}
                </Button>

                <Button
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/15"
                  onClick={async () => {
                    await declineInvite(selected.id);
                    closeDetails();
                  }}
                  disabled={busyId === selected.id}
                >
                  {busyId === selected.id ? "..." : "Recusar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

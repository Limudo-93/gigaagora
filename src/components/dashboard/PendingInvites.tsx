"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, DollarSign, Check, X, Eye, Download, User, AlertTriangle } from "lucide-react";
import InviteDetailsDialog from "./InviteDetailsDialog";

type PendingInviteRow = {
  invite_id: string;
  status: string | null;
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
  flyer_url: string | null;
  contractor_name: string | null;
  cache: number | null;
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

function buildLocationText(r: PendingInviteRow) {
  const parts = [
    r.location_name,
    r.address_text,
    r.city,
    r.state ? `- ${r.state}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

export default function PendingInvites({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<PendingInviteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCommitmentWarning, setShowCommitmentWarning] = useState(false);
  const [acceptedInviteTitle, setAcceptedInviteTitle] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const count = useMemo(() => items.length, [items]);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    console.log("PendingInvites: fetchPending called with userId:", userId);

    try {
      // Tenta usar a RPC primeiro
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_pending_invites");

      if (rpcError) {
        console.error("RPC fetchPending error:", rpcError);
        console.error("Error details:", {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
        });

        // Se a RPC não existir (code 42883) ou tiver problemas, tenta query direta
        if (rpcError.code === "42883" || rpcError.code === "P0001") {
          console.log("RPC não disponível, tentando query direta...");
          console.log("PendingInvites: Querying invites for musician_id:", userId);
          
          // Fallback: busca direta da tabela invites com join em gigs
          const { data: directData, error: directError } = await supabase
            .from("invites")
            .select(`
              id,
              status,
              created_at,
              gig_id,
              gig_role_id,
              gigs(
                id,
                title,
                start_time,
                end_time,
                location_name,
                address_text,
                city,
                state,
                flyer_url,
                contractor_id,
                profiles!gigs_contractor_id_fkey(
                  display_name
                )
              ),
              gig_roles(
                instrument,
                cache
              )
            `)
            .eq("musician_id", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          console.log("PendingInvites: Direct query result:", { directData, directError });

          if (directError) {
            console.error("Direct query error:", directError);
            setErrorMsg(
              `Erro ao carregar convites: ${directError.message}${directError.hint ? ` (${directError.hint})` : ""}. Verifique se as tabelas 'invites', 'gigs' e 'gig_roles' existem e têm as colunas corretas.`
            );
            setItems([]);
            setLoading(false);
            return;
          }

          // Transforma os dados para o formato esperado
          const transformed = (directData ?? []).map((invite: any) => {
            const gig = Array.isArray(invite.gigs) ? invite.gigs[0] : invite.gigs;
            const role = Array.isArray(invite.gig_roles) ? invite.gig_roles[0] : invite.gig_roles;
            const contractorProfile = Array.isArray(gig?.profiles) ? gig?.profiles[0] : gig?.profiles;
            
            return {
              invite_id: invite.id,
              status: invite.status,
              created_at: invite.created_at,
              gig_id: invite.gig_id,
              gig_title: gig?.title ?? null,
              start_time: gig?.start_time ?? null,
              end_time: gig?.end_time ?? null,
              location_name: gig?.location_name ?? null,
              address_text: gig?.address_text ?? null,
              city: gig?.city ?? null,
              state: gig?.state ?? null,
              instrument: role?.instrument ?? null,
              flyer_url: gig?.flyer_url ?? null,
              contractor_name: contractorProfile?.display_name ?? null,
              cache: role?.cache ?? null,
            };
          });

          console.log("PendingInvites loaded (direct):", transformed.length, "invites");
          console.log("PendingInvites: Transformed data:", transformed);
          setItems(transformed);
          setLoading(false);
          return;
        }

        // Outro tipo de erro da RPC - mas ainda mostra os dados se a query direta funcionar
        console.warn("RPC error, but trying direct query as fallback...");
        
        // Tenta query direta mesmo se não for erro de função não encontrada
        const { data: directData, error: directError } = await supabase
          .from("invites")
          .select(`
            id,
            status,
            created_at,
            gig_id,
            gig_role_id,
            gigs(
              id,
              title,
              start_time,
              end_time,
              location_name,
              address_text,
              city,
              state
            ),
            gig_roles(
              instrument
            )
          `)
          .eq("musician_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (directError) {
          console.error("Direct query error:", directError);
          setErrorMsg(
            `Erro ao carregar convites: ${rpcError.message}. A RPC pode ter problemas no banco de dados. Verifique o console para mais detalhes.`
          );
          setItems([]);
          setLoading(false);
          return;
        }

        // Transforma os dados
        const transformed: PendingInviteRow[] = (directData ?? []).map((invite: any) => {
          const gig = Array.isArray(invite.gigs) ? invite.gigs[0] : invite.gigs;
          const role = Array.isArray(invite.gig_roles) ? invite.gig_roles[0] : invite.gig_roles;
          
          return {
            invite_id: invite.id,
            status: invite.status,
            created_at: invite.created_at,
            gig_id: invite.gig_id,
            gig_title: gig?.title ?? null,
            start_time: gig?.start_time ?? null,
            end_time: gig?.end_time ?? null,
            location_name: gig?.location_name ?? null,
            address_text: gig?.address_text ?? null,
            city: gig?.city ?? null,
            state: gig?.state ?? null,
            instrument: role?.instrument ?? null,
            flyer_url: gig?.flyer_url ?? null,
            contractor_name: null, // Não disponível na query direta
            cache: null, // Não disponível na query direta
          };
        });

        console.log("PendingInvites loaded (direct fallback):", transformed.length, "invites");
        setItems(transformed);
        setLoading(false);
        return;
      }

      console.log("PendingInvites loaded (RPC):", rpcData?.length ?? 0, "invites");
      setItems((rpcData ?? []) as PendingInviteRow[]);
      setLoading(false);
    } catch (e: any) {
      console.error("fetchPending exception:", e);
      setErrorMsg(e?.message ?? "Erro inesperado ao carregar convites.");
      setItems([]);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void fetchPending();
    } else {
      setErrorMsg("Usuário não identificado.");
      setLoading(false);
    }
  }, [userId, fetchPending]);

  // Contador de 5 segundos para o dialog de aviso
  useEffect(() => {
    if (showCommitmentWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showCommitmentWarning, countdown]);

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      setBusyId(inviteId);
      setErrorMsg(null);

      try {
        // Chama a RPC que retorna JSON
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_accept_invite", {
          p_invite_id: inviteId,
        });

        if (rpcError) {
          console.error("RPC acceptInvite error:", rpcError);
          setErrorMsg(`Erro ao aceitar convite: ${rpcError.message}`);
          setBusyId(null);
          return;
        }

        // A RPC retorna JSON com {ok: true/false, message: '...'}
        if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData) {
          if (!rpcData.ok) {
            const message = (rpcData as any)?.message || "Erro ao aceitar convite";
            console.error("RPC returned error:", message);
            setErrorMsg(message);
            setBusyId(null);
            return;
          }
          // ok === true, continua
        }

        // Sucesso
        console.log("Invite accepted successfully:", rpcData);
        
        // Buscar título da gig para mostrar no aviso
        const acceptedInvite = items.find((x) => x.invite_id === inviteId);
        if (acceptedInvite) {
          setAcceptedInviteTitle(acceptedInvite.gig_title || "esta gig");
        }
        
        // Mostrar aviso de compromisso e iniciar contador
        setCountdown(5);
        setShowCommitmentWarning(true);
        
        // remove da lista local
        setItems((prev) => prev.filter((x) => x.invite_id !== inviteId));
        setBusyId(null);
      } catch (err: any) {
        console.error("acceptInvite exception:", err);
        setErrorMsg(err?.message ?? "Erro inesperado ao aceitar convite.");
        setBusyId(null);
      }
    },
    [setItems]
  );

  const declineInvite = useCallback(async (inviteId: string) => {
    setBusyId(inviteId);
    setErrorMsg(null);

    try {
      // Chama a RPC (pode retornar JSON ou void)
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
      });

      if (rpcError) {
        console.error("RPC declineInvite error:", rpcError);
        setErrorMsg(`Erro ao recusar convite: ${rpcError.message}`);
        setBusyId(null);
        return;
      }

      // Se a RPC retornar JSON com {ok: false}, trata o erro
      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao recusar convite";
        console.error("RPC returned error:", message);
        setErrorMsg(message);
        setBusyId(null);
        return;
      }

      // Sucesso
      console.log("Invite declined successfully:", rpcData);
      setItems((prev) => prev.filter((x) => x.invite_id !== inviteId));
      setBusyId(null);
    } catch (err: any) {
      console.error("declineInvite exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao recusar convite.");
      setBusyId(null);
    }
  }, []);

  return (
    <section className="mt-4 md:mt-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          Convites Pendentes{" "}
          {count > 0 && (
            <Badge className="ml-2 text-xs md:text-sm">
              {count}
            </Badge>
          )}
        </h2>
      </div>

      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar convites:</p>
          <p className="mt-1">{errorMsg}</p>
          <p className="mt-2 text-xs opacity-75">
            Verifique o console do navegador (F12) para mais detalhes.
          </p>
        </div>
      ) : null}

      <Card>
        {loading ? (
          <CardContent className="text-center py-6 text-sm text-muted-foreground">
            Carregando convites...
          </CardContent>
        ) : items.length === 0 ? (
          <CardContent className="text-center py-6">
            <p className="text-sm font-medium text-foreground">Nenhum convite pendente</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você não tem convites aguardando resposta no momento.
            </p>
          </CardContent>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {items.slice(0, 3).map((r) => {
              const when = formatDateTimeBR(r.start_time);
              const location = buildLocationText(r);

              // Calcular horas restantes (exemplo: 48h)
              const hoursRemaining = r.start_time
                ? Math.ceil(
                    (new Date(r.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
                  )
                : null;

              const handleDownloadFlyer = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (r.flyer_url) {
                  const link = document.createElement("a");
                  link.href = r.flyer_url;
                  link.download = `${r.gig_title || "flyer"}.jpg`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              };

              return (
                <Card key={r.invite_id}>
                  {/* Miniatura do flyer ou logo padrão */}
                  <div className="mb-2 md:mb-3 relative group">
                    <div 
                      className={`relative w-full h-24 md:h-32 rounded-lg overflow-hidden border border-border ${r.flyer_url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                      onClick={r.flyer_url ? handleDownloadFlyer : undefined}
                      title={r.flyer_url ? "Clique para baixar o flyer" : undefined}
                    >
                      {r.flyer_url ? (
                        <>
                          <img
                            src={r.flyer_url}
                            alt={r.gig_title || "Flyer do evento"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-full p-2">
                              <Download className="h-4 w-4 text-card-foreground" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                          <div className="relative w-24 h-24">
                            <Image
                              src="/logo.png"
                              alt="Logo Chama o Músico"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags de gênero/tipo */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary">Sertanejo</Badge>
                    <Badge variant="secondary">Evento</Badge>
                    {hoursRemaining && hoursRemaining > 0 && hoursRemaining <= 48 && (
                      <Badge className="ml-auto">
                        {hoursRemaining}h
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Nome do Contractor */}
                      {r.contractor_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          <span>Publicado por: <span className="font-medium text-foreground">{r.contractor_name}</span></span>
                        </div>
                      )}

                      {/* Localização */}
                      <div className="text-sm font-medium text-foreground mb-2">
                        {location || "Local não informado"}
                      </div>

                      {/* Data, Hora e Valor */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        {when && (
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{when.split(" ")[0]}</span>
                          </div>
                        )}
                        {when && (
                          <div className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{when.split(" ")[1]}</span>
                          </div>
                        )}
                        {r.cache && (
                          <div className="inline-flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4" />
                            <span>R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.cache)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação - empilhados em mobile, lado a lado em desktop */}
                  <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button
                      onClick={() => acceptInvite(r.invite_id)}
                      disabled={busyId === r.invite_id}
                      size="sm"
                      className="flex-1 w-full sm:w-auto text-xs md:text-sm"
                    >
                      <Check className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                      Aceitar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => declineInvite(r.invite_id)}
                      disabled={busyId === r.invite_id}
                      size="sm"
                      className="flex-1 w-full sm:w-auto text-xs md:text-sm"
                    >
                      <X className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                      Recusar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Buscar dados completos do convite para o dialog
                        try {
                          // Busca o invite primeiro
                          const { data: inviteData, error: inviteError } = await supabase
                            .from("invites")
                            .select("*")
                            .eq("id", r.invite_id)
                            .single();

                          if (inviteError) throw inviteError;
                          if (!inviteData) throw new Error("Convite não encontrado");

                          // Busca a gig separadamente
                          const { data: gigData, error: gigError } = await supabase
                            .from("gigs")
                            .select("*")
                            .eq("id", inviteData.gig_id)
                            .single();

                          if (gigError) {
                            console.error("Error loading gig:", gigError);
                            throw new Error("Erro ao carregar dados da gig");
                          }

                          // Busca a role separadamente
                          const { data: roleData, error: roleError } = await supabase
                            .from("gig_roles")
                            .select("*")
                            .eq("id", inviteData.gig_role_id)
                            .single();

                          if (roleError) {
                            console.error("Error loading role:", roleError);
                            throw new Error("Erro ao carregar dados da vaga");
                          }

                          // Formata no formato esperado pelo dialog
                          const formattedInvite = {
                            ...inviteData,
                            gig: gigData,
                            role: roleData,
                          };
                          
                          console.log("Formatted invite for dialog:", formattedInvite);
                          setSelectedInvite(formattedInvite);
                          setDialogOpen(true);
                        } catch (err: any) {
                          console.error("Error loading invite details:", err);
                          setErrorMsg(`Erro ao carregar detalhes do convite: ${err.message}`);
                        }
                      }}
                      className="flex-1 w-full sm:w-auto text-xs md:text-sm"
                    >
                      <Eye className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              );
            })}
            {items.length > 3 && (
              <CardContent className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/gigs")}
                >
                  Ver todas as {items.length} convites
                </Button>
              </CardContent>
            )}
          </div>
        )}
      </Card>

      <InviteDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invite={selectedInvite}
        onAccept={() => {
          if (selectedInvite?.id) {
            acceptInvite(selectedInvite.id);
            setDialogOpen(false);
          }
        }}
        onDecline={() => {
          if (selectedInvite?.id) {
            declineInvite(selectedInvite.id);
            setDialogOpen(false);
          }
        }}
      />

      {/* Dialog de Aviso de Compromisso */}
      <Dialog 
        open={showCommitmentWarning} 
        onOpenChange={(open) => {
          // Só permite fechar se o contador chegou a 0
          if (!open && countdown === 0) {
            setShowCommitmentWarning(false);
            setCountdown(5);
          } else if (!open) {
            // Se tentar fechar antes do contador, não fecha
            setShowCommitmentWarning(true);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>
                Compromisso Confirmado
              </DialogTitle>
            </div>
            <DialogDescription>
              Você aceitou o convite para <strong>{acceptedInviteTitle || "esta gig"}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Importante:</strong> Sabemos que imprevistos acontecem, 
                mas é fundamental que você honre este compromisso. A confiança entre músicos e contratantes 
                é essencial para o funcionamento da plataforma.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Cancelamentos Frequentes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A frequência de cancelamentos, mesmo com antecedência, pode levar ao bloqueio 
                    temporário na plataforma.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Cancelamento com Menos de 24h
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Cancelamentos com menos de 24 horas até o início do evento</strong> resultam 
                    em bloqueio de <strong>7 dias</strong> para receber convites de novas gigs.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Ao continuar, você confirma que entendeu e concorda com estas políticas.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-6">
            {countdown > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="text-primary font-bold">{countdown}</span>
                </div>
                <span>Por favor, leia as informações acima antes de continuar</span>
              </div>
            )}
            <Button
              onClick={() => setShowCommitmentWarning(false)}
              disabled={countdown > 0}
              className="min-w-[200px]"
            >
              {countdown > 0 ? `Aguarde ${countdown}s` : "Entendi e Concordo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

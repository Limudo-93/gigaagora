"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, Clock, Download, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { downloadICS, CalendarEvent } from "@/lib/ics-utils";
import { useRouter } from "next/navigation";

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
};

type PendingInviteRow = {
  invite_id: string;
  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;
};

type DayStatus = "free" | "preferred" | "busy";

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

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayStatus(
  dayKey: string,
  confirmedGigs: ConfirmedGigRow[],
  pendingInvites: PendingInviteRow[]
): DayStatus {
  // Verifica se há shows confirmados neste dia
  const hasConfirmed = confirmedGigs.some((gig) => {
    if (!gig.start_time) return false;
    const gigDate = new Date(gig.start_time);
    return getDayKey(gigDate) === dayKey;
  });

  if (hasConfirmed) return "busy";

  // Verifica se há convites pendentes neste dia
  const hasPending = pendingInvites.some((invite) => {
    if (!invite.start_time) return false;
    const inviteDate = new Date(invite.start_time);
    return getDayKey(inviteDate) === dayKey;
  });

  if (hasPending) return "preferred";

  return "free";
}

export default function AgendaPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmedGigs, setConfirmedGigs] = useState<ConfirmedGigRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Busca o usuário atual
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    fetchUser();
  }, [router]);

  // Busca shows confirmados
  useEffect(() => {
    if (!userId) return;

    const fetchConfirmed = async () => {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_upcoming_confirmed_gigs");

        if (rpcError) {
          // Fallback: busca direta
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
            console.error("Error fetching confirmed gigs:", directError);
            setErrorMsg("Erro ao carregar shows confirmados.");
            setLoading(false);
            return;
          }

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
          }));

          setConfirmedGigs(transformed);
        } else {
          const sorted = (rpcData ?? []).sort((a: ConfirmedGigRow, b: ConfirmedGigRow) => {
            if (!a.start_time) return 1;
            if (!b.start_time) return -1;
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          });
          setConfirmedGigs(sorted as ConfirmedGigRow[]);
        }
      } catch (e: any) {
        console.error("fetchConfirmed exception:", e);
        setErrorMsg(e?.message ?? "Erro inesperado ao carregar shows confirmados.");
      }
    };

    fetchConfirmed();
  }, [userId]);

  // Busca convites pendentes
  useEffect(() => {
    if (!userId) return;

    const fetchPending = async () => {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_pending_invites");

        if (rpcError) {
          // Fallback: busca direta
          const { data: directData, error: directError } = await supabase
            .from("invites")
            .select(`
              id,
              gig_id,
              gigs(
                id,
                title,
                start_time,
                end_time
              )
            `)
            .eq("musician_id", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (directError) {
            console.error("Error fetching pending invites:", directError);
            return;
          }

          const transformed = (directData ?? []).map((invite: any) => {
            const gig = Array.isArray(invite.gigs) ? invite.gigs[0] : invite.gigs;
            return {
              invite_id: invite.id,
              gig_id: invite.gig_id,
              gig_title: gig?.title ?? null,
              start_time: gig?.start_time ?? null,
              end_time: gig?.end_time ?? null,
            };
          });

          setPendingInvites(transformed);
        } else {
          const transformed = (rpcData ?? []).map((invite: any) => ({
            invite_id: invite.invite_id,
            gig_id: invite.gig_id,
            gig_title: invite.gig_title,
            start_time: invite.start_time,
            end_time: invite.end_time,
          }));
          setPendingInvites(transformed);
        }
      } catch (e: any) {
        console.error("fetchPending exception:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [userId]);

  const handleDownloadICS = () => {
    const events: CalendarEvent[] = confirmedGigs
      .filter((gig) => gig.start_time && gig.end_time)
      .map((gig) => {
        const locationParts = [
          gig.location_name,
          gig.address_text,
          gig.city,
          gig.state,
        ].filter(Boolean);
        const location = locationParts.join(", ");

        return {
          title: gig.gig_title || "Show",
          startTime: gig.start_time!,
          endTime: gig.end_time!,
          location: location || undefined,
          description: `Show confirmado - ${gig.gig_title || "Show"}`,
        };
      });

    downloadICS(events, "agenda-chamaomusico.ics");
  };

  // Gera os dias do calendário
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date; status: DayStatus }> = [];

    // Preenche dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dayKey = getDayKey(date);
      days.push({
        date,
        status: getDayStatus(dayKey, confirmedGigs, pendingInvites),
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayKey = getDayKey(date);
      days.push({
        date,
        status: getDayStatus(dayKey, confirmedGigs, pendingInvites),
      });
    }

    // Preenche dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayKey = getDayKey(date);
      days.push({
        date,
        status: getDayStatus(dayKey, confirmedGigs, pendingInvites),
      });
    }

    return days;
  }, [currentMonth, confirmedGigs, pendingInvites]);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Obtém eventos de um dia específico
  const getDayEvents = (date: Date) => {
    const dayKey = getDayKey(date);
    const dayConfirmed = confirmedGigs.filter((gig) => {
      if (!gig.start_time) return false;
      const gigDate = new Date(gig.start_time);
      return getDayKey(gigDate) === dayKey;
    });
    const dayPending = pendingInvites.filter((invite) => {
      if (!invite.start_time) return false;
      const inviteDate = new Date(invite.start_time);
      return getDayKey(inviteDate) === dayKey;
    });
    return { confirmed: dayConfirmed, pending: dayPending };
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const formatDateBR = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualize seus shows confirmados e disponibilidade
            </p>
          </div>
          <Button
            onClick={handleDownloadICS}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Calendário (.ics)
          </Button>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Erro:</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        )}

        {/* Próximos Eventos */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-700">
                Carregando...
              </div>
            ) : confirmedGigs.length === 0 && pendingInvites.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-gray-900">
                  Nenhum evento próximo
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Você não tem shows confirmados ou convites pendentes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Todos os eventos ordenados por data */}
                {(() => {
                  // Combina e ordena todos os eventos
                  const allEvents = [
                    ...confirmedGigs.map((gig) => ({
                      ...gig,
                      type: "confirmed" as const,
                      sortDate: gig.start_time ? new Date(gig.start_time).getTime() : 0,
                    })),
                    ...pendingInvites.map((invite) => ({
                      ...invite,
                      type: "pending" as const,
                      sortDate: invite.start_time ? new Date(invite.start_time).getTime() : 0,
                    })),
                  ]
                    .filter((e) => e.sortDate > 0)
                    .sort((a, b) => a.sortDate - b.sortDate);

                  return allEvents.map((event) => {
                    const isConfirmed = event.type === "confirmed";
                    const when = formatDateTimeBR(event.start_time);
                    const location = isConfirmed
                      ? buildLocationText(event as ConfirmedGigRow)
                      : null;
                    const dateParts = when ? when.split(" ") : null;
                    const dayMonth = dateParts
                      ? dateParts[0].split("/").slice(0, 2).join("/")
                      : null;
                    const monthName = dateParts
                      ? new Date(event.start_time || "").toLocaleDateString("pt-BR", {
                          month: "short",
                        }).toUpperCase()
                      : null;

                    const key = isConfirmed
                      ? (event as ConfirmedGigRow).confirmation_id
                      : (event as PendingInviteRow).invite_id;

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                          isConfirmed ? "border-gray-200" : "border-yellow-200"
                        }`}
                        onClick={() => {
                          if (event.start_time) {
                            handleDayClick(new Date(event.start_time));
                          }
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {dayMonth && monthName && (
                            <div
                              className={`flex flex-col items-center justify-center text-white rounded-lg px-4 py-3 min-w-[80px] ${
                                isConfirmed ? "bg-orange-500" : "bg-yellow-500"
                              }`}
                            >
                              <div className="text-2xl font-bold">{dayMonth.split("/")[0]}</div>
                              <div className="text-sm font-medium">{monthName}</div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge
                                className={`text-white text-xs ${
                                  isConfirmed ? "bg-orange-500" : "bg-yellow-500"
                                }`}
                              >
                                {isConfirmed ? "Confirmada" : "Pendente"}
                              </Badge>
                            </div>
                            <div className="text-sm font-semibold truncate text-gray-900 mb-1">
                              {event.gig_title ?? "Show"}
                            </div>
                            {location && (
                              <div className="text-xs text-gray-700 mb-1">
                                {location}
                              </div>
                            )}
                            {dateParts && (
                              <div className="text-xs text-gray-700">
                                {dateParts[1]}{" "}
                                {isConfirmed && (event as ConfirmedGigRow).instrument
                                  ? `• ${(event as ConfirmedGigRow).instrument}`
                                  : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendário Mensal */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Calendário</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-8 px-3"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </p>
          </CardHeader>
          <CardContent>
            {/* Grade do Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cabeçalho dos dias da semana */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Dias do calendário */}
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === currentMonth.getMonth();
                const isToday =
                  getDayKey(day.date) === getDayKey(new Date()) &&
                  isCurrentMonth;

                const statusColors = {
                  free: "bg-green-500",
                  preferred: "bg-yellow-500",
                  busy: "bg-red-500",
                };

                const dayEvents = getDayEvents(day.date);
                const eventCount = dayEvents.confirmed.length + dayEvents.pending.length;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayClick(day.date)}
                    className={`
                      aspect-square p-1 border border-gray-200 rounded
                      ${!isCurrentMonth ? "opacity-40 bg-gray-50" : "bg-white"}
                      ${isToday ? "ring-2 ring-orange-500" : ""}
                      flex flex-col items-center justify-center
                      hover:bg-orange-50 hover:border-orange-300 transition-colors
                      cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                      ${day.status !== "free" ? "hover:shadow-sm" : ""}
                    `}
                  >
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {day.date.getDate()}
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full ${statusColors[day.status]}`}
                      />
                      {eventCount > 0 && (
                        <span className="text-[10px] font-semibold text-gray-600">
                          {eventCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Eventos do Dia */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate ? formatDateBR(selectedDate) : "Eventos"}
              </DialogTitle>
              <DialogDescription>
                Shows confirmados e convites pendentes para este dia
              </DialogDescription>
            </DialogHeader>
            {selectedDate && (
              <div className="space-y-4 mt-4">
                {(() => {
                  const events = getDayEvents(selectedDate);
                  const allEvents = [
                    ...events.confirmed.map((e) => ({ ...e, type: "confirmed" as const })),
                    ...events.pending.map((e) => ({ ...e, type: "pending" as const })),
                  ].sort((a, b) => {
                    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
                    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
                    return timeA - timeB;
                  });

                  if (allEvents.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum evento neste dia</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {allEvents.map((event, idx) => {
                        const isConfirmed = event.type === "confirmed";
                        const when = formatDateTimeBR(event.start_time);
                        const location = isConfirmed
                          ? buildLocationText(event as ConfirmedGigRow)
                          : null;

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border p-4 bg-white border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-2 w-2 rounded-full mt-2 ${
                                  isConfirmed ? "bg-red-500" : "bg-yellow-500"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    className={
                                      isConfirmed
                                        ? "bg-orange-500 text-white text-xs"
                                        : "bg-yellow-500 text-white text-xs"
                                    }
                                  >
                                    {isConfirmed ? "Confirmado" : "Pendente"}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {event.gig_title || "Show"}
                                </h4>
                                {when && (
                                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{when}</span>
                                  </div>
                                )}
                                {location && (
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <MapPin className="h-4 w-4" />
                                    <span>{location}</span>
                                  </div>
                                )}
                                {isConfirmed && (event as ConfirmedGigRow).instrument && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Instrumento: {(event as ConfirmedGigRow).instrument}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


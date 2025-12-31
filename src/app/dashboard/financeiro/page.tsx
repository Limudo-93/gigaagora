"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Music,
  MapPin,
  Sparkles,
} from "lucide-react";

type FinancialGig = {
  id: string;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  show_minutes: number | null;
  break_minutes: number | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  cache: number | null;
  instrument: string | null;
  confirmed_at: string | null;
};

type Insight = {
  type: "instrument" | "day" | "duration";
  message: string;
  emoji: string;
};

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gigs, setGigs] = useState<FinancialGig[]>([]);
  const [viewMode, setViewMode] = useState<"basic" | "advanced">("basic");

  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Usuário não autenticado.");
          setLoading(false);
          return;
        }

        const { data: confirmations, error: confError } = await supabase
          .from("confirmations")
          .select(`
            id,
            confirmed_at,
            invite_id,
            invites!inner(
              id,
              gig_id,
              gig_role_id,
              gigs!inner(
                id,
                title,
                start_time,
                end_time,
                show_minutes,
                break_minutes,
                location_name,
                city,
                state
              ),
              gig_roles!inner(
                instrument,
                cache
              )
            )
          `)
          .eq("musician_id", user.id)
          .order("confirmed_at", { ascending: false });

        if (confError) throw confError;

        const transformed: FinancialGig[] = (confirmations || []).map((conf: any) => {
          const invite = Array.isArray(conf.invites) ? conf.invites[0] : conf.invites;
          const gig = Array.isArray(invite?.gigs) ? invite?.gigs[0] : invite?.gigs;
          const role = Array.isArray(invite?.gig_roles) ? invite?.gig_roles[0] : invite?.gig_roles;

          return {
            id: conf.id,
            title: gig?.title || null,
            start_time: gig?.start_time || null,
            end_time: gig?.end_time || null,
            show_minutes: gig?.show_minutes || null,
            break_minutes: gig?.break_minutes || null,
            location_name: gig?.location_name || null,
            city: gig?.city || null,
            state: gig?.state || null,
            cache: role?.cache || null,
            instrument: role?.instrument || null,
            confirmed_at: conf.confirmed_at || null,
          };
        }).filter(gig => gig.title !== null);

        setGigs(transformed);
      } catch (err: any) {
        console.error("Error fetching financial data:", err);
        setError(err?.message ?? "Erro ao carregar dados financeiros.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Cálculos básicos
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Gigs passados (já ganhou)
  const pastGigs = gigs.filter(gig => {
    if (!gig.start_time) return false;
    return new Date(gig.start_time) < now;
  });

  // Gigs futuros (vai receber)
  const futureGigs = gigs.filter(gig => {
    if (!gig.start_time) return false;
    return new Date(gig.start_time) >= now;
  });

  // Total já ganho
  const totalEarnings = pastGigs.reduce((sum, gig) => sum + (gig.cache || 0), 0);

  // Este mês
  const thisMonthGigs = pastGigs.filter(gig => {
    if (!gig.confirmed_at) return false;
    return new Date(gig.confirmed_at) >= thirtyDaysAgo;
  });
  const thisMonthEarnings = thisMonthGigs.reduce((sum, gig) => sum + (gig.cache || 0), 0);

  // Você vai receber
  const futureEarnings = futureGigs.reduce((sum, gig) => sum + (gig.cache || 0), 0);

  // Horas tocadas
  const totalMinutes = pastGigs.reduce((sum, gig) => sum + (gig.show_minutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Quanto ganha por hora
  const earningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Insights (modo avançado)
  const calculateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Instrumento mais rentável
    const instrumentEarnings: Record<string, number> = {};
    pastGigs.forEach(gig => {
      const instrument = gig.instrument || "Outro";
      instrumentEarnings[instrument] = (instrumentEarnings[instrument] || 0) + (gig.cache || 0);
    });
    
    const topInstrument = Object.entries(instrumentEarnings)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topInstrument && topInstrument[1] > 0) {
      insights.push({
        type: "instrument",
        message: `Seu instrumento mais rentável: ${topInstrument[0]}`,
        emoji: "💡",
      });
    }

    // Dia da semana mais rentável
    const dayEarnings: Record<string, number> = {};
    pastGigs.forEach(gig => {
      if (gig.start_time) {
        const day = new Date(gig.start_time).toLocaleDateString("pt-BR", { weekday: "long" });
        dayEarnings[day] = (dayEarnings[day] || 0) + (gig.cache || 0);
      }
    });

    const topDay = Object.entries(dayEarnings)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topDay && topDay[1] > 0 && pastGigs.length >= 3) {
      insights.push({
        type: "day",
        message: `Você ganha mais tocando aos ${topDay[0]}`,
        emoji: "💡",
      });
    }

    // Shows acima de 2h rendem melhor
    const longGigs = pastGigs.filter(gig => (gig.show_minutes || 0) >= 120);
    const shortGigs = pastGigs.filter(gig => (gig.show_minutes || 0) < 120 && (gig.show_minutes || 0) > 0);
    
    if (longGigs.length > 0 && shortGigs.length > 0) {
      const avgLong = longGigs.reduce((sum, g) => sum + (g.cache || 0), 0) / longGigs.length;
      const avgShort = shortGigs.reduce((sum, g) => sum + (g.cache || 0), 0) / shortGigs.length;
      
      if (avgLong > avgShort * 1.1) {
        insights.push({
          type: "duration",
          message: "Shows acima de 2h rendem melhor pra você",
          emoji: "💡",
        });
      }
    }

    return insights;
  };

  const insights = calculateInsights();

  // Dados para gráfico de evolução (últimos 6 meses)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString("pt-BR", { month: "short" }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      earnings: 0,
      gigs: 0,
    };
  });

  pastGigs.forEach(gig => {
    if (gig.confirmed_at) {
      const date = new Date(gig.confirmed_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthData = last6Months.find(m => m.monthKey === monthKey);
      if (monthData) {
        monthData.earnings += gig.cache || 0;
        monthData.gigs += 1;
      }
    }
  });

  const maxEarnings = Math.max(...last6Months.map(m => m.earnings), 1);

  // Instrumentos mais rentáveis (ranking)
  const instrumentDistribution: Record<string, { count: number; earnings: number }> = {};
  pastGigs.forEach(gig => {
    const instrument = gig.instrument || "Outro";
    if (!instrumentDistribution[instrument]) {
      instrumentDistribution[instrument] = { count: 0, earnings: 0 };
    }
    instrumentDistribution[instrument].count += 1;
    instrumentDistribution[instrument].earnings += gig.cache || 0;
  });

  const topInstruments = Object.entries(instrumentDistribution)
    .map(([instrument, data]) => ({ instrument, ...data }))
    .sort((a, b) => b.earnings - a.earnings);

  const maxInstrumentEarnings = Math.max(...topInstruments.map(i => i.earnings), 1);

  // Emojis para instrumentos
  const instrumentEmojis: Record<string, string> = {
    Violão: "🎸",
    Guitarra: "🎸",
    Baixo: "🎸",
    Bateria: "🥁",
    Teclado: "⌨️",
    Piano: "🎹",
    Vocal: "🎤",
    Saxofone: "🎷",
    Trompete: "🎺",
    Outro: "🎵",
  };

  const getInstrumentEmoji = (instrument: string) => {
    return instrumentEmojis[instrument] || "🎵";
  };

  if (loading) {
    return (
      <DashboardLayout fullWidth>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando seus ganhos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout fullWidth>
        <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Erro ao carregar dados financeiros:</p>
          <p className="mt-1">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
              💰 Seus ganhos com música
            </h1>
            <p className="text-base text-gray-600 mt-2">
              Acompanhe quanto você já ganhou, quanto vai receber e como evoluir
            </p>
          </div>
          
          {/* Toggle Básico/Avançado */}
          <div className="flex items-center gap-3 bg-white rounded-lg border-2 border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("basic")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "basic"
                  ? "bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Básico
            </button>
            <button
              onClick={() => setViewMode("advanced")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "advanced"
                  ? "bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Avançado
            </button>
          </div>
        </div>

        {/* MODO BÁSICO */}
        {viewMode === "basic" && (
          <div className="space-y-6">
            {/* BLOCO 1 — HERO FINANCEIRO */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500">
              <CardContent className="p-8 md:p-12 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">💰</div>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2">Total já ganho</h2>
                <p className="text-4xl md:text-5xl font-bold mb-4">{formatCurrency(totalEarnings)}</p>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg font-medium">
                    {pastGigs.length} {pastGigs.length === 1 ? "show confirmado" : "shows confirmados"}
                  </span>
                </div>
                {totalEarnings > 0 && (
                  <p className="mt-4 text-lg font-medium">
                    Você já ganhou dinheiro tocando 🎶
                  </p>
                )}
              </CardContent>
            </Card>

            {/* BLOCO 2 — AGORA & FUTURO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">📅</div>
                    <h3 className="text-lg font-semibold text-gray-900">Este mês</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(thisMonthEarnings)}</p>
                  <p className="text-sm text-gray-600">
                    {thisMonthGigs.length} {thisMonthGigs.length === 1 ? "show confirmado" : "shows confirmados"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🔮</div>
                    <h3 className="text-lg font-semibold text-gray-900">Você vai receber</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(futureEarnings)}</p>
                  <p className="text-sm text-gray-600">
                    Próximas semanas
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-gray-500 text-center -mt-4">
              Previsão baseada em shows já confirmados
            </p>

            {/* BLOCO 3 — PRÓXIMOS SHOWS */}
            {futureGigs.length > 0 && (
              <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos shows</h3>
                  <div className="space-y-3">
                    {futureGigs.slice(0, 10).map((gig) => (
                      <div
                        key={gig.id}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getInstrumentEmoji(gig.instrument || "Outro")}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(gig.start_time)} · {gig.location_name || gig.city || "Local"}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(gig.cache || 0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BLOCO 4 — CTA EDUCATIVO */}
            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardContent className="p-6 text-center">
                <p className="text-base text-gray-700 mb-3">
                  Quer entender quais shows rendem mais pra você?
                </p>
                <Button
                  onClick={() => setViewMode("advanced")}
                  className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                >
                  👉 Ative o modo avançado
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MODO AVANÇADO */}
        {viewMode === "advanced" && (
          <div className="space-y-8">
            {/* BLOCO 1 — RESUMO PROFISSIONAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-green-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-700">💰 Total já ganho</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pastGigs.length} {pastGigs.length === 1 ? "show" : "shows"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-700">📅 Este mês</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthEarnings)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {thisMonthGigs.length} {thisMonthGigs.length === 1 ? "show" : "shows"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-700">⏱ Horas tocadas</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
                  <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-700">💸 Quanto você ganha por hora</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(earningsPerHour)}</p>
                  <p className="text-xs text-gray-500 mt-1">Média geral</p>
                </CardContent>
              </Card>
            </div>

            {/* BLOCO 2 — INSIGHTS AUTOMÁTICOS */}
            {insights.length > 0 && (
              <Card className="border-2 border-purple-200 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Insights automáticos</h3>
                  </div>
                  <div className="space-y-3">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-purple-100">
                        <span className="text-2xl">{insight.emoji}</span>
                        <p className="text-base text-gray-800 font-medium">{insight.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BLOCO 3 — EVOLUÇÃO DE GANHOS */}
            <Card className="border-2 border-gray-200 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolução de ganhos</h3>
                <div className="space-y-4">
                  {last6Months.map((month, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium capitalize">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-900 font-semibold">{formatCurrency(month.earnings)}</span>
                          <span className="text-gray-500 text-xs">
                            {month.gigs} {month.gigs === 1 ? "show" : "shows"}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${(month.earnings / maxEarnings) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BLOCO 4 — INSTRUMENTOS MAIS RENTÁVEIS */}
            {topInstruments.length > 0 && (
              <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Instrumentos mais rentáveis</h3>
                  <div className="space-y-4">
                    {topInstruments.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getInstrumentEmoji(item.instrument)}</span>
                            <span className="text-gray-900 font-medium">{item.instrument}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-xs">
                              {item.count} {item.count === 1 ? "show" : "shows"}
                            </span>
                            <span className="text-gray-900 font-bold">{formatCurrency(item.earnings)}</span>
                          </div>
                        </div>
                        <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.earnings / maxInstrumentEarnings) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BLOCO 5 — PRÓXIMOS GANHOS DETALHADOS */}
            {futureGigs.length > 0 && (
              <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos ganhos detalhados</h3>
                  <div className="space-y-3">
                    {futureGigs.map((gig) => (
                      <div
                        key={gig.id}
                        className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl">{getInstrumentEmoji(gig.instrument || "Outro")}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{gig.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>{formatDate(gig.start_time)}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {gig.location_name || gig.city || "Local"}
                              </span>
                              {gig.instrument && (
                                <span>{gig.instrument}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 ml-4">{formatCurrency(gig.cache || 0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

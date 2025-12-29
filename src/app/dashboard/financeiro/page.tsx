"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Briefcase,
  Clock,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Music,
  MapPin,
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

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gigs, setGigs] = useState<FinancialGig[]>([]);
  const [showValues, setShowValues] = useState(false); // Por padrão escondido

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

        // Busca todas as confirmações do usuário
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

        // Transforma os dados
        const transformed: FinancialGig[] = (confirmations || []).map((conf: any) => {
          // invites pode ser um array ou objeto único dependendo da query
          const invite = Array.isArray(conf.invites) ? conf.invites[0] : conf.invites;
          // gigs pode ser um array ou objeto único
          const gig = Array.isArray(invite?.gigs) ? invite?.gigs[0] : invite?.gigs;
          // gig_roles pode ser um array ou objeto único
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
        }).filter(gig => gig.title !== null); // Remove gigs sem dados válidos

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

  // Cálculos
  const totalEarnings = gigs.reduce((sum, gig) => sum + (gig.cache || 0), 0);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const earningsLast30Days = gigs
    .filter(gig => gig.confirmed_at && new Date(gig.confirmed_at) >= thirtyDaysAgo)
    .reduce((sum, gig) => sum + (gig.cache || 0), 0);

  const totalGigs = gigs.length;
  
  const totalMinutes = gigs.reduce((sum, gig) => sum + (gig.show_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // Arredonda para 1 casa decimal
  
  const averagePerGig = totalGigs > 0 ? totalEarnings / totalGigs : 0;
  const averagePerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Dados para gráficos
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      earnings: 0,
      gigs: 0,
    };
  });

  gigs.forEach(gig => {
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
  const maxGigs = Math.max(...last6Months.map(m => m.gigs), 1);

  // Distribuição por instrumento
  const instrumentDistribution: Record<string, { count: number; earnings: number }> = {};
  gigs.forEach(gig => {
    const instrument = gig.instrument || "Outro";
    if (!instrumentDistribution[instrument]) {
      instrumentDistribution[instrument] = { count: 0, earnings: 0 };
    }
    instrumentDistribution[instrument].count += 1;
    instrumentDistribution[instrument].earnings += gig.cache || 0;
  });

  const topInstruments = Object.entries(instrumentDistribution)
    .map(([instrument, data]) => ({ instrument, ...data }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  const maxInstrumentEarnings = Math.max(...topInstruments.map(i => i.earnings), 1);

  // Trabalhos recentes (últimos 10)
  const recentGigs = gigs.slice(0, 10);

  // Ganhos esperados para as próximas semanas
  const now = new Date();
  const upcomingGigs = gigs.filter(gig => {
    if (!gig.start_time) return false;
    const startDate = new Date(gig.start_time);
    return startDate > now;
  });

  // Calcular ganhos esperados por semana
  const weeklyExpectedEarnings: Record<string, { weekStart: Date; week: string; earnings: number; count: number }> = {};
  
  upcomingGigs.forEach(gig => {
    if (!gig.start_time) return;
    const startDate = new Date(gig.start_time);
    const weekStart = new Date(startDate);
    const dayOfWeek = startDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    weekStart.setDate(startDate.getDate() - dayOfWeek); // Volta para o domingo
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyExpectedEarnings[weekKey]) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeklyExpectedEarnings[weekKey] = {
        weekStart: new Date(weekStart),
        week: `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        earnings: 0,
        count: 0,
      };
    }
    
    weeklyExpectedEarnings[weekKey].earnings += gig.cache || 0;
    weeklyExpectedEarnings[weekKey].count += 1;
  });

  const weeklyEarningsArray = Object.values(weeklyExpectedEarnings)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .slice(0, 4); // Próximas 4 semanas

  const totalExpectedEarnings = upcomingGigs.reduce((sum, gig) => sum + (gig.cache || 0), 0);

  // Função para formatar valores
  const formatCurrency = (value: number) => {
    if (!showValues) return "••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (!showValues) return "•••";
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Erro ao carregar dados financeiros:</p>
          <p className="mt-1">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-600 mt-1">
              Acompanhe seus ganhos, trabalhos e estatísticas detalhadas
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowValues(!showValues)}
            className="border-gray-300"
            title={showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {showValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900">
                Ganhos Totais
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-green-700 mt-1">
                {totalGigs} {totalGigs === 1 ? "trabalho" : "trabalhos"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                Últimos 30 Dias
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(earningsLast30Days)}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {gigs.filter(gig => gig.confirmed_at && new Date(gig.confirmed_at) >= thirtyDaysAgo).length} trabalhos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">
                Horas Trabalhadas
              </CardTitle>
              <Clock className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {formatNumber(totalHours)}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                {formatNumber(totalMinutes)} minutos totais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Média por Hora
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {formatCurrency(averagePerHour)}
              </div>
              <p className="text-xs text-orange-700 mt-1">
                {formatCurrency(averagePerGig)} por trabalho
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Card de Ganhos Esperados */}
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Ganhos Esperados - Próximas Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total esperado */}
              <div className="bg-white/60 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-700 mb-1">Total Esperado</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(totalExpectedEarnings)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-indigo-600">
                      {upcomingGigs.length} {upcomingGigs.length === 1 ? "trabalho" : "trabalhos"} confirmados
                    </p>
                  </div>
                </div>
              </div>

              {/* Ganhos por semana */}
              {weeklyEarningsArray.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-indigo-900">Próximas 4 Semanas</p>
                  {weeklyEarningsArray.map((weekData, idx) => (
                    <div
                      key={idx}
                      className="bg-white/60 rounded-lg p-3 border border-indigo-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{weekData.week}</p>
                          <p className="text-xs text-gray-600">
                            {weekData.count} {weekData.count === 1 ? "trabalho" : "trabalhos"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-900">
                          {formatCurrency(weekData.earnings)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white/60 rounded-lg border border-indigo-100">
                  <Calendar className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Nenhum trabalho confirmado nas próximas semanas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Evolução de Ganhos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução de Ganhos (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {last6Months.map((month, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{month.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                          {formatCurrency(month.earnings)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatNumber(month.gigs)} {month.gigs === 1 ? "trabalho" : "trabalhos"}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(month.earnings / maxEarnings) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900">
                        {showValues && month.earnings > 0 && (
                          <span>{((month.earnings / maxEarnings) * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição por Instrumento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Top 5 Instrumentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInstruments.length > 0 ? (
                  topInstruments.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                            {item.instrument}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            {formatNumber(item.count)} {item.count === 1 ? "trabalho" : "trabalhos"}
                          </span>
                        </div>
                        <span className="text-gray-700 font-semibold">
                          {formatCurrency(item.earnings)}
                        </span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${(item.earnings / maxInstrumentEarnings) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nenhum dado disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                Trabalhos por Mês (Média)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(Math.round(totalGigs / 6 * 10) / 10)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Baseado nos últimos 6 meses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                Ganho Médio por Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(averagePerGig)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {totalGigs} {totalGigs === 1 ? "trabalho" : "trabalhos"} confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                Horas por Trabalho (Média)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(totalGigs > 0 ? Math.round((totalHours / totalGigs) * 10) / 10 : 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatNumber(totalGigs)} {totalGigs === 1 ? "trabalho" : "trabalhos"} analisados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Trabalhos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Trabalhos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentGigs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Trabalho
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Local
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Instrumento
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Duração
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Cachê
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGigs.map((gig) => {
                      const date = gig.start_time
                        ? new Date(gig.start_time).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—";
                      const duration = gig.show_minutes
                        ? `${Math.floor(gig.show_minutes / 60)}h${gig.show_minutes % 60}m`
                        : "—";
                      const location = gig.location_name || gig.city || "—";

                      return (
                        <tr key={gig.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700">{date}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {gig.title || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                              {gig.instrument || "—"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{duration}</td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(gig.cache || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Nenhum trabalho confirmado ainda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


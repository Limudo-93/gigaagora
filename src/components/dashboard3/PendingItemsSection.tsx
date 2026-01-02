"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Mail, Star, AlertCircle, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function PendingItemsSection({ userId }: { userId: string }) {
  const [pendingInvites, setPendingInvites] = useState(0);
  const [pendingRatings, setPendingRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingItems();
  }, [userId]);

  const loadPendingItems = async () => {
    try {
      const { count: invitesCount } = await supabase
        .from("invites")
        .select("*", { count: "exact", head: true })
        .eq("musician_id", userId)
        .eq("status", "pending");

      setPendingInvites(invitesCount || 0);

      const { count: ratingsCount } = await supabase
        .from("confirmations")
        .select("*", { count: "exact", head: true })
        .eq("musician_id", userId)
        .is("rating_id", null);

      setPendingRatings(ratingsCount || 0);
    } catch (error) {
      console.error("Error loading pending items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start snap-always">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </section>
    );
  }

  const hasPending = pendingInvites > 0 || pendingRatings > 0;

  return (
    <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always py-12">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Pendências
          </h2>
          <p className="text-muted-foreground">
            Itens que precisam da sua atenção
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Invites */}
          <Card
            className={`border-2 ${
              pendingInvites > 0
                ? "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50"
                : "border-border bg-background"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-3 rounded-xl ${
                      pendingInvites > 0
                        ? "bg-gradient-to-br from-orange-500 to-amber-500"
                        : "bg-muted"
                    } text-white`}
                  >
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Convites Pendentes</h3>
                      {pendingInvites > 0 && (
                        <Badge className="bg-orange-500 text-white">
                          {pendingInvites}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pendingInvites > 0
                        ? `${pendingInvites} ${
                            pendingInvites === 1 ? "convite" : "convites"
                          } aguardando resposta`
                        : "Nenhum convite pendente"}
                    </p>
                    {pendingInvites > 0 && (
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span>Responda rápido para não perder oportunidades</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                asChild
                variant={pendingInvites > 0 ? "default" : "outline"}
                className={`mt-4 w-full ${
                  pendingInvites > 0
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90"
                    : ""
                }`}
              >
                <Link href={"/dashboard/gigs" as any}>
                  {pendingInvites > 0 ? "Ver Convites" : "Ver Gigs"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pending Ratings */}
          <Card
            className={`border-2 ${
              pendingRatings > 0
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50"
                : "border-border bg-background"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-3 rounded-xl ${
                      pendingRatings > 0
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                        : "bg-muted"
                    } text-white`}
                  >
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Avaliações Pendentes</h3>
                      {pendingRatings > 0 && (
                        <Badge className="bg-blue-500 text-white">
                          {pendingRatings}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pendingRatings > 0
                        ? `${pendingRatings} ${
                            pendingRatings === 1 ? "gig" : "gigs"
                          } aguardando avaliação`
                        : "Nenhuma avaliação pendente"}
                    </p>
                    {pendingRatings > 0 && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Suas avaliações ajudam a comunidade</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                asChild
                variant={pendingRatings > 0 ? "default" : "outline"}
                className={`mt-4 w-full ${
                  pendingRatings > 0
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
                    : ""
                }`}
              >
                <Link href={"/dashboard" as any}>
                  {pendingRatings > 0 ? "Avaliar Agora" : "Ver Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {!hasPending && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tudo em dia!</h3>
              <p className="text-muted-foreground">
                Você não tem pendências no momento. Continue assim!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

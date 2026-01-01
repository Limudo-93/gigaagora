"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, Star, Heart, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function WelcomeCard() {
  const [show, setShow] = useState(false);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Verificar se já viu o card de boas-vindas
        const { data: profile } = await supabase
          .from("profiles")
          .select("welcome_card_shown, created_at")
          .eq("user_id", user.id)
          .single();

        // Verificar se é embaixador (usuário criado nos primeiros 30 dias ou primeiros 100 usuários)
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const isEarlyAdopter =
          (profile?.created_at &&
            new Date(profile.created_at) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
          (totalUsers && totalUsers <= 100);

        setIsAmbassador(isEarlyAdopter || false);

        // Mostrar card se não tiver visto ainda
        if (!profile?.welcome_card_shown) {
          setShow(true);
        }
      } catch (error) {
        console.error("Error checking welcome status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkWelcomeStatus();
  }, []);

  const handleDismiss = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ welcome_card_shown: true })
          .eq("user_id", user.id);
      }
      setShow(false);
    } catch (error) {
      console.error("Error dismissing welcome card:", error);
      setShow(false);
    }
  };

  if (loading || !show) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-purple-50/50 to-blue-50/50 shadow-xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl -z-10" />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                Bem-vindo ao Chama o Músico! 🎉
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Você faz parte da nossa comunidade desde o início
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {isAmbassador && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300/50">
            <div className="flex items-start gap-3">
              <Crown
                className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5"
                fill="currentColor"
              />
              <div>
                <h3 className="font-bold text-yellow-900 mb-1">
                  Você é um Embaixador! 👑
                </h3>
                <p className="text-sm text-yellow-800">
                  Como um dos primeiros membros da nossa plataforma, você tem um
                  lugar especial na nossa comunidade. Seu badge de{" "}
                  <strong>Embaixador</strong> está visível no seu perfil!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Sua opinião importa
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Como membro fundador, suas sugestões e feedback são extremamente
                valiosos para nós. Não hesite em compartilhar suas ideias!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Gift className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Benefícios exclusivos
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Você terá acesso prioritário a novas funcionalidades e
                oportunidades especiais conforme a plataforma cresce.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Star className="h-4 w-4 text-blue-600" fill="currentColor" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Cresça com a gente
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Complete seu perfil, participe de gigs e construa sua reputação
                desde o início. Os primeiros usuários sempre têm destaque!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
          >
            Começar a explorar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

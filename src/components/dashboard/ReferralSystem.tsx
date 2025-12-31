"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Loader2, Users, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ReferralCode {
  id: string;
  code: string;
  is_active: boolean;
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export default function ReferralSystem() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("referrer_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setReferralCode(data);
    } catch (err: any) {
      console.error("Error loading referral code:", err);
      setError(err?.message ?? "Erro ao carregar código de indicação.");
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    setCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error: rpcError } = await supabase.rpc("rpc_create_referral_code", {
        p_user_id: user.id,
        p_max_uses: null, // Ilimitado
        p_expires_at: null, // Sem expiração
      });

      if (rpcError) throw rpcError;
      if (data) {
        await loadReferralCode();
      }
    } catch (err: any) {
      console.error("Error creating referral code:", err);
      setError(err?.message ?? "Erro ao criar código de indicação.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (!referralCode) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralCode.code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!referralCode) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralCode.code}`;
    const shareText = `Junte-se ao GigAgora usando meu código de indicação! ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Indique um músico para o GigAgora",
          text: shareText,
          url: referralLink,
        });
      } catch (err) {
        // Usuário cancelou ou erro
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copiar para clipboard
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200 bg-white shadow-lg">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-700">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="h-5 w-5 text-orange-500" />
          Sistema de Indicação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!referralCode ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-4">
              Crie um código de indicação para convidar músicos para a plataforma.
            </p>
            <Button
              onClick={createReferralCode}
              disabled={creating}
              className="bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] hover:from-[#ff6b4a] hover:to-[#2aa6a1] text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Criar Código de Indicação
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Seu Código de Indicação
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralCode.code}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-base font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <Badge variant="secondary" className="whitespace-nowrap bg-gray-200 text-gray-900 font-semibold px-3 py-1.5">
                  {referralCode.usage_count} {referralCode.usage_count === 1 ? "uso" : "usos"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Link de Indicação
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/signup?ref=${referralCode.code}`}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0 border-2 border-gray-300 hover:bg-gray-100"
                  title="Copiar link"
                >
                  {copied ? (
                    <span className="text-sm font-bold text-green-600">✓</span>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-700" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareLink}
                  className="flex-shrink-0 border-2 border-gray-300 hover:bg-gray-100"
                  title="Compartilhar link"
                >
                  <Share2 className="h-4 w-4 text-gray-700" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
              <p className="text-sm font-medium text-blue-900 leading-relaxed">
                <strong className="font-bold">Como funciona:</strong> Compartilhe seu código ou link com músicos.
                Quando eles se cadastrarem usando seu código, você receberá crédito pela indicação.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


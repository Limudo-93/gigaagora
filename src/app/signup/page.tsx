"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import SignupMultiStep from "@/components/signup/SignupMultiStep";
import { Chrome, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

function SignupForm({ referralCode }: { referralCode: string | null }) {
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignup = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const options: any = {
        redirectTo: redirectUrl,
      };

      if (referralCode) {
        options.queryParams = {
          referral_code: referralCode,
        };
        options.state = JSON.stringify({ referral_code: referralCode });
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        setError(
          `Erro ao fazer cadastro com ${provider === "google" ? "Google" : "Facebook"}.`,
        );
        setOauthLoading(null);
      }
    } catch (err: any) {
      setError(
        `Erro inesperado ao fazer cadastro com ${provider === "google" ? "Google" : "Facebook"}.`,
      );
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient com padrão sutil - igual ao dashboard */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#fff1e7] via-white to-[#e9f7f5] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,179,71,0.16),transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(42,166,161,0.12),transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,107,74,0.12),transparent_50%)] -z-10" />

      {/* Padrão de ondas musicais sutil */}
      <div
        className="fixed inset-0 opacity-[0.03] -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50' stroke='%23000' fill='none' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-4xl space-y-6">
          {/* Logo */}
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center mb-2">
              <Logo size="lg" />
            </div>
          </div>

          {/* Botões OAuth - apenas na etapa 1 */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all hover:scale-105"
              onClick={() => handleOAuthSignup("google")}
              disabled={oauthLoading !== null}
            >
              {oauthLoading === "google" ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Conectando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Chrome className="h-5 w-5" />
                  Continuar com Google
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all hover:scale-105"
              onClick={() => handleOAuthSignup("facebook")}
              disabled={oauthLoading !== null}
            >
              {oauthLoading === "facebook" ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Conectando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  Continuar com Facebook
                </span>
              )}
            </Button>
          </div>

          {/* Divisor */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-gray-500">
                Ou cadastre-se com email
              </span>
            </div>
          </div>

          {/* Formulário multi-step */}
          <SignupMultiStep referralCode={referralCode} />

          {/* Link para login */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href={"/login" as any}
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function SignupPageContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  return <SignupForm referralCode={referralCode} />;
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}

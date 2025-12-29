"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { Chrome, Facebook } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") || "").trim();
      const password = String(form.get("password") || "");
      const confirmPassword = String(form.get("confirmPassword") || "");
      const displayName = String(form.get("displayName") || "").trim();

      if (!email || !password || !confirmPassword || !displayName) {
        setError("Por favor, preencha todos os campos.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        setLoading(false);
        return;
      }

      console.log("Attempting signup for:", email);

      // Criar conta
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signupError) {
        console.error("Signup error:", signupError);
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      // Se houver código de indicação, registrar
      if (referralCode) {
        try {
          const { error: referralError } = await supabase.rpc("rpc_register_referral", {
            p_code: referralCode,
            p_referred_user_id: data.user.id,
            p_user_type: "musician",
          });

          if (referralError) {
            console.error("Error registering referral:", referralError);
            // Não bloqueia o cadastro se houver erro no código de indicação
          }
        } catch (refErr) {
          console.error("Referral exception:", refErr);
          // Não bloqueia o cadastro
        }
      }

      // Criar perfil básico
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            user_type: "musician",
            display_name: displayName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Não bloqueia, o perfil pode ser criado depois
        }

        // Criar perfil de músico
        const { error: musicianError } = await supabase
          .from("musician_profiles")
          .insert({
            user_id: data.user.id,
            instruments: [],
            genres: [],
            skills: [],
            setup: [],
            portfolio_links: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (musicianError) {
          console.error("Error creating musician profile:", musicianError);
          // Não bloqueia
        }
      } catch (profileErr) {
        console.error("Profile creation exception:", profileErr);
      }

      setSuccess(true);
      setError(null);

      // Se precisar confirmar email, mostrar mensagem
      if (data.session) {
        // Email confirmado automaticamente, redireciona
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = "/dashboard";
      } else {
        // Precisa confirmar email
        setError(null);
        setTimeout(() => {
          router.push("/login?message=Verifique seu email para confirmar sua conta");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Signup exception:", err);
      setError(err?.message ?? "Erro inesperado ao criar conta.");
      setLoading(false);
    }
  }

  const handleOAuthSignup = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);

    try {
      // Usar a origem atual (suporta ngrok e outros domínios)
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("OAuth redirect URL:", redirectUrl);
      
      const options: any = {
        redirectTo: redirectUrl,
      };

      // Se houver código de indicação, passar no state
      if (referralCode) {
        options.queryParams = {
          referral_code: referralCode,
        };
        // Também passar no state para garantir
        options.state = JSON.stringify({ referral_code: referralCode });
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        console.error(`OAuth ${provider} error:`, error);
        setError(`Erro ao fazer cadastro com ${provider === "google" ? "Google" : "Facebook"}. Tente novamente.`);
        setOauthLoading(null);
      }
    } catch (err: any) {
      console.error(`OAuth ${provider} exception:`, err);
      setError(`Erro inesperado ao fazer cadastro com ${provider === "google" ? "Google" : "Facebook"}.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient com padrão sutil - igual ao dashboard */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-orange-50 to-blue-50 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.1),transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)] -z-10" />
      
      {/* Padrão de ondas musicais sutil */}
      <div className="fixed inset-0 opacity-[0.03] -z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50' stroke='%23000' fill='none' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }} />

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Logo e título */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex items-center justify-center">
              <Logo size="lg" />
            </div>
          </div>

          {/* Card de cadastro */}
          <div className="rounded-2xl border border-white/20 backdrop-blur-xl bg-white/80 p-8 shadow-lg animate-fade-in">
            <header className="space-y-1 text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-orange-700 via-purple-700 to-blue-700 bg-clip-text text-transparent">
                Criar Conta
              </h1>
              <p className="text-sm text-gray-600">Cadastre-se para começar a usar a plataforma.</p>
            </header>

            {/* Botões OAuth primeiro */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                onClick={() => handleOAuthSignup("google")}
                disabled={loading || oauthLoading !== null}
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
                className="w-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                onClick={() => handleOAuthSignup("facebook")}
                disabled={loading || oauthLoading !== null}
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 px-2 text-gray-500">Ou cadastre-se com email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="displayName">
                  Nome
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400"
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400"
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Senha
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400"
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                  Confirmar Senha
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-sm text-green-600">
                    Conta criada com sucesso! Redirecionando...
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 hover:from-orange-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-md transition-all duration-200" 
                type="submit" 
                disabled={loading || oauthLoading !== null || success}
              >
                {loading ? "Criando conta..." : success ? "Conta criada!" : "Criar Conta"}
              </Button>
            </form>

            {/* Link para login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link href="/login" as any className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


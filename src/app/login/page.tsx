"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { Chrome, Facebook } from "lucide-react";
import { applyTheme, type ThemeName } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar tema do usuário (se logado) ou usar padrão
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("theme_preference")
            .eq("user_id", user.id)
            .maybeSingle();

          const theme = (profile?.theme_preference as ThemeName) || 'default';
          const validTheme: ThemeName = ['default', 'ocean', 'sunset', 'forest', 'royal', 'dark'].includes(theme) 
            ? theme 
            : 'default';
          applyTheme(validTheme);
        } else {
          applyTheme('default');
        }
      } catch (error) {
        console.error("Error loading theme:", error);
        applyTheme('default');
      }
    };

    loadTheme();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") || "").trim();
      const password = String(form.get("password") || "");

      if (!email || !password) {
        setError("Por favor, preencha todos os campos.");
        setLoading(false);
        return;
      }

      console.log("Attempting login for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        console.error("No session returned");
        setError("Erro ao criar sessão. Tente novamente.");
        setLoading(false);
        return;
      }

      console.log("Login successful, session:", data.session.user.id);

      // O createBrowserClient gerencia cookies automaticamente
      // Aguarda um momento para garantir que os cookies sejam definidos
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redireciona usando window.location para forçar reload completo
      // Isso garante que o servidor veja os cookies atualizados
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login exception:", err);
      setError(err?.message ?? "Erro inesperado ao fazer login.");
      setLoading(false);
    }
  }

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);

    try {
      // Usar a origem atual (suporta ngrok e outros domínios)
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("OAuth redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error(`OAuth ${provider} error:`, error);
        setError(`Erro ao fazer login com ${provider === "google" ? "Google" : "Facebook"}. Tente novamente.`);
        setOauthLoading(null);
      }
    } catch (err: any) {
      console.error(`OAuth ${provider} exception:`, err);
      setError(`Erro inesperado ao fazer login com ${provider === "google" ? "Google" : "Facebook"}.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background usando gradiente do tema */}
      <div className="fixed inset-0 -z-10" style={{
        background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
        opacity: 0.1
      }} />
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

          {/* Card de login */}
          <div className="rounded-2xl border border-border backdrop-blur-xl bg-card/80 p-8 shadow-lg animate-fade-in">
            <header className="space-y-1 text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Entrar
              </h1>
              <p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
            </header>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Senha
                </label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                className="w-full text-white shadow-md transition-all duration-200" 
                type="submit" 
                disabled={loading || oauthLoading !== null}
                style={{
                  background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                  color: "white"
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            {/* Botões OAuth */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-input bg-background hover:bg-muted text-foreground font-medium"
                onClick={() => handleOAuthLogin("google")}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === "google" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
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
                className="w-full border-2 border-input bg-background hover:bg-muted text-foreground font-medium"
                onClick={() => handleOAuthLogin("facebook")}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === "facebook" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
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

            {/* Link para cadastro */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/signup" as any className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

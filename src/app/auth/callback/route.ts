import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  // O código de indicação pode vir no state do OAuth
  let referralCode: string | null = null;
  if (state) {
    try {
      // O state pode ser um JSON stringificado ou um parâmetro simples
      const stateData = JSON.parse(decodeURIComponent(state));
      referralCode = stateData.referral_code || null;
    } catch {
      // Se não for JSON, tenta extrair como query string
      const params = new URLSearchParams(state);
      referralCode = params.get("referral_code");
    }
  }

  // Fallback: tenta pegar direto da URL
  if (!referralCode) {
    referralCode = requestUrl.searchParams.get("referral_code");
  }

  // Usar a origem da requisição (suporta ngrok e outros proxies)
  // Verificar headers para obter a origem real se estiver atrás de um proxy
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Trocar código por sessão
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/login?error=Erro ao fazer login`);
    }

    if (data.user) {
      // Extrair informações do OAuth
      const metadata = data.user.user_metadata || {};
      const provider = data.user.app_metadata?.provider || "email";

      // Log para debug (remover em produção se necessário)
      console.log("OAuth user metadata:", JSON.stringify(metadata, null, 2));
      console.log("Provider:", provider);

      // Tentar obter foto de diferentes campos (Google e Facebook usam campos diferentes)
      // Google geralmente usa 'avatar_url' ou 'picture'
      // Facebook geralmente usa 'picture' ou 'avatar_url'
      const photoUrl =
        metadata.avatar_url ||
        metadata.picture ||
        metadata.photo_url ||
        metadata.raw_user_meta_data?.avatar_url ||
        metadata.raw_user_meta_data?.picture ||
        null;

      console.log("Photo URL extracted:", photoUrl);

      // Extrair nome de diferentes campos
      const displayName =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
        data.user.email?.split("@")[0] ||
        "Usuário";

      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, photo_url, display_name")
        .eq("user_id", data.user.id)
        .single();

      if (!existingProfile) {
        // Criar perfil básico
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          user_type: "musician",
          display_name: displayName,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
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
        }
      } else {
        // Atualizar perfil existente se não tiver foto ou nome
        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        // Atualizar foto se não tiver ou se veio do OAuth
        if (photoUrl && (!existingProfile.photo_url || provider !== "email")) {
          updates.photo_url = photoUrl;
        }

        // Atualizar nome se não tiver
        if (!existingProfile.display_name && displayName) {
          updates.display_name = displayName;
        }

        // Só atualiza se houver algo para atualizar
        if (Object.keys(updates).length > 1) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("user_id", data.user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          }
        }
      }

      // Se houver código de indicação, registrar
      if (referralCode) {
        try {
          await supabase.rpc("rpc_register_referral", {
            p_code: referralCode,
            p_referred_user_id: data.user.id,
            p_user_type: "musician",
          });
        } catch (refErr) {
          console.error("Error registering referral:", refErr);
          // Não bloqueia o login
        }
      }
    }

    // Redirecionar para dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Se não houver código, redirecionar para login
  return NextResponse.redirect(`${origin}/login`);
}

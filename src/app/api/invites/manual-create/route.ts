import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role env vars not configured");
  }

  return createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { gigId, musicianId, gigRoleId } = body as {
      gigId?: string;
      musicianId?: string;
      gigRoleId?: string;
    };

    if (!gigId || !musicianId || !gigRoleId) {
      return NextResponse.json(
        { success: false, error: "gigId, musicianId e gigRoleId são obrigatórios" },
        { status: 400 },
      );
    }

    const { data: gig, error: gigError } = await supabaseAdmin
      .from("gigs")
      .select("id, contractor_id, status")
      .eq("id", gigId)
      .single();

    if (gigError || !gig) {
      return NextResponse.json(
        { success: false, error: "Gig não encontrada" },
        { status: 404 },
      );
    }

    if (gig.contractor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Sem permissão para esta gig" },
        { status: 403 },
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("invites")
      .select("id, status")
      .eq("gig_id", gigId)
      .eq("gig_role_id", gigRoleId)
      .eq("musician_id", musicianId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        created: false,
        inviteId: existing.id,
        status: existing.status,
      });
    }

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from("invites")
      .insert({
        gig_id: gigId,
        gig_role_id: gigRoleId,
        contractor_id: gig.contractor_id,
        musician_id: musicianId,
        status: "pending",
        invited_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    try {
      const processUrl = new URL("/api/notifications/process", request.url);
      await fetch(processUrl, { method: "POST" });
    } catch (error) {
      console.error(
        "[manual-create invites] failed to trigger notifications process:",
        error,
      );
    }

    return NextResponse.json({
      success: true,
      created: true,
      inviteId: insertResult?.id,
    });
  } catch (error: any) {
    console.error("[manual-create invites] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido" },
      { status: 500 },
    );
  }
}

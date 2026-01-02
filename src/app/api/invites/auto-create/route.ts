import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { haversineKm } from "@/lib/geo";

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

type GigRoleRow = {
  id: string;
  instrument: string | null;
};

type CandidateRow = {
  user_id: string | null;
  latitude: number | null;
  longitude: number | null;
  max_radius_km: number | null;
  strengths_counts: Record<string, any> | null;
};

function isMissingTableError(error: { message?: string } | null) {
  const message = error?.message || "";
  return message.includes("does not exist");
}

function getMusicianRadiusKm(candidate: CandidateRow): number {
  const metadata = candidate.strengths_counts || {};
  if (metadata.searchRadius != null) {
    const radius = Number(metadata.searchRadius);
    if (!Number.isNaN(radius) && radius > 0) {
      return radius;
    }
  }
  if (candidate.max_radius_km != null) {
    const radius = Number(candidate.max_radius_km);
    if (!Number.isNaN(radius) && radius > 0) {
      return radius;
    }
  }
  return 50;
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
    const { gigId } = body as { gigId?: string };
    if (!gigId) {
      return NextResponse.json(
        { success: false, error: "gigId é obrigatório" },
        { status: 400 },
      );
    }

    const { data: gig, error: gigError } = await supabaseAdmin
      .from("gigs")
      .select("id, contractor_id, status, start_time, latitude, longitude")
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

    if (gig.status !== "published") {
      return NextResponse.json({
        success: true,
        created: 0,
        skipped: "Gig não publicada",
      });
    }

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("gig_roles")
      .select("id, instrument")
      .eq("gig_id", gigId);

    if (rolesError) {
      return NextResponse.json(
        { success: false, error: rolesError.message },
        { status: 500 },
      );
    }

    const roleRows = (roles || []) as GigRoleRow[];
    let createdCount = 0;

    for (const role of roleRows) {
      if (!role.instrument) continue;

      const { data: candidates, error: candidateError } = await supabaseAdmin
        .from("musician_profiles")
        .select(
          "user_id, latitude, longitude, max_radius_km, strengths_counts, profiles!inner(user_type)",
        )
        .contains("instruments", [role.instrument])
        .eq("profiles.user_type", "musician")
        .neq("user_id", gig.contractor_id);

      if (candidateError) {
        console.error("[auto-create invites] candidate error:", candidateError);
        continue;
      }

      const gigLat = gig.latitude as number | null | undefined;
      const gigLng = gig.longitude as number | null | undefined;
      const candidateRows = (candidates || []) as CandidateRow[];

      let candidateIds = candidateRows
        .filter((row) => {
          if (!row.user_id) return false;
          if (gigLat == null || gigLng == null) {
            console.warn(
              "[auto-create invites] gig sem coordenadas, pulando filtro de raio",
            );
            return true;
          }
          if (row.latitude == null || row.longitude == null) {
            return false;
          }
          const radiusKm = getMusicianRadiusKm(row);
          const distanceKm = haversineKm(
            gigLat,
            gigLng,
            row.latitude,
            row.longitude,
          );
          return distanceKm <= radiusKm;
        })
        .map((row) => row.user_id)
        .filter(Boolean) as string[];

      if (candidateIds.length === 0) continue;

      // Filtrar bloqueios, se a tabela existir
      const { data: blocks, error: blocksError } = await supabaseAdmin
        .from("blocks")
        .select("musician_id")
        .in("musician_id", candidateIds)
        .lte("starts_at", gig.start_time)
        .gte("ends_at", gig.start_time);

      if (!blocksError && blocks) {
        const blocked = new Set(blocks.map((b: any) => b.musician_id));
        candidateIds = candidateIds.filter((id) => !blocked.has(id));
      } else if (blocksError && !isMissingTableError(blocksError)) {
        console.warn(
          "[auto-create invites] blocks lookup failed:",
          blocksError,
        );
      }

      if (candidateIds.length === 0) continue;

      const { data: existingInvites, error: inviteError } = await supabaseAdmin
        .from("invites")
        .select("musician_id")
        .eq("gig_id", gigId)
        .eq("gig_role_id", role.id)
        .in("musician_id", candidateIds);

      if (inviteError) {
        console.error(
          "[auto-create invites] invite lookup error:",
          inviteError,
        );
        continue;
      }

      const existingIds = new Set(
        (existingInvites || []).map((inv: any) => inv.musician_id),
      );
      const toInsert = candidateIds
        .filter((id) => !existingIds.has(id))
        .map((musicianId) => ({
          gig_id: gigId,
          gig_role_id: role.id,
          contractor_id: gig.contractor_id,
          musician_id: musicianId,
          status: "pending",
          invited_at: new Date().toISOString(),
        }));

      if (toInsert.length === 0) continue;

      const { error: insertError } = await supabaseAdmin
        .from("invites")
        .insert(toInsert);

      if (insertError) {
        console.error("[auto-create invites] insert error:", insertError);
        continue;
      }

      createdCount += toInsert.length;
    }

    if (createdCount > 0) {
      try {
        const processUrl = new URL("/api/notifications/process", request.url);
        await fetch(processUrl, { method: "POST" });
      } catch (error) {
        console.error(
          "[auto-create invites] failed to trigger notifications process:",
          error,
        );
      }
    }

    return NextResponse.json({ success: true, created: createdCount });
  } catch (error: any) {
    console.error("[auto-create invites] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido" },
      { status: 500 },
    );
  }
}

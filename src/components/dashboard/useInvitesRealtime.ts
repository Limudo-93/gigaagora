"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client"; // seu createBrowserClient

type InviteRow = {
  id: string;
  gig_id: string;
  gig_role_id: string;
  contractor_id: string;
  musician_id: string;
  status: string;
  invited_at: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  warned_short_gap: boolean | null;
  warned_short_gap_minutes: number | null;
};

type InviteEventPayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: InviteRow;
  old: InviteRow;
};

export function useInvitesRealtime(params: {
  userId: string;
  onInsert?: (row: InviteRow) => void;
  onUpdate?: (row: InviteRow) => void;
  onDelete?: (row: InviteRow) => void;
}) {
  const { userId, onInsert, onUpdate, onDelete } = params;

  useEffect(() => {
    if (!userId) return;

    // 2 canais (um filtro pra musician_id e outro pra contractor_id)
    // porque o filter do postgres_changes não suporta OR.
    const chMusician = supabase
      .channel(`rt:invites:musician:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invites",
          filter: `musician_id=eq.${userId}`,
        },
        (payload: any) => {
          const p = payload as InviteEventPayload;
          if (p.eventType === "INSERT") onInsert?.(p.new);
          if (p.eventType === "UPDATE") onUpdate?.(p.new);
          if (p.eventType === "DELETE") onDelete?.(p.old);
        },
      )
      .subscribe();

    const chContractor = supabase
      .channel(`rt:invites:contractor:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invites",
          filter: `contractor_id=eq.${userId}`,
        },
        (payload: any) => {
          const p = payload as InviteEventPayload;
          if (p.eventType === "INSERT") onInsert?.(p.new);
          if (p.eventType === "UPDATE") onUpdate?.(p.new);
          if (p.eventType === "DELETE") onDelete?.(p.old);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chMusician);
      supabase.removeChannel(chContractor);
    };
  }, [userId, onInsert, onUpdate, onDelete]);
}

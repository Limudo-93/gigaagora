"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadICS, CalendarEvent } from "@/lib/ics-utils";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

export default function DownloadICSButton() {
  const [loading, setLoading] = useState(false);

  const handleDownloadICS = async () => {
    setLoading(true);
    try {
      // Busca shows confirmados
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_upcoming_confirmed_gigs");

      let confirmedGigs: any[] = [];

      if (rpcError) {
        // Fallback: busca direta
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: directData, error: directError } = await supabase
          .from("confirmations")
          .select(`
            invites!inner(
              musician_id,
              gigs!inner(
                id,
                title,
                start_time,
                end_time,
                location_name,
                address_text,
                city,
                state
              )
            )
          `)
          .eq("invites.musician_id", user.id)
          .gte("invites.gigs.start_time", new Date().toISOString());

        if (!directError && directData) {
          confirmedGigs = directData.map((conf: any) => ({
            title: conf.invites?.gigs?.title || "Show",
            start_time: conf.invites?.gigs?.start_time,
            end_time: conf.invites?.gigs?.end_time,
            location_name: conf.invites?.gigs?.location_name,
            address_text: conf.invites?.gigs?.address_text,
            city: conf.invites?.gigs?.city,
            state: conf.invites?.gigs?.state,
          }));
        }
      } else {
        confirmedGigs = (rpcData || []).map((gig: any) => ({
          title: gig.gig_title || "Show",
          start_time: gig.start_time,
          end_time: gig.end_time,
          location_name: gig.location_name,
          address_text: gig.address_text,
          city: gig.city,
          state: gig.state,
        }));
      }

      // Converte para formato CalendarEvent
      const events: CalendarEvent[] = confirmedGigs
        .filter((gig) => gig.start_time && gig.end_time)
        .map((gig) => {
          const locationParts = [
            gig.location_name,
            gig.address_text,
            gig.city,
            gig.state,
          ].filter(Boolean);
          const location = locationParts.join(", ");

          return {
            title: gig.title,
            startTime: gig.start_time,
            endTime: gig.end_time,
            location: location || undefined,
            description: `Show confirmado - ${gig.title}`,
          };
        });

      downloadICS(events, "agenda-chamaomusico.ics");
    } catch (error) {
      console.error("Erro ao gerar arquivo .ics:", error);
      alert("Erro ao gerar arquivo de calendário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100"
      onClick={handleDownloadICS}
      disabled={loading}
      title="Baixar calendário (.ics)"
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}


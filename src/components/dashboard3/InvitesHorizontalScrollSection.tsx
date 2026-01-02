"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import InviteDetailsDialog from "@/components/dashboard/InviteDetailsDialog";
import DeclineReasonDialog, {
  DeclineReason,
} from "@/components/dashboard/DeclineReasonDialog";
import { haversineKm, estimateTravelMin } from "@/lib/geo";

type InviteRow = {
  invite_id: string;
  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  instrument: string | null;
  flyer_url: string | null;
  contractor_name: string | null;
  cache: number | null;
  distance_km: number | null;
  estimated_travel_time_minutes: number | null;
};

export default function InvitesHorizontalScrollSection({
  userId,
}: {
  userId: string;
}) {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeclineReasonDialog, setShowDeclineReasonDialog] = useState(false);
  const [pendingDeclineInviteId, setPendingDeclineInviteId] = useState<
    string | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInvites();
  }, [userId]);

  const loadInvites = async () => {
    try {
      const { data: musicianProfile } = await supabase
        .from("musician_profiles")
        .select("latitude, longitude, strengths_counts")
        .eq("user_id", userId)
        .single();

      const { data: invitesData, error } = await supabase.rpc(
        "rpc_list_pending_invites_for_musician"
      );

      if (error) {
        console.error("Error loading invites:", error);
        return;
      }

      if (invitesData && musicianProfile?.latitude && musicianProfile?.longitude) {
        const transformed = invitesData.map((invite: any) => {
          const distance =
            invite.gig_latitude && invite.gig_longitude
              ? haversineKm(
                  musicianProfile.latitude,
                  musicianProfile.longitude,
                  invite.gig_latitude,
                  invite.gig_longitude
                )
              : null;

          return {
            invite_id: invite.invite_id,
            gig_id: invite.gig_id,
            gig_title: invite.gig_title,
            start_time: invite.start_time,
            location_name: invite.location_name,
            city: invite.city,
            state: invite.state,
            instrument: invite.instrument,
            flyer_url: invite.flyer_url,
            contractor_name: invite.contractor_name,
            cache: invite.cache,
            distance_km: distance,
            estimated_travel_time_minutes: distance
              ? estimateTravelMin(distance)
              : null,
          };
        });

        setInvites(transformed);
      } else if (invitesData) {
        const transformed = invitesData.map((invite: any) => ({
          invite_id: invite.invite_id,
          gig_id: invite.gig_id,
          gig_title: invite.gig_title,
          start_time: invite.start_time,
          location_name: invite.location_name,
          city: invite.city,
          state: invite.state,
          instrument: invite.instrument,
          flyer_url: invite.flyer_url,
          contractor_name: invite.contractor_name,
          cache: invite.cache,
          distance_km: null,
          estimated_travel_time_minutes: null,
        }));
        setInvites(transformed);
      }
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const acceptInvite = async (inviteId: string) => {
    setBusyId(inviteId);
    try {
      const { error } = await supabase.rpc("rpc_accept_invite", {
        p_invite_id: inviteId,
      });

      if (error) throw error;

      setInvites((prev) => prev.filter((inv) => inv.invite_id !== inviteId));
    } catch (error: any) {
      console.error("Error accepting invite:", error);
    } finally {
      setBusyId(null);
    }
  };

  const declineInvite = async (inviteId: string, reason: DeclineReason) => {
    setBusyId(inviteId);
    try {
      const { error } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
        p_decline_reason: reason,
      });

      if (error) throw error;

      setInvites((prev) => prev.filter((inv) => inv.invite_id !== inviteId));
      setShowDeclineReasonDialog(false);
      setPendingDeclineInviteId(null);
    } catch (error: any) {
      console.error("Error declining invite:", error);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start snap-always">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </section>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <>
      <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always py-12">
        <div className="max-w-7xl w-full space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Convites Recebidos
              </h2>
              <p className="text-muted-foreground mt-1">
                Deslize para ver todos os convites disponíveis
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {invites.map((invite) => (
                <Card
                  key={invite.invite_id}
                  className="min-w-[320px] max-w-[320px] border-2 hover:shadow-xl transition-all duration-300 snap-start"
                >
                  <CardContent className="p-0">
                    {invite.flyer_url && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={invite.flyer_url}
                          alt={invite.gig_title || "Flyer"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg line-clamp-2 flex-1">
                            {invite.gig_title}
                          </h3>
                          {invite.instrument && (
                            <Badge variant="outline" className="shrink-0">
                              {invite.instrument}
                            </Badge>
                          )}
                        </div>
                        {invite.contractor_name && (
                          <p className="text-sm text-muted-foreground">
                            {invite.contractor_name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(invite.start_time)} às{" "}
                            {formatTime(invite.start_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">
                            {invite.location_name}, {invite.city}
                            {invite.state && ` - ${invite.state}`}
                          </span>
                        </div>
                        {invite.distance_km && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">
                              {invite.distance_km.toFixed(1)} km
                              {invite.estimated_travel_time_minutes &&
                                ` • ${invite.estimated_travel_time_minutes} min`}
                            </span>
                          </div>
                        )}
                        {invite.cache && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              R$ {invite.cache.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                          onClick={() => acceptInvite(invite.invite_id)}
                          disabled={busyId === invite.invite_id}
                        >
                          {busyId === invite.invite_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Aceitar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingDeclineInviteId(invite.invite_id);
                            setShowDeclineReasonDialog(true);
                          }}
                          disabled={busyId === invite.invite_id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvite(invite);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button asChild variant="outline">
              <Link href={"/dashboard/gigs" as any}>
                Ver Todos os Convites
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {selectedInvite && (
        <InviteDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          invite={selectedInvite as any}
          onAccept={() => {
            acceptInvite(selectedInvite.invite_id);
            setDialogOpen(false);
          }}
          onDecline={() => {
            setDialogOpen(false);
            setPendingDeclineInviteId(selectedInvite.invite_id);
            setShowDeclineReasonDialog(true);
          }}
        />
      )}

      <DeclineReasonDialog
        open={showDeclineReasonDialog}
        onOpenChange={setShowDeclineReasonDialog}
        onDecline={(reason) => {
          if (pendingDeclineInviteId) {
            declineInvite(pendingDeclineInviteId, reason);
          }
        }}
      />
    </>
  );
}

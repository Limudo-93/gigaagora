"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type CancellationNotification = {
  id: string;
  gig_id: string;
  gig_title: string | null;
  musician_name: string | null;
  instrument: string | null;
  created_at: string;
};

export default function CancellationAlertCard({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<CancellationNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("cancellation_notifications")
          .select("id, gig_id, gig_title, musician_name, instrument, created_at")
          .eq("contractor_id", userId)
          .is("read_at", null)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading cancellation notifications:", error);
          return;
        }

        setNotifications((data || []) as CancellationNotification[]);
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe para novas notificações
    const channel = supabase
      .channel(`cancellation-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cancellation_notifications",
          filter: `contractor_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("cancellation_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const republishGig = async (gigId: string, notificationId: string) => {
    try {
      // Atualizar status da gig para published
      const { error: updateError } = await supabase
        .from("gigs")
        .update({ status: "published" })
        .eq("id", gigId)
        .eq("contractor_id", userId);

      if (updateError) {
        console.error("Error republishing gig:", updateError);
        alert("Erro ao republicar a gig. Tente novamente.");
        return;
      }

      // Marcar notificação como lida
      await markAsRead(notificationId);

      // Redirecionar para a página da gig
      router.push(`/dashboard/gigs/${gigId}`);
      router.refresh();
    } catch (err) {
      console.error("Error republishing gig:", err);
      alert("Erro ao republicar a gig. Tente novamente.");
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
        >
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-start justify-between gap-2 md:gap-4">
              <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                <div className="mt-0.5 md:mt-1 shrink-0">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg text-red-900 dark:text-red-200 mb-1">
                    Gig Cancelada
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <strong>{notification.musician_name || "Um músico"}</strong> cancelou sua participação na gig{" "}
                    <strong>"{notification.gig_title || "sem título"}"</strong>
                    {notification.instrument && (
                      <> para <strong>{notification.instrument}</strong></>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="h-7 w-7 md:h-8 md:w-8 p-0 shrink-0"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
              <Button
                onClick={() => republishGig(notification.gig_id, notification.id)}
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white text-xs md:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                Republicar Gig
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  markAsRead(notification.id);
                  router.push(`/dashboard/gigs/${notification.gig_id}`);
                }}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


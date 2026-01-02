"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import ThemedBackground from "@/components/dashboard/ThemedBackground";
import Header from "@/components/dashboard/Header";
import LocationUpdater from "@/components/dashboard/LocationUpdater";
import PushNotificationManager from "@/components/push-notifications/PushNotificationManager";

export default function Dashboard3Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    // Configurar snap scroll no body
    document.body.classList.add("snap-y", "snap-mandatory", "overflow-y-scroll");
    document.documentElement.classList.add("snap-y", "snap-mandatory", "overflow-y-scroll", "h-screen");
    
    return () => {
      document.body.classList.remove("snap-y", "snap-mandatory", "overflow-y-scroll");
      document.documentElement.classList.remove("snap-y", "snap-mandatory", "overflow-y-scroll", "h-screen");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <ThemedBackground />
      <LocationUpdater />
      {userId && <PushNotificationManager userId={userId} />}
      <Header />
      <main className="flex-1 relative z-10">
        {children}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/dashboard3/HeroSection";
import QuickActionsSection from "@/components/dashboard3/QuickActionsSection";
import ProgressSection from "@/components/dashboard3/ProgressSection";
import PendingItemsSection from "@/components/dashboard3/PendingItemsSection";
import UpcomingGigsSection from "@/components/dashboard3/UpcomingGigsSection";
import Dashboard3Layout from "@/components/dashboard3/Dashboard3Layout";

export default async function Dashboard3Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <Dashboard3Layout>
      <HeroSection userId={user.id} />
      <QuickActionsSection />
      <PendingItemsSection userId={user.id} />
      <UpcomingGigsSection userId={user.id} />
      <ProgressSection userId={user.id} />
    </Dashboard3Layout>
  );
}

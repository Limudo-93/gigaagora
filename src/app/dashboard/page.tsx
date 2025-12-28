import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileCompletion from "@/components/dashboard/ProfileCompletion";
import Sidebar from "@/components/dashboard/Sidebar";
import GigsTabs from "@/components/dashboard/GigsTabs";
import PendingInvites from "@/components/dashboard/PendingInvites";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayout sidebar={<Sidebar />}>
      <ProfileHeader />
      <ProfileCompletion />

      {/* ✅ "Meus Gigs" */}
      <GigsTabs userId={user.id} />

      {/* ✅ "Convites Pendentes" */}
      <PendingInvites userId={user.id} />
    </DashboardLayout>
  );
}

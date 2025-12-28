import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileCompletion from "@/components/dashboard/ProfileCompletion";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayout
      sidebar={<Sidebar />}
    >
      <ProfileHeader />
      <ProfileCompletion />
      {/* Próximo passo: GigsTabs */}
    </DashboardLayout>
  );
}

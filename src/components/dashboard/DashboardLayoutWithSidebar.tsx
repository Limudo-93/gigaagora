import DashboardLayout from "./DashboardLayout";
import Sidebar from "./Sidebar";

export default function DashboardLayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout sidebar={<Sidebar />}>
      {children}
    </DashboardLayout>
  );
}


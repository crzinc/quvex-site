import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-dashboard-bg">
      <Sidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

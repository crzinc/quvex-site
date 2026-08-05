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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "admin") {
    const { data: userStudio } = await supabase
      .from("user_studios")
      .select("studios(slug)")
      .eq("user_id", user.id)
      .maybeSingle();

    const studios = userStudio?.studios as unknown;
    const studioRow = Array.isArray(studios)
      ? (studios as { slug: string }[])[0]
      : (studios as { slug: string } | null);

    redirect(studioRow?.slug ? `/studio/${studioRow.slug}` : "/");
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

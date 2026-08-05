import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioHeader from "@/components/studio/StudioHeader";
import { getStudioTheme, themeVariables } from "@/lib/utils";

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { data: userStudio } = await supabase
    .from("user_studios")
    .select("*, studios!inner(*)")
    .eq("user_id", session.user.id)
    .eq("studios.slug", slug)
    .maybeSingle();

  if (!userStudio || !userStudio.studios) {
    redirect("/dashboard");
  }

  const studio = userStudio.studios as unknown as {
    id: string;
    name: string;
    logo_url: string;
    settings: Record<string, unknown>;
  };
  const theme = getStudioTheme(studio.settings);

  return (
    <div
      className="flex min-h-screen bg-dashboard-bg"
      style={themeVariables(theme) as React.CSSProperties}
    >
      <StudioSidebar
        slug={slug}
        studioName={studio.name}
        studioLogo={studio.logo_url}
      />
      <div className="flex-1 ml-64">
        <StudioHeader slug={slug} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

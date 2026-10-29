import { requireTenant } from "@/lib/auth";
import { OverviewHome } from "@/components/app/home/OverviewHome";
import { BoardHome } from "@/components/app/home/BoardHome";
import { MyWorkHome } from "@/components/app/home/MyWorkHome";

/** Each role lands on the home screen its niche template defines. */
export default async function TenantHome({ params }: PageProps<"/app/[tenant]">) {
  const ctx = await requireTenant((await params).tenant);
  switch (ctx.workspace.home) {
    case "board":
      return <BoardHome ctx={ctx} />;
    case "my_work":
      return <MyWorkHome ctx={ctx} />;
    default:
      return <OverviewHome ctx={ctx} />;
  }
}

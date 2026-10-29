import { requireTenant } from "@/lib/auth";
import { term } from "@/niches";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { ClientFields } from "@/components/app/ClientFields";
import { AssetFields } from "@/components/app/AssetFields";
import { addClient } from "@/lib/actions/crm";

export default async function NewClientPage({ params }: PageProps<"/app/[tenant]/clients/new">) {
  const { tenant: slug } = await params;
  const { niche, locale, t } = await requireTenant(slug);
  return (
    <>
      <PageHeader title={t.clients.newClient} back={{ href: `/app/${slug}/clients`, label: t.nav.clients }} />
      <ActionForm action={addClient.bind(null, slug)} resetOnSuccess={false} className="grid max-w-2xl gap-6">
        <Card className="p-4 sm:p-5">
          <ClientFields t={t} />
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">
            {term(niche, "asset", locale)} <span className="font-normal text-fg-subtle">({t.common.optional})</span>
          </h2>
          <AssetFields
            locale={locale}
            identifierLabel={niche.asset.identifierLabel[locale]}
            identifierPlaceholder={niche.asset.identifierPlaceholder}
            fields={niche.asset.fields}
          />
        </Card>
        <div>
          <SubmitButton variant="accent" size="lg" pendingLabel={t.common.saving}>{t.common.create}</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}

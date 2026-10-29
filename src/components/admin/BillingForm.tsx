"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { Field, Input, Select } from "@/components/ui";
import { PERIODS, PLANS, periodTotal, type PaidPlanId } from "@/config/plans";
import type { ActionState } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries";

/** Records a subscription payment; the amount is pre-filled from plan × period with the prepay discount. */
export function BillingForm({
  action,
  t,
  defaultPlan,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  t: Dictionary;
  defaultPlan: PaidPlanId;
}) {
  const [plan, setPlan] = useState<PaidPlanId>(defaultPlan);
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(String(periodTotal(defaultPlan, 1)));
  const recalc = (p: PaidPlanId, m: number) => setAmount(String(periodTotal(p, m)));

  return (
    <ActionForm action={action} className="grid gap-3" successMessage={t.settings.saved} onSuccess={() => recalc(plan, months)}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.admin.plan}>
          <Select
            name="plan"
            value={plan}
            onChange={(e) => {
              const p = e.target.value as PaidPlanId;
              setPlan(p);
              recalc(p, months);
            }}
          >
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {t.plans[p.id]} · {p.price} ₼
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.admin.period}>
          <Select
            name="months"
            value={months}
            onChange={(e) => {
              const m = Number(e.target.value);
              setMonths(m);
              recalc(plan, m);
            }}
          >
            {PERIODS.map((p) => (
              <option key={p.months} value={p.months}>
                {p.months} {t.admin.monthsShort}
                {p.discount ? ` (−${p.discount}%)` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.common.amount}>
          <Input name="amount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t.orders.method}>
          <Input name="method" placeholder="m10, Birbank…" />
        </Field>
      </div>
      <Field label={t.common.notes}>
        <Input name="note" />
      </Field>
      <SubmitButton>{t.admin.recordPayment}</SubmitButton>
    </ActionForm>
  );
}

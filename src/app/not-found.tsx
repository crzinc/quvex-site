import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-semibold tracking-tight text-fg-subtle">404</div>
      <ButtonLink href="/" variant="secondary">Quvex</ButtonLink>
    </div>
  );
}

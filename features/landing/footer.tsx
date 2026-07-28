import { Logo } from "@/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <Logo className="text-foreground" />
        <p>An AI business consultant for small business owners.</p>
      </div>
    </footer>
  );
}

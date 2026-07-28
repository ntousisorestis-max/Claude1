import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <FadeIn>
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop firefighting. Start fixing.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/85 text-pretty">
            Tell us what&apos;s going wrong. We&apos;ll show you exactly what it&apos;s costing you —
            and build the workspace to fix it.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8">
            <Link href="/diagnostic">
              Start free
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getBusinessTypeOption } from "@/types";
import { SimulatedAIProvider } from "@/lib/ai/simulated/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ReportView } from "@/features/report/report-view";

export const metadata = {
  title: "Example report — FixMyBusiness",
};

const EXAMPLE_WORKDAY = `I own a plumbing business.
Customers mostly call me.
Sometimes I forget to call them back.
Invoices pile up.
Employees forget tasks.
Everything is in WhatsApp.`;

// Server Component: runs the same deterministic consultant engine real
// diagnostics use, just with a fixed workday description and a fixed
// (first-option) answer to each generated follow-up question.
export default async function ExamplePage() {
  const provider = new SimulatedAIProvider();
  const businessType = "plumber" as const;

  const questions = await provider.generateFollowUpQuestions({
    businessType,
    workdayDescription: EXAMPLE_WORKDAY,
  });
  const followUpAnswers = questions.map((q) => ({
    questionId: q.id,
    selectedOptionId: q.options[0].id,
  }));
  const report = await provider.generateBusinessReport({
    businessType,
    workdayDescription: EXAMPLE_WORKDAY,
    followUpQuestions: questions,
    followUpAnswers,
  });

  const businessLabel = getBusinessTypeOption(businessType).label;

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Logo />
          <Button asChild size="sm">
            <Link href="/diagnostic">
              Try it with your business
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Badge variant="secondary">Example · {businessLabel}</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          A sample Business Health Report
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Based on a normal workday description like the one below — this is exactly what you&apos;ll
          get for your own business in about 3 minutes.
        </p>
        <blockquote className="mt-4 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground whitespace-pre-line">
          {EXAMPLE_WORKDAY}
        </blockquote>

        <ReportView report={report} />

        <div className="mt-14 rounded-2xl border border-primary/30 bg-accent/40 p-6 text-center">
          <p className="font-medium">Ready to see this for your own business?</p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/diagnostic">
              Start free
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getBusinessTypeOption } from "@/types";
import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useHydrated } from "@/lib/store/use-hydrated";
import { fetchWorkspacePlan } from "@/lib/ai/client";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { ReportView } from "@/features/report/report-view";
import { RecommendedSolutionCard } from "@/features/report/recommended-solution-card";

export default function ReportPage() {
  const router = useRouter();
  const hydrated = useHydrated(useDiagnosticStore);
  const { businessType, businessName, report, setBusinessName, setWorkspacePlan } = useDiagnosticStore();
  const seedIfEmpty = useWorkspaceStore((s) => s.seedIfEmpty);
  const [isBuilding, setIsBuilding] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && !report) router.replace("/diagnostic");
  }, [hydrated, report, router]);

  if (!hydrated || !report || !businessType) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const businessLabel = getBusinessTypeOption(businessType).label;

  async function handleBuildWorkspace() {
    if (!businessType || !report) return;
    setIsBuilding(true);
    try {
      const plan = await fetchWorkspacePlan({ businessType, businessName, report });
      setWorkspacePlan(plan);
      seedIfEmpty(businessType);
      router.push("/workspace");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setIsBuilding(false);
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Badge variant="secondary">{businessLabel} · Business Health Report</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Here&apos;s what&apos;s really going on
        </h1>

        <div className="mt-6 max-w-sm">
          <Label htmlFor="business-name" className="mb-2">
            What should we call your business?
          </Label>
          <Input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your Business"
          />
        </div>

        <ReportView report={report} />

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Recommended solution</h2>
          <div className="mt-6">
            <RecommendedSolutionCard
              solution={report.recommendedSolution}
              isLoading={isBuilding}
              onBuildWorkspace={handleBuildWorkspace}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useHydrated } from "@/lib/store/use-hydrated";
import { WorkspaceSidebar } from "@/features/workspace/sidebar";
import { WorkspaceTopbar } from "@/features/workspace/topbar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const diagnosticHydrated = useHydrated(useDiagnosticStore);
  const workspaceHydrated = useHydrated(useWorkspaceStore);
  const hydrated = diagnosticHydrated && workspaceHydrated;
  const workspacePlan = useDiagnosticStore((s) => s.workspacePlan);
  const businessName = useDiagnosticStore((s) => s.businessName);

  React.useEffect(() => {
    if (hydrated && !workspacePlan) router.replace("/diagnostic");
  }, [hydrated, workspacePlan, router]);

  if (!hydrated || !workspacePlan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block">
        <WorkspaceSidebar moduleIds={workspacePlan.moduleIds} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar moduleIds={workspacePlan.moduleIds} businessName={businessName} />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

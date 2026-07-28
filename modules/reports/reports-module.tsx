"use client";

import { BarChart3, CheckCircle2, ListTodo, Users } from "lucide-react";

import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ReportView } from "@/features/report/report-view";

export function ReportsModule() {
  const report = useDiagnosticStore((s) => s.report);
  const { tasks, customers, checklist } = useWorkspaceStore();

  const tasksDone = tasks.filter((t) => t.done).length;
  const checklistDone = checklist.filter((c) => c.done).length;

  return (
    <div>
      <SectionHeader title="Reports" description="Your business health, over time." />

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <Card className="gap-2 py-5">
          <CardContent className="flex items-center gap-3 px-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ListTodo className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
              <p className="text-xl font-semibold">{tasksDone}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardContent className="flex items-center gap-3 px-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Customers tracked</p>
              <p className="text-xl font-semibold">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardContent className="flex items-center gap-3 px-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Checklist items done</p>
              <p className="text-xl font-semibold">{checklistDone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {report ? (
        <>
          <h2 className="mb-6 text-lg font-semibold">Your original business health report</h2>
          <ReportView report={report} />
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="No report yet"
          description="Run the business diagnostic to generate your first report."
        />
      )}
    </div>
  );
}

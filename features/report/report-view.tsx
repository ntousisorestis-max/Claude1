import { Clock, DollarSign, TrendingUp } from "lucide-react";

import type { BusinessReport } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { HealthScoreGauge } from "@/features/report/health-score-gauge";
import { StatCard } from "@/features/report/stat-card";
import { BottleneckList } from "@/features/report/bottleneck-list";
import { HoursChart } from "@/features/report/hours-chart";

export function ReportView({ report }: { report: BusinessReport }) {
  return (
    <>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">{report.summary}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="items-center py-5">
          <CardContent className="flex flex-col items-center px-5">
            <p className="mb-1 text-sm text-muted-foreground">Business health score</p>
            <HealthScoreGauge score={report.healthScore} />
          </CardContent>
        </Card>
        <StatCard
          icon={Clock}
          label="Estimated hours lost per week"
          value={`${report.hoursLostPerWeek} hrs`}
          sublabel="Across everything you told us about"
        />
        <StatCard
          icon={DollarSign}
          label="Estimated revenue opportunity"
          value={`$${report.revenueOpportunity.low.toLocaleString()}–$${report.revenueOpportunity.high.toLocaleString()}`}
          sublabel="Per week, if these are fixed"
        />
      </div>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <TrendingUp className="size-5 text-primary" />
          Top operational bottlenecks
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Ranked by how much they&apos;re costing you.</p>
        <div className="mt-6">
          <BottleneckList bottlenecks={report.bottlenecks} priorityOrder={report.priorityOrder} />
        </div>
      </section>

      {report.bottlenecks.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Hours lost per week, by issue</h2>
          <Card className="mt-6 py-6">
            <CardContent className="px-6">
              <HoursChart bottlenecks={report.bottlenecks} />
            </CardContent>
          </Card>
        </section>
      )}
    </>
  );
}

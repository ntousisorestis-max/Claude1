import type { Bottleneck, Severity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const SEVERITY_VARIANT: Record<Severity, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

export function BottleneckList({
  bottlenecks,
  priorityOrder,
}: {
  bottlenecks: Bottleneck[];
  priorityOrder: string[];
}) {
  const ordered = priorityOrder
    .map((id) => bottlenecks.find((b) => b.id === id))
    .filter((b): b is Bottleneck => Boolean(b));

  return (
    <div className="space-y-3">
      {ordered.map((bottleneck, index) => (
        <Card key={bottleneck.id} className="flex-row items-start gap-4 py-5 px-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {index + 1}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{bottleneck.title}</h3>
              <Badge variant={SEVERITY_VARIANT[bottleneck.severity]}>
                {SEVERITY_LABEL[bottleneck.severity]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{bottleneck.description}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              ~{bottleneck.hoursLostPerWeek} hours lost per week
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

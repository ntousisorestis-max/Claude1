"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-destructive)";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Needs attention";
  return "At risk";
}

export function HealthScoreGauge({ score }: { score: number }) {
  const data = [{ name: "score", value: score }];

  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart
        width={220}
        height={130}
        cx="50%"
        cy="100%"
        innerRadius={85}
        outerRadius={105}
        barSize={20}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" background angleAxisId={0} cornerRadius={999} fill={scoreColor(score)} />
      </RadialBarChart>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-4xl font-semibold tracking-tight">{score}</span>
        <span className="text-xs font-medium text-muted-foreground">{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

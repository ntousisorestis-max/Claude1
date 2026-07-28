import type { Bottleneck, BusinessType, WorkerId } from "@/types";
import { AI_WORKER_DEFINITIONS, sortWorkerIds } from "./registry";

const QUOTE_DRIVEN_BUSINESS_TYPES: BusinessType[] = [
  "plumber",
  "electrician",
  "construction",
  "cleaning",
];

const MAX_WORKERS = 4;

export function recommendWorkers(
  businessType: BusinessType,
  bottlenecks: Bottleneck[]
): WorkerId[] {
  const categories = new Set(bottlenecks.map((b) => b.category));
  const score = new Map<WorkerId, number>();

  for (const worker of Object.values(AI_WORKER_DEFINITIONS)) {
    let workerScore = 0;
    for (const category of worker.relevantCategories) {
      if (categories.has(category)) workerScore += 1;
    }
    if (worker.id === "quote-generator" && QUOTE_DRIVEN_BUSINESS_TYPES.includes(businessType)) {
      workerScore += 2;
    }
    if (workerScore > 0) score.set(worker.id, workerScore);
  }

  // Always show at least the two most broadly useful workers so the
  // workspace never feels empty, even with a very short diagnostic.
  if (score.size === 0) {
    score.set("customer-follow-up", 1);
    score.set("invoice-assistant", 1);
  }

  const ranked = Array.from(score.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_WORKERS)
    .map(([id]) => id);

  return sortWorkerIds(ranked);
}

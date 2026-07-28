import type { BusinessType } from "./business";
import type { PainCategory } from "./diagnostic";
import type { ModuleId } from "./modules";
import type { WorkerId } from "./workers";

export type Severity = "low" | "medium" | "high";

export interface Bottleneck {
  id: string;
  category: PainCategory;
  title: string;
  description: string;
  severity: Severity;
  hoursLostPerWeek: number;
}

export interface RevenueOpportunity {
  low: number;
  high: number;
}

export interface BusinessReport {
  generatedAt: string;
  businessType: BusinessType;
  summary: string;
  healthScore: number;
  hoursLostPerWeek: number;
  revenueOpportunity: RevenueOpportunity;
  bottlenecks: Bottleneck[];
  /** Bottleneck ids, ordered highest priority first. */
  priorityOrder: string[];
  recommendedSolution: string;
  recommendedModuleIds: ModuleId[];
  recommendedWorkerIds: WorkerId[];
}

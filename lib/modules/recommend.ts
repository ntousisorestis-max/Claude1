import type { Bottleneck, BusinessType, ModuleId, Severity } from "@/types";
import { getBusinessTypeOption } from "@/types";
import { sortModuleIds } from "./registry";

const CATEGORY_TO_MODULES: Record<Bottleneck["category"], ModuleId[]> = {
  invoicing: ["documents", "reminders", "reports"],
  scheduling: ["calendar", "reminders"],
  customer_communication: ["customers", "reminders"],
  employee_management: ["tasks", "checklist"],
  inventory: ["tasks", "documents"],
  reviews_reputation: ["customers", "reports"],
  owner_overload: ["dashboard", "tasks"],
  record_keeping: ["notes", "documents"],
};

const BUSINESS_TYPE_BASELINE_MODULES: Record<BusinessType, ModuleId[]> = {
  restaurant: ["checklist", "tasks"],
  cafe: ["checklist", "tasks"],
  salon: ["calendar", "customers"],
  construction: ["calendar", "customers", "tasks"],
  plumber: ["calendar", "customers"],
  electrician: ["calendar", "customers"],
  dentist: ["calendar", "customers"],
  gym: ["calendar", "customers"],
  retail: ["customers", "documents"],
  cleaning: ["calendar", "tasks", "checklist"],
  other: ["tasks"],
};

const SEVERITY_WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

const CORE_MODULES: ModuleId[] = ["dashboard", "settings"];
const MAX_RECOMMENDED_MODULES = 6;

export interface ModuleRecommendation {
  moduleIds: ModuleId[];
  rationale: Partial<Record<ModuleId, string>>;
}

export function recommendModules(
  businessType: BusinessType,
  bottlenecks: Bottleneck[]
): ModuleRecommendation {
  const score = new Map<ModuleId, number>();
  const rationale: Partial<Record<ModuleId, string>> = {};

  for (const bottleneck of bottlenecks) {
    const weight = SEVERITY_WEIGHT[bottleneck.severity];
    for (const moduleId of CATEGORY_TO_MODULES[bottleneck.category]) {
      score.set(moduleId, (score.get(moduleId) ?? 0) + weight);
      if (!rationale[moduleId]) {
        rationale[moduleId] = `Recommended because: ${bottleneck.title.toLowerCase()}`;
      }
    }
  }

  const businessLabel = getBusinessTypeOption(businessType).label;
  for (const moduleId of BUSINESS_TYPE_BASELINE_MODULES[businessType]) {
    score.set(moduleId, (score.get(moduleId) ?? 0) + 1);
    if (!rationale[moduleId]) {
      rationale[moduleId] = `A staple for running a ${businessLabel.toLowerCase()}.`;
    }
  }

  const ranked = Array.from(score.entries())
    .filter(([id]) => !CORE_MODULES.includes(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_RECOMMENDED_MODULES)
    .map(([id]) => id);

  const moduleIds = sortModuleIds([...CORE_MODULES, ...ranked]);

  rationale.dashboard = "Your business, summarized in one place.";
  rationale.settings = "Business profile, team, and future connections.";

  return { moduleIds, rationale };
}

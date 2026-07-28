import type { Bottleneck, BusinessType, ModuleId, PainCategory, WorkerId } from "@/types";
import { recommendModules, type ModuleRecommendation } from "@/lib/modules/recommend";
import { sortModuleIds } from "@/lib/modules/registry";
import { recommendWorkers } from "@/lib/workers/recommend";

/**
 * The workspace generator: turns a diagnosed set of bottlenecks into the
 * concrete workspace plan (modules + AI workers). Both AI providers call
 * this instead of the lower-level recommenders, so new dynamic modules
 * only need to be registered here.
 *
 * A "dynamic module" is one that is guaranteed a place in the workspace
 * whenever one of its trigger categories shows up in the diagnostic —
 * regardless of how the general scoring in lib/modules/recommend ranks
 * it. Its React component lives in components/dynamic-modules/ and is
 * mapped to its ModuleId in modules/module-router.tsx.
 */
export interface DynamicModuleRegistration {
  moduleId: ModuleId;
  /** Diagnosed categories that guarantee this module is generated. */
  triggerCategories: PainCategory[];
  /** Plain-language reason shown to the owner for why they got this module. */
  rationale: string;
}

export const DYNAMIC_MODULE_REGISTRY: DynamicModuleRegistration[] = [
  {
    // components/dynamic-modules/EmailAutomationHub.tsx
    moduleId: "email",
    triggerCategories: ["email_overload"],
    rationale: "Recommended because: the inbox never stops.",
  },
];

export interface GeneratedWorkspace extends ModuleRecommendation {
  workerIds: WorkerId[];
}

export function generateWorkspace(
  businessType: BusinessType,
  bottlenecks: Bottleneck[]
): GeneratedWorkspace {
  const base = recommendModules(businessType, bottlenecks);
  const diagnosedCategories = new Set(bottlenecks.map((b) => b.category));

  for (const registration of DYNAMIC_MODULE_REGISTRY) {
    const triggered = registration.triggerCategories.some((category) =>
      diagnosedCategories.has(category)
    );
    if (triggered && !base.moduleIds.includes(registration.moduleId)) {
      base.moduleIds = sortModuleIds([...base.moduleIds, registration.moduleId]);
      base.rationale[registration.moduleId] = registration.rationale;
    }
  }

  return { ...base, workerIds: recommendWorkers(businessType, bottlenecks) };
}

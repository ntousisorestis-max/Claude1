import { randomUUID } from "node:crypto";

import type { Bottleneck, FollowUpQuestion, ModuleId, Severity } from "@/types";
import { getModule } from "@/lib/modules/registry";
import { generateWorkspace } from "@/lib/app-generator";

import type {
  AIProvider,
  GenerateBusinessReportInput,
  GenerateFollowUpQuestionsInput,
  GenerateWorkspacePlanInput,
} from "../types";
import { detectCategories, PAIN_SIGNALS } from "./signals";

const SEVERITY_WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
const SEVERITY_MULTIPLIER: Record<Severity, number> = { low: 0.7, medium: 1, high: 1.4 };
const HOURLY_VALUE = 35;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function buildSummary(bottlenecks: Bottleneck[], totalHours: number): string {
  if (bottlenecks.length === 0) {
    return "A business like yours keeps you busy in every direction, but nothing you described points to a specific bottleneck yet — a quick setup can still save you time on the basics.";
  }
  const [first, second] = bottlenecks;
  const highlights = [first.title, second && lowerFirst(second.title)].filter(Boolean).join(", and ");
  return `Every day brings its own fire to put out. Right now it's mainly this: ${highlights}. Together, that's quietly costing you about ${totalHours} hours a week — fixable with the right setup, not more hours in the day.`;
}

function buildRecommendedSolution(
  topBottleneck: Bottleneck | undefined,
  moduleIds: ModuleId[]
): string {
  if (!topBottleneck) {
    return "Start with a simple Dashboard and Tasks setup so you have one place to see what matters each day.";
  }
  const [primaryModuleId, secondaryModuleId] = moduleIds.filter((id) => id !== "dashboard" && id !== "settings");
  const primaryName = primaryModuleId ? getModule(primaryModuleId).name : "Dashboard";
  const secondaryName = secondaryModuleId ? getModule(secondaryModuleId).name : undefined;
  const base = `Start with ${primaryName} to get "${topBottleneck.title.toLowerCase()}" under control`;
  return secondaryName
    ? `${base}, then layer in ${secondaryName} once the basics feel automatic.`
    : `${base}.`;
}

export class SimulatedAIProvider implements AIProvider {
  readonly name = "simulated";

  async generateFollowUpQuestions({
    businessType,
    workdayDescription,
  }: GenerateFollowUpQuestionsInput): Promise<FollowUpQuestion[]> {
    const detected = detectCategories(businessType, workdayDescription);
    // Only ask about problems the owner actually described. Padding the
    // question count with business-type guesses made the consultant feel
    // like it wasn't listening ("you said emails, why are you asking about
    // staff?") — guesses are now used only when nothing matched at all.
    const matched = detected.filter((d) => d.matched);
    const chosen = matched.length > 0 ? matched.slice(0, 5) : detected.slice(0, 3);

    return chosen.map((d) => {
      const signal = PAIN_SIGNALS[d.category];
      return {
        id: `${d.category}-question`,
        category: d.category,
        context: d.matched ? signal.contextLabel : undefined,
        prompt: signal.prompt(d.matched),
        options: signal.options.map((option) => ({ id: option.id, label: option.label })),
        allowOther: true,
      };
    });
  }

  async generateBusinessReport({
    businessType,
    followUpQuestions,
    followUpAnswers,
  }: GenerateBusinessReportInput) {
    const answerByQuestion = new Map(followUpAnswers.map((a) => [a.questionId, a]));

    const bottlenecks: Bottleneck[] = followUpQuestions.map((question) => {
      const signal = PAIN_SIGNALS[question.category];
      const answer = answerByQuestion.get(question.id);
      const selectedOption = signal.options.find((o) => o.id === answer?.selectedOptionId);
      const severity: Severity = selectedOption?.severity ?? "medium";
      const hoursLostPerWeek = Math.round(signal.baseHoursLostPerWeek * SEVERITY_MULTIPLIER[severity]);

      return {
        id: `bottleneck-${question.category}-${randomUUID().slice(0, 8)}`,
        category: question.category,
        title: signal.title,
        description: signal.description,
        severity,
        hoursLostPerWeek,
      };
    });

    const priorityOrder = [...bottlenecks]
      .sort(
        (a, b) =>
          SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] ||
          b.hoursLostPerWeek - a.hoursLostPerWeek
      )
      .map((b) => b.id);

    const orderedBottlenecks = priorityOrder
      .map((id) => bottlenecks.find((b) => b.id === id))
      .filter((b): b is Bottleneck => Boolean(b));

    const totalHours = bottlenecks.reduce((sum, b) => sum + b.hoursLostPerWeek, 0);
    const severityPenalty = bottlenecks.reduce((sum, b) => sum + SEVERITY_WEIGHT[b.severity] * 6, 0);
    const healthScore = clamp(Math.round(96 - severityPenalty), 28, 94);

    const revenueOpportunity = {
      low: Math.round((totalHours * HOURLY_VALUE * 0.6) / 10) * 10,
      high: Math.round((totalHours * HOURLY_VALUE * 1.3) / 10) * 10,
    };

    const { moduleIds, workerIds } = generateWorkspace(businessType, bottlenecks);

    return {
      generatedAt: new Date().toISOString(),
      businessType,
      summary: buildSummary(orderedBottlenecks, totalHours),
      healthScore,
      hoursLostPerWeek: totalHours,
      revenueOpportunity,
      bottlenecks,
      priorityOrder,
      recommendedSolution: buildRecommendedSolution(orderedBottlenecks[0], moduleIds),
      recommendedModuleIds: moduleIds,
      recommendedWorkerIds: workerIds,
    };
  }

  async generateWorkspacePlan({ businessType, businessName, report }: GenerateWorkspacePlanInput) {
    const { moduleIds, rationale } = generateWorkspace(businessType, report.bottlenecks);

    return {
      businessType,
      businessName,
      moduleIds,
      workerIds: report.recommendedWorkerIds,
      rationale,
      createdAt: new Date().toISOString(),
    };
  }
}

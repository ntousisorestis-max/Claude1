import OpenAI from "openai";

import {
  businessReportSchema,
  followUpQuestionSchema,
  workspacePlanSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

import type {
  AIProvider,
  GenerateBusinessReportInput,
  GenerateFollowUpQuestionsInput,
  GenerateWorkspacePlanInput,
} from "../types";

const CONSULTANT_VOICE = `You are a warm, plain-spoken small-business consultant. Never use technical
words like API, database, workflow, or deployment. Talk the way a trusted advisor would talk to a busy
shop owner: short sentences, concrete, encouraging, never condescending.`;

/**
 * Real LLM-backed implementation of the AI Business Consultant. Only used
 * when OPENAI_API_KEY is configured (see lib/ai/index.ts) — until then the
 * deterministic SimulatedAIProvider covers the same contract with zero
 * setup. Responses are validated against the same Zod schemas the app
 * uses everywhere else, so a malformed model reply fails loudly instead
 * of corrupting the UI.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = process.env.OPENAI_MODEL || "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  private async completeJson(system: string, user: string): Promise<unknown> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${CONSULTANT_VOICE}\n\n${system}` },
        { role: "user", content: user },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty response.");
    return JSON.parse(content);
  }

  async generateFollowUpQuestions({
    businessType,
    workdayDescription,
  }: GenerateFollowUpQuestionsInput) {
    const raw = await this.completeJson(
      `Read the owner's description of a normal workday for their ${businessType} business.
Identify 3 to 5 root-cause problems worth asking about. For each, write one adaptive follow-up
question with 3 short multiple-choice options (plus we'll always add "Other" ourselves, so don't
include it). Respond as JSON: {"questions": FollowUpQuestion[]} where each item has
id, category (one of: invoicing, scheduling, customer_communication, employee_management,
inventory, reviews_reputation, owner_overload, record_keeping), context (short phrase or null),
prompt, options (array of {id, label}), allowOther: true.`,
      workdayDescription
    );

    const parsed = z.object({ questions: z.array(followUpQuestionSchema) }).parse(raw);
    return parsed.questions;
  }

  async generateBusinessReport({
    businessType,
    workdayDescription,
    followUpQuestions,
    followUpAnswers,
  }: GenerateBusinessReportInput) {
    const raw = await this.completeJson(
      `Using the owner's workday description and their answers to your follow-up questions, produce
a Business Health Report as JSON matching this shape exactly: { generatedAt (ISO string),
businessType: "${businessType}", summary, healthScore (0-100), hoursLostPerWeek, revenueOpportunity:
{low, high} (weekly USD), bottlenecks: [{id, category, title, description, severity: low|medium|high,
hoursLostPerWeek}], priorityOrder (bottleneck ids, most urgent first), recommendedSolution,
recommendedModuleIds (subset of: dashboard, tasks, calendar, customers, notes, reminders, documents,
checklist, reports, settings — always include dashboard and settings), recommendedWorkerIds (subset of:
customer-follow-up, invoice-assistant, email-drafter, document-summarizer, quote-generator). Be specific
and grounded in what the owner actually said.`,
      JSON.stringify({ workdayDescription, followUpQuestions, followUpAnswers })
    );

    return businessReportSchema.parse(raw);
  }

  async generateWorkspacePlan({ businessType, businessName, report }: GenerateWorkspacePlanInput) {
    const raw = await this.completeJson(
      `Turn this Business Health Report into a workspace plan as JSON: { businessType: "${businessType}",
businessName: ${JSON.stringify(businessName)}, moduleIds (from the report's recommendedModuleIds, ordered
sensibly with dashboard first and settings last), workerIds (the report's recommendedWorkerIds),
rationale (an object keyed by moduleId with a one-sentence reason a non-technical owner would
understand), createdAt (ISO string, now). }`,
      JSON.stringify(report)
    );

    return workspacePlanSchema.parse(raw);
  }
}

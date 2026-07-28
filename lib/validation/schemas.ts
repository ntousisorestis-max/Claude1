import { z } from "zod";

export const businessTypeSchema = z.enum([
  "restaurant",
  "cafe",
  "salon",
  "construction",
  "plumber",
  "electrician",
  "dentist",
  "gym",
  "retail",
  "cleaning",
  "other",
]);

export const painCategorySchema = z.enum([
  "invoicing",
  "scheduling",
  "customer_communication",
  "email_overload",
  "employee_management",
  "inventory",
  "reviews_reputation",
  "owner_overload",
  "record_keeping",
]);

export const severitySchema = z.enum(["low", "medium", "high"]);

export const moduleIdSchema = z.enum([
  "dashboard",
  "tasks",
  "calendar",
  "customers",
  "email",
  "notes",
  "reminders",
  "documents",
  "checklist",
  "reports",
  "settings",
]);

export const workerIdSchema = z.enum([
  "customer-follow-up",
  "invoice-assistant",
  "email-drafter",
  "document-summarizer",
  "quote-generator",
]);

export const followUpOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const followUpQuestionSchema = z.object({
  id: z.string().min(1),
  category: painCategorySchema,
  context: z.string().optional(),
  prompt: z.string().min(1),
  options: z.array(followUpOptionSchema).min(2),
  allowOther: z.boolean().optional(),
});

export const followUpAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  otherText: z.string().optional(),
});

export const bottleneckSchema = z.object({
  id: z.string().min(1),
  category: painCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  severity: severitySchema,
  hoursLostPerWeek: z.number().nonnegative(),
});

export const businessReportSchema = z.object({
  generatedAt: z.string(),
  businessType: businessTypeSchema,
  summary: z.string().min(1),
  healthScore: z.number().min(0).max(100),
  hoursLostPerWeek: z.number().nonnegative(),
  revenueOpportunity: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }),
  bottlenecks: z.array(bottleneckSchema),
  priorityOrder: z.array(z.string()),
  recommendedSolution: z.string().min(1),
  recommendedModuleIds: z.array(moduleIdSchema),
  recommendedWorkerIds: z.array(workerIdSchema),
});

export const workspacePlanSchema = z.object({
  businessType: businessTypeSchema,
  businessName: z.string().min(1),
  moduleIds: z.array(moduleIdSchema),
  workerIds: z.array(workerIdSchema),
  rationale: z.record(z.string(), z.string()),
  createdAt: z.string(),
});

// --- API request bodies -----------------------------------------------

export const followUpQuestionsRequestSchema = z.object({
  businessType: businessTypeSchema,
  workdayDescription: z.string().min(10, "Tell us a bit more about a normal workday.").max(4000),
});

export const businessReportRequestSchema = z.object({
  businessType: businessTypeSchema,
  workdayDescription: z.string().min(1),
  followUpQuestions: z.array(followUpQuestionSchema),
  followUpAnswers: z.array(followUpAnswerSchema),
});

export const workspacePlanRequestSchema = z.object({
  businessType: businessTypeSchema,
  businessName: z.string().min(1).max(120),
  report: businessReportSchema,
});

import type { BusinessType, PainCategory, Severity } from "@/types";

export interface PainSignalOption {
  id: string;
  label: string;
  severity: Severity;
}

export interface PainSignalDefinition {
  category: PainCategory;
  keywords: string[];
  /** Natural-language phrase used in "You mentioned {contextLabel}." */
  contextLabel: string;
  title: string;
  description: string;
  prompt: (matched: boolean) => string;
  options: PainSignalOption[];
  /** Business types where this pain is common even if unmentioned, with a score bonus. */
  businessTypeAffinity: Partial<Record<BusinessType, number>>;
  baseHoursLostPerWeek: number;
}

export const PAIN_SIGNALS: Record<PainCategory, PainSignalDefinition> = {
  invoicing: {
    category: "invoicing",
    keywords: ["invoice", "billing", "bill ", "payment", "pay ", "get paid", "overdue"],
    contextLabel: "invoices",
    title: "Invoices pile up and payments get delayed",
    description:
      "Money is being earned but not collected quickly, which quietly drains cash flow.",
    prompt: (matched) =>
      matched
        ? "You mentioned invoices. Why are they delayed?"
        : "Invoices are a common pain point for businesses like yours — why do they get delayed for you?",
    options: [
      { id: "forget", label: "I forget", severity: "high" },
      { id: "customer_ignores", label: "Customer ignores them", severity: "medium" },
      { id: "paperwork", label: "Waiting on paperwork", severity: "medium" },
    ],
    businessTypeAffinity: { retail: 1, construction: 2, plumber: 2, electrician: 2 },
    baseHoursLostPerWeek: 4,
  },
  scheduling: {
    category: "scheduling",
    keywords: ["schedul", "appointment", "booking", "book ", "calendar", "no-show", "no show", "cancel"],
    contextLabel: "scheduling",
    title: "Scheduling gaps and missed appointments",
    description: "Time slots go unfilled or double-booked, costing both revenue and trust.",
    prompt: (matched) =>
      matched
        ? "You mentioned scheduling. What's the biggest problem with it?"
        : "What's the biggest problem with scheduling day to day?",
    options: [
      { id: "double_book", label: "I double-book or forget appointments", severity: "high" },
      { id: "no_shows", label: "Customers no-show or cancel last minute", severity: "medium" },
      { id: "manual", label: "I'm juggling it all by memory or paper", severity: "medium" },
    ],
    businessTypeAffinity: { salon: 3, dentist: 3, gym: 2 },
    baseHoursLostPerWeek: 5,
  },
  customer_communication: {
    category: "customer_communication",
    keywords: ["whatsapp", "text message", "call back", "calls me", "respond", "reply", "message"],
    contextLabel: "customer messages",
    title: "Customer messages eat up the day",
    description:
      "Answering the same questions and chasing replies leaves little time for the actual work.",
    prompt: (matched) =>
      matched
        ? "You mentioned customer messages. What usually causes the delay in responding?"
        : "What usually causes delays in responding to customers?",
    options: [
      { id: "too_many", label: "There are too many messages to keep up with", severity: "high" },
      { id: "forget_reply", label: "I forget to reply", severity: "high" },
      { id: "repeat_question", label: "I'm answering the same question over and over", severity: "medium" },
    ],
    businessTypeAffinity: { plumber: 2, electrician: 2, cleaning: 2 },
    baseHoursLostPerWeek: 6,
  },
  email_overload: {
    category: "email_overload",
    keywords: ["email", "e-mail", "inbox", "unread", "newsletter", "reply to everyone"],
    contextLabel: "email",
    title: "The inbox never stops",
    description:
      "Emails pile up faster than you can answer them, and leads or customers wait too long for a reply.",
    prompt: (matched) =>
      matched
        ? "You mentioned email. What's the hardest part about keeping up with it?"
        : "How does email fit into your day — what's the hardest part about keeping up?",
    options: [
      { id: "too_many_emails", label: "There are just too many to keep up with", severity: "high" },
      { id: "same_questions", label: "I answer the same questions over and over", severity: "medium" },
      { id: "leads_go_cold", label: "Leads go cold before I get back to them", severity: "high" },
    ],
    businessTypeAffinity: { retail: 1, dentist: 1, gym: 1, other: 1 },
    baseHoursLostPerWeek: 5,
  },
  employee_management: {
    category: "employee_management",
    keywords: ["employee", "staff", "my team", "forgets", "forget to", "training", "shift"],
    contextLabel: "your team forgetting things",
    title: "Employees forget tasks or need constant reminders",
    description:
      "Work quality depends on you personally checking in, instead of a system everyone can trust.",
    prompt: (matched) =>
      matched
        ? "You mentioned your team forgetting things. What tends to slip?"
        : "When staff forget things, what tends to slip?",
    options: [
      { id: "forget_tasks", label: "They forget tasks or steps", severity: "medium" },
      { id: "no_visibility", label: "I can't see what's been done", severity: "high" },
      { id: "turnover", label: "Retraining new people takes too long", severity: "medium" },
    ],
    businessTypeAffinity: { restaurant: 2, cafe: 2, construction: 2, cleaning: 2 },
    baseHoursLostPerWeek: 5,
  },
  inventory: {
    category: "inventory",
    keywords: ["stock", "inventory", "supplies", "run out", "ran out", "reorder"],
    contextLabel: "stock and supplies",
    title: "Stock and supplies are hard to track",
    description: "Without a clear system, ordering becomes guesswork — too much or too little.",
    prompt: (matched) =>
      matched
        ? "You mentioned stock and supplies. What's the usual issue?"
        : "What's the usual issue with stock or supplies?",
    options: [
      { id: "run_out", label: "We run out without warning", severity: "high" },
      { id: "overorder", label: "We over-order and waste money", severity: "medium" },
      { id: "no_system", label: "There's no real system, just guessing", severity: "medium" },
    ],
    businessTypeAffinity: { restaurant: 2, cafe: 2, retail: 3 },
    baseHoursLostPerWeek: 3,
  },
  reviews_reputation: {
    category: "reviews_reputation",
    keywords: ["review", "reputation", "losing customers", "lose customers", "canceling", "cancelling"],
    contextLabel: "customers not coming back",
    title: "Customers are slipping away",
    description: "New customers arrive, but not enough of them come back or refer others.",
    prompt: (matched) =>
      matched
        ? "You mentioned customers not coming back. Any idea why?"
        : "Any idea why customers don't come back as often as you'd like?",
    options: [
      { id: "no_followup", label: "We never follow up after their visit", severity: "high" },
      { id: "bad_experience", label: "Something about the experience falls short", severity: "medium" },
      { id: "no_idea", label: "Honestly, I'm not sure", severity: "medium" },
    ],
    businessTypeAffinity: { restaurant: 2, salon: 2, gym: 2, retail: 1 },
    baseHoursLostPerWeek: 3,
  },
  owner_overload: {
    category: "owner_overload",
    keywords: ["i do everything", "on my own", "no time", "overwhelmed", "everything is in", "forget another"],
    contextLabel: "everything relying on you",
    title: "Too much depends on you personally",
    description: "The business runs on your memory and availability, which doesn't scale.",
    prompt: (matched) =>
      matched
        ? "You mentioned how much relies on you. If you took a day off, what would break first?"
        : "If you took a full day off, what would break first?",
    options: [
      { id: "scheduling_breaks", label: "Scheduling or bookings would fall apart", severity: "high" },
      { id: "billing_breaks", label: "Nothing would get billed or followed up", severity: "high" },
      { id: "nothing_documented", label: "Nobody else knows how things work", severity: "medium" },
    ],
    businessTypeAffinity: { other: 2 },
    baseHoursLostPerWeek: 6,
  },
  record_keeping: {
    category: "record_keeping",
    keywords: ["lose everything", "spreadsheet", "paper notes", "lost track", "sticky note", "in whatsapp"],
    contextLabel: "things getting lost in notes or chats",
    title: "Information lives in scattered notes and chats",
    description: "Details about jobs and customers are hard to find when you need them most.",
    prompt: (matched) =>
      matched
        ? "You mentioned things getting lost in notes or chats. Where does most of it get lost?"
        : "Where does important information usually get lost?",
    options: [
      { id: "chat_apps", label: "Chat apps like WhatsApp", severity: "medium" },
      { id: "paper", label: "Paper notes or sticky notes", severity: "medium" },
      { id: "memory", label: "Just my memory", severity: "high" },
    ],
    businessTypeAffinity: { construction: 2, plumber: 2, electrician: 2, cleaning: 2 },
    baseHoursLostPerWeek: 4,
  },
};

export interface DetectedCategory {
  category: PainCategory;
  score: number;
  matched: boolean;
}

export function detectCategories(
  businessType: BusinessType,
  workdayDescription: string
): DetectedCategory[] {
  const text = workdayDescription.toLowerCase();

  return Object.values(PAIN_SIGNALS)
    .map((signal): DetectedCategory => {
      const matched = signal.keywords.some((keyword) => text.includes(keyword));
      const keywordScore = matched ? 3 : 0;
      const affinityScore = signal.businessTypeAffinity[businessType] ?? 0;
      return {
        category: signal.category,
        score: keywordScore + affinityScore,
        matched,
      };
    })
    .sort((a, b) => b.score - a.score);
}

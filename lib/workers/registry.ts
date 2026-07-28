import type { AIWorkerDefinition, WorkerId } from "@/types";

export const AI_WORKER_DEFINITIONS: Record<WorkerId, AIWorkerDefinition> = {
  "customer-follow-up": {
    id: "customer-follow-up",
    name: "Customer Follow-up Assistant",
    purpose: "Notices when a customer hasn't heard back and drafts a check-in for you to send.",
    status: "simulated",
    icon: "MessageCircleHeart",
    relevantCategories: ["customer_communication", "reviews_reputation", "scheduling"],
    samplePrompt: "Maria hasn't replied about her Thursday quote in 3 days.",
    sampleOutput:
      "Hi Maria, just checking in on the quote I sent Thursday — happy to answer any questions or adjust anything. Let me know what works!",
    futureIntegration: "Will connect to WhatsApp & SMS to send and track replies automatically.",
  },
  "invoice-assistant": {
    id: "invoice-assistant",
    name: "Invoice Assistant",
    purpose: "Watches for overdue invoices and prepares reminders so payments don't fall through the cracks.",
    status: "simulated",
    icon: "ReceiptText",
    relevantCategories: ["invoicing", "record_keeping"],
    samplePrompt: "Invoice #204 to Acme Plumbing is 9 days overdue.",
    sampleOutput:
      "Hi there — friendly reminder that invoice #204 ($480) was due on the 12th. Let me know if you'd like a new copy sent over.",
    futureIntegration: "Will connect to Stripe & QuickBooks to sync invoice status automatically.",
  },
  "email-drafter": {
    id: "email-drafter",
    name: "Email Drafter",
    purpose: "Turns a short note into a polished email or message you can send in one click.",
    status: "simulated",
    icon: "PenLine",
    relevantCategories: ["customer_communication", "reviews_reputation"],
    samplePrompt: "Tell the Tuesday 2pm group their table is confirmed.",
    sampleOutput:
      "Hi! Just confirming your table for 4 this Tuesday at 2:00 PM. We're looking forward to having you — see you then!",
    futureIntegration: "Will connect to Microsoft 365 & Gmail to send directly from your inbox.",
  },
  "document-summarizer": {
    id: "document-summarizer",
    name: "Document Summarizer",
    purpose: "Reads long contracts or paperwork and pulls out the 3 things you actually need to know.",
    status: "simulated",
    icon: "FileSearch",
    relevantCategories: ["record_keeping", "inventory"],
    samplePrompt: "Supplier contract renewal, 14 pages.",
    sampleOutput:
      "Key points: auto-renews in 30 days, price increases 4%, cancellation needs 60 days notice in writing.",
    futureIntegration: "Will connect to Google Drive & Microsoft 365 to scan documents as they arrive.",
  },
  "quote-generator": {
    id: "quote-generator",
    name: "Quote Generator",
    purpose: "Builds a clean, professional quote from a quick job description.",
    status: "simulated",
    icon: "Calculator",
    relevantCategories: ["owner_overload", "invoicing"],
    samplePrompt: "Replace kitchen faucet + fix slow drain, 2 hours.",
    sampleOutput:
      "Estimate: Faucet replacement ($120 parts + $90 labor), drain service ($60 labor). Total: $270. Valid for 14 days.",
    futureIntegration: "Will connect to Stripe to turn accepted quotes into invoices automatically.",
  },
};

export const WORKER_ORDER: WorkerId[] = [
  "customer-follow-up",
  "invoice-assistant",
  "quote-generator",
  "email-drafter",
  "document-summarizer",
];

export function sortWorkerIds(ids: WorkerId[]): WorkerId[] {
  const set = new Set(ids);
  return WORKER_ORDER.filter((id) => set.has(id));
}

export function getWorker(id: WorkerId): AIWorkerDefinition {
  return AI_WORKER_DEFINITIONS[id];
}

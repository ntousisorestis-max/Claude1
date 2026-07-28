import type { BusinessKnowledgeBase, DraftVariant, EmailCategory, EmailMessage } from "@/types";

// Everything the Email Automation Hub shows in V1 comes from this file:
// a small simulated inbox plus the draft builders that "ground" each reply
// in the owner's knowledge base. When a real inbox connection ships (see
// services/integrations), these seeds go away but the draft-builder
// contract stays.

export const DEFAULT_KNOWLEDGE_BASE: BusinessKnowledgeBase = {
  pricing: "Standard visit: $95. Larger jobs quoted up front — free estimates.",
  hours: "Monday–Friday 8am–6pm, Saturday 9am–1pm. Closed Sundays.",
  notes: "We serve the whole metro area. Card, cash, and bank transfer accepted.",
};

export const SEED_EMAILS: EmailMessage[] = [
  {
    id: "email-seed-1",
    fromName: "Rachel Moreno",
    fromEmail: "rachel.moreno@gmail.com",
    subject: "Do you have availability next week?",
    body: "Hi! A friend recommended you. I'd love to book something for early next week — what do you have open, and what would it cost? Thanks!",
    category: "lead",
    receivedAgo: "12 min ago",
    replied: false,
    draftId: "lead-availability",
  },
  {
    id: "email-seed-2",
    fromName: "Dev Patel",
    fromEmail: "dev.patel@outlook.com",
    subject: "Quick question about your hours",
    body: "Hey — are you open Saturdays? I work weekdays so that's really the only time I can come by.",
    category: "lead",
    receivedAgo: "1 hr ago",
    replied: false,
    draftId: "lead-hours",
  },
  {
    id: "email-seed-3",
    fromName: "Marta Kowalski",
    fromEmail: "marta.k@acmeoffices.com",
    subject: "Invoice #218 — can we pay by card?",
    body: "Hi, we received invoice #218. Our bookkeeper is asking whether you accept card payments, and if there's a payment link you can send over.",
    category: "billing",
    receivedAgo: "3 hrs ago",
    replied: false,
    draftId: "billing-payment",
  },
  {
    id: "email-seed-4",
    fromName: "James O'Neill",
    fromEmail: "joneill124@yahoo.com",
    subject: "Follow-up on last week's visit",
    body: "Hello — after your visit last week I noticed a small issue again this morning. Could someone take another look? Not urgent, but I'd appreciate it.",
    category: "support",
    receivedAgo: "Yesterday",
    replied: false,
    draftId: "support-followup",
  },
];

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  lead: "Lead",
  support: "Support",
  billing: "Billing",
};

interface DraftContext {
  businessName: string;
  kb: BusinessKnowledgeBase;
}

type DraftBuilder = (ctx: DraftContext) => string;

const DRAFT_BUILDERS: Record<string, DraftBuilder> = {
  "lead-availability": ({ businessName, kb }) =>
    `Hi Rachel,\n\nThanks so much for reaching out — always great to hear we came recommended!\n\nWe have openings early next week. Our hours are ${kb.hours} On pricing: ${kb.pricing}\n\nJust reply with a day that works and I'll get you booked in.\n\nWarm regards,\n${businessName}`,
  "lead-hours": ({ businessName, kb }) =>
    `Hi Dev,\n\nGood news — yes! Our hours are ${kb.hours}\n\nSaturdays fill up quickly, so if you'd like a slot just reply with a time that suits you and I'll hold it for you.\n\nSee you soon,\n${businessName}`,
  "billing-payment": ({ businessName, kb }) =>
    `Hi Marta,\n\nThanks for checking — ${kb.notes}\n\nI'll send a card payment link for invoice #218 in a follow-up email so your bookkeeper can settle it in a couple of clicks.\n\nBest,\n${businessName}`,
  "support-followup": ({ businessName }) =>
    `Hi James,\n\nSorry to hear that popped up again — thanks for letting us know so quickly.\n\nWe'd be happy to come take another look, no charge to inspect it. Reply with a couple of times that suit you this week and we'll be there.\n\nBest,\n${businessName}`,
};

function shorten(draft: string): string {
  const lines = draft.split("\n\n");
  // Greeting + the core answer + sign-off keeps it polite but brief.
  const signOff = lines[lines.length - 1];
  return [lines[0], lines[1], signOff].join("\n\n");
}

function formalize(draft: string): string {
  return draft
    .replace(/^Hi /, "Dear ")
    .replace("Good news — yes!", "Yes, certainly.")
    .replace("Thanks so much for reaching out — always great to hear we came recommended!", "Thank you for your enquiry, and for the kind recommendation.")
    .replace("Thanks for checking — ", "Thank you for your enquiry. ")
    .replace("Sorry to hear that popped up again — thanks for letting us know so quickly.", "We are sorry to hear the issue has recurred, and we appreciate you bringing it to our attention promptly.")
    .replace(/Warm regards,|See you soon,|Best,/, "Kind regards,");
}

function addDiscount(draft: string): string {
  const lines = draft.split("\n\n");
  const signOffIndex = lines.length - 1;
  lines.splice(
    signOffIndex,
    0,
    "As a thank-you for getting in touch, we'd like to offer you 10% off — just mention this email."
  );
  return lines.join("\n\n");
}

export function buildDraft(
  draftId: string,
  variant: DraftVariant,
  ctx: DraftContext
): string {
  const base = DRAFT_BUILDERS[draftId];
  if (!base) {
    return `Hi,\n\nThanks for your message — we'll get back to you shortly.\n\nBest,\n${ctx.businessName}`;
  }
  const draft = base(ctx);
  switch (variant) {
    case "shorter":
      return shorten(draft);
    case "formal":
      return formalize(draft);
    case "discount":
      return addDiscount(draft);
    default:
      return draft;
  }
}

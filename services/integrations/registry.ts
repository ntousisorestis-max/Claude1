import type { IntegrationClient, IntegrationDefinition, IntegrationId } from "./types";
import { ComingSoonIntegrationClient } from "./coming-soon-client";

export const INTEGRATION_DEFINITIONS: Record<IntegrationId, IntegrationDefinition> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Send and receive customer messages without leaving FixMyBusiness.",
    icon: "MessageCircle",
    category: "messaging",
  },
  sms: {
    id: "sms",
    name: "Text Messages",
    description: "Reminders and follow-ups delivered straight to your customers' phones.",
    icon: "MessageSquareText",
    category: "messaging",
  },
  voice: {
    id: "voice",
    name: "Voice Assistant",
    description: "Answer routine calls automatically and take messages while you work.",
    icon: "Phone",
    category: "messaging",
  },
  stripe: {
    id: "stripe",
    name: "Payments",
    description: "Get paid faster with online invoices and automatic payment tracking.",
    icon: "CreditCard",
    category: "payments",
  },
  google_calendar: {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Keep appointments in sync with the calendar you already use.",
    icon: "CalendarSync",
    category: "scheduling",
  },
  quickbooks: {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Keep your books up to date without double entry.",
    icon: "Landmark",
    category: "payments",
  },
  slack: {
    id: "slack",
    name: "Slack",
    description: "Send team notifications where your team already talks.",
    icon: "MessagesSquare",
    category: "productivity",
  },
  microsoft_365: {
    id: "microsoft_365",
    name: "Microsoft 365",
    description: "Sync email, calendar, and documents with Outlook and Teams.",
    icon: "Mails",
    category: "productivity",
  },
};

export const INTEGRATION_ORDER: IntegrationId[] = [
  "whatsapp",
  "sms",
  "voice",
  "stripe",
  "google_calendar",
  "quickbooks",
  "slack",
  "microsoft_365",
];

const clients = new Map<IntegrationId, IntegrationClient>();

export function getIntegrationClient(id: IntegrationId): IntegrationClient {
  if (!clients.has(id)) {
    clients.set(id, new ComingSoonIntegrationClient(id));
  }
  return clients.get(id)!;
}

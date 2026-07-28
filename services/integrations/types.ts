export type IntegrationId =
  | "whatsapp"
  | "sms"
  | "voice"
  | "stripe"
  | "google_calendar"
  | "quickbooks"
  | "slack"
  | "microsoft_365";

export type IntegrationCategory = "messaging" | "payments" | "scheduling" | "productivity";

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
}

export interface IntegrationConnection {
  connected: boolean;
  connectedAt?: string;
  accountLabel?: string;
}

/**
 * Contract every real integration (WhatsApp, Stripe, Google Calendar, ...)
 * should implement. V1 ships only `ComingSoonIntegrationClient`, which
 * fails loudly instead of pretending to connect — a real implementation
 * swaps in behind this same interface with no changes needed upstream.
 */
export interface IntegrationClient {
  readonly id: IntegrationId;
  getConnection(businessId: string): Promise<IntegrationConnection>;
  connect(businessId: string): Promise<IntegrationConnection>;
  disconnect(businessId: string): Promise<void>;
}

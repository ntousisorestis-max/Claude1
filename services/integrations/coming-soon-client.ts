import type { IntegrationClient, IntegrationConnection, IntegrationId } from "./types";

/** Placeholder client used for every integration until it is actually built. */
export class ComingSoonIntegrationClient implements IntegrationClient {
  constructor(public readonly id: IntegrationId) {}

  async getConnection(): Promise<IntegrationConnection> {
    return { connected: false };
  }

  async connect(): Promise<IntegrationConnection> {
    throw new Error(
      `The "${this.id}" integration isn't built yet. Implement IntegrationClient in services/integrations/ to enable it.`
    );
  }

  async disconnect(): Promise<void> {
    throw new Error(`The "${this.id}" integration isn't built yet.`);
  }
}

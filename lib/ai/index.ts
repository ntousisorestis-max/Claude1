import type { AIProvider } from "./types";
import { SimulatedAIProvider } from "./simulated/provider";
import { OpenAIProvider } from "./openai/provider";

export type { AIProvider } from "./types";
export * from "./types";

let cachedProvider: AIProvider | undefined;

/**
 * Server-only factory. Returns the OpenAI-backed consultant when
 * OPENAI_API_KEY is configured, otherwise the deterministic simulated
 * consultant that ships by default. Route handlers should always go
 * through this function rather than instantiating a provider directly.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider = process.env.OPENAI_API_KEY
    ? new OpenAIProvider(process.env.OPENAI_API_KEY)
    : new SimulatedAIProvider();

  return cachedProvider;
}

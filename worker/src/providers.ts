export interface WorkerEnv {
  APP_SHARED_PASSWORD: string;
  JWT_SECRET: string;
  PLANNER_PROVIDER: string;
  PLANNER_MODEL: string;
  PLANNER_BASE_URL?: string;
  ADVISOR_PROVIDER: string;
  ADVISOR_MODEL: string;
  ADVISOR_BASE_URL?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

export class ProviderError extends Error {
  constructor(public readonly provider: string, public readonly status: number) {
    const label = provider === "anthropic" ? "Anthropic" : "OpenAI";
    super(status === 401 || status === 403
      ? `${label} rejected its API key. Update the backend credential or choose another provider in Settings.`
      : status === 404
      ? `${label} could not find the selected model. Choose another model in Settings.`
      : status === 429
      ? `${label} is rate-limited or out of credits. Check the provider account and retry.`
      : `${label} is unavailable. Try again shortly.`);
  }
}

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export type ModelInvoker = (config: ModelConfig, prompt: string) => Promise<string>;

export function resolveModelConfig(
  override: string | undefined,
  defaultConfig: ModelConfig,
  env: WorkerEnv
): ModelConfig {
  if (!override) {
    return defaultConfig;
  }

  const colonIndex = override.indexOf(":");
  if (colonIndex === -1) {
    return defaultConfig;
  }

  const provider = override.slice(0, colonIndex);
  const model = override.slice(colonIndex + 1);
  const apiKey = getProviderApiKey(provider, env);

  return { provider, model, apiKey };
}

export function getProviderApiKey(provider: string, env: WorkerEnv): string | undefined {
  switch (provider) {
    case "openai":
      return env.OPENAI_API_KEY;
    case "anthropic":
      return env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}

export async function callModel(config: ModelConfig, prompt: string): Promise<string> {
  if (!config.apiKey) {
    throw new ProviderError(config.provider, 401);
  }

  switch (config.provider) {
    case "openai":
      return callOpenAiCompatible(config, prompt);
    case "anthropic":
      return callAnthropic(config, prompt);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

async function callOpenAiCompatible(
  config: ModelConfig,
  prompt: string
): Promise<string> {
  const endpoint = config.baseUrl || "https://api.openai.com/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      // Newer reasoning-style models reject non-default temperature.
      ...(/^gpt-4/.test(config.model) ? { temperature: 0.7 } : {}),
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new ProviderError("openai", response.status);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI-compatible provider returned no content.");
  }

  return content;
}

async function callAnthropic(config: ModelConfig, prompt: string): Promise<string> {
  const endpoint = config.baseUrl || "https://api.anthropic.com/v1/messages";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      // Headroom for thinking tokens, which count toward max_tokens on 5.x models.
      max_tokens: 8000,
      // Effort is only accepted by the 5.5 family (errors on Haiku 4.5).
      ...(/^claude-(haiku|sonnet|opus)-5-5/.test(config.model)
        ? { output_config: { effort: "medium" } }
        : {}),
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new ProviderError("anthropic", response.status);
  }

  const content = data.content?.find((entry) => entry.type === "text")?.text;
  if (!content) {
    throw new Error("Anthropic provider returned no text.");
  }

  return content;
}

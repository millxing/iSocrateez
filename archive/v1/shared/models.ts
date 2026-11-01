export interface ModelOption {
  value: string;
  label: string;
}

// Single source of truth for selectable models. The Worker rejects any
// planner/advisor override that is not listed here.
export const modelOptions: ModelOption[] = [
  { value: "anthropic:claude-haiku-5-5", label: "Claude Haiku 5.5 (default planner)" },
  { value: "anthropic:claude-sonnet-5-5", label: "Claude Sonnet 5.5 (default advisor)" },
  { value: "anthropic:claude-opus-5-5", label: "Claude Opus 5.5" },
  { value: "openai:gpt-6.1-sol", label: "GPT-6.1 Sol" },
  { value: "openai:gpt-6-luna", label: "GPT-6 Luna" },
  { value: "openai:gpt-5.6-terra", label: "GPT-5.6 Terra" },
  { value: "openai:gpt-5.4-mini", label: "GPT-5.4 Mini" }
];

export function isAllowedModel(value: unknown): value is string {
  return typeof value === "string" && modelOptions.some((option) => option.value === value);
}

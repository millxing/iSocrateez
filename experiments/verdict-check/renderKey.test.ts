import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VERDICT_DILEMMAS } from "./answerKey";
import { CASE_PAIRS } from "./pairs";
import { renderAnswerKey } from "./renderKey";

describe("ANSWER_KEY.md", () => {
  it("matches the data (run: npx vite-node experiments/verdict-check/renderKey.ts)", () => {
    const file = join(dirname(fileURLToPath(import.meta.url)), "ANSWER_KEY.md");
    expect(readFileSync(file, "utf8")).toBe(renderAnswerKey(VERDICT_DILEMMAS, CASE_PAIRS));
  });
});

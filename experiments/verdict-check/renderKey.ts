/** Renders the answer key as markdown for a philosophy professor to review. */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AXIS_POLES, PHILOSOPHER_NAMES as NAMES, TEST_PHILOSOPHERS, VERDICT_DILEMMAS, type VerdictDilemma } from "./answerKey";
import { CASE_PAIRS, type CasePair } from "./pairs";

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

function summaryTable(dilemmas: VerdictDilemma[]): string[] {
  const header = ["Dilemma", "Kind", "Split", ...TEST_PHILOSOPHERS.map((id) => NAMES[id])];
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...dilemmas.map((dilemma) => {
      const entries = TEST_PHILOSOPHERS.map((id) => {
        const entry = dilemma.philosophers[id];
        if (entry) return `${entry.option}${entry.confidence === "disputed" ? " ?" : ""}`;
        return dilemma.open?.[id] !== undefined ? "open" : "—";
      });
      return `| ${[dilemma.id, dilemma.kind, dilemma.split, ...entries].join(" | ")} |`;
    })
  ];
}

function section(dilemma: VerdictDilemma): string[] {
  const label = (id: string) => dilemma.options.find((option) => option.id === id)?.label ?? id;
  const lines = [
    `### ${dilemma.title} (${dilemma.id})`,
    "",
    `Kind: ${dilemma.kind}. Split: ${dilemma.split}.`,
    "",
    ...dilemma.text.split("\n").map((line) => `> ${line}`),
    "",
    "Options:",
    "",
    ...dilemma.options.map((option) => `- \`${option.id}\`: ${option.label}`),
    "",
    "| Philosopher | Expected | Confidence | Reason | Source |",
    "| --- | --- | --- | --- | --- |"
  ];
  for (const id of TEST_PHILOSOPHERS) {
    const entry = dilemma.philosophers[id];
    if (!entry) {
      const reason = dilemma.open?.[id];
      lines.push(reason !== undefined ? `| ${NAMES[id]} | open | — | ${cell(reason)} | — |` : `| ${NAMES[id]} | — | — | No grounded answer in the texts | — |`);
      continue;
    }
    const expected = [entry.option, ...(entry.alsoAccept ?? []).map((id) => `${id} (also accepted)`)].join("; ");
    lines.push(`| ${NAMES[id]} | ${cell(expected)} | ${entry.confidence} | ${cell(entry.reason)} | ${cell(entry.source)} |`);
  }
  lines.push("");
  if (dilemma.axes.length === 0) {
    lines.push("Axis expectations: none.");
  } else {
    lines.push("Axis expectations:", "");
    for (const { axis, negative, positive } of dilemma.axes) {
      const poles = AXIS_POLES[axis];
      lines.push(`- ${poles.negative} → ${negative} (${label(negative)}); ${poles.positive} → ${positive} (${label(positive)})`);
    }
  }
  if (dilemma.axisNote) lines.push("", `Axis note: ${dilemma.axisNote}`);
  lines.push("");
  return lines;
}

const quote = (text: string) => text.split("\n").map((line) => `> ${line}`);

function pairSection(pair: CasePair): string[] {
  const lines = [
    `### ${pair.title} (${pair.id})`,
    "",
    `Split: ${pair.split}.`,
    "",
    `Pivot: ${pair.pivot}`,
    "",
    "Base case:",
    "",
    ...quote(pair.base),
    "",
    "Variant case:",
    "",
    ...quote(pair.variant),
    "",
    "Options (the same for both cases):",
    "",
    ...pair.options.map((option) => `- \`${option.id}\`: ${option.label}`),
    "",
    "| Thinker | Expectation | Basis | Reason | Source |",
    "| --- | --- | --- | --- | --- |"
  ];
  for (const id of TEST_PHILOSOPHERS) {
    const entry = pair.thinkers[id];
    if (!entry) continue;
    const expectation = entry.expect === "flip" ? `flips: ${entry.base} → ${entry.variant}` : `same: ${entry.base}`;
    const basis = entry.basis.base === entry.basis.variant ? entry.basis.base : `base: ${entry.basis.base}; variant: ${entry.basis.variant}`;
    lines.push(`| ${NAMES[id]} | ${expectation} | ${basis} | ${cell(entry.reason)} | ${cell(entry.source)} |`);
  }
  lines.push("");
  return lines;
}

export function renderAnswerKey(dilemmas: VerdictDilemma[], pairs: CasePair[]): string {
  const development = dilemmas.filter((dilemma) => dilemma.split === "development");
  const holdout = dilemmas.filter((dilemma) => dilemma.split === "holdout");
  const developmentPairs = pairs.filter((pair) => pair.split === "development");
  const holdoutPairs = pairs.filter((pair) => pair.split === "holdout");
  const lines = [
    "# Verdict check: answer key for review",
    "",
    "This document lists, for each test dilemma, the option that each test philosopher's own texts lead to: the core four (Mill, Kant, Aristotle, Confucius) and, since 2026-11-21, three transfer thinkers (Mencius, Hume, Maimonides). It also lists which of the app's three axes should decide the dilemma. The app's advice is scored against it.",
    "",
    "Status: provisional, written by an AI model. The key has had a second review. Answers that the reviewer judged \"open\" are not scored.",
    "",
    "- \"clear\": a text speaks to the case, or the doctrine leaves little doubt.",
    "- \"disputed\": a defensible reading, but scholars could argue for another option. Such entries may list other accepted options.",
    "- \"open\": a reviewer judged that the texts do not settle the case. The reason is shown. Not scored.",
    "- \"—\": the key has no entry, so the philosopher is not scored on that dilemma.",
    "",
    "How to mark corrections: write next to an entry in the Expected or Confidence column, or in the margin of the section. For example: \"change to keep\", \"downgrade to disputed\", \"wrong source\". Mark any dilemma that is unclear or unfair.",
    "",
    "Analects passage numbers follow D. C. Lau's translation. Other editions differ by one or two.",
    "",
    "## Summary",
    "",
    "A \"?\" after an option means the entry is disputed.",
    "",
    ...summaryTable([...development, ...holdout]),
    "",
    "## Paired cases",
    "",
    "A pair is one case told twice. The two tellings differ in one fact, the pivot. For each thinker, the key says if the pivot should change the answer (\"flips\") or not (\"same\"). The test asks if the app's answer changes when it should, and stays when it should. Every pair is run for all seven philosophers and for a baseline with no philosopher, and a correct pattern counts as evidence for a thinker only where it differs from the baseline.",
    "",
    "Basis is given for each side of the pair (one value when both sides agree). \"recorded\": the thinker's own text gives an answer to a case of this shape on that side. \"inferred\": our reading of the thinker's principles; no text gives the answer directly.",
    "",
    "### Development pairs",
    "",
    ...developmentPairs.flatMap(pairSection),
    "### Holdout pairs",
    "",
    "Holdout pairs must not be used to tune prompts.",
    "",
    ...holdoutPairs.flatMap(pairSection),
    "## Development dilemmas",
    "",
    ...development.flatMap(section),
    "## Holdout dilemmas",
    "",
    "Holdout dilemmas must not be used to tune prompts. They are for the final measurement only.",
    "",
    ...holdout.flatMap(section)
  ];
  return lines.join("\n").replace(/\n+$/, "") + "\n";
}

// Run with vite-node (not imported by a test): write ANSWER_KEY.md next to this file.
if (!process.env.VITEST) {
  const target = join(dirname(fileURLToPath(import.meta.url)), "ANSWER_KEY.md");
  writeFileSync(target, renderAnswerKey(VERDICT_DILEMMAS, CASE_PAIRS));
  console.log(`Wrote ${target}`);
}

# Name-only philosopher benchmark results

**Outcome:** These model scores do not support removing the perspective summaries. Both judges scored the name-only arm lower on fidelity in the full matched comparison. Accuracy differences are small and do not agree in direction. Practical value is slightly lower for name-only. These are descriptive findings, not statistical significance or philosophical truth.

## Verified coverage and execution

All 108 advice tasks and all 216 planned judgment tasks finished. Two additional format retries ran: **326 separate host tasks** in total. There are **215 valid judgments**: all 192 comparison judgments and 23 of 24 generic-control judgments. All 96 comparison responses form 48 matched pairs per judge. No advice is missing. No model was substituted. No production prompt was changed or deployed.

One generic control (sample-093 / judge-a) failed exact-evidence validation twice: a quoted excerpt changed “You” to “you.” Both raw judgments remain saved and excluded. A separate judgment (sample-098 / judge-a) included an added phrase in its evidence; its one fresh retry passed. Retries used the same frozen judge prompt, without the failed judgment or corrective content. There were no score-based reruns.

The pilot completed 4 advice tasks and 8 valid judgments before the rest of the run. All four pilot answers met the 250–400-word range and included all four sections.

## Protocol and limits

Baseline = common neutral prompt plus the shared profile summary with its terminal Tone segment removed. Candidate = the exact same common prompt with only the representative name and no summary. Both ask for reasoning consistent with the named philosopher. The former run instead used conflicting voice instructions and thinker-specific candidate requirements; its old RESULTS.md is preserved and is not a clean score comparator. This run has no misleading-style control.

Twelve fresh dilemmas were frozen with seed 20261116: six contrasts, two likely agreements, and four sampled pool cases excluding all prior pilot texts. Seven cases are development and five holdout. Expanded prompts, cases, model settings and order were frozen before outputs. No generation or evaluation prompt was tuned during the run. References and rubric remain the original provisional interpretations.

Generator: claudeAgent / claude-sonnet-5-5 / requested effort medium. Judge A: claudeAgent / claude-opus-5-5 / requested effort medium. Judge B: codex / gpt-6-astra / requested reasoningEffort medium. Host dispatch records confirm these requested model IDs and settings were accepted. Every executedModel field in the retained dispatch records is null: execution-model confirmation is unknown, not evidence of a wrong model. Actual internal compute is unobservable. Sample models were never asked to infer or report their settings.

Each sample used a fresh host delegate with no inherited history. Judges received only the dilemma, response, rubric and randomized reference order. They did not receive target, arm, split, generation prompt, other samples or judgments. An instruction allowed writing only to one absolute output path and prohibited file reads, browsing, source control and delegation. This is instruction-based isolation, not enforced access control. Host tool defaults can affect outputs. This does not test the Worker API end to end.

## Scores by split and judge

Scores range from 0 to 4. Fidelity and conceptual accuracy are primary; practical value is secondary. Each mean below uses the intended philosopher score. Generic controls have no intended target and are reported separately. Candidate means name-only.

### Development

| Judge | Arm | n | Fidelity | Accuracy | Practical value | Identified | Abstained | Leaks |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| judge-a | baseline | 28 | 3.43 | 3.07 | 3.57 | 26/28 | 0 | 2 |
| judge-a | candidate | 28 | 3.25 | 3.14 | 3.64 | 27/28 | 0 | 0 |
| judge-b | baseline | 28 | 3.54 | 3.00 | 3.54 | 26/28 | 0 | 2 |
| judge-b | candidate | 28 | 3.46 | 3.18 | 3.43 | 26/28 | 1 | 0 |

| Judge | Matched pairs | Δ fidelity | Δ accuracy | Δ practical value |
|---|---:|---:|---:|---:|
| judge-a | 28 | -0.18 | 0.07 | 0.07 |
| judge-b | 28 | -0.07 | 0.18 | -0.11 |

Deltas are candidate minus baseline, paired within dilemma and philosopher.

### Holdout

| Judge | Arm | n | Fidelity | Accuracy | Practical value | Identified | Abstained | Leaks |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| judge-a | baseline | 20 | 3.45 | 3.20 | 3.45 | 20/20 | 0 | 0 |
| judge-a | candidate | 20 | 3.10 | 3.05 | 3.20 | 17/20 | 0 | 1 |
| judge-b | baseline | 20 | 3.75 | 3.10 | 3.35 | 20/20 | 0 | 0 |
| judge-b | candidate | 20 | 3.50 | 3.05 | 3.35 | 17/20 | 1 | 1 |

| Judge | Matched pairs | Δ fidelity | Δ accuracy | Δ practical value |
|---|---:|---:|---:|---:|
| judge-a | 20 | -0.35 | -0.15 | -0.25 |
| judge-b | 20 | -0.25 | -0.05 | 0.00 |

Deltas are candidate minus baseline, paired within dilemma and philosopher.

### All

| Judge | Arm | n | Fidelity | Accuracy | Practical value | Identified | Abstained | Leaks |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| judge-a | baseline | 48 | 3.44 | 3.13 | 3.52 | 46/48 | 0 | 2 |
| judge-a | candidate | 48 | 3.19 | 3.10 | 3.46 | 44/48 | 0 | 1 |
| judge-b | baseline | 48 | 3.63 | 3.04 | 3.46 | 46/48 | 0 | 2 |
| judge-b | candidate | 48 | 3.48 | 3.13 | 3.40 | 43/48 | 2 | 1 |

| Judge | Matched pairs | Δ fidelity | Δ accuracy | Δ practical value |
|---|---:|---:|---:|---:|
| judge-a | 48 | -0.25 | -0.02 | -0.06 |
| judge-b | 48 | -0.15 | 0.08 | -0.06 |

Deltas are candidate minus baseline, paired within dilemma and philosopher.

## Per-philosopher matched findings

Each row uses all 12 dilemmas for that philosopher. Deltas are name-only minus summary.

| Philosopher | Judge | Pairs | Δ fidelity | Δ accuracy | Δ practical value |
|---|---|---:|---:|---:|---:|
| aristotle-virtue-ethics | judge-a | 12 | -0.17 | -0.17 | -0.17 |
| aristotle-virtue-ethics | judge-b | 12 | 0.00 | 0.17 | -0.25 |
| confucius-role-ethics | judge-a | 12 | -0.58 | -0.17 | -0.17 |
| confucius-role-ethics | judge-b | 12 | -0.50 | -0.08 | 0.00 |
| kant-deontology | judge-a | 12 | -0.08 | 0.17 | 0.17 |
| kant-deontology | judge-b | 12 | -0.25 | 0.25 | 0.00 |
| mill-utilitarianism | judge-a | 12 | -0.17 | 0.08 | -0.08 |
| mill-utilitarianism | judge-b | 12 | 0.17 | 0.00 | 0.00 |

Confucius shows the largest fidelity reduction for name-only in both judges (−0.58 and −0.50). Aristotle is slightly lower for judge A and tied for judge B. Kant loses fidelity but gains accuracy in both judges. Mill has mixed fidelity findings: lower for judge A and higher for judge B. These differences suggest where to focus expert review; they do not establish a universal ranking.

### Leak-free sensitivity

| Judge | Clean matched pairs | Δ fidelity | Δ accuracy | Δ practical value |
|---|---:|---:|---:|---:|
| judge-a | 45 | -0.24 | -0.02 | -0.04 |
| judge-b | 45 | -0.16 | 0.09 | -0.07 |

This excludes a pair if either response was flagged as leaking identity. It does not strip or regenerate any text.

## Targeted errors and practical examples

The following are selected judge reports for inspection, not expert-confirmed errors. Disputed interpretations remain uncertain. Full error text is saved in runs/name-only/targeted-errors.json.

- **aristotle-virtue-ethics**: sample-006 / accurate-credit / holdout / judge-a, accuracy 3/4. Judge report: Uncertain: truthfulness as a virtue in Aristotle concerns mainly how a person presents his own merits (between boastfulness and mock-modesty); the extension to not understating another person's role is a defensible modern application, not a direct doctrine.
- **confucius-role-ethics**: sample-012 / pool-2 / development / judge-b, accuracy 2/4. Judge report: The claim 'you adopt his reasoning' assumes both the landlord's motives and the moral equivalence of his evictions and the proposed theft. The facts establish neither.
- **kant-deontology**: sample-001 / pool-1 / development / judge-b, accuracy 2/4. Judge report: The advice assumes that the informant 'was promised protection.' The dilemma specifies confidentiality but does not establish an explicit protection promise; this added premise strengthens the proposed duty without sufficient support.
- **mill-utilitarianism**: sample-020 / accurate-credit / holdout / judge-a, accuracy 3/4. Judge report: Uncertain: the claim that accuracy 'matters in itself' sits uneasily with a purely consequence-based framing; a Millian reading can absorb it via the utility of truthfulness and trust, but the answer does not make that link explicit.

School-label leakage needs careful interpretation: the targeted flags include “utilitarian reasons,” “Duty-based reasoning,” and “role-based view of ethics.” Generic flags include a contrasting “consequentialist view.” These are rubric flags and need human review; explicit philosopher naming is not the only trigger.


**Practical example, baseline:** sample-004 / kant-deontology / fair-exception. judge-a gave practical value 4/4. Its next step: “Run the draw in a way entrants can verify, and honor the result. If you want to back your friend's work, do it openly: recommend her to other funders, donate to her directly, or make sure she is entered if she is eligible. If you believe the award should reward merit or impact, announce a rule change for future rounds before any entries are taken.”

**Practical example, candidate:** sample-001 / kant-deontology / pool-1. judge-a gave practical value 4/4. Its next step: “Tell the informant, privately and truthfully, about the evidence and the wrongful conviction. Ask whether they will agree to testify, with relocation and protection arranged beforehand. In parallel, ask prosecutors or a conviction review unit whether the claim can be corroborated by independent evidence, such as forensic retesting or other witnesses, or presented under seal, so that the informant's identity is never revealed.”

## Generic-control behavior

| Split | Judge | Valid / planned | Abstentions | Flagged leaks | Top selections | Mean practical value* |
|---|---|---:|---:|---:|---|---:|
| development | judge-a | 6/7 | 5 | 1 | {'aristotle-virtue-ethics': 1, 'kant-deontology': 5} | 3.17 |
| development | judge-b | 7/7 | 7 | 1 | {'aristotle-virtue-ethics': 1, 'kant-deontology': 6} | 3.29 |
| holdout | judge-a | 5/5 | 2 | 0 | {'mill-utilitarianism': 2, 'kant-deontology': 2, 'aristotle-virtue-ethics': 1} | 2.90 |
| holdout | judge-b | 5/5 | 2 | 1 | {'kant-deontology': 3, 'aristotle-virtue-ethics': 1, 'mill-utilitarianism': 1} | 3.40 |
| all | judge-a | 11/12 | 7 | 1 | {'mill-utilitarianism': 2, 'aristotle-virtue-ethics': 2, 'kant-deontology': 7} | 3.05 |
| all | judge-b | 12/12 | 9 | 2 | {'kant-deontology': 9, 'aristotle-virtue-ethics': 2, 'mill-utilitarianism': 1} | 3.33 |

*Generic practical value averages each response’s four candidate scores, then responses. It is not target fidelity or identification accuracy. Forced ranking remains required even when the judge abstains. A top selection on a generic control is not a correct identification. Leaks are judge flags, not automatically verified names.

## Output and provenance audit

- Raw originals: 326 files; byte SHA-256 index saved. Advice envelopes match all raw advice exactly.
- Word counts use whitespace tokens including headings: 19 length violations; details: [{"sample": "sample-015", "arm": "generic", "words": 404}, {"sample": "sample-023", "arm": "candidate", "words": 411}, {"sample": "sample-030", "arm": "baseline", "words": 402}, {"sample": "sample-031", "arm": "baseline", "words": 404}, {"sample": "sample-032", "arm": "candidate", "words": 409}, {"sample": "sample-036", "arm": "baseline", "words": 407}, {"sample": "sample-040", "arm": "candidate", "words": 407}, {"sample": "sample-050", "arm": "candidate", "words": 417}, {"sample": "sample-052", "arm": "baseline", "words": 421}, {"sample": "sample-056", "arm": "baseline", "words": 423}, {"sample": "sample-060", "arm": "candidate", "words": 402}, {"sample": "sample-074", "arm": "candidate", "words": 410}, {"sample": "sample-078", "arm": "generic", "words": 408}, {"sample": "sample-088", "arm": "candidate", "words": 420}, {"sample": "sample-093", "arm": "generic", "words": 404}, {"sample": "sample-095", "arm": "generic", "words": 403}, {"sample": "sample-098", "arm": "candidate", "words": 401}, {"sample": "sample-100", "arm": "candidate", "words": 417}, {"sample": "sample-103", "arm": "baseline", "words": 403}].
- Missing required section markers: 0 ([]). This is a marker check, not a full semantic section audit.
- Host dispatch records: 326; unknown executedModel confirmation: 326. Requested model IDs and options are retained in each record.
- Missing valid output: sample-093 / generic / development / judge-a. Both invalid raw outputs are retained. No comparison pair is missing.
- Full accepted judgments retain the original strict schema and exact-evidence validation. Failed judgments were not repaired or silently included.

## Proposed next step and assumptions

Keep the production prompt unchanged. Have a qualified philosophy reviewer first assess the provisional references, then blindly rate a balanced sample from both arms, every philosopher, both splits and the listed conceptual errors. Resolve reference and judge disagreements before choosing a production change. If a new prompt is proposed, freeze new holdout cases before another run.

**Assumptions:** the four provisional references capture enough of each philosophy to support these scores; the selected cases test meaningful differences; fresh host delegates approximate the intended advice task. None is established by the model scores. Development and holdout use the same frozen design, but this is one draw per condition, with no estimate of generation variability. Scores share dilemmas and judges and are not independent observations.

## Verification and files

All 131 tests, TypeScript check and production build passed after setup. Final checks are recorded separately in runs/name-only/verification.txt. Changed code is limited to nameOnly.ts, nameOnly.test.ts, nameOnlyHost.ts, this report builder, and minimal compatible changes to run.ts. Previous experiments, pilot artifacts, old results and production advice prompts were preserved. Work is uncommitted; no unrelated files were staged.

Run directory: experiments/philosopher-fidelity/runs/name-only. Protocol: NAME_ONLY_PROTOCOL.md. Chart: theme-compatible summary-chart.html, with split and judge selectors. The chart uses matched arm means and does not include generic controls.

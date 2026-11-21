Philosopher-fidelity benchmark results — 2026-11-15

**Outcome: complete coverage, unresolved effort provenance, mixed model evidence.** Both evaluators rate candidate fidelity and conceptual accuracy higher in development and holdout. Judge B rates candidate practical value lower in both splits. The provisional rule requiring fidelity improvement without accuracy or practical-value loss is therefore not met across evaluators. Do not adopt the candidate on this evidence alone. These scores are model judgments, not objective philosophical truth.

**Verified execution.** The frozen seed-20261115 manifest produced 120 advice responses: 48 baseline, 48 candidate, 12 generic and 12 style controls. All 240 judgments pass the existing validator, including exact evidence-substring checks. Development has 70 advice / 140 judgments across seven dilemmas; holdout has 50 / 100 across five. There are 360 separate sample tasks, no failed tasks, no format failures, no retries and no replacement responses. The four-advice/eight-judgment development pilot was completed and validated first and is included in these totals. At most four sample tasks ran at once. All model calls used fresh T3 host delegates; the coordinator did no generation or judging.

| Role | Selected provider / model | Requested setting | Execution evidence |
|---|---|---|---|
| Generator | claudeAgent / claude-sonnet-5-5 | effort=medium | Host executedModel matches; six envelopes self-report low effort |
| Judge A | claudeAgent / claude-opus-5-5 | effort=medium | Host executedModel and envelope settings match |
| Judge B | codex / gpt-6-astra | reasoningEffort=medium | Host model/options and envelopes match; executedModel is null for all 120 calls |

The coordinator used gpt-6.1-sol at medium reasoning effort. No selected model was substituted. The actual effort for six generation calls is unresolved: host medium options conflict with low-effort self-reports in sample-008, -013, -019, -042, -051 and -066 (three baseline, three candidate; five development, one holdout). Original envelopes and host metadata remain unchanged. Requested settings must not be presented as proof of actual effort. Codex backend model identity also lacks the separate executedModel confirmation.

The candidate was frozen before any generation; no development-driven tuning occurred before holdout generation. The manifest fingerprint remains `4e661975aacdd9abf03c424176a84acf69a029b8933ee9cd39202341cc1ab567`. Production prompts were not edited. Sample tasks received only their one packet prompt and serialization/output instructions, with explicit bans on repository reads, browsing and other agents. Judge tasks received no intended target, arm, split, generator prompt or other judgment. This instruction-based tool restriction was not independently audited as an access-control boundary.

**Paired results.** Rubric scores range from 0 to 4. Cells show baseline → candidate (paired candidate-minus-baseline mean). A/B denote the evaluators above. ID is successful top identification / sample count, with abstention counted as unsuccessful. Controls are excluded from this comparison.

| Split | Judge | Matched pairs | Fidelity | Conceptual accuracy | Practical value | ID baseline → candidate |
|---|---|---:|---|---|---|---|
| development | A | 28 | 2.54 → 3.21 (+0.68) | 2.93 → 3.11 (+0.18) | 3.64 → 3.71 (+0.07) | 20/28 → 26/28 |
| development | B | 28 | 3.14 → 3.61 (+0.46) | 2.93 → 2.96 (+0.04) | 3.54 → 3.32 (-0.21) | 19/28 → 26/28 |
| holdout | A | 20 | 2.40 → 3.15 (+0.75) | 2.90 → 3.10 (+0.20) | 3.65 → 3.95 (+0.30) | 13/20 → 19/20 |
| holdout | B | 20 | 3.05 → 3.65 (+0.60) | 3.05 → 3.20 (+0.15) | 3.80 → 3.65 (-0.15) | 11/20 → 18/20 |
| all | A | 48 | 2.48 → 3.19 (+0.71) | 2.92 → 3.10 (+0.19) | 3.65 → 3.81 (+0.17) | 33/48 → 45/48 |
| all | B | 48 | 3.10 → 3.63 (+0.52) | 2.98 → 3.06 (+0.08) | 3.65 → 3.46 (-0.19) | 30/48 → 44/48 |

Across all 48 pairs, fidelity wins/ties/losses are A: 27/21/0 and B: 20/26/2; accuracy: A 10/37/1, B 7/38/3; practical value: A 10/36/2, B 2/35/11. The accuracy gains are small and mostly ties. Secondary mean changes are specificity A +0.67 / B +0.50 and distinctiveness A +1.00 / B +0.90. Higher identification alone does not establish better philosophy.

**Exploratory provenance sensitivity.** Removing both arms of each of the six disputed pairs retains 42 pairs (23 development, 19 holdout); the main results above retain every original sample. Full-run fidelity / accuracy / practical-value deltas become A +0.69 / +0.19 / +0.17 and B +0.57 / +0.12 / −0.19. Holdout deltas become A +0.68 / +0.21 / +0.32 and B +0.58 / +0.16 / −0.16. The practical-value disagreement remains. This post-run exclusion neither resolves actual effort nor replaces the main analysis.

**By intended philosopher, all cases.** Each row has 12 matched pairs. Cells again show baseline → candidate (change).

| Philosopher | Judge | Fidelity | Conceptual accuracy | Practical value |
|---|---|---|---|---|
| Aristotle | A | 2.50 → 3.17 (+0.67) | 3.00 → 3.25 (+0.25) | 3.58 → 3.83 (+0.25) |
| Aristotle | B | 2.92 → 3.83 (+0.92) | 3.08 → 3.08 (+0.00) | 3.50 → 3.33 (-0.17) |
| Confucius | A | 1.42 → 2.67 (+1.25) | 2.83 → 2.92 (+0.08) | 3.67 → 3.83 (+0.17) |
| Confucius | B | 2.42 → 3.33 (+0.92) | 3.17 → 3.33 (+0.17) | 3.67 → 3.50 (-0.17) |
| Kant | A | 3.17 → 3.67 (+0.50) | 2.92 → 3.08 (+0.17) | 3.58 → 3.75 (+0.17) |
| Kant | B | 3.50 → 3.50 (+0.00) | 2.75 → 2.75 (+0.00) | 3.75 → 3.50 (-0.25) |
| Mill | A | 2.83 → 3.25 (+0.42) | 2.92 → 3.17 (+0.25) | 3.75 → 3.83 (+0.08) |
| Mill | B | 3.58 → 3.83 (+0.25) | 2.92 → 3.08 (+0.17) | 3.67 → 3.50 (-0.17) |

Confucius has the largest fidelity gain for A and ties Aristotle for the largest gain for B. B sees no Kant fidelity or accuracy gain, and rates Kant candidate accuracy at 2.75 with lower practical value. This makes Kant application a priority for expert review rather than a general prompt-length increase.

**By dilemma kind, all cases.** Agreement cases can reasonably converge; identification is not required for good advice. The random group contains four seeded cases, not an independent large sample.

| Kind | Judge | Pairs | Fidelity | Conceptual accuracy | Practical value |
|---|---|---:|---|---|---|
| agreement | A | 8 | 2.50 → 3.50 (+1.00) | 2.88 → 3.13 (+0.25) | 3.88 → 4.00 (+0.13) |
| agreement | B | 8 | 3.25 → 3.75 (+0.50) | 3.13 → 3.38 (+0.25) | 4.00 → 4.00 (+0.00) |
| contrast | A | 24 | 2.75 → 3.13 (+0.38) | 3.00 → 3.17 (+0.17) | 3.83 → 3.88 (+0.04) |
| contrast | B | 24 | 3.42 → 3.75 (+0.33) | 3.08 → 3.08 (+0.00) | 3.71 → 3.50 (-0.21) |
| random | A | 16 | 2.06 → 3.13 (+1.06) | 2.81 → 3.00 (+0.19) | 3.25 → 3.63 (+0.38) |
| random | B | 16 | 2.56 → 3.38 (+0.81) | 2.75 → 2.88 (+0.13) | 3.38 → 3.13 (-0.25) |

The random cases show larger fidelity gains than fixed contrasts. On contrasts, B sees no mean accuracy gain and a −0.21 practical-value change. Both evaluators have unchanged mean accuracy on the family and authority cases. A has a −0.25 accuracy change on the promise case. Full per-dilemma results are in analysis.json; the averages must not hide these differences.

**Abstentions, leaks and controls.** Neither evaluator flags an identity leak in baseline, candidate or generic advice. Baseline → candidate abstentions are A 10 → 2 and B 8 → 0. Split counts are development A 4 → 2 / B 3 → 0 and holdout A 6 → 0 / B 5 → 0.

| Control | Judge | Abstentions | Identity-leak flags | Intended substance identified | Misleading style selected |
|---|---|---:|---:|---|---|
| generic | A | 4/12 | 0/12 | n/a | n/a |
| generic | B | 6/12 | 0/12 | n/a | n/a |
| style-control | A | 0/12 | 1/12 | 12/12 | 0/12 |
| style-control | B | 0/12 | 2/12 | 12/12 | 0/12 |

Generic forced top ranks are A: Mill 5, Kant 5, Aristotle 2, Confucius 0; B: Mill 4, Kant 4, Aristotle 2, Confucius 2. These are not identification accuracy because generic samples have no intended identity. Generic advice still receives high practical-value scores (per-candidate means roughly 3.6–3.8), so useful advice need not identify a philosopher.

Style-control target fidelity averages 3.75 for each evaluator; accuracy is A 3.00 / B 2.67. Leak flags concern sample-018 (B only, development) and sample-090 (both, holdout), involving signature/quotation-like language rather than an explicit philosopher name. Leak-free identification remains A 11/11 and B 10/10. All leaky responses remain in the full analysis. Although neither judge selected the misleading style, neither the style manipulation nor preservation of intended substance has been independently validated. These results cannot establish evaluator resistance to style.

**Disagreements and conceptual concerns.** Top ranks differ on 12/120 responses: baseline 4/48, candidate 5/48, generic 3/12, style controls 0/12. Some differing ranks have abstentions. The 240 ratings are dependent assessments of 120 responses on only 12 dilemmas; they are not 240 independent pieces of evidence.

- Candidate sample-025 (Confucius, ritual): A places Kant first but abstains; B places Confucius first without abstaining. Intended-target fidelity is A 2 / B 4. Candidate sample-056 (Confucius, refund): A selects Confucius; B selects Aristotle, illustrating overlap between relational trust and habit reasoning on an agreement case.
- Baseline sample-017 (Kant, theft): “Using her as an example for the team would treat her as a tool for a goal, and that would be wrong.” B flags a means-versus-merely-means conflation (accuracy 2); A treats the concern as uncertain (accuracy 3).
- Candidate sample-097 (Kant, random-3): “Each rule lets one side use the other.” B flags the same distinction and a tension between rejecting a veto and requiring freely accepted terms. A treats the defect as minor. Target accuracy is A 3 / B 2, and practical value A 4 / B 3.
- Candidate sample-101 (Confucius, trolley/random-2): “A duty to help the public does not cancel his family's claim on him.” A calls the imported family/public-duty framing contrived because the agent has no supplied family role; B regards the relational conclusion as uncertain. A selects Confucius; B selects Kant. Both note that proposed alternatives or real-world uncertainty do not answer the stipulated scenario.
- Candidate sample-107 (Mill, trolley/random-2): the next step refers to “the person with the least power”. Both judges question its connection to impartial welfare; they also question an asserted loss of general security from the stipulated exceptional act. Target accuracy is 3 for both, while practical value is A 3 / B 2.

These are judge-attributed claims for review, not coordinator adjudications. All quoted advice excerpts were checked as exact substrings. There are 218 judgments with nonempty errors arrays, covering all 120 responses at least once, but many entries explicitly describe uncertainty, omissions or weak fit to another candidate. That field must not be reported as a count of verified conceptual errors.

**Protocol limits and next action.** Nineteen responses exceed 400 whitespace-separated words: baseline 6/48, candidate 11/48, generic 1/12 and style control 1/12; none are below 250. Baseline/candidate means are 379.4/388.0 words, with ranges 327–443 / 304–462. No answers were shortened or regenerated. Length may confound ratings. The six effort conflicts and 120 missing Codex executedModel confirmations remain unresolved.

The references are provisional and were authored in the same setup as generator guidance; rubric agreement is not independent scholarship. Judge A shares a provider family with the generator. This is one generated response per condition, with no model-randomness replication; the seed fixes trial selection/order, not model output. This host-agent experiment does not test the Worker end to end. No confidence interval, significance claim or universal ranking is justified by 12 dilemmas.

Next: resolve host-versus-envelope effort provenance, have the philosophy instructor review the reference summaries, then obtain blinded human ratings across both variants, all philosophers, agreement cases, the practical-value losses and the examples above. Check style-control substance and style before interpreting that diagnostic. Preserve this run as exploratory evidence. Do not change production prompts yet. If later tuning follows this review, use new holdout dilemmas; the present holdout has now been examined.

**Artifacts and checks.** Private run data stay intentionally ignored under `experiments/philosopher-fidelity/runs/pilot/`: the manifest and 120 generation packets; 240 blind judge packets; 120 advice and 240 judgment envelopes; 360 raw envelope copies; 360 task logs and run-log.jsonl; reports/scored rows for development, holdout and all; analysis.json; sensitivity-provenance.json; coverage-audit.json; failures-and-deviations.json; sha256.json; and the self-contained comparison.html. The HTML compares fidelity and accuracy separately by evaluator and split and displays the provenance warning. artifact-inventory.txt lists every absolute artifact path. Pilot reports and progress-validation logs are retained. `npm run test` passed 123 tests in 18 files; `npm run check` and `npm run build` passed. All three final benchmark report commands passed with zero missing advice or judgments and exact evidence validation.

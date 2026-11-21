# Verdict check

The app seems to give the same recommendation whichever philosopher or profile the user picks. This check tests that.

There are three kinds of test:

- Single cases. A dilemma with fixed options and a keyed answer for some thinkers. The voice route runs them.
- Pairs. One case told twice, with one fact changed. The key says if the answer should change. The pair route runs them.
- Profile-axis pairs. The same dilemma for a person at each end of an axis (for example Outcomes and Principles). The profile route runs them.

Single cases and pairs work in three steps:

1. The app's own prompts write advice for a dilemma with fixed options.
2. A cheap judge model reads the dilemma, the options and the advice. It says which option the advice recommends. It never sees the answer key.
3. The script compares the verdicts with the answer key.

## Files

- `answerKey.ts`: the dilemmas, options and expected verdicts. Provisional. An AI model wrote it. A reviewer has seen it once.
- `pairs.ts`: the paired cases and what each thinker should do.
- `ANSWER_KEY.md`: the same key as a document for a philosophy professor. Make it with `npx vite-node experiments/verdict-check/renderKey.ts`. A test fails if it is out of date.
- `variants.ts`: prompt variants. `prod` is the production prompts (`worker/src/prompts.ts`). `legacy` is the production prompts as they were until 2026-11-21, frozen in `legacyPrompts.ts`. Add a new entry to test a new prompt.
- `scoring.ts`: task list and scoring. Pure functions.
- `judge.ts`: judge prompt and reply parser.
- `run.ts`: the command-line script.

## How to run

You need the `claude` CLI, signed in. The script makes no API calls.

```
npx vite-node experiments/verdict-check/run.ts --report-only
npx vite-node experiments/verdict-check/run.ts --limit 4
npx vite-node experiments/verdict-check/run.ts
```

The first line makes no model calls and scores what is cached. The second is a smoke test. The third is a full development run.

Options: `--variant <name>`, `--split development|holdout|all`, `--route voice|profile|pair|all`, `--limit <n>`, `--concurrency <n>`, `--samples <n>`, `--reuse-from <variant>`, `--compare <variant,variant,...>`.

`--reuse-from prod` copies an answer from `prod` (same sample) when this variant's prompt is the same, instead of a new call. Example: the `notes` variant gives the transfer thinkers the same prompt as `prod`.

Results are cached in `data/<variant>/`. A rerun continues from the cache. A changed prompt or changed advice makes a new call. The report goes to `data/<variant>/report-<split>.md`.

Note: a run with `--limit` writes a report of only those tasks over the full report. Run `--report-only` after it to get the full report again.

### Run-to-run variation

The same prompt can give a different answer on a second call. To measure this, answer every task more than one time:

```
npx vite-node experiments/verdict-check/run.ts --samples 3 --concurrency 8
```

Sample 1 is the normal cache in `data/<variant>/`. Sample k is in `data/<variant>/sample-k/`, with its own report. The run also writes `data/<variant>/variability-<split>.md`: the main scores of each sample side by side, the share of tasks with the same verdict in every sample, and a list of the tasks whose verdict changed. Each extra sample of the development split costs 168 advice calls and 168 judge calls.

Use it before you compare two variants. A difference between variants that is no larger than the spread between samples is not evidence.

### Compare variants with the original prompts

```
npx vite-node experiments/verdict-check/run.ts --compare legacy,prod,notes --samples 3
```

This makes no model calls. It scores the cache of each variant, sample by sample, and writes `data/comparison-<split>.md`: the main scores, the distinctness table and every keyed row, with one column for each variant. Each cell shows the samples in order ("s1 / s2 / s3"). Run each variant with `--samples 3` first. Always include `legacy`: it is the original advice process, and every claim of progress is made against it.

## Test philosophers

- Core four: Mill, Kant, Aristotle, Confucius. The key was written for them, and the model knows them best.
- Transfer thinkers (since 2026-11-21): Mencius, Hume, Maimonides. They have no lens notes. They show whether a change works beyond the core four. Every pair runs for all seven.

## Distinctness

The report counts, for each philosopher, the pair sides where the verdict differs from the baseline verdict on the same text. It needs no key, so it measures the complaint directly. A wrong answer also differs, so read it with the keyed scores.

Since 2026-11-21, every single dilemma also runs for the baseline and for all seven philosophers, keyed or not, so distinctness covers single cases too. The comparison report splits it by case group:

- contested: the key expects different answers from two or more thinkers. Distinctness should be high here.
- control: everyone, and a sensible adviser, should agree (agreement dilemmas, pairs marked `control: true`). Distinctness should be low here. A change that raises it on control cases invents disagreement.
- other: the rest.

Two key-based rows go with it: of the couples of keyed thinkers that the key expects to disagree, how many do; and of those it expects to agree, how many do.

## What "open" means

A reviewer judged that a thinker's texts do not settle a dilemma. The key keeps the reason. The thinker is not tested on that dilemma. A dilemma of kind `open` has no tested thinker at all. The report shows `open` in the cell. `·` means the key has nothing for that thinker.

## How to read the pair results

A pair has a base case and a variant case. One fact differs (the pivot). For each thinker the key says `flip` or `same`.

- `flip`: the answer should change. Example: `new → old`.
- `same`: the answer should not change.
- `recorded`: the thinker's own text gives the answer. `inferred`: our reading of the principles. Basis is given for each side (`recorded/inferred`). Trust rows with both sides `recorded` more.
- `correct`: both verdicts match the key.
- `wrong direction`: a flip row. The answer changed, but not as the key says.
- `no flip`: a flip row. The answer stayed the same, or was `none`. This is the main failure the pairs look for.
- `no choice`: either verdict is `none`. It is not counted as `no flip` or `changed`.
- `held other answer`: a same row. The answer stayed, but on the other option.
- `changed`: a same row. The answer changed, or was `none`.
- `missing`: a verdict is not yet available. These rows are left out of the percentages.

## Baseline, matrix and "uses pivot"

- Baseline: every pair is also run with the app's advice prompt with no philosopher (a neutral voice). A sensible adviser with no philosophy flips the same way on many pairs, so a correct flip proves little. A correct row counts as evidence for a thinker only where the thinker's pattern differs from the baseline's. The report column "differs from baseline" shows this.
- Pattern: the two verdicts of one arm, written `base → variant`.
- Matrix: one row per pair, with the pattern of the baseline and of all four philosophers (also those with no key), and the number of distinct patterns among the four philosophers. The aggregate "all the same" counts the pairs where the four philosophers and the baseline all gave one pattern. That measures directly the complaint that the app gives the same answer whichever philosopher is chosen.
- Uses pivot: the judge also says if the advice gives the pivot fact as a main reason for its recommendation (not only mentions it). The judge sees one version of the case and the pivot text. A row says "yes" when the judge said so for both sides. A pair judgment made before this field existed is made again, because its judge prompt changed.

## Report columns

- Voice table: one row per dilemma, one column per philosopher. The cell shows the judge's verdict. ✓ matches the key. ✗ does not match. `open` means the key marks the case as open. · means the key has no entry. `?` means the key entry is disputed. `*` means the judge saw conditional advice.
- `none`: the advice picks no listed option.
- Profile table: for each axis that should decide the dilemma, the verdict for a person at each end of the axis. `bothMatch`: both verdicts match the key. `differs`: the two verdicts differ and neither is `none`.
- Axis count: from the key alone, how many dilemmas each axis decides.
- `invalid`: the judge reply could not be read. It counts as missing.

## Limits

- Most recorded pairs can be passed by recall of a famous passage. If the passages behind the holdout pairs are written into the app's notes on a philosopher, the holdout measures copying.
- By default each case is answered once, so one changed answer can be noise. Use `--samples` to measure how often a verdict changes.

## Holdout rule

Holdout dilemmas and holdout pairs are for the final measurement only. Never use them to tune a prompt.

## Reasoning test

`npx vite-node experiments/verdict-check/reasoningRun.ts --variants legacy,prod,contrast [--sample 1] [--stage outline|judge|report|all]`

Asks whether thinkers who give the same verdict argue differently. Groups the cached voice answers by verdict, has GPT 6.2 Sol (Codex CLI) rewrite each as a plain argument outline without names or technical terms (`LEAK_PATTERNS` in `reasoning.ts`), and has two judges (GPT 6.1 Terra, Claude Sonnet 5.5) match outlines to authors. Writes `data/<variant>/reasoning/` and `data/reasoning-development.md`. Needs the `codex` CLI signed in. No new advice calls.

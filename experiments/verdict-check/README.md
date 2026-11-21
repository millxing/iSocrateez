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

Options: `--variant <name>`, `--split development|holdout|all`, `--route voice|profile|pair|all`, `--limit <n>`, `--concurrency <n>`.

Results are cached in `data/<variant>/`. A rerun continues from the cache. A changed prompt or changed advice makes a new call. The report goes to `data/<variant>/report-<split>.md`.

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
- Each case is answered once, so one changed answer can be noise.

## Holdout rule

Holdout dilemmas and holdout pairs are for the final measurement only. Never use them to tune a prompt.

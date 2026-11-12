# Profile-fidelity experiment

Date: 2026-11-11 and 2026-11-12

## Question

Until 2026-11-12, iSocrateez wrote advice in two model calls. A planner model (default Claude Haiku 5.5) read the dilemma and the ethical profile and returned a JSON plan. An advisor model (default Claude Sonnet 5.5) then wrote the advice from that plan.

Does the planner call make the advice fit the user's ethical profile better?

## Answer

No.

- A Sonnet plan followed by Sonnet advice gave the same fit as one Sonnet call with no plan.
- The app's default route (Haiku plan, Sonnet advice) gave the worst fit of the four routes tested.
- About half of all plans did not pass the app's own JSON validation. In the live app, each of those would have silently replaced the two-stage route with a thin fallback prompt.

The app was changed to one model call on 2026-11-12.

## Method

### Cases

A seeded script (`run.ts`, seed 20261111) made 25 cases. Each case is:

- one dilemma, drawn without replacement from a pool of 35 (the 20 sample dilemmas in the app plus 15 written for this test, in `dilemmas.ts`);
- one random profile: each of the three axes drawn uniformly from -1.00 to +1.00 in steps of 0.05, the same resolution as the app's sliders.

The explanation level was "informed" (the middle level) for every case. The persona mode was "personalized".

### Routes

Every case went through all four routes, so each route saw identical inputs.

| Route | Planner | Advisor |
|---|---|---|
| a (app default) | Haiku 5.5 | Sonnet 5.5 |
| b | Sonnet 5.5 | Haiku 5.5 |
| c | Sonnet 5.5 | Sonnet 5.5 |
| d | none | Sonnet 5.5 |

Routes b and c used the same Sonnet plan for a case, so they differ only in the advisor.

Routes a, b, and c used the app's real prompt code as it was at the time. A frozen copy is in `legacyPrompts.ts`. Route d used a new single-call prompt: the advisor prompt, with the planner's notes replaced by the plain-language description of each axis, the summary of the nearest philosophy, and this instruction, which only the planner had before:

> Before you write, identify the moral tensions in the dilemma. Surface them in the advice; do not collapse them too quickly.

### Judges

Two models read each advice text and estimated the profile it was written for: Claude Opus 5.5 and OpenAI Astra 6 (`gpt-6-astra`). Each judge saw one text at a time, with the dilemma and a definition of the three axes. The judge did not know the route.

The section "Why this fits your ethical profile" was removed from each text before the judges saw it, because it states the profile almost directly. The removal succeeded for all 100 texts.

### Model calls

All calls used the `claude` (2.1.322) and `codex` (0.167.0) command-line tools in headless mode, on subscriptions and not API keys. The Claude calls had an empty system prompt, no tools, no settings files, and medium effort. That is close to the app's API call, but it is not the same.

### Totals

50 plans, 100 advice texts, 200 judgments. No call failed.

## Results

### Fit to profile, by route

Error is the mean absolute difference between the true value and the mean of the two judges' guesses, averaged over the three axes. The scale goes from -1 to +1. Intervals are 95% bootstrap intervals over the 25 cases.

| Route | Mean error | 95% interval |
|---|---|---|
| a. Haiku plan + Sonnet advice | 0.56 | 0.46 to 0.66 |
| b. Sonnet plan + Haiku advice | 0.45 | 0.37 to 0.54 |
| c. Sonnet plan + Sonnet advice | 0.48 | 0.38 to 0.59 |
| d. Sonnet advice, no plan | 0.48 | 0.38 to 0.58 |

For reference, a judge that always guesses 0 on every axis gets an error of 0.56 on these cases.

### Paired differences

Each difference is computed case by case, so the dilemma and the profile cancel out. A negative value means the first route has the smaller error.

| Comparison | Difference | 95% interval |
|---|---|---|
| b minus a | -0.11 | -0.20 to -0.02 |
| c minus a | -0.08 | -0.15 to -0.01 |
| d minus a | -0.08 | -0.17 to +0.00 |
| d minus c | 0.00 | -0.08 to +0.09 |

### Correlation by axis

Correlation between the true value and the mean guess, across the 25 cases. This shows whether the guesses track the profile, and it is not affected by a constant offset.

| Route | Outcomes/Principles | Individual/Collective | Reason/Intuition |
|---|---|---|---|
| a | 0.56 | 0.26 | 0.10 |
| b | 0.63 | 0.57 | 0.59 |
| c | 0.69 | 0.51 | 0.38 |
| d | 0.55 | 0.53 | 0.50 |

With 25 cases, each correlation has an interval of about ±0.3.

### Direction

Where the true value was at least 0.2 away from zero, how often did a judge get the side right? Chance is 50%.

| Route | Outcomes/Principles | Individual/Collective | Reason/Intuition |
|---|---|---|---|
| a | 32 of 44 | 26 of 44 | 20 of 36 |
| b | 32 of 44 | 33 of 44 | 25 of 36 |
| c | 35 of 44 | 26 of 44 | 21 of 36 |
| d | 33 of 44 | 32 of 44 | 23 of 36 |

### Plans that failed the app's validation

| Planner | Plans rejected |
|---|---|
| Haiku 5.5 | 13 of 25 |
| Sonnet 5.5 | 10 of 25 |

The usual cause: `framingNotes` was one string and not a list of strings. The planner prompt named the JSON keys but did not state their types. In the app, a rejected plan was dropped and a short fallback prompt was used, with no message to the user. For this experiment, the script repaired such plans, so that every route was tested as designed.

### Other observations

- **All advice reads as "reason".** The true Reason/Intuition values average -0.03. The guesses average -0.54. A structured, argued text looks like the work of a reasoner, whatever the profile.
- **The judges agree with each other.** The correlation between the two judges' guesses is 0.91, 0.81, and 0.79 on the three axes. The limit is in the advice, not in judge noise.
- **The advice does not caricature the profile.** The judges guessed profiles that were less extreme than the true ones (ratio of absolute sizes: 0.71 to 0.76).
- **Advice length:** route d was the shortest, at 666 words on average. Routes a, b, and c had 760, 715, and 784.
- **A dilemma can override the profile.** In case 2 (a museum asked to return a ceremonial object), the profile was -0.95 on Outcomes/Principles. Three of the four routes wrote rights-based advice, and both judges guessed +0.5 to +0.8.

## Conclusions

1. **The planner adds nothing measurable.** Routes c and d differ by 0.00, with an interval of -0.08 to +0.09.
2. **A Haiku planner makes the fit worse.** Route a is worse than b and c, and the intervals exclude zero. A likely cause, not tested: in the two-stage design, only the planner saw the plain-language axis descriptions. The advisor got the numbers and the planner's interpretation, so a weak interpretation was passed on.
3. **Routes b, c, and d cannot be separated** with 25 cases.
4. **Fit to profile is moderate in every route.** The direction of an axis was right about 70% of the time. This is a larger problem than the choice of route. The Reason/Intuition axis is the weakest.

## Limits

- **Not the live app.** The calls went through command-line tools, not the API. The comparison between routes is fair. The absolute numbers, and the plan rejection rate, may differ in production.
- **Fit, not quality.** A judge that can recover the profile shows that the advice expresses the profile. It does not show that the advice is good.
- **Route d has a different prompt.** It includes the axis descriptions, which the advisor prompts of a, b, and c did not. This does not affect the c = d result, but it means "no plan" and "better inputs" are not separated.
- **Profile route only.** The philosopher-voice route was not tested. Its planner was removed at the same time, on the assumption that the result carries over.
- **Sample size.** 25 cases show a large difference. They do not show a small one. Four comparisons were made without a correction for multiple tests.
- **Judges are models.** Both judges may share blind spots, for example on the Reason/Intuition axis.

## What changed in the app

- Advice is one model call (`buildAdvisorPrompt` and `buildVoiceAdvisorPrompt` in `worker/src/prompts.ts`). The prompt is the route d prompt.
- Settings has one model field in place of two.
- The planner prompts, the plan validator, and the fallback prompts were removed.

## Possible next experiments

- **Prompt variants for fit.** Tell the model how each axis must shape the advice, most of all intuition, and measure each variant with this harness.
- **Philosopher route.** A panel reads advice written in a philosopher's voice and tries to name the philosopher. This would test the route that this experiment did not cover.
- **Quality.** Pairwise comparison of advice texts by a panel, with a blind check by a person.

## Files

| File | Content |
|---|---|
| `run.ts` | The whole experiment: cases, prompts, model calls, judges, report |
| `dilemmas.ts` | The dilemma pool |
| `legacyPrompts.ts` | Frozen copy of the two-stage prompts |
| `data/cases.json` | The 25 cases with their true profiles |
| `data/plans/` | Raw planner output, one file for each case and planner model |
| `data/advice/` | The 100 advice texts |
| `data/judgments/` | Raw judge output, one file for each text and judge |
| `data/results.jsonl` | One row for each judgment, with true and guessed values |
| `data/report.txt` | The summary tables that the script prints |

## How to run it again

From the repository root:

```bash
npx vite-node experiments/profile-fidelity/run.ts 25
```

The script stores every model output in `data/` and reads it from there on the next run. With the current data, it makes no model calls and prints the report. To make new calls, delete the related files in `data/`. The script needs the `claude` and `codex` command-line tools, each signed in.

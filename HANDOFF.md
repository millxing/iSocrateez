# Handoff: make the advice differ by philosopher and by profile

Written 2026-11-21. Read `CLAUDE.md` first, then this file.

## 1. Objective and status

**Objective.** An ethics professor said that the app "just repackages the same basic idea but in tailored language to that thinker". The owner (Rob) wants advice that is specific to the chosen philosopher or to the user's ethical coordinates.

**The agreed plan has six steps.**

| Step | Content | Status |
|---|---|---|
| 1 | Fix five calibration questions that were scored backwards | Done, local |
| 2 | Build a test that shows if the recommendation changes with the philosopher or the profile | Done, local. The key is not yet checked by a philosopher |
| 3 | Rewrite the two advice prompts: work out what the view concludes, then advise | Done, local |
| 4 | Replace the two-sentence philosopher briefs with longer notes | **Pilot done for Mill, Kant, Aristotle, Confucius (section 3a). Stopped there. Not in the app** |
| 4a | Transfer test (other thinkers) and distinctness test (thinker against common sense), compared with the original prompts | **Done, first result (section 3b)** |
| 5 | Send the user's actual calibration answers to the model | Not started. Smaller than first planned (see section 8) |
| 6 | Run the held-back cases once, then decide the larger items (axes, side-by-side view, checker call) | Not started |

**Deployed 2026-11-21:** step 1 (the question fix), and the new advice prompts with the `contrast` step 5 (`CONTRAST_STEP_5` in `worker/src/prompts.ts`), with the "Key fact" tab. Rob chose to stop the testing here and to try the new prompts in the live app. Not deployed: the lens notes (4 thinkers only), and any change to the debate prompts (Rob: try the advice first). In the harness, `prod` now includes the contrast step; the older voice prompt is the variant `verdict`, and its cached answers moved from `data/prod/` to `data/verdict/`. The `contrast` variant is now the same as `prod`; `notes` now includes the contrast step too.

Checked end to end on 2026-11-21 through an inactive Worker version (preview URL, live keys): one Kant answer and one profile answer, both with the five sections. The local `worker/.dev.vars` API keys (Anthropic and OpenAI) are rejected by the providers; update them before you use `npm run worker:dev`.

## 2. What was found

Verified (measured, or read in the code):

- **Reversed questions.** `op-6`, `op-8`, `ic-10`, `ri-7` and `ri-10` in `shared/questionBank.ts` had `polarity: -1`, but their labels already pointed the correct way. This pulled calibration scores toward the middle. Fixed: only `ic-5` is reverse-scored now.
- **The old prompts gave hedged, similar answers.** With the old prompts, two opposite profiles got the two expected answers in 3 of 14 test pairs. With the new prompts: 13 of 14.
- **Mill and Kant were already correct** when the dilemma forces a choice (18 of 18 single cases, old and new prompts). The weak thinkers are Aristotle and Confucius.
- **Much of what looks correct is generic.** Of 12 correct pair answers, only 5 differ from a baseline with no philosopher (3 with the old prompts).

Assumptions and interpretations (not verified):

- The answer key is correct. An AI model wrote it. Two AI models and one outside reviewer criticised it. No philosopher has checked it.
- The remaining Aristotle and Confucius errors are errors of content (what the thinker holds), so longer notes will correct them. A 28-call pilot before step 2 supports this for one case only.
- One answer for each case is enough to compare prompts. Run-to-run variation was not measured.

## 3. Results on the development split

One answer per case. Advice by `claude-sonnet-5-5`, effort medium. Judge: `claude-haiku-5-5`, effort medium.

| Measure | Old prompts (`legacy`) | New prompts (`prod`) |
|---|---|---|
| Single cases that match the key | 32 of 40 | 37 of 40 |
| Mill | 8 of 8 | 8 of 8 |
| Kant | 10 of 10 | 10 of 10 |
| Aristotle | 7 of 11 | 9 of 11 |
| Confucius | 7 of 11 | 10 of 11 |
| Opposite profiles with the two expected answers | 3 of 14 | 13 of 14 |
| Pairs where the answer must reverse | 6 of 9 | 6 of 9 |
| Pairs where the answer must stay | 6 of 7 | 6 of 7 |
| Correct pair answers that differ from the baseline | 3 of 12 | 5 of 12 |
| Answers that did not choose an option | 2 | 0 |

Full reports: `experiments/verdict-check/data/prod/report-development.md` and `data/legacy/report-development.md`.

**Rows that still fail with the new prompts** (targets for step 4):

| Case | Thinker | The app answers | The key expects |
|---|---|---|---|
| `medicine` (single) and `drug-stakes` (pair) | Aristotle | Takes the drug to save a life | Does not take it: theft has no mean (NE II.6) |
| `gut-vs-record` (single), `experienced-eye` (pair) | Aristotle | Trusts the unease of a person with no experience | Votes on the record; trusts the feeling only of an experienced judge (NE VI.11) |
| `gut-vs-record` (single) | Confucius | Trusts the unexplained unease | Votes on the record |
| `hold-back-or-urge` (pair) | Confucius | "Consult" for both people | Consult for the hasty person, act for the timid one (Analects 11.22) |
| `drug-stakes` (pair) | Mill | Takes the drug to stop two weeks of pain | Does not. This key row is our inference and is weak |
| `water-scheme`, Individual-Collective axis | Profile | Enforces the penalty at both ends | The individual end should not. The case joins a fine and a water cut; it has a known design fault |

Also seen, not scored: the app as Aristotle called a single lie "a vice in you". The professor's first complaint was this same error (an act is not a disposition). Put it in the Aristotle notes as a common error.

## 3a. Step 4 result: lens notes (2026-11-21)

Variant `notes` = `prod` + `experiments/verdict-check/lensNotes.ts` (draft 2) in the voice prompt. Development split, 3 samples each. Baseline and profile answers are shared with `prod` (copied cache, same prompts).

| Measure (sample 1 / 2 / 3) | `prod` | `notes` |
|---|---|---|
| Single cases, Mill / Kant | 8/8, 10/10 in all | 8/8, 10/10 in all |
| Single cases, Aristotle | 9 / 9 / 9 of 11 | 9 / 9 / 9 of 11 |
| Single cases, Confucius | 10 / 9 / 9 of 11 | 9 / 10 / 10 of 11 |
| Pairs, flip rows correct | 7 / 6 / 8 of 10 | **9 / 9 / 9 of 10** |
| Pairs, same rows correct | 6 of 7 in all | 6 of 7 in all |
| Correct pair rows that differ from the baseline | 6 / 4 / 3 | 6 / 5 / 3 (of 15) |

- Fixed in all 3 samples: `experienced-eye` Aristotle, `drug-stakes` Mill, `debt-or-father` Aristotle, `promise-charity` Confucius.
- Still wrong in all 3 samples: `medicine` and `drug-stakes` base, Aristotle takes the drug; `gut-vs-record` single case, Aristotle and Confucius trust the feeling. All three key entries are marked disputed. The notes did not add a rule to force them (rule 7), and the note on mixed actions (III.1) may support "take". An independent agent panel should rule on these (Rob, 2026-11-21: the professor is not available for follow-up; do not plan on his input).
- `hold-back-or-urge` Confucius still fails: 11.22 was removed from the note on the reviewer's advice (teaching method, fitted to the case).
- **The notes make the answers more correct, but not more distinct from the baseline.** The added correct rows are rows where the baseline is also correct.
- Decision rule from section 8 is met (failing rows improve, Mill and Kant unchanged), so the notes are a candidate for the app. Not yet moved to `shared/philosophyProfiles.ts`.

**Decision (Rob, 2026-11-21): treat this as a pilot and stop work on these four notes. The notes are deferred, not dropped:** they raised correctness on the core pairs (flip rows 12 of 13 in every sample, against 8 to 11 with `prod`), so they should go into the app later, for all 40 thinkers, after the distinctness work and after a check on the holdout. Reasons: a note changes the prompt of one thinker only, so it does nothing for the other 36; these four are the thinkers that the model knows best, so they are the easiest cases; and the pilot showed more correct answers but not more distinct ones, which was the professor's complaint. The next work must apply to all 40 thinkers (section 3b). Every comparison must include the original prompts (`legacy`).

## 3b. Transfer and distinctness tests (started 2026-11-21)

Plan, agreed with Rob:

1. **Transfer test.** Add 3 thinkers that are not among the four: Mencius, Hume, Maimonides. They are less known to the model, and each has recorded positions on cases of the kind in the test. Write key entries for them on the existing development cases. Run `legacy` and `prod` for them with no notes. This shows whether the shared prompt works beyond the four.
2. **Distinctness test.** Add development pairs where a thinker's recorded answer differs from what a sensible adviser with no philosophy would say. The measure is how often each thinker's verdict differs from the baseline verdict on the same text. It does not need the key.
3. **Comparison with the original.** One report puts `legacy` (the original prompts), `prod` and `notes` side by side, 3 samples each, on the same tasks.

Changes made: `CORE_PHILOSOPHERS` and `TRANSFER_PHILOSOPHERS` in `answerKey.ts`; 3 new development pairs (`mourning-leave`, `anger-at-the-meeting`, `loan-i-cannot-repay`); `distinctness()` in `scoring.ts`; `--compare` and `--reuse-from` in `run.ts`. The new entries had a reference check and a content review (two AI subagents); their corrections are in. Not checked by a philosopher. Two existing pairs (`debt-or-father`, `credit-stakes`) change more than one fact; their text was kept so that old answers stay valid.

**Result (2026-11-21), development split, 3 samples for each variant, the same 307 tasks.** Full report: `experiments/verdict-check/data/comparison-development.md` (make it again with `--compare legacy,prod,notes --samples 3`). Cells: sample 1 / 2 / 3.

| Measure | `legacy` (original) | `prod` | `notes` |
|---|---|---|---|
| Single cases, core four | 32 / 31 / 33 of 40 | 37 / 36 / 36 | 36 / 37 / 37 |
| Single cases, transfer thinkers | 15 / 14 / 14 of 15 | 14 / 15 / 15 | 14 / 15 / 15 |
| Profile, both poles match | 3 / 4 / 3 of 14 | 13 / 13 / 13 | 13 / 13 / 13 |
| Pairs, flip rows correct, core four | 9 / 9 / 9 of 13 | 9 / 8 / 11 | 12 / 12 / 12 |
| Pairs, flip and same rows correct, transfer | 8 / 8 / 9 of 11 | 10 / 11 / 10 | 10 / 11 / 10 |
| Answers that choose no option | 2 / 6 / 3 of 55 | 0 | 0 |
| **Distinctness, core four** (pair answers that differ from the baseline) | 20% / 13% / 15% | 24% / 16% / 17% | 19% / 15% / 16% |
| **Distinctness, transfer thinkers** | 13% / 9% / 10% | 19% / 20% / 20% | same as prod |
| Pairs where all 7 philosophers and the baseline agree | 2 / 5 / 3 of 14 | 1 / 1 / 1 | 1 / 1 / 1 |

Verified from the data:

- `prod` is better than the original on every measure, and the gain holds for the transfer thinkers, who have no notes. Their distinctness about doubles (10-13% to 19-20%). So the shared prompt change transfers.
- The notes add correctness on core pairs, but no distinctness.
- **About 80% of philosopher answers on the pairs are still the same as the baseline answer** in every variant.
- The new pairs show that the model can differ from the baseline when a case calls for it: `mourning-leave` Confucius and Mencius are correct and different from the baseline in 3 of 3 samples with `prod` (original: 1 and 0 of 3); Kant differs in 3 of 3 on `loan-i-cannot-repay`, in every variant.
- The transfer thinkers' single cases do not discriminate: even the original prompts match 14-15 of 15. Those entries are cases where the thinker agrees with common sense.

Interpretations (not verified):

- Much of the 80% overlap is in the case set: many cases are ones where the thinkers agree with a sensible adviser. A score that depends on the case mix cannot alone say if the advice is "the same basic idea".
- The verdict test measures only the choice. The professor may mean that the reasoning is the same. That is not measured.

## 3c. Distinctness by case group (2026-11-21)

Changes: every single dilemma now runs for the baseline and all seven philosophers; cases are grouped as contested / control / other (`dilemmaGroup`, `pairGroup`, `control: true` on `wallet-owner`); `separation()` counts whether thinkers that the key expects to disagree do disagree. New development cases: `kidney-for-a-stranger`, `cousin-or-strangers` (contested), `manager-who-belittles` (other). Two drafts were removed after review (see the comment in `answerKey.ts`). Development split, 3 samples each:

| Measure | `legacy` | `prod` | `notes` |
|---|---|---|---|
| Control cases: answers that differ from the baseline | 0 of 28 in every sample | 0 of 28 | 0 of 28 |
| Expected disagreements between keyed thinkers that appear | 23/31, 20/27, 22/30 | 26/34, 27/34, 27/34 | 25/33, 26/34, 27/34 |
| Expected agreements kept | 95% to 97% | 94% to 96% | 95% to 98% |
| Contested cases, core four: answers that differ from the baseline | 17% to 19% | 19% to 30% | 16% to 22% |

Verified:

- No version invents disagreement on control cases.
- Where the key expects two thinkers to disagree, they do in about 80% of couples with `prod` (about 75% with `legacy`).
- The distinctness percentage on contested cases is low by construction: in most contested cases only one thinker departs from common sense (for example Kant on the lie), so most answers match the baseline correctly.
- The new "gray" cases were not gray for the model: the baseline chose firmly (donate, cousin, stand up), and most thinkers agreed. Mill chose the charity abroad in 3 of 3 samples with `prod`, against the baseline.
- The misses have one shape: the thinker's text gives an uncomfortable answer, and the model gives the modern, kind answer instead: Kant gives the kidney (2 of 3 samples), the Confucian entry never declines, Aristotle takes the drug (0 of 3, every version). All these key entries are disputed.

Interpretation (not verified): the remaining verdict-level gap is that the model softens thinkers toward modern common sense when their doctrine is harsh or unusual. Whether that is an error depends on the disputed key entries. The agent panel in section 3d supports the key on these entries.

## 3d. Agent panel on the disputed key entries (2026-11-21)

Rob cannot easily follow up with the professor, so disputed entries go to independent agents. Do not plan work that waits on the professor.

Method: 3 reviewers from 3 model families (Claude Sonnet 5.5, GPT 6.1 Terra, Gemini 4 Neon) answered 32 development entries separately: the 24 disputed single entries, and 8 clear entries that `prod` misses in 2 or 3 of 3 samples. They saw only the case and the options, not the key or the app's answers. The decision rule was written before any answer was read. Files: `experiments/verdict-check/reviews/agent-panel-2026-11-21/` (brief, items, hidden key, rule, the three answer files, `score.py`).

Result, over 38 answer slots (pairs count both sides): confirmed (3 of 3) 29, kept (2 of 3) 7, changed 1, open 1.

- Changed: Confucius, `gut-vs-record`: "record" became "feeling" (2 of 3; Analects 2.10, 20.3, 15.28). The app already chose "feeling", so the key was wrong there.
- Open: Aristotle, `parents-or-post` (2 of 3 say the texts do not settle it; NE IX.2 says no fixed rule settles such conflicts). Moved to the `open` field.
- The softening misses are supported: Aristotle "do not take the drug" (single case and pair, 3 of 3), Kant "decline the kidney" (3 of 3), Confucius "decline" (2 of 3, 1 open), Confucius `hold-back-or-urge` (3 of 3).

Limits: only the Gemini reviewer checked passages on the web; the other two cited from memory, and nobody checked the citations. All reviewers are AI models. The brief told reviewers to give hard answers where the texts lead there, which may push toward the key's harsher readings. Most confidences were "medium", and "low" on gut-vs-record and Hume's experienced-eye.

Next: a `contrast` variant (`variants.ts`): prod with step 5 of the voice prompt replaced by an explicit check against common sense. Results in section 3e.

## 3e. The `contrast` variant (2026-11-21)

`contrast` = `prod` with step 5 of the voice prompt replaced (`CONTRAST_STEP_5` in `variants.ts`): say the modern adviser's answer, list the thinker's strict or surprising doctrines that bear on the facts, follow one that applies even when harsh, and do not invent a disagreement. Profile and baseline prompts are the same as `prod` (reused, not run again). Development split, 3 samples. Comparison: `data/comparison-development.md` (`--compare legacy,prod,contrast`).

| measure (3 samples) | legacy | prod | contrast |
|---|---|---|---|
| Voice, core four, match with key | 37, 34, 37 /45 | 41, 40, 41 /45 | 43, 42, 41 /45 |
| Voice, transfer thinkers | 17, 16, 16 /17 | 16, 17, 17 /17 | 16, 16, 16 /17 |
| Pair flip rows, core four | 9, 9, 9 /13 | 9, 8, 11 /13 | 11, 10, 11 /13 |
| Expected disagreements reproduced | 23/32, 20/27, 22/31 | 26, 27, 27 /35 | 29, 30, 29 /35 |
| Expected agreements kept | 104/110, 104/107, 107/110 | 109, 107, 110 /114 | 110, 108, 107 /114 |
| Control cases that differ from baseline | 0/28 | 0/28 | 0/28 |

Rows that moved from `prod` to `contrast`: Kant `kidney-for-a-stranger` decline 1 to 3 of 3; Aristotle `medicine` not-take 0 to 2 of 3; Aristotle `anger-at-the-meeting` 1 to 3 of 3; Aristotle `drug-stakes` 0 to 1 of 3; Aristotle `experienced-eye` 0 to 1 of 3. Worse: Maimonides `credit` deflect 2 to 0 of 3 (disputed; the panel confirmed it 3 of 3). Unchanged: Confucius `kidney-for-a-stranger` decline 0 of 3.

Verified: `contrast` reproduces more expected disagreements than `prod` in every sample (29 to 30 against 26 to 27 of 35), with no invented disagreement on the control cases and the same rate of kept agreements. Raw distinctness (answers that differ from the baseline) did not rise; the gain is in correctness on contested cases.

Risk: the examples in step 5b (acts forbidden in all cases, duties to oneself, role duties) are general, but they match the development misses. The development gain may overstate the effect. Only the holdout run can test this. Not decided: whether `contrast` goes into `worker/src/prompts.ts`.


## 3f. Reasoning test (2026-11-21)

Question: when thinkers give the same verdict, is the reasoning different, or one argument in different words? Script: `experiments/verdict-check/reasoningRun.ts` (logic in `reasoning.ts`, tests in `reasoning.test.ts`; shared call helpers moved to `cli.ts`). Report: `data/reasoning-development.md`.

Method: development split, sample 1, voice answers. Groups = answers on one dilemma (7 test thinkers + baseline) that chose the same option, 3 or more. GPT 6.2 Sol rewrote each answer as a plain argument outline without names, sources, technical terms or first-person voice (399 outlines; leak check, 10 retried, 0 left with a leak). Two judges (GPT 6.1 Terra, Claude Sonnet 5.5) matched the outlines of each group to the authors, separately.

| variant | matched (Terra / Sonnet) | chance | thinkers taken for the baseline |
|---|---|---|---|
| legacy | 97% / 100% | 15% | 0% / 0% (chance 14%) |
| prod | 99% / 96% | 15% | 0% / 1% |
| contrast | 100% / 99% | 15% | 0% / 0% |

Verified: with names and terms removed, the judges still identify almost every author, in every variant, including the original prompts. The judges' notes name content, not words: duties to donors and "using her" (Kant), help that makes the poor self-supporting (Maimonides), a fitting degree of anger (Aristotle), shame as a moral signal (Mencius).

Interpretation (not verified): the app does not give one argument in different words; each thinker's reasons are specific, and were already in `legacy`. So this test cannot tell the variants apart (ceiling). What remains of the professor's complaint is at the verdict level (sections 3c to 3e): thinkers whose texts give a hard answer were pulled to the common answer, with their own reasons attached. A possible sharper test: match on the "Decisive fact" section only, to see if the deciding reason (not only the supporting reasons) is thinker-specific.

## 3g. Holdout run: rules fixed before the run (2026-11-21)

Rob approved the holdout run on 2026-11-21. Written before any holdout answer was generated.

- Variants: `legacy`, `prod`, `notes`, `contrast`. 3 samples each. `--split holdout`. `notes` and `contrast` reuse identical prompts from `prod`.
- The holdout runs once. No prompt is changed and run on the holdout again on the basis of these results. Holdout key entries have not had the agent panel review.
- Measures: voice match with the key (core four, transfer thinkers); pair flip and same rows; expected disagreements reproduced; expected agreements kept; control cases that differ from the baseline.
- `contrast` goes into `worker/src/prompts.ts` (with Rob's approval) only if, in the sum over the 3 samples: voice match with the key is at least that of `prod`; expected disagreements reproduced are at least those of `prod`; expected agreements kept fall by no more than 2 against `prod`; and no control case differs from the baseline more often than with `prod`. Otherwise it stays an experiment.
- `notes` (deferred for all 40 thinkers): the holdout check passes if `notes` matches the key on core-four voice and pair flip rows at least as often as `prod`, in the sum over 3 samples.
- `prod` against `legacy`: report the same measures. The claim "prod is better than the original" holds on the holdout only if prod is at least as good on voice match and expected disagreements.

## 3h. Holdout result (2026-11-21)

Run once, 3 samples, no failed calls. Report: `experiments/verdict-check/data/comparison-holdout.md`. The holdout has 15 keyed voice answers and 6 pairs, all for the core four; no transfer thinker is keyed on the holdout.

Sums over the 3 samples:

| measure | legacy | prod | notes | contrast |
|---|---|---|---|---|
| Voice, core four, match with key | 39/45 | 41/45 | 42/45 | 42/45 |
| Pair flip rows, core four | 10/18 | 17/18 | 18/18 | 18/18 |
| Expected disagreements reproduced | 5/11 | 11/15 | 12/15 | 12/15 |
| Expected agreements kept | 37/37 | 36/39 | 36/39 | 36/39 |
| Control cases that differ from baseline | 0/42 | 0/42 | 0/42 | 0/42 |

Against the rules in section 3g:
- `contrast`: passes every condition (42 >= 41; 12 >= 11; agreements equal to prod; controls 0).
- `notes`: passes (voice 42 >= 41; pair flips 18 >= 17).
- `prod` against `legacy`: holds (voice 41 against 39; expected disagreements 73% against 45%). Legacy has smaller totals because it gave more "none" verdicts.

Limits: the holdout is small. `contrast` and `notes` beat `prod` by 1 answer on each measure, which is inside the spread between samples. So the holdout shows that they are not worse, not that they are better. The development gain of `contrast` (section 3e) is the evidence that it is better. One holdout row is wrong in every new variant: Confucius `deathbed-promise` keep (disputed) (0 of 3 in prod, notes, contrast; 1 of 3 in legacy).

## 3i. Hybrid test: rules fixed before the run (2026-11-21)

Rob's idea: on the philosopher path, the thinker's preset coordinates (`coordinates` in `shared/philosophyProfiles.ts`) do most of the work, and knowledge of the thinker changes the answer only where a specific doctrine applies. Variant `hybrid` (`buildHybridVoicePrompt` in `variants.ts`). Only the core four have coordinates among the test thinkers, so only their voice and pair answers change; all other prompts are the same as `prod` and are reused from `data/contrast/` (same prompts as the current `prod`).

- Run: development and holdout, 3 samples each, `--reuse-from contrast`. Compare `legacy,contrast,hybrid` (`contrast` = live prompts). The holdout was already used once for the 3g decision; this is a new, fixed design, not a tuned prompt.
- Measures, summed over 3 samples and both splits: core-four voice match with the key; pair flip rows; expected disagreements reproduced; expected agreements kept; control cases that differ from the baseline. Also: core-four voice rows that the hybrid fixes (wrong in live, right in hybrid) against rows that it breaks.
- Decision: `hybrid` is better if voice match and expected disagreements are each higher than live by 3 or more, and agreements kept fall by no more than 2. It is worse if either of the first two is lower by 3 or more. Otherwise it is a tie, and the live design stays (less work, no coordinates needed for 30 thinkers).

## 3j. Hybrid result (2026-11-22)

Run as fixed in 3i, no failed calls. Reports: `data/comparison-development.md`, `data/comparison-holdout.md` (`--compare legacy,contrast,hybrid --samples 3`). Sums over 3 samples, development + holdout:

| measure | live (`contrast`) | `hybrid` | difference |
|---|---|---|---|
| Voice, core four, match with key | 168/180 | 162/180 | -6 |
| Expected disagreements reproduced (couples of thinkers, all 7) | 100/120 | 93/120 | -7 |
| Expected agreements kept (couples of thinkers, all 7) | 361/381 | 361/381 | 0 |
| Pair flip rows, core four | 50/57 | 44/57 | -6 |
| Control-case answers that differ from the baseline (all 7 thinkers) | 0/126 | 0/126 | 0 |

Rows (samples correct, live to hybrid). Fixed: Confucius `promise-charity` keep 1 to 3. Broken: Mill `memorial-words` silent 3 to 0; Confucius `favour-asked` pair (holdout) 3 to 0; Aristotle `medicine` not-take 2 to 0; Kant `kidney-for-a-stranger` decline 3 to 1; Mill `lie-stakes` pair 3 to 1; Confucius `extension` 3 to 2; Mill `drug-stakes` pair 1 to 0. Fixed 2 samples, broke 14.

**Decision by the 3i rule: `hybrid` is worse** (voice -6, disagreements -7). The live design stays. Interpretation (not verified): the coordinates pull toward "a person with this thinker's scores". Example: Mill's Individual-Collective score is +0.35 (toward the group), and the hybrid had Mill say the words of faith for the family; the key (disputed) has Mill stay silent, from his defence of individuality. Kant's duty to himself on the kidney case was lost in the same way.

## 4. Decisions and reasons

- **Paired cases, not one "correct" answer.** The first key gave each philosopher one option for each dilemma. An outside reviewer showed that the texts do not settle most of those answers (24 of 78 judged "open", 4 changed). The reviewer proposed pairs: tell one case twice, change one fact, and check whose answer reverses. This needs agreement only on which fact matters to whom. Review: `experiments/verdict-check/reviews/second-reviewer-2026-11.md`. The reviewer is not identified to us.
- **A baseline with no philosopher runs on every pair.** A design critique showed that a sensible adviser also reverses on most pairs. A correct answer is evidence for a thinker only where it differs from the baseline.
- **"Open" entries are kept but not scored.** They sit in the `open` field of each dilemma in `answerKey.ts`.
- **The new prompts were adopted after one run.** They were written before the development results were seen, and were not tuned on them. The frozen old prompts are the `legacy` variant.
- **One model call is kept.** An earlier experiment (`experiments/profile-fidelity/`) showed that a separate planner call did not help.
- **New section and tab.** The advice has a fifth section, "What this answer turns on". The results page shows it as the tab "Key fact". Rob has not confirmed the label.
- **Holdout passages stay out of every prompt (2026-11-21).** The alternative, new holdout pairs, would have a weaker key (inferred, not recorded) and would need another review. `HOLDOUT_PASSAGES` in `pairs.ts` lists the six passages as narrow patterns; a test in `variants.test.ts` fails if any variant's prompt, for any of the 40 philosophers or any profile, contains one. So step 4 notes cannot quote them. Do not loosen a pattern to make that test pass.
- **Kant flip pair added (2026-11-21):** `pardon-the-surgeon` (development). Guilty surgeon: no pardon; proven innocent: pardon. Sources checked against Hastie's translation of the Doctrine of Right, §49 E. Result, 3 samples: Kant correct 3 of 3. The baseline gives the same pattern in 2 of 3 samples, so the pair shows that Kant can reverse, but it is weak evidence of Kant-specific content.
- **Held-back cases are untouched.** 6 pairs and 8 single cases are marked `holdout`. They were never run. Run them once, after steps 4 and 5.
- **Rob accepted** that sharper advice will sometimes recommend what most people think is wrong (for example, do not report your father). The safety filter is unchanged.

## 5. Files

Changed by this work:

| File | Change |
|---|---|
| `shared/questionBank.ts` | Polarity of five questions corrected |
| `shared/ethics.test.ts` | New test: the direction of all 30 questions (`HIGH_LABEL_POLE`) |
| `worker/src/prompts.ts` | New advice prompts. Exports `commitRules`, `adviceSections`, `presentationGuidance`, `NO_FOLLOW_UP_NOTE` for the test baseline |
| `worker/src/llm.test.ts` | Expectations for the new prompt text |
| `src/components/ResultsView.tsx`, `.test.tsx` | New tab `turns` ("Key fact"); pattern `/turns\s+on/i`; export description |
| `CLAUDE.md` | Tab list; notes under "If you change model orchestration" |
| `.gitignore`, `tsconfig.json`, `vitest.config.ts` | One line each for `experiments/verdict-check` |
| `experiments/verdict-check/` | New. The test harness (section 6) |
| `HANDOFF.md` | This file |

Already uncommitted before this work, and **not mine** (do not revert, ask Rob): `package.json`, `package-lock.json`, `worker/src/providers.ts`, `worker/src/providers.test.ts`, all of `experiments/philosopher-fidelity/`, and other lines in `.gitignore`, `tsconfig.json`, `vitest.config.ts`. Rob put `docs/philosopher-questionnaire-answers.md` there; `reviews/second-reviewer-2026-11.md` is a copy of it.

**Not in Git:** `experiments/verdict-check/data/` (ignored). It holds all cached advice, judgments and reports. If it is lost, a new run costs about 340 model calls for each variant, and the answers will differ a little.

## 6. The test harness

Folder: `experiments/verdict-check/`. Read its `README.md`.

| File | Content |
|---|---|
| `answerKey.ts` | 25 single dilemmas, each with two options: keyed answers for some thinkers, `open` notes, and the axis that decides the case |
| `pairs.ts` | 17 paired cases (11 development, 6 holdout), and `HOLDOUT_PASSAGES` |
| `variants.ts` | `prod` = `worker/src/prompts.ts`; `legacy` = frozen old prompts. Add a new variant here to test a prompt |
| `legacyPrompts.ts` | Frozen old prompts. Do not edit |
| `run.ts`, `scoring.ts`, `judge.ts` | Runner, scoring, judge prompt and parser |
| `renderKey.ts`, `ANSWER_KEY.md` | The key as a document. A test fails if the two differ: run `npx vite-node experiments/verdict-check/renderKey.ts` after a data change |

Commands (from the repository root):

```bash
npm run check && npm run test && npm run build        # 400 tests pass now
npx vite-node experiments/verdict-check/run.ts --report-only             # score the cache, no model calls
npx vite-node experiments/verdict-check/run.ts --variant <name>          # development split
npx vite-node experiments/verdict-check/run.ts --variant <name> --limit 4   # smoke test
```

- Model calls use the `claude` command-line tool, signed in to Rob's subscription. No API key.
- A full development run is 168 advice calls and 168 judge calls. It takes about 10 minutes with `--concurrency 8`.
- Results are cached by a hash of the prompt. A changed prompt makes new calls; an unchanged one costs nothing.
- The profile test sets one axis to -0.85 or +0.85 and the other two to 0.
- **The holdout was run once on 2026-11-21 (section 3g). Do not run it again to tune a prompt.**

## 7. Open risks

- **The key is provisional.** If a review (an independent agent panel, or the professor if he replies) changes it, the numbers change. A new score costs no model calls unless a case text or an option changes.
- **Run-to-run variation (measured 2026-11-21, `prod`, development split, 3 samples, `--samples 3`).** Same verdict in all 3 samples: voice 39 of 40, profile 28 of 28, pair 90 of 100. Voice and profile scores are stable; the Aristotle failures are the same in every sample, so they are real. Confucius is 9 of 11, not 10 (`promise-charity` changes). Pair scores move: flip rows 5 to 7 of 9; "differs from the baseline" 3 to 5. The baseline itself changes in 3 pairs. Report: `data/prod/variability-development.md`. Rule: for voice and profile, a fixed row counts if it holds in all samples; for pairs, compare variants on 3 samples, and a change of 1 or 2 rows is noise. The legacy variant has only one sample.
- **Recall.** Most "recorded" pairs follow a famous passage. If step 4 puts the passages behind the holdout pairs into the notes, those pairs measure copying. The passages are: Analects 4.19, 3.17 and 14.34; Nicomachean Ethics IX.3; On Liberty ch. 4 (drunk on duty); Kant's deposit example. Decided: they stay out of every prompt, and a test enforces it (section 4).
- **Kant has only one pair in which his answer must reverse** (`pardon-the-surgeon`), and the baseline usually reverses there too.
- **The judge.** It is reliable on the new prompts, because the first sentence gives the answer (12 of 12 checked by hand). On the old prompts it was weaker on hedged advice.
- **Not tested end to end.** The new prompts ran through the `claude` command-line tool, not through the Worker and the provider API. Wait time looked the same (11 to 19 seconds for each answer).
- **Debate replies** (`worker/src/debatePrompts.ts`) still use the short brief and the old style. They were not tested.
- **Tab bar.** With eight tabs, screens between about 640 and 1000 pixels will probably use the section menu. Not checked by eye.

## 8. Next steps

**Step 4: longer notes for each philosopher.** This is the main work.

1. Add a field to `PhilosophyProfile` in `shared/contracts.ts` (for example `lensNotes`). Keep `voiceBrief`: the debate prompt and the frontend use it.
2. Each note is 150 to 300 words: the test or priority that the thinker applies; what the thinker gives little weight; known positions with a source; common errors (for Aristotle: an act is not a vice; practical wisdom is an intellectual virtue; for Kant: "as a means" is not "merely as a means").
3. Start with Mill, Kant, Aristotle and Confucius. A first draft is in `experiments/philosopher-fidelity/runs/verdict-pilot/pilot.ts` (`LENS_CARDS`). It is not reviewed, and it was written with the test cases in mind.
4. Add the notes to `buildVoiceAdvisorPrompt` as a new variant in `variants.ts`, run the development split, and compare with `prod`. Keep the change only if the failing rows in section 3 improve and Mill and Kant do not get worse.
5. Then write the other 36 notes. Only 10 of the 40 philosophers have coordinates; all 40 can be chosen directly.
6. Use the method that worked here: one cheaper subagent checks each reference against the texts online, and one stronger subagent criticises the content. Both found real errors in every draft. The model writes confident references from memory that are wrong in detail.
7. Do not write a rule into a note only because a development case needs it. An error in a note goes into every answer for that thinker.

**Step 5: the coordinates path.** The new prompt already passes 13 of 14 with the existing axis descriptions. What remains:

- Send the user's actual calibration answers when they exist (`request.answers`), so the advice can refer to them. The slider path has no answers.
- Make Reason-Intuition shape how the advice is written. An earlier experiment showed that all advice reads as "reason".
- Measure before and after with the profile route of the harness.

**Step 6: final measurement and larger items.**

- Run the holdout once: `--variant prod --split holdout`. Report it with the limits in section 7.
- Axes: Individual-Collective mixes "the group's welfare" with "my own people first". The key marks which axis decides each case (`axes` in `answerKey.ts`, with a candidate axis `impartialPartial`). The count is in each report. The cases were written by us, so the count shows only that each axis can decide a case.
- Only if the differences are still weak: a side-by-side view of two or three philosophers, or a second checker call.

## 9. Waiting for Rob

- **The professor's document.** It is a Claude Doc: "iSocrateez: what would each philosopher conclude?", https://claude.ai/artifact/5PWP7JqpRywGWXHT6qDeyA. It asks the professor to check the 16 pairs. It is private until Rob shares it. We do not know if it was sent. Do not plan work that waits on it (Rob, 2026-11-21). When answers come back, change `pairs.ts` and `answerKey.ts`, run `renderKey.ts`, and score again with `--report-only`.
- **Feedback from Rob's own use** of the deployed prompts. Next candidate after that: the debate prompts (`worker/src/debatePrompts.ts`, about 1 hour).
- **`worker/src/providers.ts`** (Rob's uncommitted change: reasoning effort "medium" for GPT models) was kept out of the 2026-11-21 deploy.
- **The tab label** "Key fact".

## 10. How Rob works

See `~/.claude/CLAUDE.md`. In short: write in Simplified Technical English; he has limited developer training, so explain plainly; be direct and say when something is a mistake; label verified facts and assumptions; use the cheapest subagent model that is adequate; ask before a large install. After any test on a device, remind him to block node in the firewall again and to stop the dev servers.

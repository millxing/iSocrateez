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
| 4 | Replace the two-sentence philosopher briefs with longer notes | **Next. Not started** |
| 5 | Send the user's actual calibration answers to the model | Not started. Smaller than first planned (see section 8) |
| 6 | Run the held-back cases once, then decide the larger items (axes, side-by-side view, checker call) | Not started |

**Nothing is committed. Nothing is deployed.** The live app still has the old prompts and the reversed questions.

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

## 4. Decisions and reasons

- **Paired cases, not one "correct" answer.** The first key gave each philosopher one option for each dilemma. An outside reviewer showed that the texts do not settle most of those answers (24 of 78 judged "open", 4 changed). The reviewer proposed pairs: tell one case twice, change one fact, and check whose answer reverses. This needs agreement only on which fact matters to whom. Review: `experiments/verdict-check/reviews/second-reviewer-2026-11.md`. The reviewer is not identified to us.
- **A baseline with no philosopher runs on every pair.** A design critique showed that a sensible adviser also reverses on most pairs. A correct answer is evidence for a thinker only where it differs from the baseline.
- **"Open" entries are kept but not scored.** They sit in the `open` field of each dilemma in `answerKey.ts`.
- **The new prompts were adopted after one run.** They were written before the development results were seen, and were not tuned on them. The frozen old prompts are the `legacy` variant.
- **One model call is kept.** An earlier experiment (`experiments/profile-fidelity/`) showed that a separate planner call did not help.
- **New section and tab.** The advice has a fifth section, "What this answer turns on". The results page shows it as the tab "Key fact". Rob has not confirmed the label.
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
| `pairs.ts` | 16 paired cases (10 development, 6 holdout) |
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
- **Do not run `--split holdout` or `--split all` before step 6.**

## 7. Open risks

- **The key is provisional.** If the professor changes it, the numbers change. A new score costs no model calls unless a case text or an option changes.
- **Single samples.** Each case was answered once. A difference of one or two rows can be noise. The profile result (3 to 13 of 14) is too large to be noise.
- **Recall.** Most "recorded" pairs follow a famous passage. If step 4 puts the passages behind the holdout pairs into the notes, those pairs measure copying. The passages are: Analects 4.19, 3.17 and 14.34; Nicomachean Ethics IX.3; On Liberty ch. 4 (drunk on duty); Kant's deposit example. Either keep them out of the notes, or write new holdout pairs before step 6.
- **Kant has no pair in which his answer must reverse.** A Kant that always gives the strict answer passes.
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

- **The professor's document.** It is a Claude Doc: "iSocrateez: what would each philosopher conclude?", https://claude.ai/artifact/5PWP7JqpRywGWXHT6qDeyA. It asks the professor to check the 16 pairs. It is private until Rob shares it. We do not know if it was sent. When answers come back, change `pairs.ts` and `answerKey.ts`, run `renderKey.ts`, and score again with `--report-only`.
- **Commit and deploy.** Rob decides when. The question fix (step 1) is independent and safe to ship alone.
- **The tab label** "Key fact".

## 10. How Rob works

See `~/.claude/CLAUDE.md`. In short: write in Simplified Technical English; he has limited developer training, so explain plainly; be direct and say when something is a mistake; label verified facts and assumptions; use the cheapest subagent model that is adequate; ask before a large install. After any test on a device, remind him to block node in the firewall again and to stop the dev servers.

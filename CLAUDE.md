# CLAUDE.md

## Purpose

This file is for Claude or other coding agents working in this repository.

Treat this as a small full-stack app with one shared ethical-domain layer. Most bugs in this repo come from changing one layer and forgetting the others.

## Mental Model

The app has three main responsibilities:

1. Collect user input
2. Produce or accept a normalized ethical profile tuple
3. Generate advice through the Worker using that profile

If you touch any of those, check the full path from UI -> shared contracts -> Worker validation -> tests.

## Repo Map

- `src/`: frontend application
- `shared/`: cross-runtime types and ethical scoring logic
- `worker/`: Cloudflare Worker API

Important files:

- `src/App.tsx` — wizard flow controller (phases: locked → dilemma → path → calibration | philosopher → explanation → results)
- `src/components/PasswordGate.tsx` — shared password entry
- `src/components/DilemmaPage.tsx` — dilemma text entry
- `src/components/ExplanationPage.tsx` — 3-choice explanation style
- `src/components/SettingsPage.tsx` — appearance and the one advice model (default: Claude Sonnet 5.5)
- `src/components/PathPage.tsx` — calibration questions vs manual tuple
- `src/components/CalibrationPage.tsx` — question flow (9 questions, extendable to 30) with a summary page, or 3-axis sliders
- `src/calibrationFile.ts` — save/load format for a calibration file
- `src/components/ResultsView.tsx` — tabbed results (advice, why, watch, next, coordinates, export)
- `src/styles.css` — all styling (light/dark themes, responsive layout)
- `shared/contracts.ts`
- `shared/ethics.ts`
- `worker/src/index.ts`
- `worker/src/llm.ts`
- `worker/src/safety.ts`

## Current Behavior

The frontend is a wizard-style multi-page flow with a sticky hero bar:

1. Password gate
2. Enter a dilemma (dynamic-height textarea)
3. Choose path: 9-question calibration, manual 3-axis tuple, choose a philosopher, or load a saved calibration file
4. Answer calibration questions or set sliders. The questionnaire ends on a summary page, where the user can answer 3 more questions (one for each axis, up to all 30), save the calibration to a JSON file, or continue. A loaded file restores the answers and opens the summary; if its answers no longer match the question bank, its coordinates open in the sliders. Or pick one philosopher/tradition from a grid (`PhilosopherPage`). The philosopher path ignores the axes: the request carries `philosopherId`, the Worker answers from that figure's `voiceBrief`, and the response has `selectedPhilosopherId` with no `profile`
5. Choose explanation style (3 cards)
6. The explanation step requests the advice. The model is set in Settings (default: Sonnet 5.5) and is used for advice and debate replies
7. Results page with tabbed navigation:
   - Your Advice, Why This Advice, What to Watch For, Next Step, Original Dilemma, Ethical Coordinates, Export Advice
   - On narrow screens, tabs collapse to a hamburger dropdown menu
   - Export saves a single markdown file (dilemma + all advice sections + ethical coordinates)
   - "Start a new dilemma" button is pinned at the bottom of the viewport

The Worker returns:
  - advice markdown
  - the resolved profile tuple
  - nearest philosophy matches
  - safety mode
  - model used

## Constraints

- Do not expose LLM API keys in the frontend
- Keep the app stateless unless explicitly changing product scope
- Keep tuple semantics consistent everywhere
- Keep safety intent-aware, not raw keyword-only
- Prefer shared logic over reimplementing scoring/matching separately in frontend and worker

## Frontend Notes

- Typography: Newsreader serif (Google Fonts) for headings and reading text, system sans for UI. Warm paper/sage palette with light and dark themes; tokens live at the top of `src/styles.css`
- Shell: left sidebar with progress steps; it becomes a top step bar at ≤1000px. The sign-in page has no sidebar (large wordmark, drifting philosopher names)
- Desktop/tablet wizard pages sit just above the vertical middle with their buttons directly underneath; phones keep the buttons pinned at the bottom
- Each wizard page is a separate component in `src/components/`, using `PageHeader` for the step eyebrow/title/subtitle
- Philosopher page: uniform cards, a summary column beside the list on wide screens; search uses `src/philosopherSearch.ts` (name, school, region, traditions plus hidden keywords)
- Results: tabs on wide screens, a section menu below 640px; the advice card fills the height and scrolls inside
- Export uses the File System Access API (`showSaveFilePicker`) with blob download fallback

## Worker Notes

- `POST /api/session`: validates the shared password and issues a token
- `POST /api/advice`: accepts either:
  - 9 to 30 answers (known, unique question IDs; at least 3 for each axis; see `isValidAnswerSet` in `shared/ethics.ts`), or
  - `profileOverride`
- `GET /api/health`: simple status route

The Worker should validate input strictly before calling model providers.

## When Making Changes

If you change input shape:

- update `shared/contracts.ts`
- update frontend request creation
- update Worker validation
- update tests

If you change ethical scoring:

- update `shared/ethics.ts`
- verify nearest-profile ranking still makes sense
- update any UI copy explaining tuple ranges or axis meaning

If you change model orchestration:

- advice is one model call (`buildAdvisorPrompt` / `buildVoiceAdvisorPrompt`). A separate planner call was removed on 2026-11-12: a 25-case test (`experiments/profile-fidelity/`) showed it gave no better fit to the profile, and about half of its JSON plans failed validation
- give the model the plain-language axis descriptions, not only the tuple numbers
- test a prompt change with the experiment harness before you keep it

If you change safety:

- be careful about false positives on policy, clinical, or governance discussions
- keep direct harmful-instructions requests blocked
- add tests for both allowed and refused cases

## Commands

```bash
npm run test
npm run check
npm run build
npm run dev
npm run worker:dev
```

## Documents Worth Reading First

- `README.md`
- `PLAN.md`
- `AGENTS.md`

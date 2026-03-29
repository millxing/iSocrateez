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

- `src/App.tsx` — wizard flow controller (phases: locked → dilemma → explanation → voice → models → path → calibration → results)
- `src/components/PasswordGate.tsx` — shared password entry
- `src/components/DilemmaPage.tsx` — dilemma text entry
- `src/components/ExplanationPage.tsx` — 3-choice explanation style
- `src/components/VoicePage.tsx` — 2-choice advice voice
- `src/components/ModelPage.tsx` — model selection (defaults to GPT-5.4 Mini)
- `src/components/PathPage.tsx` — calibration questions vs manual tuple
- `src/components/CalibrationPage.tsx` — 9-question flow or 3-axis sliders
- `src/components/ResultsView.tsx` — tabbed results (advice, why, watch, next, coordinates, export)
- `src/styles.css` — all styling (dark theme, responsive hamburger menu on narrow screens)
- `shared/contracts.ts`
- `shared/ethics.ts`
- `worker/src/index.ts`
- `worker/src/llm.ts`
- `worker/src/safety.ts`

## Current Behavior

The frontend is a wizard-style multi-page flow with a sticky hero bar:

1. Password gate
2. Enter a dilemma (dynamic-height textarea)
3. Choose explanation style (3 cards)
4. Choose advice voice (2 cards)
5. Confirm or change models (default: GPT-5.4 Mini)
6. Choose path: 9-question calibration or manual 3-axis tuple
7. Answer calibration questions or set sliders
8. Results page with tabbed navigation:
   - Your Advice, Why This Advice, What to Watch For, Next Step, Ethical Coordinates, Export Advice
   - On narrow screens, tabs collapse to a hamburger dropdown menu
   - Export saves a single markdown file (dilemma + all advice sections + ethical coordinates)
   - "Start a new dilemma" button is pinned at the bottom of the viewport

The Worker returns:
  - advice markdown
  - the resolved profile tuple
  - nearest philosophy matches
  - safety mode
  - models used

## Constraints

- Do not expose LLM API keys in the frontend
- Keep the app stateless unless explicitly changing product scope
- Keep tuple semantics consistent everywhere
- Keep safety intent-aware, not raw keyword-only
- Prefer shared logic over reimplementing scoring/matching separately in frontend and worker

## Frontend Notes

- Typography is Funnel Sans, dark editorial theme (`--bg: #111110`, `--accent: #c9a84c`)
- Layout is 75vw max-width, wizard pages use `flex: 1` chains to fill the viewport
- Each wizard page is a separate component in `src/components/`
- Results page uses a light cream card (`#f0ede6`) with scrollable body and fixed footer
- Tab bar switches to hamburger dropdown on screens narrower than ~1100px
- Calibration question layout: two visual groups (question + scale buttons) vertically centered with spacing
- Export uses the File System Access API (`showSaveFilePicker`) with blob download fallback

## Worker Notes

- `POST /api/session`: validates the shared password and issues a token
- `POST /api/advice`: accepts either:
  - 9 answers, or
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

- keep the two-stage planner/advisor shape unless intentionally redesigning it
- preserve fallback behavior
- do not let planner parse failures crash the whole route

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

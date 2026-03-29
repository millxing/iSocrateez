# AGENTS.md

## Project Overview

iSocrateez is a private ethical-advice app with:

- a React + TypeScript + Vite frontend in `src/`
- shared domain logic in `shared/`
- a Cloudflare Worker backend in `worker/`

The product asks the user for a dilemma, either:

- walks them through a 9-question assessment, or
- lets them enter a normalized 3-axis tuple directly

Then it generates advice based on the resulting ethical profile.

## Architecture

### Frontend

The UI is a wizard-style multi-page flow with a sticky hero bar and page-by-page progression.

- `src/App.tsx`: wizard flow controller managing phases (locked → dilemma → explanation → voice → models → path → calibration → results)
- `src/components/PasswordGate.tsx`: shared password entry
- `src/components/DilemmaPage.tsx`: dilemma text entry (dynamic-height textarea)
- `src/components/ExplanationPage.tsx`: 3-choice explanation style cards
- `src/components/VoicePage.tsx`: 2-choice advice voice cards
- `src/components/ModelPage.tsx`: model selection (defaults to GPT-5.4 Mini)
- `src/components/PathPage.tsx`: choose calibration questions or manual tuple
- `src/components/CalibrationPage.tsx`: 9-question flow or 3-axis sliders
- `src/components/ResultsView.tsx`: tabbed results with 6 tabs (advice, why, watch, next, coordinates, export); hamburger menu on narrow screens; export saves markdown via File System Access API
- `src/api/client.ts`: frontend API client
- `src/styles.css`: all styling — dark theme, 75vw layout, responsive breakpoints

Note: `src/components/DilemmaForm.tsx` and `src/components/AssessmentFlow.tsx` are legacy files no longer imported.

### Shared logic

- `shared/contracts.ts`: request/response and domain types
- `shared/questionBank.ts`: static question bank
- `shared/philosophyProfiles.ts`: curated philosophy coordinates
- `shared/ethics.ts`: question selection, scoring, tuple formatting, nearest-match ranking

### Worker

- `worker/src/index.ts`: HTTP routes and request validation
- `worker/src/llm.ts`: advice pipeline orchestration
- `worker/src/prompts.ts`: planner/advisor prompt construction
- `worker/src/safety.ts`: local safety gate
- `worker/src/auth.ts`: signed session tokens

## Key Product Rules

- Tuple order is:
  - `outcomesPrinciples`
  - `individualCollective`
  - `reasonIntuition`
- Tuple values are normalized to `[-1, 1]`
- Negative means the left pole of the axis
- Positive means the right pole of the axis
- Frontend must never receive provider API keys
- The Worker is the only place that should call model providers
- The app is stateless in v1: no accounts, no stored dilemma history
- `personaMode` changes how advice is framed, and may snap to the nearest philosophy profile
- `explanationLevel` changes presentation complexity, not the scoring math

## Local Development

Install and run:

```bash
npm install
cp .env.example .env
cp worker/.dev.vars.example worker/.dev.vars
```

Start the app:

```bash
npm run worker:dev
npm run dev
```

Useful checks:

```bash
npm run test
npm run check
npm run build
```

## Environment

Frontend:

- `.env`
- `VITE_API_BASE_URL`
- `VITE_BASE_PATH`

Worker:

- `worker/.dev.vars`
- `APP_SHARED_PASSWORD`
- `JWT_SECRET`
- `PLANNER_PROVIDER`
- `PLANNER_MODEL`
- `PLANNER_API_KEY`
- `ADVISOR_PROVIDER`
- `ADVISOR_MODEL`
- `ADVISOR_API_KEY`

## Editing Guidance

- Keep contracts in `shared/contracts.ts` in sync with both frontend and worker changes
- If you change scoring or tuple semantics, update:
  - `shared/ethics.ts`
  - worker validation/orchestration
  - UI copy where ranges or axes are described
  - relevant tests
- If you change safety behavior, update both:
  - `worker/src/safety.ts`
  - `worker/src/safety.test.ts`
- If you add new frontend states or branches, prefer keeping them centralized in `src/App.tsx`
- Avoid moving LLM prompt logic into React components
- Avoid duplicating axis labels or philosophy metadata outside shared modules unless necessary

## Testing Expectations

Before shipping meaningful changes, run:

```bash
npm run test
npm run check
npm run build
```

Relevant tests:

- `shared/ethics.test.ts`
- `src/App.test.tsx`
- `worker/src/safety.test.ts`
- `worker/src/llm.test.ts`
- `worker/src/index.test.ts`

## Reference Docs

- `README.md`: setup and deployment summary
- `PLAN.md`: original implementation plan and product assumptions

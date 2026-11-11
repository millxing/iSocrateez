# Development notes

These notes are for people who work on the code. To use the app, go to
<https://millxing.github.io/iSocrateez/>.

Agents and new contributors: read `CLAUDE.md`, `AGENTS.md`, and `PLAN.md` first.

## Run locally

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Development uses the deployed backend through Vite's `/api` proxy, configured in `.env.development`. Use the existing shared passphrase. No local provider keys or Worker process are needed.

## Verify

```sh
npm run test
npm run check
npm run build
```

Tests cover all three perspective paths, Settings and draft preservation, regeneration with changed selections, advice retries, and backend validation. The archived app is excluded from active tests and the TypeScript build.

## Deployment

Pushing `main` runs `.github/workflows/deploy-pages.yml`, validates the app, and deploys the root frontend to GitHub Pages at `https://millxing.github.io/iSocrateez/`. The workflow uses the repository variable `VITE_API_BASE_URL` and builds with `VITE_BASE_PATH=/iSocrateez/`.

The backend is `https://isocrateez-worker.millxing-isocrateez.workers.dev`. The frontend deployment does not deploy or replace the Worker. Worker source and its deployment configuration are in `worker/`; local credentials are ignored by Git.

Deploy an updated Worker before the frontend when the frontend needs a new endpoint.

## Structure

- `src/`: React frontend
- `shared/`: contracts, model choices, philosophy profiles, and scoring
- `worker/`: Cloudflare Worker source
- `public/`: static files served with the app (brand art, `promo.mp4`)
- `archive/v1/`: the previous app source, from commit `617b018`. Not built, not tested.

## Interface behaviour

- Scrollable content with pinned bottom actions.
- Sidebar Settings for appearance and planner/advisor models.
- Completed sidebar steps reopen the dilemma, perspective, or style for regeneration, preserving selections.
- Philosopher-name animation during generation, respecting reduced motion.
- No stored dilemma history. Appearance and model preferences are local to the browser; session tokens use session storage.

## Debate

After advice, **Explore through debate** opens the debate. The user chooses two philosophers for three rounds (six replies), or one philosopher and writes their own position (up to six exchanges).

Each turn uses the advisor model selected when the debate starts. No planner call is needed. **Next reply** advances a philosopher debate. A failed or cancelled reply can be retried without duplicating the user's message. Cancellation stops the client from accepting the reply; a provider call already in progress can still incur usage. **Back to advice** preserves the transcript. A new dilemma or a change to the advice inputs clears the debate. Reloading the tab also clears it. No transcript is stored on the server or in browser storage.

The Worker exposes authenticated `POST /api/debate/turn`, with types in `shared/contracts.ts` and limits in `shared/debate.ts`. It validates participants, turn order, models, and message sizes, then checks the dilemma and user messages with the existing safety gate. Safety responses stop the debate and appear outside the philosopher transcript. **Export debate** saves the dilemma, participants, model, explanation style, and messages as Markdown. A partial debate can be exported. Unsent drafts are not included.

Debate prompts and orchestration are in `worker/src/debatePrompts.ts` and `worker/src/debate.ts`. Provider transport is shared with advice through `worker/src/providers.ts`. The advice endpoint and its request/response format are unchanged by the debate feature.

## Promo film

`public/promo.mp4` is the film linked from the README (1920 x 1080, 65.5 s, silent). `docs/promo-poster.jpg` is its poster image.

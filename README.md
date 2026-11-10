# iSocrateez

A private ethical-advice app. The redesigned v2 is now the main application. The previous tracked source is preserved in [`archive/v1`](archive/v1), from commit `617b018`.

## Run locally

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Development uses the original deployed backend through Vite's `/api` proxy, configured in `.env.development`. Use the existing shared passphrase. No local provider keys or Worker process are needed.

## Interface

- Scrollable content with pinned bottom actions.
- Sidebar Settings for appearance and planner/advisor models.
- Completed sidebar steps reopen the dilemma, perspective, or style for regeneration, preserving selections.
- Philosopher-name animation during generation, respecting reduced motion.
- No stored dilemma history. Appearance and model preferences are local to the browser; session tokens use session storage.

## Verify

```sh
npm run test
npm run check
npm run build
```

Tests cover all three perspective paths, Settings and draft preservation, regeneration with changed selections, advice retries, and backend validation. The archived app is excluded from active tests and the TypeScript build.

## Deployment

Pushing `main` runs `.github/workflows/deploy-pages.yml`, validates the app, and deploys the root frontend to GitHub Pages at `https://millxing.github.io/iSocrateez/`. The workflow uses the existing repository variable `VITE_API_BASE_URL` and builds with `VITE_BASE_PATH=/iSocrateez/`.

The existing backend remains `https://isocrateez-worker.millxing-isocrateez.workers.dev`. This frontend deployment does not deploy or replace the Worker. Worker source and its existing deployment configuration remain in `worker/`; local credentials are ignored by Git.

## Structure

- `src/`: React frontend
- `shared/`: contracts, model choices, philosophy profiles, and scoring
- `worker/`: Cloudflare Worker source
- `archive/v1/`: preserved previous app source

## Debate

After advice, select **Explore through debate**. Choose two philosophers for three
rounds (six replies), or choose one philosopher and write your own position (up to
six exchanges). The voices can agree on a conclusion while testing assumptions,
evidence, and missing consequences. They are AI interpretations, not quotations.

Each turn uses the advisor model selected when the debate starts. No planner call
is needed. Use **Next reply** to advance a philosopher debate. A failed or cancelled
reply can be retried without duplicating the user's message. Cancellation stops the
client from accepting the reply; a provider call already in progress can still incur
usage. **Back to advice** preserves the transcript. A new dilemma or a change to the
advice inputs clears the debate. Reloading the tab also clears it. No transcript is
stored on the server or in browser storage.

The Worker exposes authenticated `POST /api/debate/turn`, with types in
`shared/contracts.ts` and limits in `shared/debate.ts`. It validates participants,
turn order, models, and message sizes, then checks the dilemma and user messages
with the existing safety gate. Safety responses stop the debate and appear outside
the philosopher transcript. Use **Export debate** to save the dilemma, participants,
model, explanation style, and messages as Markdown. You can export a partial debate.
Unsent drafts are not included. Debate prompts and orchestration are in
`worker/src/debatePrompts.ts` and `worker/src/debate.ts`. Provider transport is shared
with advice through `worker/src/providers.ts`.

Deploy the updated Worker before the frontend so the debate endpoint is available.
The existing advice endpoint and its request/response format are unchanged.

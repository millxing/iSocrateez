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

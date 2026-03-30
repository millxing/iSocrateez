# iSocrateez

A private ethical-advice web app with a React frontend and a Cloudflare Worker backend.

## What is here

- `src/`: Vite React app
- `shared/`: question bank, philosophy library, contracts, and scoring logic
- `worker/`: Cloudflare Worker API that protects LLM keys

## Local setup

1. Install dependencies with `npm install`
2. Copy `worker/.dev.vars.example` to `worker/.dev.vars` and fill in your secrets
3. In `worker/.dev.vars`, use provider-scoped secrets:
   `OPENAI_API_KEY` for any selected `openai:*` model and `ANTHROPIC_API_KEY` for any selected `anthropic:*` model
4. Do not create separate `PLANNER_API_KEY` or `ADVISOR_API_KEY` variables; the worker does not read them
5. Copy `.env.example` to `.env` if you want a custom API base URL
6. Run the frontend with `npm run dev`
7. Run the worker with `npm run worker:dev`

## Deployment shape

- Deploy the built frontend to GitHub Pages
- Deploy the worker separately to Cloudflare Workers
- Point `VITE_API_BASE_URL` at the worker URL during the frontend build

## Deploy to GitHub Pages + Cloudflare Workers

### 1. Prepare the local repo

Initialize git locally and create the default branch:

```bash
git init -b main
git add .
git commit -m "Initial project setup"
```

### 2. Create the GitHub repository

Create a new **public** GitHub repository named `iSocrateez`.

Then connect the local repo and push:

```bash
git remote add origin git@github.com:<your-github-username>/iSocrateez.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/<your-github-username>/iSocrateez.git
git push -u origin main
```

### 3. Deploy the Cloudflare Worker

Authenticate Wrangler:

```bash
npx wrangler login
```

Set the required secrets:

```bash
npx wrangler secret put APP_SHARED_PASSWORD
npx wrangler secret put JWT_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

Use provider-scoped secrets, not separate planner/advisor keys:

- `OPENAI_API_KEY` is used whenever the selected model provider is `openai`
- `ANTHROPIC_API_KEY` is used whenever the selected model provider is `anthropic`
- the planner and advisor can use the same provider or different providers
- you only need to set the provider secrets you actually plan to use

Deploy the worker:

```bash
npx wrangler deploy --config worker/wrangler.toml
```

Verify it:

```bash
curl https://<worker-name>.<subdomain>.workers.dev/api/health
```

You should get a JSON response with `{"ok":true}`.

### 4. Configure GitHub Pages deployment

This repo includes `.github/workflows/deploy-pages.yml`, which:

- installs dependencies with `npm ci`
- runs `npm run test`
- runs `npm run check`
- builds with `VITE_BASE_PATH=/iSocrateez/`
- deploys `dist/` to GitHub Pages

Before the workflow can succeed, set the repository Actions variable:

- name: `VITE_API_BASE_URL`
- value: your deployed Worker base URL, for example:
  - `https://isocrateez-worker.<subdomain>.workers.dev`

In GitHub:

1. Open `Settings`
2. Open `Secrets and variables` -> `Actions`
3. Add a repository **variable** named `VITE_API_BASE_URL`

Then enable Pages:

1. Open `Settings`
2. Open `Pages`
3. Under `Build and deployment`, choose `GitHub Actions`

Push to `main` again, or run the workflow manually from the `Actions` tab.

### 5. Final URLs

Frontend project site:

- `https://<your-github-username>.github.io/iSocrateez/`

Worker endpoints:

- `https://<worker-name>.<subdomain>.workers.dev/api/health`
- `https://<worker-name>.<subdomain>.workers.dev/api/session`
- `https://<worker-name>.<subdomain>.workers.dev/api/advice`

### 6. Local preflight before shipping

Run these locally before pushing deployment changes:

```bash
npm run test
npm run check
npm run build
```

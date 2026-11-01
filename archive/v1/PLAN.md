# Ethical Advice Web App Plan

## Summary
- Build a mobile-first React + TypeScript + Vite single-page app hosted on GitHub Pages.
- Protect LLM API keys with a separate Cloudflare Worker that handles auth, model orchestration, and safety checks.
- Keep the product stateless in v1: no accounts, no saved dilemmas, no persistent history.
- Default result is personalized advice from the user’s measured 3-axis profile; philosopher-snapped advice is an optional alternate mode.

## Key Changes
- Product flow:
  - Shared-password gate before any app use.
  - Dilemma entry screen.
  - 9-question assessment: randomly select 3 unique questions from each axis bank of 10.
  - Results screen with advice first and an optional profile explorer.
- Scoring model:
  - Use a 5-point Likert answer scale anchored to each axis pole.
  - Map answers to `-2, -1, 0, 1, 2`.
  - Compute each axis score as the mean of its 3 answers, normalized to `[-1, 1]`.
  - Produce the final profile tuple in this order: `(Outcomes↔Principles, Individual↔Collective, Reason↔Intuition)`.
- Profile exploration:
  - Show three labeled horizontal continua instead of a literal 3D graphic.
  - Display the user’s tuple, primary nearest match, and two alternate nearby matches.
  - Include short “why this fits” explanations and representative philosophers/philosophies.
- Curated philosophy library:
  - Ship a fixed reviewed set in version-controlled JSON.
  - Use these initial representatives: Utilitarianism/Mill, Kantian deontology/Kant, Contractualism/Scanlon, Care ethics/Gilligan, Aristotelian virtue ethics/Aristotle, Stoicism/Epictetus, Confucian role ethics/Confucius, Pragmatism/James-Dewey, Existentialism/Sartre-de Beauvoir, Moral particularism/Dancy.
  - Match users to profiles by Euclidean distance on the normalized 3-tuple.
- Explanation/presentation controls:
  - Support `general`, `informed`, and `phd` explanation levels.
  - This changes vocabulary, density, and references, but not the underlying score computation.
  - Support a separate persona mode that snaps the user to the nearest curated profile and lets that philosophy/persona present the advice.
- Secure backend shape:
  - `POST /api/session` validates the shared password and returns a short-lived signed token.
  - `POST /api/advice` accepts `{ token, dilemma, answers, explanationLevel, personaMode }` and returns `{ adviceMarkdown, profile, nearestProfiles, safetyMode, modelsUsed }`.
  - `GET /api/health` returns a simple status payload.
  - Store the returned token in `sessionStorage`; require it on all advice requests.
- LLM pipeline:
  - Planner stage uses the configured planner model to output strict JSON only: dilemma summary, key tensions, profile interpretation, framing notes, and advisor brief.
  - Advisor stage uses the configured advisor model to turn that structured context into the final advice.
  - If either stage fails, fall back to a single-stage advisor prompt and record that in `modelsUsed`.
  - Keep model choice hidden from end users; configure providers/models only through worker env vars.
- Safety posture:
  - Apply soft guardrails for self-harm, violent wrongdoing, and clearly dangerous illegal guidance.
  - In those cases, do not provide optimization advice; return brief refusal/supportive guidance and crisis redirection when appropriate.
  - Do not log raw dilemmas or raw answers in production logs.

## Public Interfaces
- Static frontend data:
  - `questionBank`: 30 records with `id`, `axis`, `prompt`, `leftLabel`, `rightLabel`, `polarity`.
  - `philosophyProfiles`: fixed records with `id`, `name`, `representative`, `coordinates`, `summary`, `exampleConcerns`.
- Worker env vars:
  - `APP_SHARED_PASSWORD`
  - `JWT_SECRET`
  - `PLANNER_PROVIDER`, `PLANNER_MODEL`
  - `ADVISOR_PROVIDER`, `ADVISOR_MODEL`
  - Provider-specific API keys
- Frontend app states:
  - `locked`, `dilemma`, `assessment`, `results`
  - No server-stored user session state in v1

## Test Plan
- Unit tests for unique 3-per-axis question selection and normalized scoring.
- Unit tests for reverse polarity handling and tuple bounds.
- Unit tests for nearest-profile matching with stable primary and alternate matches.
- Unit tests for planner JSON schema validation, fallback behavior, and safety branching.
- Integration tests for password gate, invalid/expired token rejection, and successful end-to-end advice flow.
- UI tests confirming explanation level changes presentation style without changing the tuple.
- UI tests confirming persona mode can change the advice output by snapping to the nearest curated profile.
- Acceptance test: a friend can open the GitHub Pages site, enter the shared password, complete the flow, get advice, and optionally inspect their profile without any saved history.

## Assumptions
- GitHub Pages is used only for static hosting; private API keys never ship to the browser.
- Shared-password gating is meant to keep the app private among friends, not provide strong identity security.
- v1 is English-only and includes no admin UI, exports, user accounts, or saved session history.
- The question bank and philosophy library are manually reviewed and fixed for consistency in v1.

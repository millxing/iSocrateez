# iSocrateez: Ideas for Future Features

A brainstorm of possible additions, grouped by what they would do for the app. Nothing here is committed or scheduled.

## Make the advice more useful

- **Multiple voices on one dilemma.** Pick two or three philosophers and get a side-by-side comparison (e.g., Kant vs. Mill vs. Confucius). The most natural next step now that there are 40 voices. It turns the app from "get an answer" into "explore a dilemma."
- **A debate or panel mode.** Two thinkers respond to each other on the same dilemma. More fun than a comparison, but harder to keep from feeling gimmicky.
- **Follow-up questions.** For example, "What if the pharmacist knew the child would die?" or "Push back on that." A full conversation thread conflicts with the stateless design; a single "ask one follow-up" step might fit without breaking it.
- **Surprise me.** A random philosopher paired with a random sample dilemma, to make exploring easier.

## Make self-calibration worth doing

- **A shareable result card.** A picture of your three-axis position and nearest philosopher. People like sharing this kind of result, and it can be generated on the spot, so the app stays stateless.
- **Your profile over time.** Save and compare results across dilemmas. Requires storing something per user, even if only on the device, so it changes the "stateless" constraint.
- **"Which answer surprised the model?"** After the nine questions, show the one most at odds with your overall pattern, to make calibration feel smarter.

## Content and trust

- **More dilemmas.** Group the samples into categories (medical, tech, personal, work). Add a "generate a new dilemma like this" button.
- **Source anchoring.** For voices like Kant or Aristotle, include one real, accurate concept or short passage, to reduce invented quotations.
- **A review pass on the voice briefs.** Having someone with a philosophy background check the briefs for all 40 voices would improve quality more than any feature.

## Housekeeping

- **Search or filter on the philosopher grid.** At 40 entries it is worth having, especially on a phone.
- **Accessibility pass.** Keyboard use, screen-reader labels, and color contrast on the dark theme.
- **Usage guardrails.** A per-session rate limit on the Worker, since every request costs money and anyone with the shared password can call it.
- **Cost and latency.** Advice takes about 30 seconds. Options: stream the response so text appears as it is written, or skip the planner stage for short dilemmas.

## Suggested order

1. Philosopher search or filter (small, directly improves what was just shipped).
2. Compare two or three voices on one dilemma (the biggest gain in value).
3. Streaming the advice (the biggest gain in how the app feels).
4. A shareable result card.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("submits the selected explanation and voice settings through the questionnaire path", async () => {
    const originalFetch = globalThis.fetch;
    const adviceBodies: unknown[] = [];

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      const body = init?.body ? JSON.parse(String(init.body)) : {};

      if (url.endsWith("/api/session")) {
        return new Response(
          JSON.stringify({
            token: "session-token",
            expiresAt: "2030-01-01T00:00:00.000Z"
          })
        );
      }

      if (url.endsWith("/api/advice")) {
        adviceBodies.push(body);
        const advice =
          body.personaMode === "philosopher"
            ? "## Core advice\n\nAs Kant, I would tell you to disclose the truth."
            : body.explanationLevel === "phd"
              ? "## Core advice\n\nAt a more technical level, disclose the truth while preserving proportionality."
              : "## Core advice\n\nTell the truth with care.";

        return new Response(
          JSON.stringify({
            adviceMarkdown: advice,
            profile: {
              outcomesPrinciples: -0.33,
              individualCollective: 0.17,
              reasonIntuition: -0.67
            },
            nearestProfiles: [
              {
                id: "kant",
                name: "Kantian Deontology",
                representative: "Immanuel Kant",
                coordinates: {
                  outcomesPrinciples: 0.95,
                  individualCollective: -0.3,
                  reasonIntuition: -0.95
                },
                summary: "Duty-focused",
                exampleConcerns: ["duty"],
                distance: 0.8,
                whyItFits: "Reason-first and principle-leaning."
              },
              {
                id: "scanlon",
                name: "Contractualism",
                representative: "T. M. Scanlon",
                coordinates: {
                  outcomesPrinciples: 0.55,
                  individualCollective: -0.1,
                  reasonIntuition: -0.8
                },
                summary: "Justifiability-focused",
                exampleConcerns: ["justifiability"],
                distance: 0.9,
                whyItFits: "Close on public reason."
              },
              {
                id: "stoic",
                name: "Stoicism",
                representative: "Epictetus",
                coordinates: {
                  outcomesPrinciples: 0.7,
                  individualCollective: -0.1,
                  reasonIntuition: -0.7
                },
                summary: "Integrity-focused",
                exampleConcerns: ["integrity"],
                distance: 1.0,
                whyItFits: "Close on discipline."
              }
            ],
            safetyMode: "standard",
            modelsUsed: ["openai:planner", "openai:advisor"]
          })
        );
      }

      return new Response("Not found", { status: 404 });
    }) as typeof fetch;

    try {
      render(<App />);

      fireEvent.change(screen.getByPlaceholderText(/shared passphrase/i), {
        target: { value: "secret" }
      });
      fireEvent.click(screen.getByRole("button", { name: /^enter$/i }));

      await screen.findByRole("heading", { name: /name the dilemma/i });

      fireEvent.change(screen.getByPlaceholderText(/example:/i), {
        target: { value: "I need to decide whether to disclose a painful truth that affects my team." }
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /explanation style/i });
      fireEvent.click(screen.getByRole("button", { name: /phd-level philosophical training/i }));

      await screen.findByRole("heading", { name: /advice voice/i });
      fireEvent.click(screen.getByRole("button", { name: /philosopher persona/i }));

      await screen.findByRole("heading", { name: /^models$/i });
      fireEvent.click(screen.getByRole("button", { name: /yes, use defaults/i }));

      await screen.findByRole("heading", { name: /calibration/i });
      fireEvent.click(screen.getByRole("button", { name: /9-question calibration/i }));

      for (let step = 0; step < 8; step += 1) {
        fireEvent.click(screen.getByRole("button", { name: /^neutral$/i }));
        fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
      }

      fireEvent.click(screen.getByRole("button", { name: /^neutral$/i }));
      fireEvent.click(screen.getByRole("button", { name: /see advice/i }));

      await screen.findByText(/as kant, i would tell you to disclose the truth/i);
      fireEvent.click(screen.getByRole("button", { name: /ethical coordinates/i }));
      expect(screen.getByText(/kantian deontology/i)).toBeInTheDocument();
      expect(screen.getByText(/moderately toward outcomes/i)).toBeInTheDocument();
      expect(adviceBodies).toHaveLength(1);
      expect(adviceBodies[0]).toMatchObject({
        explanationLevel: "phd",
        personaMode: "philosopher",
        plannerModel: "openai:gpt-5.4-mini",
        advisorModel: "openai:gpt-5.4-mini"
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("lets the user skip the questions by entering a manual tuple", async () => {
    const originalFetch = globalThis.fetch;
    const adviceBodies: unknown[] = [];

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      const body = init?.body ? JSON.parse(String(init.body)) : {};

      if (url.endsWith("/api/session")) {
        return new Response(
          JSON.stringify({
            token: "session-token",
            expiresAt: "2030-01-01T00:00:00.000Z"
          })
        );
      }

      if (url.endsWith("/api/advice")) {
        adviceBodies.push(body);

        return new Response(
          JSON.stringify({
            adviceMarkdown: "## Core advice\n\nUse the manual tuple directly.",
            profile: {
              outcomesPrinciples: -0.5,
              individualCollective: 0.25,
              reasonIntuition: 0.75
            },
            nearestProfiles: [
              {
                id: "particularism",
                name: "Moral Particularism",
                representative: "Jonathan Dancy",
                coordinates: {
                  outcomesPrinciples: 0.1,
                  individualCollective: -0.05,
                  reasonIntuition: 0.85
                },
                summary: "Context-sensitive ethics.",
                exampleConcerns: ["nuance"],
                distance: 0.6,
                whyItFits: "Close on context and intuition."
              },
              {
                id: "care",
                name: "Care Ethics",
                representative: "Carol Gilligan",
                coordinates: {
                  outcomesPrinciples: 0.1,
                  individualCollective: 0.75,
                  reasonIntuition: 0.55
                },
                summary: "Relational ethics.",
                exampleConcerns: ["care"],
                distance: 0.7,
                whyItFits: "Nearby on intuition."
              },
              {
                id: "virtue",
                name: "Virtue Ethics",
                representative: "Aristotle",
                coordinates: {
                  outcomesPrinciples: 0.15,
                  individualCollective: 0.15,
                  reasonIntuition: 0.1
                },
                summary: "Character-centered ethics.",
                exampleConcerns: ["character"],
                distance: 0.8,
                whyItFits: "Moderate overlap."
              }
            ],
            safetyMode: "standard",
            modelsUsed: ["openai:planner", "openai:advisor"]
          })
        );
      }

      return new Response("Not found", { status: 404 });
    }) as typeof fetch;

    try {
      render(<App />);

      fireEvent.change(screen.getByPlaceholderText(/shared passphrase/i), {
        target: { value: "secret" }
      });
      fireEvent.click(screen.getByRole("button", { name: /^enter$/i }));

      await screen.findByRole("heading", { name: /name the dilemma/i });

      fireEvent.change(screen.getByPlaceholderText(/example:/i), {
        target: { value: "I want advice, but I already know my tuple." }
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /explanation style/i });
      fireEvent.click(screen.getByRole("button", { name: /no philosophy training/i }));

      await screen.findByRole("heading", { name: /advice voice/i });
      fireEvent.click(screen.getByRole("button", { name: /personalized/i }));

      await screen.findByRole("heading", { name: /^models$/i });
      fireEvent.click(screen.getByRole("button", { name: /yes, use defaults/i }));

      await screen.findByRole("heading", { name: /calibration/i });
      fireEvent.click(screen.getByRole("button", { name: /enter 3-axis alignment/i }));

      const sliders = screen.getAllByRole("slider");
      fireEvent.change(sliders[0], { target: { value: "-50" } });
      fireEvent.change(sliders[1], { target: { value: "25" } });
      fireEvent.change(sliders[2], { target: { value: "75" } });

      fireEvent.click(screen.getByRole("button", { name: /get advice/i }));

      await screen.findByText(/use the manual tuple directly/i);
      expect(screen.queryByText(/question 1 of 9/i)).not.toBeInTheDocument();
      expect(adviceBodies).toHaveLength(1);
      expect(adviceBodies[0]).toMatchObject({
        answers: [],
        profileOverride: {
          outcomesPrinciples: -0.5,
          individualCollective: 0.25,
          reasonIntuition: 0.75
        }
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

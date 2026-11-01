import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(cleanup);

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("submits the selected explanation setting through the questionnaire path", async () => {
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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

      fireEvent.change(screen.getByLabelText(/shared passphrase/i), {
        target: { value: "secret" }
      });
      fireEvent.click(screen.getByRole("button", { name: /^enter$/i }));

      await screen.findByRole("heading", { name: /^dilemma$/i });

      fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), {
        target: { value: "I need to decide whether to disclose a painful truth that affects my team." }
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /calibration/i });
      fireEvent.click(screen.getByRole("button", { name: /9-question calibration/i }));

      for (let step = 0; step < 8; step += 1) {
        fireEvent.click(screen.getByRole("button", { name: /^neutral$/i }));
        fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
      }

      fireEvent.click(screen.getByRole("button", { name: /^neutral$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /explanation style/i });
      fireEvent.click(screen.getByRole("button", { name: /^advanced$/i }));


      fireEvent.click(screen.getByRole("button", { name: /^get advice$/i }));

      await screen.findByText(/at a more technical level/i);
      fireEvent.click(screen.getByRole("button", { name: /ethical coordinates/i }));
      expect(screen.getByText(/kantian deontology/i)).toBeInTheDocument();
      expect(screen.getByText(/moderately toward outcomes/i)).toBeInTheDocument();
      expect(adviceBodies).toHaveLength(1);
      expect(adviceBodies[0]).toMatchObject({
        explanationLevel: "phd",
        personaMode: "personalized",
        plannerModel: "anthropic:claude-haiku-5-5",
        advisorModel: "anthropic:claude-sonnet-5-5"
      });
      fireEvent.click(screen.getByRole("button", { name: "Perspective" }));
      expect(screen.getByRole("button", { name: "Neutral" })).toHaveAttribute("aria-pressed", "true");
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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
                speaker: { years: "1724–1804", region: "Prussia", traditions: "Deontology" },
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

      fireEvent.change(screen.getByLabelText(/shared passphrase/i), {
        target: { value: "secret" }
      });
      fireEvent.click(screen.getByRole("button", { name: /^enter$/i }));

      await screen.findByRole("heading", { name: /^dilemma$/i });

      fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), {
        target: { value: "I want advice, but I already know my tuple." }
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /calibration/i });
      fireEvent.click(screen.getByRole("button", { name: /enter 3-axis alignment/i }));

      const sliders = screen.getAllByRole("slider");
      fireEvent.change(sliders[0], { target: { value: "-50" } });
      fireEvent.change(sliders[1], { target: { value: "25" } });
      fireEvent.change(sliders[2], { target: { value: "75" } });

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /explanation style/i });
      fireEvent.click(screen.getByRole("button", { name: /^plain language$/i }));


      fireEvent.click(screen.getByRole("button", { name: /^get advice$/i }));

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
      fireEvent.click(screen.getByRole("button", { name: "Perspective" }));
      expect(screen.getByRole("slider", { name: "Outcomes to Principles" })).toHaveValue("-50");
      expect(screen.getByRole("slider", { name: "Individual to Collective" })).toHaveValue("25");
      expect(screen.getByRole("slider", { name: "Reason to Intuition" })).toHaveValue("75");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("sends the chosen philosopher (no axes) and shows the original dilemma in results", async () => {
    const originalFetch = globalThis.fetch;
    const adviceBodies: any[] = [];
    const dilemmaText = "Should I report a friend who cheated on an exam?";

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (url.endsWith("/api/session")) {
        return new Response(JSON.stringify({ token: "t", expiresAt: "2030-01-01T00:00:00.000Z" }));
      }
      if (url.endsWith("/api/advice")) {
        adviceBodies.push(body);
        return new Response(
          JSON.stringify({
            adviceMarkdown: "## Core advice\n\nSnapped advice.",
            nearestProfiles: [],
            selectedPhilosopherId: body.philosopherId,
            safetyMode: "standard",
            modelsUsed: ["a", "b"]
          })
        );
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;

    try {
      render(<App />);
      fireEvent.change(screen.getByLabelText(/shared passphrase/i), { target: { value: "secret" } });
      fireEvent.click(screen.getByRole("button", { name: /^enter$/i }));
      await screen.findByRole("heading", { name: /^dilemma$/i });
      fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: dilemmaText } });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /calibration/i });
      fireEvent.click(screen.getByRole("button", { name: /choose a philosopher/i }));
      await screen.findByRole("heading", { name: /choose a philosopher/i });
      expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
      fireEvent.click(screen.getByRole("radio", { name: /nietzsche/i }));
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await screen.findByRole("heading", { name: /explanation style/i });
      fireEvent.click(screen.getByRole("button", { name: /^plain language$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^get advice$/i }));

      await screen.findByText(/snapped advice/i);
      expect(adviceBodies[0].answers).toEqual([]);
      expect(adviceBodies[0].personaMode).toBe("philosopher");
      expect(adviceBodies[0].philosopherId).toBe("nietzsche-perspectivism");
      expect(adviceBodies[0].profileOverride).toBeUndefined();

      fireEvent.click(screen.getAllByRole("button", { name: /original dilemma/i }).find((b) => !b.closest(".results-tabs-measure"))!);
      expect(await screen.findByText(dilemmaText)).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("keeps an unfinished dilemma when visiting Settings and persists model choices", async () => {
    sessionStorage.setItem("isocrateez-v2-production-token", "test-session");
    render(<App />);
    const draft = "Should I return a lost umbrella?";
    fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: draft } });
    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    await screen.findByRole("heading", { name: "Settings" });
    expect(screen.queryByRole("textbox", { name: "Dilemma" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Appearance"), { target: { value: "dark" } });
    fireEvent.change(screen.getByLabelText("Planner model"), { target: { value: "openai:gpt-5.4-mini" } });
    fireEvent.change(screen.getByLabelText("Advisor model"), { target: { value: "openai:gpt-5.4-mini" } });
    expect(localStorage.getItem("isocrateez-v2-advisor")).toBe("openai:gpt-5.4-mini");
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(screen.getByRole("link", { name: "Done" }));
    expect(await screen.findByRole("textbox", { name: "Dilemma" })).toHaveValue(draft);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("keeps provider errors on the style screen and lets the user retry", async () => {
    sessionStorage.setItem("isocrateez-v2-production-token", "test-session");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Anthropic rejected its API key." }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ adviceMarkdown: "## Core advice\n\nReturn the umbrella.", nearestProfiles: [], safetyMode: "standard", modelsUsed: ["test"] })));
    try {
      render(<App />);
      fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: "Should I return a lost umbrella?" } });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Enter 3-axis alignment" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
      fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Anthropic rejected its API key.");
      expect(screen.getByRole("heading", { name: "Explanation style" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
      await screen.findByText("Return the umbrella.");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).explanationLevel).toBe("phd");
    } finally { fetchMock.mockRestore(); }
  });

  it("regenerates from completed sidebar steps while retaining the dilemma and selections", async () => {
    sessionStorage.setItem("isocrateez-v2-production-token", "test-session");
    const requests: any[] = [];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      return new Response(JSON.stringify({
        adviceMarkdown: `## Core advice\n\nAdvice version ${requests.length}.`,
        nearestProfiles: [], selectedPhilosopherId: body.philosopherId,
        safetyMode: "standard", modelsUsed: ["test"]
      }));
    });
    try {
      render(<App />);
      const dilemma = "Should I report a friend who cheated on an exam?";
      fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: dilemma } });
      expect(screen.queryByRole("button", { name: "Style" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Choose a philosopher" }));
      fireEvent.click(screen.getByRole("radio", { name: /Nietzsche/ }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
      await screen.findByText("Advice version 1.");

      fireEvent.click(screen.getByRole("button", { name: "Style" }));
      expect(screen.getByRole("button", { name: "Plain language" })).toHaveAttribute("aria-pressed", "true");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
      fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
      await screen.findByText("Advice version 2.");
      expect(requests[1]).toMatchObject({ dilemma, philosopherId: requests[0].philosopherId, explanationLevel: "phd" });

      fireEvent.click(screen.getByRole("button", { name: "Perspective" }));
      expect(screen.getByRole("radio", { name: /Nietzsche/ })).toHaveAttribute("aria-checked", "true");
      fireEvent.click(screen.getByRole("radio", { name: /Aristotle/ }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
      await screen.findByText("Advice version 3.");
      expect(requests[2]).toMatchObject({ dilemma, philosopherId: "aristotle-virtue-ethics", explanationLevel: "phd" });
      fireEvent.click(screen.getByRole("button", { name: "Dilemma" }));
      expect(screen.getByRole("textbox", { name: "Dilemma" })).toHaveValue(dilemma);
    } finally { fetchMock.mockRestore(); }
  });

});

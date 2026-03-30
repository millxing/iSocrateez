import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AdviceResponse } from "../../shared/contracts";
import { ResultsView } from "./ResultsView";

const response: AdviceResponse = {
  adviceMarkdown: [
    "## Core advice",
    "",
    "Lead with the most grounded version of the truth.",
    "",
    "## Why this advice",
    "",
    "It balances honesty with proportionality.",
    "",
    "## Watch for",
    "",
    "Avoid turning uncertainty into accusation.",
    "",
    "## Next steps",
    "",
    "Confirm what you know before you escalate."
  ].join("\n"),
  profile: {
    outcomesPrinciples: -0.15,
    individualCollective: 0.4,
    reasonIntuition: -0.2
  },
  nearestProfiles: [
    {
      id: "care",
      name: "Care Ethics",
      representative: "Carol Gilligan",
      coordinates: {
        outcomesPrinciples: -0.1,
        individualCollective: 0.8,
        reasonIntuition: 0.2
      },
      summary: "Relational and context-aware.",
      exampleConcerns: ["care"],
      distance: 0.3,
      whyItFits: "It stays attentive to harm, trust, and relationships."
    },
    {
      id: "virtue",
      name: "Virtue Ethics",
      representative: "Aristotle",
      coordinates: {
        outcomesPrinciples: 0.2,
        individualCollective: 0.1,
        reasonIntuition: 0
      },
      summary: "Character-centered.",
      exampleConcerns: ["character"],
      distance: 0.5,
      whyItFits: "It is nearby on practical judgment."
    }
  ],
  safetyMode: "standard",
  modelsUsed: ["openai:gpt-5.4-mini"]
};

describe("ResultsView", () => {
  const originalInnerWidth = window.innerWidth;
  const clientWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientWidth"
  );
  const scrollWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollWidth"
  );

  let measuredClientWidth = 1200;
  let measuredScrollWidth = 900;

  beforeEach(() => {
    window.innerWidth = 1280;
    measuredClientWidth = 1200;
    measuredScrollWidth = 900;

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return this.classList.contains("results-tabs-measure") ? measuredClientWidth : 0;
      }
    });

    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return this.classList.contains("results-tabs-measure") ? measuredScrollWidth : 0;
      }
    });
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;

    if (clientWidthDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", clientWidthDescriptor);
    }

    if (scrollWidthDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", scrollWidthDescriptor);
    }
  });

  it("switches to the hamburger menu when the tab row overflows", async () => {
    const { container } = render(
      <ResultsView
        response={response}
        dilemma="I heard a rumor about a colleague and do not know whether to raise it."
        explanationLevel="general"
        personaMode="personalized"
        onRestart={() => undefined}
      />
    );

    const desktopNav = container.querySelector(
      "nav.results-tabs-desktop:not(.results-tabs-measure)"
    );
    const mobileNav = container.querySelector("nav.results-tabs-mobile");

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Why This Advice" })).toBeInTheDocument();
    expect(desktopNav).not.toHaveAttribute("hidden");
    expect(mobileNav).toHaveAttribute("hidden");

    measuredClientWidth = 760;
    measuredScrollWidth = 980;
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Why This Advice" })).not.toBeInTheDocument();
    expect(desktopNav).toHaveAttribute("hidden");
    expect(mobileNav).not.toHaveAttribute("hidden");
  });
});

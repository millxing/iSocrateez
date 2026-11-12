import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { buildCalibrationFile, parseCalibrationFile } from "./calibrationFile";

const IDS = ["op-1", "op-2", "op-3", "ic-1", "ic-2", "ic-3", "ri-1", "ri-2", "ri-3", "op-4", "ic-4", "ri-4"];

function reachPathPage() {
  sessionStorage.setItem("isocrateez-v2-production-token", "test-token");
  render(<App />);
  fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), {
    target: { value: "Should I tell my friend a truth that will hurt them?" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

function chooseFile(text: string) {
  const file = new File([text], "isocrateez-calibration.json", { type: "application/json" });
  // jsdom has no Blob.text(); browsers do.
  if (!file.text) Object.defineProperty(file, "text", { value: async () => text });
  fireEvent.change(screen.getByLabelText("Saved calibration file"), { target: { files: [file] } });
}

describe("calibration save, load and refine", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker;
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("refines a finished questionnaire in rounds of three and saves the result", async () => {
    let written = "";
    (window as { showSaveFilePicker?: unknown }).showSaveFilePicker = vi.fn(async () => ({
      name: "isocrateez-calibration.json",
      createWritable: async () => ({ write: async (text: string) => { written = text; }, close: async () => {} })
    }));
    reachPathPage();
    fireEvent.click(screen.getByRole("button", { name: /9-question calibration/i }));

    for (let step = 0; step < 9; step += 1) {
      fireEvent.click(screen.getByRole("radio", { name: /^neutral$/i }));
      fireEvent.click(screen.getByRole("button", { name: step === 8 ? /^see result$/i : /^next$/i }));
    }
    expect(screen.getByText(/based on 9 answers/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /answer 3 more questions/i }));
    expect(screen.getByText("Question 10 of 12")).toBeInTheDocument();
    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole("radio", { name: /^neutral$/i }));
      fireEvent.click(screen.getByRole("button", { name: step === 2 ? /^see result$/i : /^next$/i }));
    }
    expect(screen.getByText(/based on 12 answers/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save calibration/i }));
    expect(await screen.findByText("Calibration saved.")).toBeInTheDocument();
    const saved = parseCalibrationFile(written);
    expect(saved && "answers" in saved && saved.answers).toHaveLength(12);
  });

  it("loads a saved calibration and sends its answers with the advice request", async () => {
    const answers = IDS.map((questionId) => ({ questionId, value: 1 as const }));
    const adviceBodies: { answers: unknown; profileOverride?: unknown }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      adviceBodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({
        adviceMarkdown: "## Your Advice\n\nLoaded advice.",
        profile: { outcomesPrinciples: 0.5, individualCollective: 0.5, reasonIntuition: 0.5 },
        nearestProfiles: [],
        safetyMode: "standard",
        modelsUsed: []
      }));
    });
    reachPathPage();

    chooseFile("not a calibration");
    expect(await screen.findByRole("alert")).toHaveTextContent(/not a saved isocrateez calibration/i);

    chooseFile(buildCalibrationFile(answers));
    expect(await screen.findByText(/based on 12 answers/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^get advice$/i }));

    await screen.findByText("Loaded advice.");
    expect(adviceBodies).toHaveLength(1);
    expect(adviceBodies[0].answers).toEqual(answers);
    expect(adviceBodies[0].profileOverride).toBeUndefined();
  });

  it("opens the sliders when a saved file only has usable coordinates", async () => {
    const file = JSON.parse(buildCalibrationFile(IDS.slice(0, 9).map((questionId) => ({ questionId, value: 2 as const }))));
    file.answers = [];
    reachPathPage();

    chooseFile(JSON.stringify(file));
    expect(await screen.findByRole("heading", { name: /set your coordinates/i })).toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });
});

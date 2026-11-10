import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./api/client";
import type { AdviceResponse, DebateTurnResponse } from "../shared/contracts";
import { debateMessageLimit, debateSpeakerAt } from "../shared/debate";

const advice: AdviceResponse = {
  adviceMarkdown: "## Core advice\n\nTell the truth with care.", nearestProfiles: [],
  safetyMode: "standard", modelsUsed: ["test"]
};
const response = (content: string): DebateTurnResponse => ({ safetyMode: "standard", message: { speakerId: "mill-utilitarianism", content }, complete: false, modelUsed: "test" });

async function openDebate(philosopher = false) {
  render(<App />);
  fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: "Should I tell my friend about a mistake?" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  if (philosopher) {
    fireEvent.click(screen.getByRole("button", { name: "Choose a philosopher" }));
    fireEvent.click(screen.getByRole("radio", { name: /Immanuel Kant/ }));
  } else fireEvent.click(screen.getByRole("button", { name: "Enter 3-axis alignment" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Get advice" }));
  fireEvent.click(await screen.findByRole("button", { name: "Explore through debate" }));
}
function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, "", "/");
  sessionStorage.setItem("isocrateez-v2-production-token", "test-token");
  vi.spyOn(api, "requestAdvice").mockResolvedValue(advice);
  vi.spyOn(api, "requestDebateTurn").mockImplementation(async request => ({
    safetyMode: "standard", message: { speakerId: debateSpeakerAt(request.participants, request.messages.length), content: `Reply ${request.messages.length + 1}` },
    complete: request.messages.length + 1 >= debateMessageLimit(request.participants), modelUsed: "test"
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("debate flow", () => {
  it("runs six alternating turns, returns to advice, and keeps the transcript", async () => {
    await openDebate();
    click("Start debate");
    await screen.findByText("Reply 1");
    for (let i = 2; i <= 6; i++) { click("Next reply"); await screen.findByText(`Reply ${i}`); }
    expect(screen.queryByRole("button", { name: "Next reply" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Debate transcript" })).getAllByRole("listitem")).toHaveLength(6);
    expect(api.requestDebateTurn).toHaveBeenCalledTimes(6);
    expect(vi.mocked(api.requestDebateTurn).mock.calls.map(([req]) => req.messages.length)).toEqual([0, 1, 2, 3, 4, 5]);
    click("Back to advice");
    expect(screen.getByText("Tell the truth with care.")).toBeInTheDocument();
    click("Explore through debate");
    expect(screen.getByText("Reply 6")).toBeInTheDocument();
    expect(api.requestAdvice).toHaveBeenCalledTimes(1);
  });

  it("retries a failed user reply without adding the user's message twice", async () => {
    vi.mocked(api.requestDebateTurn).mockRejectedValueOnce(new api.ApiError("Provider unavailable", 502));
    await openDebate();
    fireEvent.click(screen.getByRole("radio", { name: "You and a philosopher" }));
    click("Start debate");
    expect(api.requestDebateTurn).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Your position" }), { target: { value: "I think honesty protects trust." } });
    click("Send message");
    await screen.findByRole("alert");
    click("Retry reply");
    await screen.findByText("Reply 2");
    expect(screen.getAllByText("I think honesty protects trust.")).toHaveLength(1);
    const calls = vi.mocked(api.requestDebateTurn).mock.calls;
    expect(calls[0][0].messages).toEqual(calls[1][0].messages);
    expect(screen.getByRole("textbox", { name: "Your reply" })).toHaveValue("");
  });

  it("ignores a cancelled reply even if it arrives after a successful retry", async () => {
    const late = deferred<DebateTurnResponse>();
    vi.mocked(api.requestDebateTurn).mockReturnValueOnce(late.promise);
    await openDebate(); click("Start debate");
    const signal = vi.mocked(api.requestDebateTurn).mock.calls[0][1];
    click("Cancel reply");
    expect(signal?.aborted).toBe(true);
    click("Next reply");
    await screen.findByText("Reply 1");
    await act(async () => late.resolve(response("Stale reply")));
    expect(screen.queryByText("Stale reply")).not.toBeInTheDocument();
    expect(screen.getByText("Reply 1")).toBeInTheDocument();
  });

  it("cancels on navigation and resets the debate when the dilemma changes", async () => {
    const late = deferred<DebateTurnResponse>();
    vi.mocked(api.requestDebateTurn).mockReturnValueOnce(late.promise);
    await openDebate(); click("Start debate");
    click("Back to advice");
    expect(vi.mocked(api.requestDebateTurn).mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => late.resolve(response("Stale reply")));
    click("Dilemma");
    fireEvent.change(screen.getByRole("textbox", { name: "Dilemma" }), { target: { value: "Should I return an umbrella I found at work?" } });
    click("Continue"); click("Enter 3-axis alignment"); click("Continue"); click("Get advice");
    fireEvent.click(await screen.findByRole("button", { name: "Explore through debate" }));
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(screen.queryByText("Stale reply")).not.toBeInTheDocument();
  });

  it("stops on a safety response and does not attribute it to a philosopher", async () => {
    vi.mocked(api.requestDebateTurn).mockResolvedValue({ safetyMode: "supportive_refusal", safetyMarkdown: "Please choose a safe course of action.", complete: true, modelUsed: "local-safety" });
    await openDebate(); click("Start debate");
    await screen.findByRole("heading", { name: "Debate stopped" });
    expect(screen.queryByRole("button", { name: "Next reply" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Debate transcript" })).queryAllByRole("listitem")).toHaveLength(0);
    click("Back to advice");
    expect(screen.getByText("Tell the truth with care.")).toBeInTheDocument();
  });

  it("requires two different philosophers and preselects the advice voice", async () => {
    vi.mocked(api.requestAdvice).mockResolvedValue({ ...advice, selectedPhilosopherId: "kant-deontology" });
    await openDebate(true);
    expect(screen.getByRole("combobox", { name: /^First philosopher/ })).toHaveValue("kant-deontology");
    fireEvent.change(screen.getByRole("combobox", { name: /^Second philosopher/ }), { target: { value: "kant-deontology" } });
    expect(screen.getByRole("button", { name: "Start debate" })).toBeDisabled();
  });

  it("keeps a user draft across advice and Settings", async () => {
    await openDebate();
    fireEvent.click(screen.getByRole("radio", { name: "You and a philosopher" }));
    click("Start debate");
    fireEvent.change(screen.getByRole("textbox", { name: "Your position" }), { target: { value: "My unfinished argument" } });
    click("Back to advice"); click("Explore through debate");
    expect(screen.getByRole("textbox", { name: "Your position" })).toHaveValue("My unfinished argument");
    window.history.replaceState(null, "", "#settings"); fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    window.history.replaceState(null, "", "#reflection"); fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByRole("textbox", { name: "Your position" })).toHaveValue("My unfinished argument");
  });

  it("resumes the pending user turn after session expiry", async () => {
    vi.mocked(api.requestDebateTurn).mockRejectedValueOnce(new api.ApiError("Expired", 401));
    vi.spyOn(api, "createSession").mockResolvedValue({ token: "renewed-token", expiresAt: "2030-01-01" });
    await openDebate();
    fireEvent.click(screen.getByRole("radio", { name: "You and a philosopher" }));
    click("Start debate");
    fireEvent.change(screen.getByRole("textbox", { name: "Your position" }), { target: { value: "I think truth matters." } });
    click("Send message");
    fireEvent.change(await screen.findByLabelText("Shared passphrase"), { target: { value: "test-password" } });
    click("Enter");
    fireEvent.click(await screen.findByRole("button", { name: "Retry reply" }));
    await screen.findByText("Reply 2");
    expect(vi.mocked(api.requestDebateTurn).mock.calls[1][0]).toMatchObject({ token: "renewed-token", messages: [{ speakerId: "user", content: "I think truth matters." }] });
  });

  it("clears a pending debate without accepting its late reply", async () => {
    const late = deferred<DebateTurnResponse>();
    vi.mocked(api.requestDebateTurn).mockReturnValueOnce(late.promise);
    await openDebate(); click("Start debate");
    click("Start a new debate"); click("Clear debate");
    expect(vi.mocked(api.requestDebateTurn).mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => late.resolve(response("Stale reply")));
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(screen.queryByText("Stale reply")).not.toBeInTheDocument();
  });

  it("ends the user mode after six exchanges", async () => {
    await openDebate();
    fireEvent.click(screen.getByRole("radio", { name: "You and a philosopher" })); click("Start debate");
    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getByRole("textbox", { name: i === 0 ? "Your position" : "Your reply" }), { target: { value: `Reason ${i}` } });
      click("Send message"); await screen.findByText(`Reply ${(i + 1) * 2}`);
    }
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
    expect(screen.getByText("6 of 6 exchanges complete")).toBeInTheDocument();
    expect(api.requestDebateTurn).toHaveBeenCalledTimes(6);
  });

});

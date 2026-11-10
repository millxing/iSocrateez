import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DebateExport } from "./DebateExport";
import type { DebateSession } from "./DebatePage";

const session: DebateSession = {
  dilemma: "Should I tell my friend about a mistake?",
  participants: { mode: "user", philosopherIds: ["kant-deontology"] },
  explanationLevel: "general", advisorModel: "anthropic:claude-sonnet-5-5",
  messages: [{ speakerId: "user", content: "Honesty protects trust." }, { speakerId: "kant-deontology", content: "Consider **duty**, too." }],
  draft: "An unsent private draft", complete: false
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function installPicker(picker: unknown) {
  Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: picker });
}
afterEach(() => { Reflect.deleteProperty(window, "showSaveFilePicker"); });

describe("debate export", () => {
  it("saves attributed messages and metadata, but not an unsent draft", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const picker = vi.fn().mockResolvedValue({ createWritable: async () => ({ write, close }) });
    installPicker(picker);
    render(<DebateExport session={session} />);
    fireEvent.click(screen.getByRole("button", { name: "Export debate" }));
    await screen.findByText("Debate saved.");
    const text = write.mock.calls[0][0];
    expect(text).toContain(session.dilemma);
    expect(text).toContain(session.advisorModel);
    expect(text).toContain("Status: Partial debate");
    expect(text).toContain("### 1. You\n\nHonesty protects trust.");
    expect(text).toContain("### 2. Immanuel Kant\n\nConsider **duty**, too.");
    expect(text).not.toContain(session.draft);
    expect(close).toHaveBeenCalledOnce();
    expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: "isocrateez-debate.md" }));
  });

  it("downloads a file when the save picker is unavailable, including a separate safety response", async () => {
    const create = vi.fn().mockReturnValue("blob:debate-test");
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = create;
    URL.revokeObjectURL = vi.fn();
    let filename = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { filename = this.download; });
    try {
      render(<DebateExport session={{ ...session, participants: { mode: "philosophers", philosopherIds: ["kant-deontology", "scanlon-contractualism"] },
        messages: [], complete: true, safetyMarkdown: "Choose a safe course of action." }} />);
      fireEvent.click(screen.getByRole("button", { name: "Export debate" }));
      await screen.findByText("Debate downloaded.");
      expect(click).toHaveBeenCalledOnce();
      expect(filename).toBe("isocrateez-debate.md");
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsText(create.mock.calls[0][0]);
      });
      expect(text).toContain("In the spirit of T. M. Scanlon");
      expect(text).toContain("Status: Stopped for safety");
      expect(text).toContain("## Safety response\n\nChoose a safe course of action.");
      expect(document.querySelector('a[download]')).toBeNull();
      // Run the scheduled cleanup before restoring URL methods.
      await new Promise(resolve => window.setTimeout(resolve, 1050));
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:debate-test");
    } finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; }
  });

  it("allows retry after cancellation or a save error", async () => {
    const picker = vi.fn().mockRejectedValueOnce(new DOMException("Cancelled", "AbortError")).mockRejectedValueOnce(new Error("Disk full"));
    installPicker(picker);
    render(<DebateExport session={session} />);
    fireEvent.click(screen.getByRole("button", { name: "Export debate" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Export debate" })).toBeEnabled());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Export debate" }));
    await screen.findByText("The file could not be saved. Try again.");
    expect(screen.getByRole("button", { name: "Export debate" })).toBeEnabled();
  });
});

import { useState } from "react";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import type { DebateSession } from "./DebatePage";

type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{ write: (text: string) => Promise<void>; close: () => Promise<void> }> }>;

export function DebateExport({ session }: { session: DebateSession }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setStatus(null);
    const speakerName = (id: string) => {
      if (id === "user") return "You";
      const voice = getPhilosophyById(id);
      return voice ? `${voice.voiceStyle === "in-the-spirit" ? "In the spirit of " : ""}${voice.representative}` : id;
    };
    const markdown = [
      "# iSocrateez Debate", "",
      `> Mode: ${session.participants.mode === "philosophers" ? "Two philosophers" : "You and a philosopher"}`,
      `> Advisor model: ${session.advisorModel}`,
      `> Explanation style: ${{ general: "Plain language", informed: "Some technical detail", phd: "Advanced" }[session.explanationLevel]}`,
      `> Status: ${session.safetyMarkdown ? "Stopped for safety" : session.complete ? "Complete" : "Partial debate"}`,
      "", "*The philosopher voices are AI interpretations, not authentic quotations.*",
      "", "## Dilemma", "", session.dilemma,
      "", "## Participants", "",
      ...(session.participants.mode === "user" ? ["- You"] : []),
      ...session.participants.philosopherIds.map(id => `- ${speakerName(id)}`),
      "", "## Discussion", "",
      ...session.messages.flatMap((message, index) => [
        `### ${index + 1}. ${speakerName(message.speakerId)}`, "", message.content, ""
      ]),
      ...(session.safetyMarkdown ? ["## Safety response", "", session.safetyMarkdown, ""] : [])
    ].join("\n");

    try {
      const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
      if (picker) {
        const handle = await picker.call(window, {
          suggestedName: "isocrateez-debate.md",
          types: [{ description: "Markdown file", accept: { "text/plain": [".md"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(markdown);
        await writable.close();
        setStatus("Debate saved.");
      } else {
        const url = URL.createObjectURL(new Blob([markdown], { type: "text/plain;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "isocrateez-debate.md";
        try {
          document.body.appendChild(link);
          link.click();
          setStatus("Debate downloaded.");
        } finally {
          link.remove();
          // Keep the URL alive until the browser has started the download.
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("The file could not be saved. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return <div className="debate-export">
    <button type="button" className="button-secondary" disabled={saving} onClick={() => void save()}>
      {saving ? "Saving…" : "Export debate"}
    </button>
    <span className="form-note" role="status">{status}</span>
  </div>;
}

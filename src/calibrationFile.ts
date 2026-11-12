import type { AnswerRecord, ProfileTuple } from "../shared/contracts";
import { isValidAnswerSet, isValidProfileTuple, scoreProfile } from "../shared/ethics";

export const CALIBRATION_FILE_NAME = "isocrateez-calibration.json";

/** What a saved calibration restores: the answers when they still match the question bank, else the coordinates. */
export type LoadedCalibration = { answers: AnswerRecord[] } | { profile: ProfileTuple };

export function buildCalibrationFile(answers: AnswerRecord[]): string {
  return JSON.stringify(
    {
      app: "isocrateez",
      kind: "calibration",
      version: 1,
      savedAt: new Date().toISOString(),
      profile: scoreProfile(answers),
      answers
    },
    null,
    2
  );
}

/** Returns null when the text is not a usable calibration file. */
export function parseCalibrationFile(text: string): LoadedCalibration | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (!data || typeof data !== "object") return null;
  const file = data as { app?: unknown; kind?: unknown; answers?: unknown; profile?: unknown };
  if (file.app !== "isocrateez" || file.kind !== "calibration") return null;

  if (isValidAnswerSet(file.answers)) {
    return { answers: file.answers.map(({ questionId, value }) => ({ questionId, value })) };
  }
  // The questions can change between versions; the saved coordinates still apply.
  if (isValidProfileTuple(file.profile)) {
    const { outcomesPrinciples, individualCollective, reasonIntuition } = file.profile;
    return { profile: { outcomesPrinciples, individualCollective, reasonIntuition } };
  }
  return null;
}

type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ name?: string; createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }>;

/** Saves through the system dialog where the browser has one, else as a download. */
export async function saveCalibrationFile(text: string): Promise<"saved" | "downloaded" | "cancelled"> {
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName: CALIBRATION_FILE_NAME,
        types: [{ description: "iSocrateez calibration", accept: { "application/json": [".json"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return "saved";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      throw error;
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = CALIBRATION_FILE_NAME;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Keep the URL alive until the browser has started the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return "downloaded";
}

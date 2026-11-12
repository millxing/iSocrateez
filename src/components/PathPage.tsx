import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { parseCalibrationFile, type LoadedCalibration } from "../calibrationFile";
import { PageHeader } from "./PageHeader";

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ICONS = {
  questions: svg(<><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.5" /><circle cx="4.5" cy="12" r="1.5" /><circle cx="4.5" cy="18" r="1.5" /></>),
  tuple: svg(<><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="15" cy="6" r="2" fill="var(--surface)" /><circle cx="8" cy="12" r="2" fill="var(--surface)" /><circle cx="13" cy="18" r="2" fill="var(--surface)" /></>),
  philosopher: svg(<><path d="M4 20h16M6 20V9M10 20V9M14 20V9M18 20V9M3 9h18L12 4z" /></>)
};

interface PathPageProps {
  onSelect: (mode: "questions" | "tuple" | "philosopher") => void;
  onLoadCalibration: (loaded: LoadedCalibration) => void;
  onBack: () => void;
}

const PATHS: {
  mode: "questions" | "tuple" | "philosopher";
  label: string;
  hint: string;
  meta: string;
}[] = [
  {
    mode: "questions",
    label: "9-question calibration",
    hint: "Nine quick questions place you on three ethical axes, so the advice reflects your outlook. You can answer more to refine the result.",
    meta: "About 2 minutes · Recommended"
  },
  {
    mode: "tuple",
    label: "Enter 3-axis alignment",
    hint: "Know where you stand? Set the three axes yourself.",
    meta: "Under a minute"
  },
  {
    mode: "philosopher",
    label: "Choose a philosopher",
    hint: "Hear from one thinker or tradition, like Aristotle or Confucius.",
    meta: "Pick from the catalogue"
  }
];

export function PathPage({ onSelect, onLoadCalibration, onBack }: PathPageProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so the same file can be chosen again after an error.
    event.target.value = "";
    if (!file) return;
    setLoadError(null);
    try {
      const loaded = parseCalibrationFile(await file.text());
      if (loaded) onLoadCalibration(loaded);
      else setLoadError("That file is not a saved iSocrateez calibration.");
    } catch {
      setLoadError("The file could not be read. Try again.");
    }
  }

  return (
    <div className="wizard-card path-page">
      <div className="wizard-scroll">
        <PageHeader step="Step 2 of 4" title="Choose a perspective">
          Whose point of view should the advice come from? Yours, measured or set by hand, or a philosopher’s.
        </PageHeader>
        <div className="path-choices">
          {PATHS.map((path) => (
            <button
              key={path.mode}
              className="path-card"
              type="button"
              aria-labelledby={`path-${path.mode}`}
              aria-describedby={`path-${path.mode}-hint`}
              onClick={() => onSelect(path.mode)}
            >
              <span className="path-icon" aria-hidden="true">{ICONS[path.mode]}</span>
              <span className="choice-label" id={`path-${path.mode}`}>{path.label}</span>
              <span className="choice-hint" id={`path-${path.mode}-hint`}>{path.hint}</span>
              <span className="path-meta">{path.meta}</span>
              <span className="path-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <div className="path-load">
          <span>Saved a calibration before?</span>
          <button className="button-secondary" type="button" onClick={() => fileInput.current?.click()}>
            Load a saved calibration
          </button>
          <input ref={fileInput} type="file" accept=".json,application/json" hidden
            aria-label="Saved calibration file" onChange={(event) => void handleFile(event)} />
        </div>
        {loadError && <p className="error" role="alert">{loadError}</p>}
      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

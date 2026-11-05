import type { ReactNode } from "react";
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
    hint: "Nine quick questions place you on three ethical axes, so the advice reflects your outlook.",
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

export function PathPage({ onSelect, onBack }: PathPageProps) {
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
      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

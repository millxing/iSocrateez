import type { ExplanationLevel } from "../../shared/contracts";

interface ExplanationPageProps {
  current: ExplanationLevel;
  onSelect: (level: ExplanationLevel) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const options: { value: ExplanationLevel; label: string }[] = [
  {
    value: "general",
    label: "Plain language"
  },
  {
    value: "informed",
    label: "Some technical detail"
  },
  {
    value: "phd",
    label: "Advanced"
  }
];

export function ExplanationPage({ current, onSelect, onBack, onSubmit, isSubmitting, error }: ExplanationPageProps) {
  return (
    <div className="wizard-card">
      <div className="wizard-scroll">
      <h2 className="wizard-title">Explanation style</h2>
      <div className="wizard-choices style-choices">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`choice-card ${opt.value === current ? "is-active" : ""}`}
            aria-pressed={opt.value === current}
            onClick={() => onSelect(opt.value)}
          >
            <span className="choice-label">{opt.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>Back</button>
        <button className="button-primary" type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Generating…" : "Get advice"}
        </button>
      </div>
    </div>
  );
}

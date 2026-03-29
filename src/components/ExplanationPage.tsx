import type { ExplanationLevel } from "../../shared/contracts";

interface ExplanationPageProps {
  current: ExplanationLevel;
  onSelect: (level: ExplanationLevel) => void;
  onBack: () => void;
}

const options: { value: ExplanationLevel; label: string; hint: string }[] = [
  {
    value: "general",
    label: "No philosophy training",
    hint: "Plain language and fewer references."
  },
  {
    value: "informed",
    label: "Some philosophy training",
    hint: "Keeps some vocabulary and contrast."
  },
  {
    value: "phd",
    label: "PhD-level philosophical training",
    hint: "Denser distinctions and sharper framing."
  }
];

export function ExplanationPage({ current, onSelect, onBack }: ExplanationPageProps) {
  return (
    <div className="wizard-card">
      <h2 className="wizard-title">Explanation style</h2>
      <p className="wizard-subtitle">
        How technical should the response feel?
      </p>
      <div className="wizard-choices">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`choice-card ${opt.value === current ? "is-active" : ""}`}
            onClick={() => onSelect(opt.value)}
          >
            <span className="choice-label">{opt.label}</span>
            <span className="choice-hint">{opt.hint}</span>
          </button>
        ))}
      </div>
      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

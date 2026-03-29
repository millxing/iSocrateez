import type { PersonaMode } from "../../shared/contracts";

interface VoicePageProps {
  current: PersonaMode;
  onSelect: (mode: PersonaMode) => void;
  onBack: () => void;
}

const options: { value: PersonaMode; label: string; hint: string }[] = [
  {
    value: "personalized",
    label: "Personalized",
    hint: "Use your measured profile directly."
  },
  {
    value: "philosopher",
    label: "Philosopher persona",
    hint: "Snap to the nearest curated voice."
  }
];

export function VoicePage({ current, onSelect, onBack }: VoicePageProps) {
  return (
    <div className="wizard-card">
      <h2 className="wizard-title">Advice voice</h2>
      <p className="wizard-subtitle">
        Should the answer stay profile-based or use a matched persona?
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

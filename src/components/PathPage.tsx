import { useState } from "react";
import type { ProfileTuple } from "../../shared/contracts";
import { philosophyProfiles } from "../../shared/philosophyProfiles";

interface PathPageProps {
  onSelect: (mode: "questions" | "tuple") => void;
  onSelectPhilosopher: (profileId: string, tuple: ProfileTuple) => void;
  onBack: () => void;
}

export function PathPage({ onSelect, onSelectPhilosopher, onBack }: PathPageProps) {
  const [choosingPhilosopher, setChoosingPhilosopher] = useState(false);

  return (
    <div className="wizard-card path-page">
      <h2 className="wizard-title">Calibration</h2>
      <p className="wizard-subtitle">
        How should we determine your ethical profile?
      </p>
      <div className="wizard-choices">
        <button
          className="choice-card"
          onClick={() => onSelect("questions")}
        >
          <span className="choice-label">9-question calibration</span>
          <span className="choice-hint">Answer nine questions across three ethical axes.</span>
        </button>
        <button
          className="choice-card"
          onClick={() => onSelect("tuple")}
        >
          <span className="choice-label">Enter 3-axis alignment</span>
          <span className="choice-hint">Set your ethical coordinates directly with sliders.</span>
        </button>
        <button
          className={`choice-card ${choosingPhilosopher ? "is-active" : ""}`}
          aria-expanded={choosingPhilosopher}
          onClick={() => setChoosingPhilosopher((open) => !open)}
        >
          <span className="choice-label">Choose a philosopher</span>
          <span className="choice-hint">Snap your alignment to a philosopher or school of thought.</span>
        </button>
      </div>

      {choosingPhilosopher && (
        <div className="example-list philosopher-list" role="listbox" aria-label="Philosophers">
          {philosophyProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              role="option"
              aria-selected={false}
              className="choice-card example-option"
              onClick={() => onSelectPhilosopher(profile.id, profile.coordinates)}
            >
              <span className="choice-label">{profile.name}</span>
              <span className="choice-hint">{profile.representative}</span>
            </button>
          ))}
        </div>
      )}

      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

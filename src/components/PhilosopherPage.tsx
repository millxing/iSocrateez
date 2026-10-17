import { useState } from "react";
import type { PhilosophyGroup } from "../../shared/contracts";
import { philosophyProfiles } from "../../shared/philosophyProfiles";

interface PhilosopherPageProps {
  initialId: string | null;
  onSubmit: (profileId: string) => void;
  onBack: () => void;
}

const GROUPS: { id: PhilosophyGroup; label: string }[] = [
  { id: "ancient", label: "Ancient Greece & Rome" },
  { id: "eastern", label: "Asian & African traditions" },
  { id: "religious", label: "Religious traditions" },
  { id: "modern", label: "Modern" },
  { id: "contemporary", label: "Contemporary" }
];

export function PhilosopherPage({ initialId, onSubmit, onBack }: PhilosopherPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const selected = philosophyProfiles.find((p) => p.id === selectedId);

  return (
    <div className="wizard-card philosopher-page">
      <h2 className="wizard-title">Choose a philosopher</h2>
      <p className="wizard-subtitle">
        Whose perspective would you like on your dilemma?
      </p>

      <div className="philosopher-groups" role="radiogroup" aria-label="Philosophers">
        {GROUPS.map((group) => {
          const members = philosophyProfiles.filter((p) => p.group === group.id);
          if (members.length === 0) return null;
          return (
            <section key={group.id} className="philosopher-group">
              <h3 className="philosopher-group-label">{group.label}</h3>
              <div className="philosopher-grid">
                {members.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={p.id === selectedId}
                    className={`philosopher-chip ${p.id === selectedId ? "is-selected" : ""}`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <span className="philosopher-chip-name">{p.representative}</span>
                    <span className="philosopher-chip-school">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="philosopher-blurb" aria-live="polite">
        {selected ? selected.summary : "Select one to see a short description."}
      </p>

      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="button-primary"
          type="button"
          disabled={!selected}
          onClick={() => selected && onSubmit(selected.id)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

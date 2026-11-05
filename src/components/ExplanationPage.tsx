import { useEffect, useRef } from "react";
import type { ExplanationLevel } from "../../shared/contracts";
import { navigateRadios } from "./radioNavigation";
import { PageHeader } from "./PageHeader";

interface ExplanationPageProps {
  current: ExplanationLevel;
  onSelect: (level: ExplanationLevel) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const options: { value: ExplanationLevel; label: string; hint: string }[] = [
  {
    value: "general",
    label: "Plain language",
    hint: "Everyday words, no jargon."
  },
  {
    value: "informed",
    label: "Some technical detail",
    hint: "Names the ethical ideas at play."
  },
  {
    value: "phd",
    label: "Advanced",
    hint: "Philosophical terms and references."
  }
];

export function ExplanationPage({ current, onSelect, onBack, onSubmit, isSubmitting, error }: ExplanationPageProps) {
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  return (
    <div className="wizard-card explanation-page">
      <div className="wizard-scroll">
      <PageHeader step="Step 3 of 4" title="Explanation style">
        How should the advice be written? This changes the language, not the reasoning. Your choice is remembered for next time.
      </PageHeader>
      {error && (
        <div className="error-panel" role="alert" tabIndex={-1} ref={errorRef}>
          <p className="error-title">We couldn’t get your advice.</p>
          <p>{error}</p>
          <p className="error-help">Your dilemma and answers are kept. You can try again now.</p>
          <button className="button-secondary" type="button" onClick={onSubmit} disabled={isSubmitting}>Try again</button>
        </div>
      )}
      <div className="style-choices" role="radiogroup" aria-label="Explanation style" onKeyDown={navigateRadios}>
        {options.map((opt) => {
          const active = opt.value === current;
          return (
            <button
              key={opt.value}
              type="button"
              className={`style-card ${active ? "is-active" : ""}`}
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              aria-labelledby={`style-${opt.value}`}
              aria-describedby={`style-${opt.value}-hint`}
              onClick={() => onSelect(opt.value)}
            >
              <span className="style-check" aria-hidden="true" />
              <span className="choice-label" id={`style-${opt.value}`}>{opt.label}</span>
              <span className="choice-hint" id={`style-${opt.value}-hint`}>{opt.hint}</span>
            </button>
          );
        })}
      </div>
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

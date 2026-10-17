import { FormEvent, useState } from "react";
import { SAMPLE_DILEMMAS } from "../sampleDilemmas";

interface DilemmaPageProps {
  initialDilemma: string;
  onSubmit: (dilemma: string) => void;
}

export function DilemmaPage({ initialDilemma, onSubmit }: DilemmaPageProps) {
  const [dilemma, setDilemma] = useState(initialDilemma);
  const [mode, setMode] = useState<"own" | "example">(
    SAMPLE_DILEMMAS.some((s) => s.text === initialDilemma) ? "example" : "own"
  );

  const selected = SAMPLE_DILEMMAS.find((s) => s.text === dilemma);
  const canContinue = mode === "example" ? Boolean(selected) : Boolean(dilemma.trim());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canContinue) {
      onSubmit(dilemma.trim());
    }
  }

  return (
    <div className="wizard-card dilemma-page">
      <h2 className="wizard-title">Name the dilemma</h2>
      <p className="wizard-subtitle">
        What situation are you trying to navigate?
      </p>
      <form className="wizard-form" onSubmit={handleSubmit}>
        <div className="mode-toggle" role="group" aria-label="Dilemma source">
          <button
            type="button"
            className={`mode-toggle-option ${mode === "own" ? "is-active" : ""}`}
            aria-pressed={mode === "own"}
            onClick={() => setMode("own")}
          >
            Write my own
          </button>
          <button
            type="button"
            className={`mode-toggle-option ${mode === "example" ? "is-active" : ""}`}
            aria-pressed={mode === "example"}
            onClick={() => setMode("example")}
          >
            Choose an example
          </button>
        </div>
        <div className="dilemma-body">
          {mode === "example" ? (
            <div className="example-split">
              <div className="example-list" role="listbox" aria-label="Example dilemmas">
                {SAMPLE_DILEMMAS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    role="option"
                    aria-selected={sample.title === selected?.title}
                    className={`choice-card example-option ${sample.title === selected?.title ? "is-active" : ""}`}
                    onClick={() => setDilemma(sample.text)}
                  >
                    <span className="choice-label">{sample.title}</span>
                  </button>
                ))}
              </div>
              <div className="example-preview" tabIndex={0} aria-live="polite">
                {selected ? (
                  <>
                    <h3 className="example-preview-title">{selected.title}</h3>
                    <p>{selected.text}</p>
                  </>
                ) : (
                  <p className="example-preview-empty">
                    Select an example on the left to read it here.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <textarea
              name="dilemma"
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              placeholder="Example: I learned something at work that could protect my team if I disclose it, but I would be violating a confidence."
              className="wizard-textarea"
              rows={6}
            />
          )}
        </div>
        <button className="button-primary dilemma-continue" type="submit" disabled={!canContinue}>
          Continue
        </button>
      </form>
    </div>
  );
}

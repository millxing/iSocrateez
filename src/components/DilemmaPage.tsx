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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dilemma.trim()) {
      onSubmit(dilemma.trim());
    }
  }

  return (
    <div className="wizard-card">
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
        {mode === "example" && (
          <div className="example-list" role="listbox" aria-label="Example dilemmas">
            {SAMPLE_DILEMMAS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                role="option"
                aria-selected={sample.text === dilemma}
                className={`choice-card example-option ${sample.text === dilemma ? "is-active" : ""}`}
                onClick={() => setDilemma(sample.text)}
              >
                <span className="choice-label">{sample.title}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          name="dilemma"
          value={dilemma}
          onChange={(e) => setDilemma(e.target.value)}
          placeholder="Example: I learned something at work that could protect my team if I disclose it, but I would be violating a confidence."
          className="wizard-textarea"
          rows={6}
          required
        />
        <button className="button-primary" type="submit" disabled={!dilemma.trim()}>
          Continue
        </button>
      </form>
    </div>
  );
}

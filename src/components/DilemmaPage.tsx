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
      <h2 className="wizard-title">Dilemma</h2>
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
            <div className={`example-split ${selected ? "has-selection" : ""}`}>
              <ExampleList selectedTitle={selected?.title} onPick={setDilemma} />
              <div className="example-preview" tabIndex={0} aria-live="polite">
                {selected ? (
                  <>
                    <h3 className="example-preview-title">{selected.title}</h3>
                    <p>{selected.text}</p>
                  </>
                ) : (
                  <p className="example-preview-empty">
                    Select an example.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
            <textarea
              id="dilemma"
              aria-label="Dilemma"
              name="dilemma"
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              className="wizard-textarea"
              rows={6}
            />
            <details className="optional-help"><summary>What to include</summary><p>What happened, who is affected, and what makes the choice difficult?</p></details>
            </>
          )}
        </div>
        <div className="button-row dilemma-actions">
        <button className="button-primary dilemma-continue" type="submit" disabled={!canContinue}>
          Continue
        </button>
        </div>
      </form>
    </div>
  );
}

function ExampleList({
  selectedTitle,
  onPick
}: {
  selectedTitle?: string;
  onPick: (text: string) => void;
}) {
  return (
    <div className="example-list-wrap">
      <div
        className="example-list"
        role="group"
        aria-label="Example dilemmas"
      >
        {SAMPLE_DILEMMAS.map((sample) => (
          <button
            key={sample.title}
            type="button"
            aria-pressed={sample.title === selectedTitle}
            className={`choice-card example-option ${sample.title === selectedTitle ? "is-active" : ""}`}
            onClick={() => onPick(sample.text)}
          >
            <span className="choice-label">{sample.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

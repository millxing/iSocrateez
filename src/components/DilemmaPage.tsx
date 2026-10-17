import { FormEvent, useState } from "react";
import { SAMPLE_DILEMMAS } from "../sampleDilemmas";

interface DilemmaPageProps {
  initialDilemma: string;
  onSubmit: (dilemma: string) => void;
}

export function DilemmaPage({ initialDilemma, onSubmit }: DilemmaPageProps) {
  const [dilemma, setDilemma] = useState(initialDilemma);

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
        <select
          aria-label="Choose an example dilemma"
          value={SAMPLE_DILEMMAS.find((s) => s.text === dilemma)?.title ?? ""}
          onChange={(e) => {
            const sample = SAMPLE_DILEMMAS.find((s) => s.title === e.target.value);
            if (sample) setDilemma(sample.text);
          }}
        >
          <option value="">Write your own, or choose an example…</option>
          {SAMPLE_DILEMMAS.map((s) => (
            <option key={s.title} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>
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

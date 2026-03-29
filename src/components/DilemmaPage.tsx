import { FormEvent, useState } from "react";

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

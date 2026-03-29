interface PathPageProps {
  onSelect: (mode: "questions" | "tuple") => void;
  onBack: () => void;
}

export function PathPage({ onSelect, onBack }: PathPageProps) {
  return (
    <div className="wizard-card">
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
      </div>
      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

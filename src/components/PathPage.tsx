interface PathPageProps {
  onSelect: (mode: "questions" | "tuple" | "philosopher") => void;
  onBack: () => void;
}

export function PathPage({ onSelect, onBack }: PathPageProps) {
  return (
    <div className="wizard-card path-page">
      <div className="wizard-scroll">
      <h2 className="wizard-title">Calibration</h2>
      <div className="wizard-choices">
        <button
          className="choice-card"
          onClick={() => onSelect("questions")}
        >
          <span className="choice-label">9-question calibration</span>
        </button>
        <button
          className="choice-card"
          onClick={() => onSelect("tuple")}
        >
          <span className="choice-label">Enter 3-axis alignment</span>
        </button>
        <button
          className="choice-card"
          onClick={() => onSelect("philosopher")}
        >
          <span className="choice-label">Choose a philosopher</span>
        </button>
      </div>

      </div>
      <div className="button-row">
      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
      </div>
    </div>
  );
}

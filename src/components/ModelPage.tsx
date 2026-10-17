import { useState } from "react";
import { modelOptions } from "../../shared/models";

interface ModelPageProps {
  plannerModel: string;
  advisorModel: string;
  onSubmit: (useDefaults: boolean, planner?: string, advisor?: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function displayName(value: string): string {
  return modelOptions.find((o) => o.value === value)?.label ?? value;
}

export function ModelPage({ plannerModel, advisorModel, onSubmit, onBack, isSubmitting, error }: ModelPageProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [planner, setPlanner] = useState(plannerModel);
  const [advisor, setAdvisor] = useState(advisorModel);

  return (
    <div className="wizard-card models-page">
      <h2 className="wizard-title">Models</h2>
      <p className="wizard-subtitle">
        Use the defaults?
      </p>
      <div className="model-defaults">
        <span className="model-default-label">Planner: <strong>{displayName(plannerModel)}</strong></span>
        <span className="model-default-label">Advisor: <strong>{displayName(advisorModel)}</strong></span>
      </div>

      {!showCustom ? (
        <div className="wizard-choices">
          <button
            className="choice-card"
            disabled={isSubmitting}
            onClick={() => onSubmit(true)}
          >
            <span className="choice-label">Yes, use defaults</span>
          </button>
          <button
            className="choice-card"
            onClick={() => setShowCustom(true)}
          >
            <span className="choice-label">No, let me choose</span>
          </button>
        </div>
      ) : (
        <div className="wizard-form model-custom">
          <div className="model-pickers">
            <ModelPicker label="Planner model" value={planner} onChange={setPlanner} />
            <ModelPicker label="Advisor model" value={advisor} onChange={setAdvisor} />
          </div>
          <button
            className="button-primary"
            disabled={isSubmitting}
            onClick={() => onSubmit(false, planner, advisor)}
          >
            {isSubmitting ? "Requesting advice..." : "Get advice"}
          </button>
        </div>
      )}

      {error ? <p className="error">{error}</p> : null}

      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function ModelPicker({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="model-picker" role="radiogroup" aria-label={label}>
      <h3 className="model-picker-heading">{label}</h3>
      <div className="philosopher-list">
        {modelOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={opt.value === value}
            className={`philosopher-option ${opt.value === value ? "is-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

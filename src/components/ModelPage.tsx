import { useState } from "react";

interface ModelPageProps {
  plannerModel: string;
  advisorModel: string;
  onSubmit: (useDefaults: boolean, planner?: string, advisor?: string) => void;
  onBack: () => void;
}

const modelOptions = [
  { value: "openai:gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { value: "anthropic:claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: "anthropic:claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "anthropic:claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "openai:gpt-4o", label: "GPT-4o" },
  { value: "openai:gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "openai:gpt-5.4", label: "GPT-5.4" },
  { value: "openai:o3-mini", label: "o3-mini" }
];

function displayName(value: string): string {
  return modelOptions.find((o) => o.value === value)?.label ?? value;
}

export function ModelPage({ plannerModel, advisorModel, onSubmit, onBack }: ModelPageProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [planner, setPlanner] = useState(plannerModel);
  const [advisor, setAdvisor] = useState(advisorModel);

  return (
    <div className="wizard-card">
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
        <div className="wizard-form">
          <label className="wizard-field">
            <span>Planner model</span>
            <select value={planner} onChange={(e) => setPlanner(e.target.value)}>
              {modelOptions.map((opt) => (
                <option key={`p-${opt.value}`} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="wizard-field">
            <span>Advisor model</span>
            <select value={advisor} onChange={(e) => setAdvisor(e.target.value)}>
              {modelOptions.map((opt) => (
                <option key={`a-${opt.value}`} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <button
            className="button-primary"
            onClick={() => onSubmit(false, planner, advisor)}
          >
            Continue
          </button>
        </div>
      )}

      <button className="button-back" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

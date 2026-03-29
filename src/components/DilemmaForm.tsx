import { FormEvent, useState } from "react";
import type {
  ExplanationLevel,
  ProfileTuple,
  PersonaMode
} from "../../shared/contracts";

interface DilemmaFormProps {
  initialDilemma: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  plannerModel: string;
  advisorModel: string;
  isSubmitting?: boolean;
  error?: string | null;
  onBegin: (payload: {
    dilemma: string;
    explanationLevel: ExplanationLevel;
    personaMode: PersonaMode;
    plannerModel: string;
    advisorModel: string;
    profileOverride?: ProfileTuple;
  }) => void;
}

const explanationOptions: { value: ExplanationLevel; label: string; hint: string }[] = [
  {
    value: "general",
    label: "No philosophy training",
    hint: "Plain language and fewer references."
  },
  {
    value: "informed",
    label: "Some philosophy training",
    hint: "Keeps some vocabulary and contrast."
  },
  {
    value: "phd",
    label: "PhD-level philosophical training",
    hint: "Denser distinctions and sharper framing."
  }
];

const modelOptions = [
  { value: "openai:gpt-5.4-mini", label: "GPT-5.4 Mini (default)" },
  { value: "anthropic:claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: "anthropic:claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "anthropic:claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "openai:gpt-4o", label: "GPT-4o" },
  { value: "openai:gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "openai:gpt-5.4", label: "GPT-5.4" },
  { value: "openai:o3-mini", label: "o3-mini" }
];

export function DilemmaForm({
  initialDilemma,
  explanationLevel,
  personaMode,
  plannerModel: initialPlannerModel,
  advisorModel: initialAdvisorModel,
  isSubmitting = false,
  error = null,
  onBegin
}: DilemmaFormProps) {
  const [dilemma, setDilemma] = useState(initialDilemma);
  const [level, setLevel] = useState<ExplanationLevel>(explanationLevel);
  const [mode, setMode] = useState<PersonaMode>(personaMode);
  const [planner, setPlanner] = useState(initialPlannerModel);
  const [advisor, setAdvisor] = useState(initialAdvisorModel);
  const [showTupleEntry, setShowTupleEntry] = useState(false);
  const [tupleFields, setTupleFields] = useState({
    outcomesPrinciples: 0,
    individualCollective: 0,
    reasonIntuition: 0
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBegin({
      dilemma: dilemma.trim(),
      explanationLevel: level,
      personaMode: mode,
      plannerModel: planner,
      advisorModel: advisor
    });
  }

  function updateTupleField(
    field: keyof typeof tupleFields,
    value: number
  ) {
    setTupleFields((current) => ({ ...current, [field]: value }));
  }

  function parseTuple(): ProfileTuple {
    return {
      outcomesPrinciples: tupleFields.outcomesPrinciples,
      individualCollective: tupleFields.individualCollective,
      reasonIntuition: tupleFields.reasonIntuition
    };
  }

  function handleDirectContinue() {
    if (!dilemma.trim()) {
      return;
    }

    onBegin({
      dilemma: dilemma.trim(),
      explanationLevel: level,
      personaMode: mode,
      plannerModel: planner,
      advisorModel: advisor,
      profileOverride: parseTuple()
    });
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">Step 1</p>
        <h2>Name the dilemma</h2>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>What situation are you trying to navigate?</span>
          <textarea
            name="dilemma"
            value={dilemma}
            onChange={(event) => setDilemma(event.target.value)}
            placeholder="Example: I learned something at work that could protect my team if I disclose it, but I would be violating a confidence."
            rows={7}
            required
          />
        </label>
        <div className="controls-grid">
          <fieldset className="field-group control-cluster">
            <legend>Explanation style</legend>
            <p className="control-note">Choose how technical the explanation should feel.</p>
            <div className="segmented-control segmented-control-horizontal">
              {explanationOptions.map((option) => (
                <button
                  key={option.value}
                  aria-pressed={option.value === level}
                  className={
                    option.value === level
                      ? "segmented-option segmented-option-horizontal is-active"
                      : "segmented-option segmented-option-horizontal"
                  }
                  type="button"
                  onClick={() => setLevel(option.value)}
                >
                  <span className="segmented-title">{option.label}</span>
                  <span className="segmented-copy">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="field-group control-cluster">
            <legend>Advice voice</legend>
            <p className="control-note">Choose whether the answer stays profile-based or uses a matched persona.</p>
            <div className="segmented-control segmented-control-vertical">
              <button
                aria-pressed={mode === "personalized"}
                className={
                  mode === "personalized"
                    ? "segmented-option segmented-option-vertical is-active"
                    : "segmented-option segmented-option-vertical"
                }
                type="button"
                onClick={() => setMode("personalized")}
              >
                <span className="segmented-title">Personalized</span>
                <span className="segmented-copy">Use your measured profile directly.</span>
              </button>
              <button
                aria-pressed={mode === "philosopher"}
                className={
                  mode === "philosopher"
                    ? "segmented-option segmented-option-vertical is-active"
                    : "segmented-option segmented-option-vertical"
                }
                type="button"
                onClick={() => setMode("philosopher")}
              >
                <span className="segmented-title">Philosopher persona</span>
                <span className="segmented-copy">Snap to the nearest curated voice.</span>
              </button>
            </div>
          </fieldset>
        </div>
        <div className="controls-grid">
          <label className="field">
            <span>Planner model</span>
            <select value={planner} onChange={(e) => setPlanner(e.target.value)}>
              {modelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Advisor model</span>
            <select value={advisor} onChange={(e) => setAdvisor(e.target.value)}>
              {modelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">
          The app does not save dilemmas or answers. Your profile exists only for
          this session.
        </p>
        <button className="button-primary" type="submit">
          {isSubmitting ? "Requesting advice..." : "Start the 9-question calibration"}
        </button>
        <button
          className="button-secondary"
          disabled={isSubmitting}
          type="button"
          onClick={() => setShowTupleEntry((value) => !value)}
        >
          {showTupleEntry ? "Hide manual tuple entry" : "I already know my 3-axis tuple"}
        </button>
        {showTupleEntry ? (
          <section className="manual-tuple-panel">
            <div className="manual-tuple-header">
              <strong>Skip the 9 questions</strong>
              <span>Position each slider between the two endpoints.</span>
            </div>
            <div className="tuple-sliders">
              <div className="tuple-slider-field">
                <div className="slider-row">
                  <span className="slider-label">Outcomes</span>
                  <input
                    type="range"
                    className="question-slider"
                    min={-100}
                    max={100}
                    step={1}
                    value={tupleFields.outcomesPrinciples * 100}
                    onChange={(e) =>
                      updateTupleField("outcomesPrinciples", Number(e.target.value) / 100)
                    }
                  />
                  <span className="slider-label">Principles</span>
                </div>
                <span className="slider-value">{tupleFields.outcomesPrinciples.toFixed(2)}</span>
              </div>
              <div className="tuple-slider-field">
                <div className="slider-row">
                  <span className="slider-label">Individual</span>
                  <input
                    type="range"
                    className="question-slider"
                    min={-100}
                    max={100}
                    step={1}
                    value={tupleFields.individualCollective * 100}
                    onChange={(e) =>
                      updateTupleField("individualCollective", Number(e.target.value) / 100)
                    }
                  />
                  <span className="slider-label">Collective</span>
                </div>
                <span className="slider-value">{tupleFields.individualCollective.toFixed(2)}</span>
              </div>
              <div className="tuple-slider-field">
                <div className="slider-row">
                  <span className="slider-label">Reason</span>
                  <input
                    type="range"
                    className="question-slider"
                    min={-100}
                    max={100}
                    step={1}
                    value={tupleFields.reasonIntuition * 100}
                    onChange={(e) =>
                      updateTupleField("reasonIntuition", Number(e.target.value) / 100)
                    }
                  />
                  <span className="slider-label">Intuition</span>
                </div>
                <span className="slider-value">{tupleFields.reasonIntuition.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="button-secondary"
              disabled={!dilemma.trim() || isSubmitting}
              type="button"
              onClick={handleDirectContinue}
            >
              {isSubmitting ? "Requesting advice..." : "Skip questions and continue"}
            </button>
          </section>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}

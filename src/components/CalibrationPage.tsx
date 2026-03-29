import { useMemo, useState } from "react";
import type {
  AnswerRecord,
  AnswerValue,
  ProfileTuple,
  Question
} from "../../shared/contracts";
import { axisLabels } from "../../shared/ethics";

interface CalibrationPageProps {
  mode: "questions" | "tuple";
  questions: Question[];
  onCompleteQuestions: (answers: AnswerRecord[]) => void;
  onCompleteTuple: (tuple: ProfileTuple) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const SCALE: { value: AnswerValue; label: string }[] = [
  { value: -2, label: "Strongly" },
  { value: -1, label: "\u2190" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "\u2192" },
  { value: 2, label: "Strongly" }
];

export function CalibrationPage({
  mode,
  questions,
  onCompleteQuestions,
  onCompleteTuple,
  onBack,
  isSubmitting,
  error
}: CalibrationPageProps) {
  if (mode === "tuple") {
    return (
      <TupleEntry
        onComplete={onCompleteTuple}
        onBack={onBack}
        isSubmitting={isSubmitting}
        error={error}
      />
    );
  }

  return (
    <QuestionFlow
      questions={questions}
      onComplete={onCompleteQuestions}
      onBack={onBack}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}

function QuestionFlow({
  questions,
  onComplete,
  onBack,
  isSubmitting,
  error
}: {
  questions: Question[];
  onComplete: (answers: AnswerRecord[]) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const groupedProgress = useMemo(() => {
    return Object.entries(axisLabels).map(([axis, labels]) => ({
      axis,
      title: labels.title,
      count: questions.filter(
        (q) => q.axis === axis && answers[q.id] !== undefined
      ).length
    }));
  }, [answers, questions]);

  function setAnswer(value: AnswerValue) {
    setAnswers((cur) => ({ ...cur, [currentQuestion.id]: value }));
  }

  function next() {
    if (currentAnswer === undefined) return;

    if (currentIndex === questions.length - 1) {
      const payload = questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? 0
      })) as AnswerRecord[];
      onComplete(payload);
      return;
    }

    setCurrentIndex((v) => v + 1);
  }

  function previous() {
    if (currentIndex === 0) {
      onBack();
      return;
    }
    setCurrentIndex((v) => v - 1);
  }

  return (
    <div className="wizard-card wizard-card-wide">
      <div className="progress-shell" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="progress-meta">
        <strong>Question {currentIndex + 1} of {questions.length}</strong>
        <div className="axis-tally">
          {groupedProgress.map((item) => (
            <span key={item.axis}>
              {item.title}: {item.count}/3
            </span>
          ))}
        </div>
      </div>

      <div className="question-block">
        <div className="question-block-top">
          <p className="question-axis">{axisLabels[currentQuestion.axis].title}</p>
          <h3 className="question-prompt">{currentQuestion.prompt}</h3>
        </div>
        <div className="question-block-bottom">
          <div className="scale-labels">
            <span>{currentQuestion.lowLabel}</span>
            <span>{currentQuestion.highLabel}</span>
          </div>
          <div className="scale-grid">
            {SCALE.map((option) => (
              <button
                key={option.value}
                className={`scale-option ${currentAnswer === option.value ? "is-active" : ""}`}
                type="button"
                onClick={() => setAnswer(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="button-row">
        <button className="button-back" type="button" onClick={previous}>
          {currentIndex === 0 ? "Back" : "Previous"}
        </button>
        <button
          className="button-primary"
          type="button"
          disabled={currentAnswer === undefined || isSubmitting}
          onClick={next}
        >
          {isSubmitting && currentIndex === questions.length - 1
            ? "Requesting advice..."
            : currentIndex === questions.length - 1
              ? "See advice"
              : "Next"}
        </button>
      </div>
    </div>
  );
}

function TupleEntry({
  onComplete,
  onBack,
  isSubmitting,
  error
}: {
  onComplete: (tuple: ProfileTuple) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [fields, setFields] = useState({
    outcomesPrinciples: 0,
    individualCollective: 0,
    reasonIntuition: 0
  });

  function update(field: keyof typeof fields, value: number) {
    setFields((cur) => ({ ...cur, [field]: value }));
  }

  function handleSubmit() {
    onComplete(fields);
  }

  return (
    <div className="wizard-card">
      <h2 className="wizard-title">Set your coordinates</h2>
      <p className="wizard-subtitle">
        Position each slider between the two endpoints.
      </p>
      <div className="tuple-sliders">
        {([
          { key: "outcomesPrinciples" as const, neg: "Outcomes", pos: "Principles" },
          { key: "individualCollective" as const, neg: "Individual", pos: "Collective" },
          { key: "reasonIntuition" as const, neg: "Reason", pos: "Intuition" }
        ]).map((axis) => (
          <div className="tuple-slider-field" key={axis.key}>
            <div className="slider-row">
              <span className="slider-label">{axis.neg}</span>
              <input
                type="range"
                className="question-slider"
                min={-100}
                max={100}
                step={1}
                value={fields[axis.key] * 100}
                onChange={(e) => update(axis.key, Number(e.target.value) / 100)}
              />
              <span className="slider-label">{axis.pos}</span>
            </div>
            <span className="slider-value">{fields[axis.key].toFixed(2)}</span>
          </div>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="button-primary"
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Requesting advice..." : "Get advice"}
        </button>
      </div>
    </div>
  );
}

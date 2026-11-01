import { useMemo, useState } from "react";
import type {
  AnswerRecord,
  AnswerValue,
  Question
} from "../../shared/contracts";
import { axisLabels } from "../../shared/ethics";

interface AssessmentFlowProps {
  questions: Question[];
  onBack: () => void;
  onComplete: (answers: AnswerRecord[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const SCALE: { value: AnswerValue; label: string }[] = [
  { value: -2, label: "Strongly" },
  { value: -1, label: "Somewhat" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "Somewhat" },
  { value: 2, label: "Strongly" }
];

export function AssessmentFlow({
  questions,
  onBack,
  onComplete,
  isSubmitting,
  error
}: AssessmentFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return null;
  }

  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const groupedProgress = useMemo(() => {
    return Object.entries(axisLabels).map(([axis, labels]) => ({
      axis,
      title: labels.title,
      count: questions.filter((question) => question.axis === axis && answers[question.id] !== undefined)
        .length
    }));
  }, [answers, questions]);

  function setAnswer(value: AnswerValue) {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
  }

  async function next() {
    if (currentAnswer === undefined) {
      return;
    }

    if (currentIndex === questions.length - 1) {
      const payload = questions.map((question) => ({
        questionId: question.id,
        value: answers[question.id] ?? (question.id === currentQuestion.id ? currentAnswer : 0)
      })) as AnswerRecord[];

      await onComplete(payload);
      return;
    }

    setCurrentIndex((value) => value + 1);
  }

  function previous() {
    if (currentIndex === 0) {
      onBack();
      return;
    }

    setCurrentIndex((value) => value - 1);
  }

  return (
    <section className="panel assessment-panel">
      <div className="panel-header">
        <p className="eyebrow">Step 2</p>
        <h2>Place yourself on the ethical field</h2>
      </div>
      <div className="progress-shell" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-meta">
        <strong>
          Question {currentIndex + 1} of {questions.length}
        </strong>
        <div className="axis-tally">
          {groupedProgress.map((item) => (
            <span key={item.axis}>
              {item.title}: {item.count}/3
            </span>
          ))}
        </div>
      </div>
      <article className="question-card">
        <p className="question-axis">{axisLabels[currentQuestion.axis].title}</p>
        <h3>{currentQuestion.prompt}</h3>
        <div className="scale-labels">
          <span>{currentQuestion.lowLabel}</span>
          <span>{currentQuestion.highLabel}</span>
        </div>
        <div className="scale-grid">
          {SCALE.map((option) => (
            <button
              key={option.value}
              className={currentAnswer === option.value ? "scale-option is-active" : "scale-option"}
              type="button"
              onClick={() => setAnswer(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </article>
      {error ? <p className="error">{error}</p> : null}
      <div className="button-row">
        <button className="button-secondary" type="button" onClick={previous}>
          {currentIndex === 0 ? "Back to dilemma" : "Previous"}
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
              : "Next question"}
        </button>
      </div>
    </section>
  );
}

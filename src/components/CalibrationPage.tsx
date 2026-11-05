import { useEffect, useRef, useState } from "react";
import type {
  AnswerRecord,
  AnswerValue,
  ProfileTuple,
  Question
} from "../../shared/contracts";
import { axisLabels, describeAxisPosition } from "../../shared/ethics";
import { navigateRadios } from "./radioNavigation";
import { PageHeader } from "./PageHeader";

interface CalibrationPageProps {
  mode: "questions" | "tuple";
  questions: Question[];
  initialAnswers: AnswerRecord[];
  initialTuple: ProfileTuple | null;
  onCompleteQuestions: (answers: AnswerRecord[]) => void;
  onCompleteTuple: (tuple: ProfileTuple) => void;
  onBack: () => void;
}

// Ends show the pole label on its own; inner points lean toward it. This reads naturally
// whether a pole is a position ("Judge by outcomes") or a degree ("Very little").
const SCALE: AnswerValue[] = [-2, -1, 0, 1, 2];

export function CalibrationPage({
  mode,
  questions,
  initialAnswers,
  initialTuple,
  onCompleteQuestions,
  onCompleteTuple,
  onBack
}: CalibrationPageProps) {
  if (mode === "tuple") {
    return (
      <TupleEntry
        initialTuple={initialTuple}
        onComplete={onCompleteTuple}
        onBack={onBack}
      />
    );
  }

  return (
    <QuestionFlow
      questions={questions}
      initialAnswers={initialAnswers}
      onComplete={onCompleteQuestions}
      onBack={onBack}
    />
  );
}

function QuestionFlow({
  questions,
  initialAnswers,
  onComplete,
  onBack
}: {
  questions: Question[];
  initialAnswers: AnswerRecord[];
  onComplete: (answers: AnswerRecord[]) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => Object.fromEntries(initialAnswers.map(answer => [answer.questionId, answer.value])));
  // Returning to a finished questionnaire resumes at the last question rather than the first.
  const [currentIndex, setCurrentIndex] = useState(() =>
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined) ? questions.length - 1 : 0
  );
  const groupRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    // Keep keyboard users on the answers when the question changes (not on first render).
    if (!moved.current) return;
    groupRef.current?.querySelector<HTMLButtonElement>('[role="radio"][tabindex="0"]')?.focus();
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const currentAnswer = answers[currentQuestion.id];
  const isLast = currentIndex === questions.length - 1;

  function setAnswer(value: AnswerValue) {
    setAnswers((cur) => ({ ...cur, [currentQuestion.id]: value }));
  }

  function next() {
    if (currentAnswer === undefined) return;

    if (isLast) {
      const payload = questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? 0
      })) as AnswerRecord[];
      onComplete(payload);
      return;
    }

    moved.current = true;
    setCurrentIndex((v) => v + 1);
  }

  function previous() {
    if (currentIndex === 0) {
      onBack();
      return;
    }
    moved.current = true;
    setCurrentIndex((v) => v - 1);
  }

  const promptId = `question-${currentQuestion.id}`;

  return (
    <div className="wizard-card calibration-page">
      <div className="wizard-scroll">
      <div className="question-progress">
        <p className="eyebrow">Step 2 of 4 · Calibration</p>
        <div className="progress-meta">
          <strong aria-live="polite">Question {currentIndex + 1} of {questions.length}</strong>
          <span>{Object.keys(answers).filter((id) => questions.some((q) => q.id === id)).length} answered</span>
        </div>
        <ol className="progress-segments" aria-hidden="true">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className={`${answers[q.id] !== undefined ? "is-done" : ""} ${index === currentIndex ? "is-current" : ""}`}
            />
          ))}
        </ol>
      </div>

      <div className="question-block" key={currentQuestion.id}>
        <p className="question-axis">{axisLabels[currentQuestion.axis].title}</p>
        <h2 className="question-prompt" id={promptId}>{currentQuestion.prompt}</h2>
        <div
          className="scale-grid"
          role="radiogroup"
          aria-labelledby={promptId}
          ref={groupRef}
          onKeyDown={navigateRadios}
        >
          {SCALE.map((value) => {
            const pole = value < 0 ? currentQuestion.lowLabel : value > 0 ? currentQuestion.highLabel : "";
            const extreme = Math.abs(value) === 2;
            const checked = currentAnswer === value;
            const focusable = currentAnswer === undefined ? value === 0 : checked;
            return (
              <button
                key={value}
                className={`scale-option ${extreme ? "is-extreme" : ""} ${checked ? "is-active" : ""}`}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={focusable ? 0 : -1}
                aria-label={value === 0 ? "Neutral" : extreme ? pole : `Leaning toward: ${pole}`}
                onClick={() => setAnswer(value)}
              >
                <span className="scale-dot" aria-hidden="true" />
                {value === 0 ? (
                  <><span className="scale-strength">Neutral</span><span className="scale-pole">No preference</span></>
                ) : extreme ? (
                  <span className="scale-strength">{pole}</span>
                ) : (
                  <><span className="scale-pole scale-lean">Leaning toward</span><span className="scale-strength is-lean">{pole}</span></>
                )}
              </button>
            );
          })}
        </div>
        <p className="form-note scale-help">Use the arrow keys to move between answers.</p>
      </div>

      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={previous}>
          {currentIndex === 0 ? "Back" : "Previous"}
        </button>
        <button
          className="button-primary"
          type="button"
          disabled={currentAnswer === undefined}
          onClick={next}
        >
          {isLast ? "Continue" : "Next"}
        </button>
      </div>
    </div>
  );
}

const AXES: { key: keyof ProfileTuple; neg: string; pos: string; negHint: string; posHint: string }[] = [
  { key: "outcomesPrinciples", neg: "Outcomes", pos: "Principles", negHint: "Judge actions by their consequences", posHint: "Judge actions by duties and rules" },
  { key: "individualCollective", neg: "Individual", pos: "Collective", negHint: "Personal freedom and rights come first", posHint: "Community and shared good come first" },
  { key: "reasonIntuition", neg: "Reason", pos: "Intuition", negHint: "Trust explicit argument", posHint: "Trust moral feeling and lived wisdom" }
];

function TupleEntry({
  initialTuple,
  onComplete,
  onBack
}: {
  initialTuple: ProfileTuple | null;
  onComplete: (tuple: ProfileTuple) => void;
  onBack: () => void;
}) {
  const [fields, setFields] = useState(initialTuple || {
    outcomesPrinciples: 0,
    individualCollective: 0,
    reasonIntuition: 0
  });

  function update(field: keyof typeof fields, value: number) {
    setFields((cur) => ({ ...cur, [field]: value }));
  }

  return (
    <div className="wizard-card tuple-page">
      <div className="wizard-scroll">
      <PageHeader step="Step 2 of 4 · Your coordinates" title="Set your coordinates">
        Drag each slider toward the side that sounds more like you. The middle means you weigh both equally.
      </PageHeader>
      <div className="tuple-sliders">
        {AXES.map((axis) => {
          const value = fields[axis.key];
          const description = describeAxisPosition(axis.key, value);
          return (
            <div className="tuple-slider-field" key={axis.key}>
              <div className="slider-head">
                <h3 className="slider-title">{axis.neg} <span>vs</span> {axis.pos}</h3>
                <output className="slider-value" htmlFor={`slider-${axis.key}`}>
                  {description} <span>({value >= 0 ? "+" : ""}{value.toFixed(2)})</span>
                </output>
              </div>
              <input
                id={`slider-${axis.key}`}
                type="range"
                aria-label={`${axis.neg} to ${axis.pos}`}
                aria-valuetext={`${description} (${value >= 0 ? "+" : ""}${value.toFixed(2)})`}
                className="question-slider"
                min={-100}
                max={100}
                step={5}
                value={Math.round(value * 100)}
                onChange={(e) => update(axis.key, Number(e.target.value) / 100)}
              />
              <div className="slider-poles">
                <span><strong>{axis.neg}</strong>{axis.negHint}</span>
                <span><strong>{axis.pos}</strong>{axis.posHint}</span>
              </div>
            </div>
          );
        })}
      </div>

      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="button-primary"
          type="button"
          onClick={() => onComplete(fields)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

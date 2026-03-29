import { useState, useCallback } from "react";
import type {
  AdviceResponse,
  AnswerRecord,
  ExplanationLevel,
  ProfileTuple,
  PersonaMode,
  Question
} from "../shared/contracts";
import { randomizeQuestions } from "../shared/ethics";
import { createSession, ApiError, requestAdvice } from "./api/client";
import { PasswordGate } from "./components/PasswordGate";
import { DilemmaPage } from "./components/DilemmaPage";
import { ExplanationPage } from "./components/ExplanationPage";
import { VoicePage } from "./components/VoicePage";
import { ModelPage } from "./components/ModelPage";
import { PathPage } from "./components/PathPage";
import { CalibrationPage } from "./components/CalibrationPage";
import { ResultsView } from "./components/ResultsView";
import { LoadingOverlay } from "./components/LoadingOverlay";

type Phase =
  | "locked"
  | "dilemma"
  | "explanation"
  | "voice"
  | "models"
  | "path"
  | "calibration"
  | "results";

const SESSION_STORAGE_KEY = "isocrateez-token";

export default function App() {
  const [phase, setPhase] = useState<Phase>(() =>
    sessionStorage.getItem(SESSION_STORAGE_KEY) ? "dilemma" : "locked"
  );
  const [prevPhase, setPrevPhase] = useState<Phase | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [dilemma, setDilemma] = useState("");
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>("general");
  const [personaMode, setPersonaMode] = useState<PersonaMode>("personalized");
  const [plannerModel, setPlannerModel] = useState("openai:gpt-5.4-mini");
  const [advisorModel, setAdvisorModel] = useState("openai:gpt-5.4-mini");
  const [calibrationMode, setCalibrationMode] = useState<"questions" | "tuple">("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profileOverride, setProfileOverride] = useState<ProfileTuple | null>(null);

  const [response, setResponse] = useState<AdviceResponse | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  function goTo(next: Phase) {
    setPrevPhase(phase);
    setPhase(next);
  }

  async function handleUnlock(password: string) {
    setIsUnlocking(true);
    setAuthError(null);
    try {
      const session = await createSession(password);
      sessionStorage.setItem(SESSION_STORAGE_KEY, session.token);
      setSessionToken(session.token);
      goTo("dilemma");
    } catch (error) {
      setAuthError(
        error instanceof ApiError ? error.message : "Unable to unlock the app right now."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function handleDilemmaSubmit(text: string) {
    setDilemma(text);
    goTo("explanation");
  }

  function handleExplanation(level: ExplanationLevel) {
    setExplanationLevel(level);
    goTo("voice");
  }

  function handleVoice(mode: PersonaMode) {
    setPersonaMode(mode);
    goTo("models");
  }

  function handleModels(useDefaults: boolean, planner?: string, advisor?: string) {
    if (!useDefaults && planner && advisor) {
      setPlannerModel(planner);
      setAdvisorModel(advisor);
    }
    goTo("path");
  }

  function handlePath(mode: "questions" | "tuple") {
    setCalibrationMode(mode);
    if (mode === "questions") {
      setQuestions(randomizeQuestions());
    }
    goTo("calibration");
  }

  const fetchAdvice = useCallback(async (
    nextAnswers: AnswerRecord[],
    nextProfileOverride: ProfileTuple | null
  ) => {
    if (!sessionToken) {
      goTo("locked");
      return;
    }

    setIsLoadingAdvice(true);
    setLoadingStartTime(Date.now());
    setAdviceError(null);
    setProfileOverride(nextProfileOverride);

    try {
      const nextResponse = await requestAdvice({
        token: sessionToken,
        dilemma,
        answers: nextAnswers,
        profileOverride: nextProfileOverride || undefined,
        explanationLevel,
        personaMode,
        plannerModel: plannerModel || undefined,
        advisorModel: advisorModel || undefined
      });
      setResponse(nextResponse);
      goTo("results");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionToken(null);
        goTo("locked");
        setAuthError("Your session expired. Enter the shared password again.");
        return;
      }
      setAdviceError(
        error instanceof ApiError ? error.message : "Advice generation failed. Try again."
      );
    } finally {
      setIsLoadingAdvice(false);
      setLoadingStartTime(null);
    }
  }, [sessionToken, dilemma, explanationLevel, personaMode, plannerModel, advisorModel]);

  function handleCalibrationComplete(answers: AnswerRecord[]) {
    void fetchAdvice(answers, null);
  }

  function handleTupleComplete(tuple: ProfileTuple) {
    void fetchAdvice([], tuple);
  }

  function resetFlow() {
    setQuestions([]);
    setProfileOverride(null);
    setResponse(null);
    setAdviceError(null);
    goTo("dilemma");
  }

  const direction = getDirection(prevPhase, phase);

  return (
    <div className="app-shell">
      <header className="sticky-hero">
        <h1>iSocrateez</h1>
      </header>

      <main className="page-stage">
        <div className={`page-content page-${direction}`} key={phase}>
          {phase === "locked" && (
            <PasswordGate
              error={authError}
              isSubmitting={isUnlocking}
              onSubmit={handleUnlock}
            />
          )}

          {phase === "dilemma" && (
            <DilemmaPage
              initialDilemma={dilemma}
              onSubmit={handleDilemmaSubmit}
            />
          )}

          {phase === "explanation" && (
            <ExplanationPage
              current={explanationLevel}
              onSelect={handleExplanation}
              onBack={() => goTo("dilemma")}
            />
          )}

          {phase === "voice" && (
            <VoicePage
              current={personaMode}
              onSelect={handleVoice}
              onBack={() => goTo("explanation")}
            />
          )}

          {phase === "models" && (
            <ModelPage
              plannerModel={plannerModel}
              advisorModel={advisorModel}
              onSubmit={handleModels}
              onBack={() => goTo("voice")}
            />
          )}

          {phase === "path" && (
            <PathPage
              onSelect={handlePath}
              onBack={() => goTo("models")}
            />
          )}

          {phase === "calibration" && (
            <CalibrationPage
              mode={calibrationMode}
              questions={questions}
              onCompleteQuestions={handleCalibrationComplete}
              onCompleteTuple={handleTupleComplete}
              onBack={() => goTo("path")}
              isSubmitting={isLoadingAdvice}
              error={adviceError}
            />
          )}

          {phase === "results" && response && (
            <ResultsView
              response={response}
              dilemma={dilemma}
              explanationLevel={explanationLevel}
              personaMode={personaMode}
              onRestart={resetFlow}
            />
          )}

          {isLoadingAdvice && loadingStartTime && (
            <LoadingOverlay startTime={loadingStartTime} />
          )}
        </div>
      </main>
    </div>
  );
}

const PHASE_ORDER: Phase[] = [
  "locked", "dilemma", "explanation", "voice", "models", "path", "calibration", "results"
];

function getDirection(prev: Phase | null, next: Phase): "enter" | "forward" | "backward" {
  if (!prev) return "enter";
  const prevIdx = PHASE_ORDER.indexOf(prev);
  const nextIdx = PHASE_ORDER.indexOf(next);
  return nextIdx >= prevIdx ? "forward" : "backward";
}

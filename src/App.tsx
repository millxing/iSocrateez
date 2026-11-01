import { useState, useCallback, useEffect, useRef } from "react";
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
import { SettingsPage } from "./components/SettingsPage";
import { modelOptions } from "../shared/models";
import { PhilosopherPage } from "./components/PhilosopherPage";
import { PathPage } from "./components/PathPage";
import { CalibrationPage } from "./components/CalibrationPage";
import { ResultsView } from "./components/ResultsView";
import { LoadingOverlay } from "./components/LoadingOverlay";

type Phase =
  | "locked"
  | "dilemma"
  | "path"
  | "calibration"
  | "philosopher"
  | "explanation"
  | "results";

function savedModel(key: string, fallback: string) {
  try {
    const value = localStorage.getItem(key);
    return modelOptions.some(option => option.value === value) ? value! : fallback;
  } catch { return fallback; }
}

const SESSION_STORAGE_KEY = "isocrateez-v2-production-token";

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
  const [flowRevision, setFlowRevision] = useState(0);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>("general");
  const [chosenPhilosopher, setChosenPhilosopher] = useState<string | null>(null);
  const personaMode: PersonaMode = chosenPhilosopher ? "philosopher" : "personalized";
  const [plannerModel, setPlannerModel] = useState(() => savedModel("isocrateez-v2-planner", "anthropic:claude-haiku-5-5"));
  const [advisorModel, setAdvisorModel] = useState(() => savedModel("isocrateez-v2-advisor", "anthropic:claude-sonnet-5-5"));
  const [calibrationMode, setCalibrationMode] = useState<"questions" | "tuple">("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
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
    goTo("path");
  }

  function handlePath(mode: "questions" | "tuple" | "philosopher") {
    if (mode === "philosopher") {
      goTo("philosopher");
      return;
    }
    setChosenPhilosopher(null);
    setCalibrationMode(mode);
    if (mode === "questions" && questions.length === 0) {
      setQuestions(randomizeQuestions());
    }
    goTo("calibration");
  }

  function handlePhilosopher(profileId: string) {
    setChosenPhilosopher(profileId);
    setAnswers([]);
    setProfileOverride(null);
    goTo("explanation");
  }

  function handleCalibrationComplete(nextAnswers: AnswerRecord[]) {
    setAnswers(nextAnswers);
    setProfileOverride(null);
    goTo("explanation");
  }

  function handleTupleComplete(tuple: ProfileTuple) {
    setAnswers([]);
    setProfileOverride(tuple);
    goTo("explanation");
  }

  const fetchAdvice = useCallback(async (nextPlanner: string, nextAdvisor: string) => {
    if (!sessionToken) {
      goTo("locked");
      return;
    }

    setIsLoadingAdvice(true);
    setLoadingStartTime(Date.now());
    setAdviceError(null);

    try {
      const nextResponse = await requestAdvice({
        token: sessionToken,
        dilemma,
        answers,
        profileOverride: profileOverride || undefined,
        philosopherId: chosenPhilosopher || undefined,
        explanationLevel,
        personaMode,
        plannerModel: nextPlanner || undefined,
        advisorModel: nextAdvisor || undefined
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
  }, [sessionToken, dilemma, answers, profileOverride, chosenPhilosopher, explanationLevel, personaMode]);

  function resetFlow() {
    setDilemma("");
    setFlowRevision(value => value + 1);
    setSettingsOpen(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#reflection");
    setQuestions([]);
    setAnswers([]);
    setProfileOverride(null);
    setChosenPhilosopher(null);
    setResponse(null);
    setAdviceError(null);
    goTo(sessionToken ? "dilemma" : "locked");
  }

  const [settingsOpen, setSettingsOpen] = useState(() => window.location.hash === "#settings");
  useEffect(() => {
    const sync = () => setSettingsOpen(window.location.hash === "#settings");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("isocrateez-v2-planner", plannerModel);
      localStorage.setItem("isocrateez-v2-advisor", advisorModel);
    } catch { /* Settings still work for this session. */ }
  }, [plannerModel, advisorModel]);

  const direction = getDirection(prevPhase, phase);
  const stageRef = useRef<HTMLElement>(null);
  const [appearance, setAppearance] = useState(() => {
    try { return localStorage.getItem("isocrateez-v2-appearance") || "system"; }
    catch { return "system"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
    try { localStorage.setItem("isocrateez-v2-appearance", appearance); } catch { /* preference is optional */ }
  }, [appearance]);
  useEffect(() => {
    stageRef.current?.focus();
    window.scrollTo?.(0, 0);
  }, [phase, settingsOpen]);
  const step = phase === "locked" ? -1 : phase === "dilemma" ? 0 : ["path", "calibration", "philosopher"].includes(phase) ? 1 : phase === "explanation" ? 2 : 3;
  const steps = ["Dilemma", "Perspective", "Style", "Advice"];

  function revisitStep(index: number) {
    if (index >= step || isLoadingAdvice || settingsOpen) return;
    setResponse(null);
    setAdviceError(null);
    if (index === 0) goTo("dilemma");
    else if (index === 1) goTo(chosenPhilosopher ? "philosopher" : "calibration");
    else if (index === 2) goTo("explanation");
  }


  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Session progress">
        <h1 className="brand"><button className="brand-home" type="button" onClick={resetFlow} disabled={isLoadingAdvice} aria-label="iSocrateez — new dilemma"><img src={`${import.meta.env.BASE_URL}socrates-bust.png`} alt="" width="48" height="48" /><span>iSocrateez</span></button></h1>
        <ol className="step-list">
          {steps.map((label, index) => (
            <li key={label} className={`${step === index ? "current" : ""} ${step > index ? "complete" : ""}`} aria-current={step === index ? "step" : undefined}>
              {index < step ? (
                <button className="step-link" type="button" aria-label={label}
                  disabled={isLoadingAdvice || settingsOpen} onClick={() => revisitStep(index)}>
                  <span className="step-number" aria-hidden="true">✓</span>
                  <span className="step-label">{label}</span>
                </button>
              ) : <><span className="step-number" aria-hidden="true">{index + 1}</span><span className="step-label">{label}</span></>}
            </li>
          ))}
        </ol>
        <nav className="settings-nav" aria-label="App"><a href="#settings" aria-current={settingsOpen ? "page" : undefined}>Settings</a></nav>
        <div className="sidebar-footer"><a href="https://entangledparticles.xyz" target="_blank" rel="noopener noreferrer">entangledparticles.xyz ↗</a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer license">CC BY-SA 4.0</a></div>
      </aside>
      <div className="workspace">
        <main className="page-stage" id="main" ref={stageRef} tabIndex={-1} aria-label={settingsOpen ? "Settings" : phase === "locked" ? "Sign in" : steps[step]} aria-busy={isLoadingAdvice}>
        {settingsOpen && <SettingsPage appearance={appearance} onAppearance={setAppearance}
          plannerModel={plannerModel} onPlannerModel={setPlannerModel}
          advisorModel={advisorModel} onAdvisorModel={setAdvisorModel} />}
        <div className={`page-content page-${direction}`} key={`${phase}:${flowRevision}`} hidden={settingsOpen}>
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

          {phase === "path" && (
            <PathPage
              onSelect={handlePath}
              onBack={() => goTo("dilemma")}
            />
          )}

          {phase === "philosopher" && (
            <PhilosopherPage
              initialId={chosenPhilosopher}
              onSubmit={handlePhilosopher}
              onBack={() => goTo("path")}
            />
          )}

          {phase === "calibration" && (
            <CalibrationPage
              mode={calibrationMode}
              questions={questions}
              initialAnswers={answers}
              initialTuple={profileOverride}
              onCompleteQuestions={handleCalibrationComplete}
              onCompleteTuple={handleTupleComplete}
              onBack={() => goTo("path")}
            />
          )}

          {phase === "explanation" && (
            <ExplanationPage
              current={explanationLevel}
              onSelect={setExplanationLevel}
              onSubmit={() => void fetchAdvice(plannerModel, advisorModel)}
              isSubmitting={isLoadingAdvice}
              error={adviceError}
              onBack={() => goTo("path")}
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
        </div>
      </main>
      </div>

      {isLoadingAdvice && loadingStartTime && (
        <LoadingOverlay startTime={loadingStartTime} />
      )}
    </div>
  );
}

const PHASE_ORDER: Phase[] = [
  "locked", "dilemma", "path", "calibration", "philosopher", "explanation", "results"
];

function getDirection(prev: Phase | null, next: Phase): "enter" | "forward" | "backward" {
  if (!prev) return "enter";
  const prevIdx = PHASE_ORDER.indexOf(prev);
  const nextIdx = PHASE_ORDER.indexOf(next);
  return nextIdx >= prevIdx ? "forward" : "backward";
}

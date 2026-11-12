import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type {
  AdviceResponse,
  DebateParticipants,
  AnswerRecord,
  ExplanationLevel,
  ProfileTuple,
  PersonaMode,
  Question
} from "../shared/contracts";
import { extendQuestions, randomizeQuestions } from "../shared/ethics";
import { questionBank } from "../shared/questionBank";
import type { LoadedCalibration } from "./calibrationFile";
import { createSession, ApiError, requestAdvice, requestDebateTurn } from "./api/client";
import { PasswordGate } from "./components/PasswordGate";
import { DilemmaPage } from "./components/DilemmaPage";
import { ExplanationPage } from "./components/ExplanationPage";
import { SettingsPage } from "./components/SettingsPage";
import { modelOptions } from "../shared/models";
import { PhilosopherPage } from "./components/PhilosopherPage";
import { PathPage } from "./components/PathPage";
import { CalibrationPage } from "./components/CalibrationPage";
import { ResultsView } from "./components/ResultsView";
import { DebatePage, type DebateSession } from "./components/DebatePage";
import { LoadingOverlay } from "./components/LoadingOverlay";

type Phase =
  | "locked"
  | "dilemma"
  | "path"
  | "calibration"
  | "philosopher"
  | "explanation"
  | "results"
  | "debate";

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
  const [draft, setDraft] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [flowRevision, setFlowRevision] = useState(0);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>(() => {
    try {
      const saved = localStorage.getItem("isocrateez-v2-style");
      return saved === "informed" || saved === "phd" ? saved : "general";
    } catch { return "general"; }
  });
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
  const adviceAbort = useRef<AbortController | null>(null);
  // The inputs that produced `response`; results stay reachable until an input changes.
  const [responseKey, setResponseKey] = useState<string | null>(null);
  const inputsKey = JSON.stringify([dilemma, answers, profileOverride, chosenPhilosopher, explanationLevel]);
  const resultsAreCurrent = Boolean(response) && responseKey === inputsKey;

  const [debate, setDebate] = useState<DebateSession | null>(null);
  const [debateError, setDebateError] = useState<string | null>(null);
  const [isLoadingDebate, setIsLoadingDebate] = useState(false);
  const debateAbort = useRef<AbortController | null>(null);

  function cancelDebate() {
    debateAbort.current?.abort();
    debateAbort.current = null;
    setIsLoadingDebate(false);
  }

  function clearDebate() {
    cancelDebate();
    setDebate(null);
    setDebateError(null);
  }

  // A debate belongs to the exact dilemma and perspective that produced the advice.
  useEffect(() => { clearDebate(); }, [inputsKey]);
  useEffect(() => () => { debateAbort.current?.abort(); }, []);

  async function fetchDebateTurn(current: DebateSession) {
    if (debateAbort.current || current.complete) return;
    if (!sessionToken) { goTo("locked"); return; }
    let messages = current.messages;
    if (current.participants.mode === "user" && messages.length % 2 === 0) {
      if (!current.draft.trim()) return;
      messages = [...messages, { speakerId: "user", content: current.draft.trim() }];
    }
    const pending = { ...current, messages, draft: "" };
    setDebate(pending);
    setDebateError(null);
    setIsLoadingDebate(true);
    const controller = new AbortController();
    debateAbort.current = controller;
    try {
      const reply = await requestDebateTurn({
        token: sessionToken, dilemma: current.dilemma, participants: current.participants,
        messages, explanationLevel: current.explanationLevel, advisorModel: current.advisorModel
      }, controller.signal);
      if (controller.signal.aborted || debateAbort.current !== controller) return;
      setDebate(reply.safetyMode === "supportive_refusal"
        ? { ...pending, complete: true, safetyMarkdown: reply.safetyMarkdown }
        : { ...pending, messages: [...messages, reply.message], complete: reply.complete });
    } catch (error) {
      if (controller.signal.aborted || debateAbort.current !== controller) return;
      if (error instanceof ApiError && error.status === 401) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionToken(null);
        setAuthError("Your session expired. Enter the shared password again.");
        goTo("locked");
        return;
      }
      setDebateError(error instanceof ApiError ? error.message : "The reply failed. Try again.");
    } finally {
      if (debateAbort.current === controller) {
        debateAbort.current = null;
        setIsLoadingDebate(false);
      }
    }
  }

  function startDebate(participants: DebateParticipants) {
    const next: DebateSession = { dilemma, participants, explanationLevel, advisorModel, messages: [], draft: "", complete: false };
    setDebate(next);
    setDebateError(null);
    if (participants.mode === "philosophers") void fetchDebateTurn(next);
  }

  function goTo(next: Phase) {
    if (next !== "debate") cancelDebate();
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
      goTo(debate ? "debate" : "dilemma");
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

  function handleLoadCalibration(loaded: LoadedCalibration) {
    setChosenPhilosopher(null);
    if ("answers" in loaded) {
      // Keep the answer order so the questionnaire reads as it did when it was saved.
      const byId = new Map(questionBank.map(question => [question.id, question]));
      setQuestions(loaded.answers.flatMap(answer => byId.get(answer.questionId) ?? []));
      setAnswers(loaded.answers);
      setProfileOverride(null);
      setCalibrationMode("questions");
    } else {
      setAnswers([]);
      setProfileOverride(loaded.profile);
      setCalibrationMode("tuple");
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
    const controller = new AbortController();
    adviceAbort.current = controller;

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
      }, controller.signal);
      setResponse(nextResponse);
      setResponseKey(inputsKey);
      goTo("results");
    } catch (error) {
      if (controller.signal.aborted) return;
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
      if (adviceAbort.current === controller) adviceAbort.current = null;
      setIsLoadingAdvice(false);
      setLoadingStartTime(null);
    }
  }, [sessionToken, dilemma, answers, profileOverride, chosenPhilosopher, explanationLevel, personaMode, inputsKey]);

  function cancelAdvice() {
    adviceAbort.current?.abort();
    requestAnimationFrame(() => stageRef.current?.querySelector<HTMLElement>(".button-row .button-primary")?.focus());
  }

  function resetFlow() {
    clearDebate();
    setConfirmingReset(false);
    setDraft("");
    setDilemma("");
    setFlowRevision(value => value + 1);
    setSettingsOpen(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#reflection");
    setQuestions([]);
    setAnswers([]);
    setProfileOverride(null);
    setChosenPhilosopher(null);
    setResponse(null);
    setResponseKey(null);
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
      localStorage.setItem("isocrateez-v2-style", explanationLevel);
    } catch { /* Settings still work for this session. */ }
  }, [plannerModel, advisorModel, explanationLevel]);

  const direction = getDirection(prevPhase, phase);
  const stageRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  // Layout effect so `inert` is lifted before child effects (e.g. focusing an error) run.
  useLayoutEffect(() => {
    // The loading dialog is modal: keep focus and assistive tech out of the page behind it.
    const modalOpen = isLoadingAdvice || confirmingReset;
    shellRef.current?.querySelector(".sidebar")?.toggleAttribute("inert", modalOpen);
    shellRef.current?.querySelector(".workspace")?.toggleAttribute("inert", modalOpen);
  }, [isLoadingAdvice, confirmingReset]);
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

  const perspectiveRoute: Phase = chosenPhilosopher ? "philosopher" : profileOverride || answers.length ? "calibration" : "path";
  // An unsubmitted edit on the dilemma page means the saved advice no longer matches.
  const draftPending = phase === "dilemma" && draft.trim() !== dilemma;
  const adviceReachable = resultsAreCurrent && !draftPending;
  const canRevisit = (index: number) => (index !== step || phase === "debate") && (index < step || adviceReachable);
  const hasWork = Boolean(draft.trim() || dilemma || response);

  // Captured before the dialog makes the page inert, so focus can return to it on cancel.
  const resetOpener = useRef<HTMLElement | null>(null);
  function requestReset() {
    if (hasWork && sessionToken) {
      resetOpener.current = document.activeElement as HTMLElement | null;
      setConfirmingReset(true);
    } else resetFlow();
  }
  function cancelReset() {
    setConfirmingReset(false);
    requestAnimationFrame(() => resetOpener.current?.focus());
  }

  function revisitStep(index: number) {
    if (!canRevisit(index) || isLoadingAdvice || settingsOpen) return;
    setAdviceError(null);
    if (index === 3) goTo("results");
    else if (index === 0) goTo("dilemma");
    else if (index === 1) goTo(chosenPhilosopher ? "philosopher" : "calibration");
    else if (index === 2) goTo("explanation");
  }


  // The sign-in page stands alone: no progress sidebar until there is a session.
  const welcomeView = phase === "locked" && !settingsOpen;

  return (
    <div className={`app-shell ${welcomeView ? "is-welcome" : ""}`} ref={shellRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      {!welcomeView && <aside className="sidebar" aria-label="Session progress">
        <h1 className="brand"><button className="brand-home" type="button" onClick={requestReset} disabled={isLoadingAdvice} aria-label="iSocrateez — new dilemma"><img src={`${import.meta.env.BASE_URL}socrates-bust.png`} alt="" width="48" height="48" /><span>iSocrateez</span></button></h1>
        <ol className="step-list">
          {steps.map((label, index) => (
            <li key={label} className={`${step === index ? "current" : ""} ${canRevisit(index) ? "complete" : ""}`} aria-current={step === index ? "step" : undefined}>
              {canRevisit(index) ? (
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
      </aside>}
      <div className="workspace">
        <main className="page-stage" id="main" ref={stageRef} tabIndex={-1} aria-label={settingsOpen ? "Settings" : phase === "locked" ? "Sign in" : phase === "debate" ? "Debate" : steps[step]} aria-busy={isLoadingAdvice}>
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
              onDraftChange={setDraft}
              onSubmit={handleDilemmaSubmit}
            />
          )}

          {phase === "path" && (
            <PathPage
              onSelect={handlePath}
              onLoadCalibration={handleLoadCalibration}
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
              onExtend={questions.length < questionBank.length ? () => setQuestions(current => extendQuestions(current)) : undefined}
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
              onBack={() => goTo(perspectiveRoute)}
            />
          )}

          {phase === "results" && response && (
            <ResultsView
              response={response}
              perspectiveLabel={chosenPhilosopher ? "Philosopher's voice" : profileOverride ? "Your own coordinates" : `${answers.length}-question calibration`}
              dilemma={dilemma}
              explanationLevel={explanationLevel}
              personaMode={personaMode}
              onRestart={requestReset}
              onDebate={() => goTo("debate")}
            />
          )}
          {phase === "debate" && response && (
            <DebatePage session={debate} dilemma={dilemma}
              initialPhilosopherId={chosenPhilosopher || response.nearestProfiles[0]?.id || null}
              busy={isLoadingDebate} error={debateError}
              onStart={startDebate}
              onDraft={draft => setDebate(current => current ? { ...current, draft } : current)}
              onTurn={() => { if (debate) void fetchDebateTurn(debate); }}
              onCancel={cancelDebate} onBack={() => goTo("results")} onReset={clearDebate} />
          )}
        </div>
      </main>
      </div>

      {confirmingReset && (
        <ConfirmReset onCancel={cancelReset} onConfirm={resetFlow} />
      )}

      {isLoadingAdvice && loadingStartTime && (
        <LoadingOverlay startTime={loadingStartTime} onCancel={cancelAdvice} />
      )}
    </div>
  );
}

function ConfirmReset({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".dialog button"));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-desc">
        <h2 id="reset-title">Start over?</h2>
        <p id="reset-desc">Your current dilemma, answers and advice will be cleared. Export the advice first if you want to keep it.</p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="button-back" onClick={onCancel}>Keep working</button>
          <button type="button" className="button-primary" onClick={onConfirm}>Start over</button>
        </div>
      </div>
    </div>
  );
}

const PHASE_ORDER: Phase[] = [
  "locked", "dilemma", "path", "calibration", "philosopher", "explanation", "results", "debate"
];

function getDirection(prev: Phase | null, next: Phase): "enter" | "forward" | "backward" {
  if (!prev) return "enter";
  const prevIdx = PHASE_ORDER.indexOf(prev);
  const nextIdx = PHASE_ORDER.indexOf(next);
  return nextIdx >= prevIdx ? "forward" : "backward";
}

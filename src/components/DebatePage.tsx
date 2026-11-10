import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { DebateMessage, DebateParticipants, ExplanationLevel } from "../../shared/contracts";
import { DEBATE_LIMITS, debateMessageLimit, debateSpeakerAt } from "../../shared/debate";
import { getPhilosophyById, philosophyProfiles } from "../../shared/philosophyProfiles";
import { DebateExport } from "./DebateExport";
import { PageHeader } from "./PageHeader";

export interface DebateSession {
  dilemma: string;
  participants: DebateParticipants;
  explanationLevel: ExplanationLevel;
  advisorModel: string;
  messages: DebateMessage[];
  draft: string;
  complete: boolean;
  safetyMarkdown?: string;
}

interface DebatePageProps {
  session: DebateSession | null;
  dilemma: string;
  initialPhilosopherId: string | null;
  busy: boolean;
  error: string | null;
  onStart: (participants: DebateParticipants) => void;
  onDraft: (text: string) => void;
  onTurn: () => void;
  onCancel: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function DebatePage({ session, dilemma, initialPhilosopherId, busy, error,
  onStart, onDraft, onTurn, onCancel, onBack, onReset }: DebatePageProps) {
  const [mode, setMode] = useState<DebateParticipants["mode"]>("philosophers");
  const [first, setFirst] = useState(() => getPhilosophyById(initialPhilosopherId ?? "")?.id ?? philosophyProfiles[0].id);
  const [second, setSecond] = useState(() => philosophyProfiles.find(p => p.id !== first)!.id);
  const [confirmReset, setConfirmReset] = useState(false);
  const latestRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const count = session?.messages.length ?? 0;
  useEffect(() => {
    latestRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [count, session?.safetyMarkdown]);
  useEffect(() => {
    if (!busy && session?.participants.mode === "user" && count % 2 === 0) composerRef.current?.focus();
  }, [busy, count, session?.participants.mode]);

  const waitingForReply = session?.participants.mode === "user" && count % 2 === 1;
  const needsDraft = session?.participants.mode === "user" && !waitingForReply;
  const nextSpeaker = session && !session.complete
    ? debateSpeakerAt(session.participants, needsDraft ? count + 1 : count) : null;
  const nextName = getPhilosophyById(nextSpeaker ?? "")?.representative;
  const tooLong = dilemma.length > DEBATE_LIMITS.dilemmaCharacters;

  return (
    <div className="wizard-card debate-page">
      <PageHeader step="Explore your dilemma" title="Explore through debate">
        Test the reasons behind a conclusion. Agreement is allowed.
      </PageHeader>
      <div className="wizard-scroll debate-scroll">
        <details className="debate-dilemma">
          <summary>Your dilemma</summary>
          <p>{session?.dilemma ?? dilemma}</p>
        </details>
        <p className="form-note">The philosopher voices are AI interpretations. The discussion stays in this tab until you reload or start over.</p>
        {!session ? (
          <div className="debate-setup">
            <fieldset className="debate-mode">
              <legend>Who will take part?</legend>
              <label><input type="radio" name="debate-mode" checked={mode === "philosophers"} onChange={() => setMode("philosophers")} /> Two philosophers</label>
              <label><input type="radio" name="debate-mode" checked={mode === "user"} onChange={() => setMode("user")} /> You and a philosopher</label>
            </fieldset>
            <PhilosopherSelect label={mode === "user" ? "Philosopher" : "First philosopher"} value={first} onChange={setFirst} />
            {mode === "philosophers" && <PhilosopherSelect label="Second philosopher" value={second} onChange={setSecond} />}
            {mode === "philosophers" && first === second && <p className="error" role="alert">Select two different philosophers.</p>}
            <p className="form-note">{mode === "philosophers"
              ? "Three rounds: opening views, challenges, and closing views. Request one reply at a time."
              : "Write your position first. You can send up to six messages. The philosopher will test your reasons and ask questions."}</p>
            {tooLong && <p className="error" role="alert">Debate supports a dilemma of up to {DEBATE_LIMITS.dilemmaCharacters.toLocaleString()} characters. Shorten your dilemma to continue.</p>}
          </div>
        ) : (
          <>
            <p className="debate-progress">{session.participants.mode === "philosophers"
              ? `${count} of ${debateMessageLimit(session.participants)} replies`
              : `${Math.floor(count / 2)} of ${DEBATE_LIMITS.userExchanges} exchanges complete`}</p>
            <ol className="debate-transcript" aria-label="Debate transcript">
              {session.messages.map((message, index) => {
                const voice = getPhilosophyById(message.speakerId);
                return <li key={index}>
                  <article className={`debate-message ${message.speakerId === "user" ? "is-user" : ""}`} ref={index === count - 1 ? latestRef : undefined}>
                    <h3>{message.speakerId === "user" ? "You" : `${voice?.voiceStyle === "in-the-spirit" ? "In the spirit of " : ""}${voice?.representative}`}</h3>
                    {message.speakerId === "user" ? <p className="debate-user-text">{message.content}</p> : <div className="advice-markdown"><ReactMarkdown>{message.content}</ReactMarkdown></div>}
                  </article>
                </li>;
              })}
            </ol>
            {session.safetyMarkdown && <section className="debate-message" aria-label="Safety response" ref={latestRef}>
              <h3>Debate stopped</h3><ReactMarkdown>{session.safetyMarkdown}</ReactMarkdown>
            </section>}
            {session.complete && !session.safetyMarkdown && <p role="status">The debate is complete. You can return to your advice or start a new debate.</p>}
            {needsDraft && !session.complete && <div className="debate-composer">
              <label className="field-label" htmlFor="debate-message">{count === 0 ? "Your position" : "Your reply"}</label>
              <textarea ref={composerRef} id="debate-message" rows={4} maxLength={DEBATE_LIMITS.userMessageCharacters}
                value={session.draft} disabled={busy} onChange={event => onDraft(event.target.value)} aria-describedby="debate-message-help" />
              <p id="debate-message-help" className="form-note">Explain your reasons or ask a question. {session.draft.length}/{DEBATE_LIMITS.userMessageCharacters} characters.</p>
            </div>}
            <p className="form-note" role="status">{busy ? `${nextName} is preparing a reply…` : !session.complete && nextName ? `Next reply: ${nextName}` : ""}</p>
            {error && <p className="error" role="alert">{error}</p>}
            {confirmReset ? <div className="debate-reset" role="group" aria-label="Clear this debate?">
              <p>Clear this debate? Your advice will remain available.</p>
              <button type="button" onClick={() => setConfirmReset(false)}>Keep debate</button>
              <button type="button" onClick={() => { setConfirmReset(false); onReset(); }}>Clear debate</button>
            </div> : <button className="link-button debate-new" type="button" onClick={() => setConfirmReset(true)}>Start a new debate</button>}
          </>
        )}
      </div>
      <div className="button-row debate-actions">
        <button type="button" className="button-back" onClick={onBack}>Back to advice</button>
        {session && (count > 0 || session.safetyMarkdown) && <DebateExport session={session} />}
        {!session ? <button type="button" className="button-primary" disabled={tooLong || (mode === "philosophers" && first === second)}
          onClick={() => onStart(mode === "philosophers" ? { mode, philosopherIds: [first, second] } : { mode, philosopherIds: [first] })}>Start debate</button>
          : busy ? <button type="button" className="button-secondary" onClick={onCancel}>Cancel reply</button>
            : !session.complete && <button type="button" className="button-primary" onClick={onTurn} disabled={Boolean(needsDraft && !session.draft.trim())}>
              {error || waitingForReply ? "Retry reply" : needsDraft ? "Send message" : "Next reply"}
            </button>}
      </div>
    </div>
  );
}

function PhilosopherSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const profile = getPhilosophyById(value);
  return <label className="debate-select">
    <span className="field-label">{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)}>
      {philosophyProfiles.map(p => <option key={p.id} value={p.id}>{p.representative} · {p.name}</option>)}
    </select>
    <span className="form-note">{profile?.summary}</span>
  </label>;
}

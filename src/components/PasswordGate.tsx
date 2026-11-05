import { FormEvent, useState } from "react";
import { FloatingNames } from "./LoadingOverlay";

interface PasswordGateProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (password: string) => Promise<void>;
}

export function PasswordGate({
  isSubmitting,
  error,
  onSubmit
}: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(password);
  }

  return (
    <div className="welcome-page">
      <FloatingNames className="welcome-names" />
      <div className="welcome-intro">
        <img className="welcome-bust" src={`${import.meta.env.BASE_URL}socrates-bust.png`} alt="" width="320" height="320" />
        <h1 className="welcome-wordmark">iSocrateez</h1>
        <p className="welcome-tagline">Good Reasons For Hard Choices.</p>
        <p className="welcome-lede">
          Describe a moral dilemma, choose the perspective you want to reason from, and get advice
          grounded in moral philosophy.
        </p>
      </div>
      <form className="welcome-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="password">Shared passphrase</label>
        <div className="welcome-input-row">
          <div className="password-field">
            <input
              id="password"
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              name="password"
              type={revealed ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="wizard-input"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "password-error" : undefined}
              required
            />
            <button
              type="button"
              className="password-reveal"
              aria-label="Show passphrase"
              aria-pressed={revealed}
              aria-controls="password"
              onClick={() => setRevealed((v) => !v)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                <circle cx="12" cy="12" r="3" />
                {revealed && <path d="M4 4l16 16" />}
              </svg>
            </button>
          </div>
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Unlocking…" : "Enter"}
          </button>
        </div>
        {error && <p className="error" id="password-error" role="alert">{error}</p>}
      </form>
      <figure className="welcome-quote">
        <blockquote>“The unexamined life is not worth living.”</blockquote>
        <figcaption>Socrates, in Plato’s <cite>Apology</cite></figcaption>
      </figure>
      <footer className="welcome-footer">
        <a href="https://entangledparticles.xyz" target="_blank" rel="noopener noreferrer">entangledparticles.xyz ↗</a>
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer license">CC BY-SA 4.0</a>
      </footer>
    </div>
  );
}

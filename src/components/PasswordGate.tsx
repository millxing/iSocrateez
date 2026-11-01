import { FormEvent, useState } from "react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(password);
  }

  return (
    <div className="wizard-card welcome-page">
      <form className="wizard-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="password">Shared passphrase</label>
        <input
          id="password"
          autoComplete="current-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="wizard-input"
          required
        />
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button className="button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Unlocking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

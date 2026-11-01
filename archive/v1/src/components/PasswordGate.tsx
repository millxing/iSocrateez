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
    <div className="wizard-card">
      <p className="eyebrow">Private link for friends</p>
      <h2 className="wizard-title">Enter the chamber</h2>
      <p className="wizard-subtitle">
        Enter the shared password to open the app.
      </p>
      <form className="wizard-form" onSubmit={handleSubmit}>
        <input
          autoComplete="current-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Shared passphrase"
          className="wizard-input"
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button className="button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Unlocking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

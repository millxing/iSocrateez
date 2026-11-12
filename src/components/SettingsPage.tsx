import { modelOptions } from "../../shared/models";
import { PageHeader } from "./PageHeader";

interface SettingsPageProps {
  appearance: string;
  onAppearance: (value: string) => void;
  advisorModel: string;
  onAdvisorModel: (value: string) => void;
}

const DEFAULT_ADVISOR = "anthropic:claude-sonnet-5-5";

function ModelSelect({ label, help, value, fallback, onChange }: {
  label: string; help: string; value: string; fallback: string; onChange: (value: string) => void;
}) {
  const id = `setting-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="settings-field">
      <div className="settings-field-text">
        <label htmlFor={id}>{label}</label>
        <p className="form-note" id={`${id}-help`}>{help}</p>
      </div>
      <div className="settings-control">
        <select id={id} aria-describedby={`${id}-help`} value={value} onChange={event => onChange(event.target.value)}>
          {modelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}{option.value === fallback ? " (default)" : ""}
            </option>
          ))}
        </select>
        {value !== fallback && (
          <button type="button" className="link-button" onClick={() => onChange(fallback)}>Reset to default</button>
        )}
      </div>
    </div>
  );
}

export function SettingsPage(props: SettingsPageProps) {
  return <div className="page-content settings-page">
    <div className="wizard-card">
      <div className="wizard-scroll">
        <PageHeader title="Settings">
          Changes apply right away and are remembered on this device. Your current dilemma is kept.
        </PageHeader>
        <div className="settings-fields">
          <div className="settings-field">
            <div className="settings-field-text">
              <label htmlFor="setting-appearance">Appearance</label>
              <p className="form-note" id="setting-appearance-help">Follow your system, or always use light or dark.</p>
            </div>
            <div className="settings-control">
              <select id="setting-appearance" aria-describedby="setting-appearance-help" value={props.appearance} onChange={event => props.onAppearance(event.target.value)}>
                <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
              </select>
            </div>
          </div>
          <ModelSelect label="Model" value={props.advisorModel} fallback={DEFAULT_ADVISOR} onChange={props.onAdvisorModel}
            help="Writes the advice and the debate replies. Larger models give richer, slower answers." />
        </div>
      </div>
      <div className="button-row">
        <button className="button-primary" type="button" onClick={() => { window.location.hash = "reflection"; }}>Done</button>
      </div>
    </div>
  </div>;
}

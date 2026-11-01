import { modelOptions } from "../../shared/models";

interface SettingsPageProps {
  appearance: string;
  onAppearance: (value: string) => void;
  plannerModel: string;
  onPlannerModel: (value: string) => void;
  advisorModel: string;
  onAdvisorModel: (value: string) => void;
}

export function SettingsPage(props: SettingsPageProps) {
  return <div className="page-content settings-page">
    <div className="wizard-card">
      <div className="wizard-scroll">
        <h2 className="wizard-title">Settings</h2>
        <div className="settings-fields">
          <label className="settings-field">Appearance
            <select value={props.appearance} onChange={event => props.onAppearance(event.target.value)}>
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </label>
          <label className="settings-field">Planner model
            <select value={props.plannerModel} onChange={event => props.onPlannerModel(event.target.value)}>
              {modelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="settings-field">Advisor model
            <select value={props.advisorModel} onChange={event => props.onAdvisorModel(event.target.value)}>
              {modelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="button-row"><a className="button-primary" href="#reflection">Done</a></div>
    </div>
  </div>;
}

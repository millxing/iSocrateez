import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type {
  AdviceResponse,
  Axis,
  ExplanationLevel,
  PersonaMode,
  ProfileTuple
} from "../../shared/contracts";
import { axisLabels, describeAxisPosition, formatTuple } from "../../shared/ethics";

interface ResultsViewProps {
  response: AdviceResponse;
  dilemma: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  onRestart: () => void;
}

type Tab = "advice" | "why" | "watch" | "next" | "export" | "coordinates";

const TABS: { id: Tab; label: string }[] = [
  { id: "advice", label: "Your Advice" },
  { id: "why", label: "Why This Advice" },
  { id: "watch", label: "What to Watch For" },
  { id: "next", label: "Next Step" },
  { id: "coordinates", label: "Ethical Coordinates" },
  { id: "export", label: "Export Advice" }
];

/** Heading patterns for section splitting */
const SECTION_PATTERNS: { tab: Tab; patterns: RegExp[] }[] = [
  { tab: "advice", patterns: [/your\s+advice/i, /core\s+advice/i] },
  { tab: "why", patterns: [/why\s+this\s+fits/i, /why\s+this\s+advice/i, /ethical\s+profile/i] },
  { tab: "watch", patterns: [/watch\s+for/i, /watch\s+out/i, /be\s+careful/i] },
  { tab: "next", patterns: [/next\s+steps?/i, /action\s+items?/i, /practical\s+steps?/i] }
];

function splitMarkdownSections(raw: string): Record<Tab, string> {
  const renamed = raw.replace(/^(#{1,3})\s*Core\s+advice/mi, "$1 Your Advice");
  const lines = renamed.split("\n");
  const sections: Record<Tab, string[]> = {
    advice: [],
    why: [],
    watch: [],
    next: [],
    export: [],
    coordinates: []
  };

  let currentTab: Tab = "advice";

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      const title = headingMatch[1];
      let matched = false;
      for (const { tab, patterns } of SECTION_PATTERNS) {
        if (patterns.some((p) => p.test(title))) {
          currentTab = tab;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Keep in current tab
      }
      // Don't include the heading itself — the tab label serves as the heading
      continue;
    }
    sections[currentTab].push(line);
  }

  return {
    advice: sections.advice.join("\n").trim(),
    why: sections.why.join("\n").trim(),
    watch: sections.watch.join("\n").trim(),
    next: sections.next.join("\n").trim(),
    export: "",
    coordinates: ""
  };
}

export function ResultsView({
  response,
  dilemma,
  explanationLevel,
  personaMode,
  onRestart
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("advice");
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = response.nearestProfiles[0];
  const alternates = response.nearestProfiles.slice(1, 3);

  const sections = useMemo(
    () => splitMarkdownSections(response.adviceMarkdown),
    [response.adviceMarkdown]
  );

  // Only show tabs that have content (plus export and coordinates which are always available)
  const availableTabs = TABS.filter((tab) => {
    if (tab.id === "export" || tab.id === "coordinates") return true;
    return sections[tab.id].length > 0;
  });

  const fullMarkdown = response.adviceMarkdown.replace(
    /^(#{1,3})\s*Core\s+advice/mi,
    "$1 Your Advice"
  );

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  function selectTab(id: Tab) {
    setActiveTab(id);
    setMenuOpen(false);
  }

  return (
    <div className="results-layout">
      {/* Desktop: horizontal tab bar */}
      <nav className="results-tabs results-tabs-desktop">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            className={`results-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Narrow screens: hamburger dropdown */}
      <nav className="results-tabs results-tabs-mobile">
        <button
          className="hamburger-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className="hamburger-icon">{menuOpen ? "\u2715" : "\u2630"}</span>
          <span className="hamburger-label">{activeLabel}</span>
        </button>
        {menuOpen && (
          <div className="hamburger-dropdown">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                className={`hamburger-item ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="results-body">
        {activeTab !== "export" && activeTab !== "coordinates" && (
          <div className="advice-markdown">
            <ReactMarkdown>{sections[activeTab] || ""}</ReactMarkdown>
          </div>
        )}

        {activeTab === "export" && (
          <ExportTab
            dilemma={dilemma}
            sections={sections}
            fullMarkdown={fullMarkdown}
            explanationLevel={explanationLevel}
            personaMode={personaMode}
            response={response}
          />
        )}

        {activeTab === "coordinates" && (
          <CoordinatesTab
            profile={response.profile}
            primary={primary}
            alternates={alternates}
          />
        )}
      </div>

      <div className="results-footer">
        <button className="button-primary" type="button" onClick={onRestart}>
          Start a new dilemma
        </button>
      </div>
    </div>
  );
}

function ExportTab({
  dilemma,
  sections,
  fullMarkdown,
  explanationLevel,
  personaMode,
  response
}: {
  dilemma: string;
  sections: Record<Tab, string>;
  fullMarkdown: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  response: AdviceResponse;
}) {
  const primary = response.nearestProfiles[0];
  const alternates = response.nearestProfiles.slice(1, 3);

  const coordinatesSection = [
    "## Ethical Coordinates",
    "",
    `**Profile:** ${formatTuple(response.profile)}`,
    "",
    ...Object.entries(axisLabels).map(([axisKey, labels]) => {
      const axis = axisKey as Axis;
      const value = response.profile[axis];
      return `- **${labels.title}:** ${describeAxisPosition(axis, value)} (${value.toFixed(2)})`;
    }),
    "",
    `**Nearest match:** ${primary.name} via ${primary.representative}`,
    primary.summary,
    primary.whyItFits,
    ...(alternates.length > 0
      ? [
          "",
          "**Nearby alternatives:**",
          ...alternates.map(
            (p) => `- **${p.name} / ${p.representative}** — ${p.whyItFits}`
          )
        ]
      : [])
  ].join("\n");

  const exportMarkdown = [
    `# iSocrateez Advice`,
    "",
    `> Explanation: ${explanationLevel} | Mode: ${personaMode}`,
    `> Models: ${response.modelsUsed.join(" \u2192 ")}`,
    "",
    "## Dilemma",
    "",
    dilemma,
    "",
    fullMarkdown,
    "",
    coordinatesSection
  ].join("\n");

  async function handleSave() {
    try {
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: "isocrateez-advice.md",
          types: [
            {
              description: "Markdown file",
              accept: { "text/plain": [".md"] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(exportMarkdown);
        await writable.close();
      } else {
        const blob = new Blob([exportMarkdown], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "isocrateez-advice.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled the save dialog
    }
  }

  return (
    <div className="export-tab">
      <button className="button-primary" onClick={handleSave}>
        Save as markdown file
      </button>
    </div>
  );
}

function CoordinatesTab({
  profile,
  primary,
  alternates
}: {
  profile: ProfileTuple;
  primary: AdviceResponse["nearestProfiles"][0];
  alternates: AdviceResponse["nearestProfiles"];
}) {
  return (
    <div className="coordinates-tab">
      <ProfileBars profile={profile} />

      <div className="match-section">
        <h3 className="match-heading">Nearest match</h3>
        <p className="match-name">
          {primary.name} via {primary.representative}
        </p>
        <p className="match-summary">{primary.summary}</p>
        <p className="match-why">{primary.whyItFits}</p>
      </div>

      {alternates.length > 0 && (
        <div className="match-section">
          <h3 className="match-heading">Nearby alternatives</h3>
          <ul className="profile-list">
            {alternates.map((p) => (
              <li key={p.id}>
                <strong>{p.name} / {p.representative}</strong>
                <span>{p.whyItFits}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProfileBars({ profile }: { profile: ProfileTuple }) {
  return (
    <div className="axis-bars">
      {Object.entries(axisLabels).map(([axisKey, labels]) => {
        const axis = axisKey as Axis;
        const value = profile[axis];
        const percentage = `${((value + 1) / 2) * 100}%`;

        return (
          <article className="axis-bar-card" key={axis}>
            <header>
              <strong>{labels.title}</strong>
              <span>{describeAxisPosition(axis, value)}</span>
            </header>
            <div className="axis-bar">
              <span>{labels.negLabel}</span>
              <div className="axis-track">
                <div className="axis-center" />
                <div className="axis-marker" style={{ left: percentage }} />
              </div>
              <span>{labels.posLabel}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

import { modelOptions } from "../../shared/models";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import type {
  AdviceResponse,
  PhilosophyProfile,
  Axis,
  ExplanationLevel,
  PersonaMode,
  ProfileTuple
} from "../../shared/contracts";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { axisLabels, describeAxisPosition, formatTuple } from "../../shared/ethics";

interface ResultsViewProps {
  response: AdviceResponse;
  dilemma: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  /** Human-readable description of how the perspective was chosen. */
  perspectiveLabel?: string;
  onRestart: () => void;
  onDebate?: () => void;
}

type Tab = "advice" | "why" | "watch" | "next" | "dilemma" | "export" | "coordinates";

const TABS: { id: Tab; label: string; title: string }[] = [
  { id: "advice", label: "Advice", title: "Your advice" },
  { id: "why", label: "Reasoning", title: "Why this advice" },
  { id: "watch", label: "Watch for", title: "What to watch for" },
  { id: "next", label: "Next step", title: "Your next step" },
  { id: "dilemma", label: "Dilemma", title: "Your dilemma" },
  { id: "coordinates", label: "Coordinates", title: "Ethical coordinates" },
  { id: "export", label: "Export", title: "Export advice" }
];

/** Heading patterns for section splitting */
const SECTION_PATTERNS: { tab: Tab; patterns: RegExp[] }[] = [
  { tab: "advice", patterns: [/your\s+advice/i, /core\s+advice/i] },
  { tab: "why", patterns: [/why\s+this\s+fits/i, /why\s+this\s+advice/i, /ethical\s+profile/i] },
  { tab: "watch", patterns: [/watch\s+for/i, /watch\s+out/i, /be\s+careful/i] },
  { tab: "next", patterns: [/next\s+steps?/i, /action\s+items?/i, /practical\s+steps?/i] }
];

const MOBILE_RESULTS_BREAKPOINT = 640;

function splitMarkdownSections(raw: string): Record<Tab, string> {
  const renamed = raw.replace(/^(#{1,3})\s*Core\s+advice/mi, "$1 Your Advice");
  const lines = renamed.split("\n");
  const sections: Record<Tab, string[]> = {
    advice: [],
    why: [],
    watch: [],
    next: [],
    dilemma: [],
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
    dilemma: "",
    coordinates: ""
  };
}

const STYLE_LABELS: Record<ExplanationLevel, string> = {
  general: "Plain language",
  informed: "Some technical detail",
  phd: "Advanced"
};

export function ResultsView({
  response,
  dilemma,
  explanationLevel,
  personaMode,
  perspectiveLabel,
  onRestart,
  onDebate
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("advice");
  const [menuOpen, setMenuOpen] = useState(false);
  const [useHamburgerMenu, setUseHamburgerMenu] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_RESULTS_BREAKPOINT : false
  );
  const measureTabsRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const primary = response.nearestProfiles[0];
  const alternates = response.nearestProfiles.slice(1, 3);
  // Looked up client-side so the page doesn't depend on the Worker echoing the full profile.
  const voice = response.selectedPhilosopherId
    ? getPhilosophyById(response.selectedPhilosopherId)
    : undefined;

  const sections = useMemo(
    () => splitMarkdownSections(response.adviceMarkdown),
    [response.adviceMarkdown]
  );

  const tabs = useMemo(
    () =>
      TABS.map((tab) =>
        tab.id === "coordinates" && voice ? { ...tab, label: "Speaker", title: "About the speaker" } : tab
      ),
    [voice]
  );

  // Only show tabs that have content (plus export and coordinates which are always available)
  const availableTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.id === "export" || tab.id === "coordinates" || tab.id === "dilemma") return true;
        return sections[tab.id].length > 0;
      }),
    [sections, tabs]
  );

  const fullMarkdown = response.adviceMarkdown.replace(
    /^(#{1,3})\s*Core\s+advice/mi,
    "$1 Your Advice"
  );

  const activeIndex = availableTabs.findIndex((t) => t.id === activeTab);
  const active = availableTabs[activeIndex] ?? availableTabs[0];
  const nextTab = availableTabs[activeIndex + 1];

  function selectTab(id: Tab, focusPanel = false) {
    setActiveTab(id);
    if (menuOpen) {
      setMenuOpen(false);
      toggleRef.current?.focus();
    }
    if (focusPanel) requestAnimationFrame(() => panelRef.current?.focus());
    panelRef.current?.scrollTo?.({ top: 0 });
  }

  function handleTabKeys(event: KeyboardEvent<HTMLElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const count = availableTabs.length;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? count - 1
      : (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
    const id = availableTabs[nextIndex].id;
    setActiveTab(id);
    requestAnimationFrame(() => document.getElementById(`tab-${id}`)?.focus());
  }

  useEffect(() => {
    function syncTabsLayout() {
      const nextUseHamburger =
        window.innerWidth <= MOBILE_RESULTS_BREAKPOINT ||
        Boolean(
          measureTabsRef.current &&
            measureTabsRef.current.scrollWidth - measureTabsRef.current.clientWidth > 1
        );

      setUseHamburgerMenu((current) =>
        current === nextUseHamburger ? current : nextUseHamburger
      );
    }

    let frameId = 0;

    function scheduleSync() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncTabsLayout);
    }

    scheduleSync();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && measureTabsRef.current
        ? new ResizeObserver(scheduleSync)
        : null;

    if (resizeObserver && measureTabsRef.current) {
      resizeObserver.observe(measureTabsRef.current);
    }

    window.addEventListener("resize", scheduleSync);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleSync);
    };
  }, [availableTabs]);

  useEffect(() => {
    if (!useHamburgerMenu) {
      setMenuOpen(false);
    }
  }, [useHamburgerMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>(".hamburger-item.is-active")?.focus();
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const headline = voice
    ? `${voice.voiceStyle === "first-person" ? "Advice from" : "Advice in the spirit of"} ${voice.representative}`
    : "Advice for your dilemma";

  return (
    <div className="results-layout">
      <header className="results-header">
        <div className="results-header-text">
          <p className="eyebrow">Step 4 of 4</p>
          <h2 className="wizard-title">{headline}</h2>
          <p className="results-excerpt" title={dilemma}>{dilemma}</p>
        </div>
        <ul className="results-meta" aria-label="How this advice was made">
          {perspectiveLabel && <li>{perspectiveLabel}</li>}
          <li>{STYLE_LABELS[explanationLevel]}</li>
        </ul>
      </header>

      <nav
        ref={measureTabsRef}
        className="results-tabs results-tabs-desktop results-tabs-measure"
        aria-hidden="true"
      >
        {availableTabs.map((tab) => (
          <button key={tab.id} className="results-tab" tabIndex={-1}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Desktop: horizontal tab bar */}
      <div
        className={`results-tabs results-tabs-desktop ${useHamburgerMenu ? "is-hidden" : ""}`}
        role="tablist"
        aria-label="Advice sections"
        hidden={useHamburgerMenu}
        onKeyDown={handleTabKeys}
      >
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active.id === tab.id}
            aria-controls="results-panel"
            tabIndex={active.id === tab.id ? 0 : -1}
            className={`results-tab ${active.id === tab.id ? "is-active" : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Narrow screens: dropdown menu */}
      <nav
        ref={menuRef}
        className={`results-tabs results-tabs-mobile ${useHamburgerMenu ? "" : "is-hidden"}`}
        aria-label="Advice sections"
        hidden={!useHamburgerMenu}
      >
        <button
          ref={toggleRef}
          type="button"
          className="hamburger-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Advice sections: ${active.title}`}
          aria-expanded={menuOpen}
          aria-controls="results-menu"
        >
          <span className="hamburger-label"><small>Section {activeIndex + 1} of {availableTabs.length}</small>{active.title}</span>
          <span className="hamburger-icon" aria-hidden="true">{menuOpen ? "✕" : "▾"}</span>
        </button>
        {menuOpen && (
          <div
            className="hamburger-dropdown"
            id="results-menu"
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".hamburger-item"));
              const i = items.indexOf(document.activeElement as HTMLButtonElement);
              const n = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
                : (i + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
              items[n]?.focus();
            }}
          >
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`hamburger-item ${active.id === tab.id ? "is-active" : ""}`}
                aria-current={active.id === tab.id ? "true" : undefined}
                onClick={() => selectTab(tab.id, true)}
              >
                {tab.title}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div
        className="results-body"
        id="results-panel"
        ref={panelRef}
        role={useHamburgerMenu ? "region" : "tabpanel"}
        aria-labelledby={useHamburgerMenu ? "results-panel-title" : `tab-${active.id}`}
        tabIndex={-1}
      >
        <h3 className="panel-title" id="results-panel-title">{active.title}</h3>

        {active.id === "dilemma" && (
          <div className="advice-markdown">
            <p className="dilemma-original">{dilemma}</p>
          </div>
        )}

        {active.id === "advice" && (
          <div className="advice-layout">
            <div className="advice-markdown is-lead">
              <ReactMarkdown>{sections.advice || ""}</ReactMarkdown>
            </div>
            {voice ? (
              <aside className="speaker-card" aria-label="About this voice">
                <p className="speaker-label">
                  {voice.voiceStyle === "first-person" ? "Speaking as" : "In the spirit of"}
                </p>
                <p className="speaker-name">
                  {voice.representative} <span>· {voice.name}</span>
                </p>
                <p className="speaker-detail">
                  {voice.speaker.years} · {voice.speaker.region}
                </p>
                <p className="speaker-detail speaker-traditions">{voice.speaker.traditions}</p>
                <p className="speaker-note">
                  An AI interpretation of this perspective, not the person's own words.
                </p>
              </aside>
            ) : response.profile && primary ? (
              <aside className="speaker-card profile-glance" aria-label="Your perspective at a glance">
                <p className="speaker-label">Closest tradition</p>
                <p className="speaker-name">{primary.name}</p>
                <p className="speaker-detail">via {primary.representative}</p>
                <ul className="glance-axes">
                  {Object.entries(axisLabels).map(([axisKey]) => (
                    <li key={axisKey}>{describeAxisPosition(axisKey as Axis, response.profile![axisKey as Axis])}</li>
                  ))}
                </ul>
                <button type="button" className="link-button" onClick={() => selectTab("coordinates", true)}>See your coordinates</button>
              </aside>
            ) : null}
          </div>
        )}

        {active.id !== "advice" && active.id !== "export" && active.id !== "coordinates" && active.id !== "dilemma" && (
          <div className={`advice-markdown ${active.id === "next" ? "is-next-step" : ""}`}>
            <ReactMarkdown>{sections[active.id] || ""}</ReactMarkdown>
          </div>
        )}

        {active.id === "next" && sections.next && <CopyButton text={sections.next} label="Copy this step" />}

        {active.id === "export" && (
          <ExportTab
            dilemma={dilemma}
            sections={sections}
            fullMarkdown={fullMarkdown}
            explanationLevel={explanationLevel}
            personaMode={personaMode}
            perspectiveLabel={perspectiveLabel}
            response={response}
          />
        )}

        {active.id === "coordinates" &&
          (voice ? (
            <SpeakerTab voice={voice} />
          ) : (
            response.profile &&
            primary && (
              <CoordinatesTab
                profile={response.profile}
                primary={primary}
                alternates={alternates}
              />
            )
          ))}

        {nextTab && (
          <div className="panel-next">
            <button type="button" className="button-secondary" onClick={() => selectTab(nextTab.id, true)}>
              Next: {nextTab.title} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>

      <div className="results-footer">
        {onDebate && response.safetyMode === "standard" && <button className="button-primary" type="button" onClick={onDebate}>Explore through debate</button>}
        <p className="form-note">Want to try another perspective? Use the steps in the sidebar to change an answer.</p>
        <button className="button-secondary restart-button" type="button" onClick={onRestart}>
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
  perspectiveLabel,
  response
}: {
  dilemma: string;
  sections: Record<Tab, string>;
  fullMarkdown: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  perspectiveLabel?: string;
  response: AdviceResponse;
}) {
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status) statusRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [status]);
  const primary = response.nearestProfiles[0];
  const alternates = response.nearestProfiles.slice(1, 3);
  const voice = response.selectedPhilosopherId
    ? getPhilosophyById(response.selectedPhilosopherId)
    : undefined;

  const profile = response.profile;
  const coordinatesSection =
    !voice && profile && primary
      ? [
          "## Ethical Coordinates",
          "",
          `**Profile:** ${formatTuple(profile)}`,
          "",
          ...Object.entries(axisLabels).map(([axisKey, labels]) => {
            const axis = axisKey as Axis;
            const value = profile[axis];
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
        ].join("\n")
      : voice
        ? [
            "## About the Speaker",
            "",
            `**${voice.representative}** · ${voice.name}`,
            `${voice.speaker.years} · ${voice.speaker.region}  `,
            `${voice.speaker.traditions}`,
            "",
            voice.summary,
            "",
            "*An AI interpretation of this perspective, not the person's own words.*"
          ].join("\n")
        : "";

  const speakerSection = voice
    ? [
        `**${voice.voiceStyle === "first-person" ? "Speaking as" : "In the spirit of"} ${voice.representative}** · ${voice.name}  `,
        `${voice.speaker.years} · ${voice.speaker.region}  `,
        voice.speaker.traditions,
        ""
      ]
    : [];

  function modelName(id: string) {
    const modelId = id.replace(/^fallback:/, "");
    const label = modelOptions.find(option => option.value === modelId)?.label
      .replace(/ \(default (planner|advisor)\)/, "");
    return label ? `${label} (${modelId})` : modelId;
  }
  const models = response.modelsUsed;
  const advisor = models[models.length - 1];
  const modelDetails = advisor === "local-safety"
    ? ["> Generated by: local safety response (no AI model)"]
    : [
        `> Advice model: ${advisor ? modelName(advisor) : "Not reported"}`,
        ...(models.length > 1 ? [`> Planner model: ${modelName(models[0])}`] : [])
      ];

  const exportMarkdown = [
    `# iSocrateez Advice`,
    "",
    `> Explanation style: ${STYLE_LABELS[explanationLevel]} · Perspective: ${perspectiveLabel ?? (personaMode === "philosopher" ? "Philosopher's voice" : "Your ethical profile")}`,
    ...modelDetails,
    "",
    "## Dilemma",
    "",
    dilemma,
    "",
    ...speakerSection,
    fullMarkdown,
    "",
    coordinatesSection
  ].join("\n");

  async function handleSave() {
    setStatus(null);
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
        setStatus({ kind: "ok", text: `Saved ${handle.name ?? "isocrateez-advice.md"}.` });
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
        setStatus({ kind: "ok", text: "Downloaded isocrateez-advice.md." });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // user cancelled
      setStatus({ kind: "error", text: "The file couldn’t be saved. Try again, or copy the text instead." });
    }
  }

  async function handleCopy() {
    setStatus(null);
    try {
      await navigator.clipboard.writeText(exportMarkdown);
      setStatus({ kind: "ok", text: "Copied to clipboard as Markdown." });
    } catch {
      setStatus({ kind: "error", text: "Copying isn’t available here. Use Save instead." });
    }
  }

  return (
    <div className="export-tab">
      <p className="export-intro">Keep a copy of this session as a Markdown file you can open in any notes app.</p>
      <ul className="export-includes">
        <li>Your dilemma</li>
        <li>The advice, reasoning, what to watch for and next step</li>
        <li>{voice ? "About the speaker" : "Your ethical coordinates and nearest philosophies"}</li>
        <li>The models that generated it</li>
      </ul>
      <div className="export-actions">
        <button className="button-primary" type="button" onClick={handleSave}>
          Save as markdown file
        </button>
        <button className="button-secondary" type="button" onClick={handleCopy}>
          Copy to clipboard
        </button>
      </div>
      <p ref={statusRef} className={`export-status ${status?.kind === "error" ? "is-error" : ""}`} role="status">
        {status && <span aria-hidden="true">{status.kind === "ok" ? "✓ " : "! "}</span>}{status?.text}
      </p>
      <details className="export-preview">
        <summary>Preview the file</summary>
        <pre>{exportMarkdown}</pre>
      </details>
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

function SpeakerTab({ voice }: { voice: PhilosophyProfile }) {
  return (
    <div className="coordinates-tab">
      <div className="match-section">
        <p className="match-name">
          {voice.representative} · {voice.name}
        </p>
        <p className="match-summary">
          {voice.speaker.years} · {voice.speaker.region}
        </p>
        <p className="match-summary">{voice.speaker.traditions}</p>
        <p className="match-why">{voice.summary}</p>
        <p className="match-why">
          Key concerns: {voice.exampleConcerns.join(", ")}.
        </p>
      </div>
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  async function copy() {
    try {
      // Plain text: drop markdown emphasis markers.
      await navigator.clipboard.writeText(text.replace(/[*_`]/g, ""));
      setState("done");
    } catch {
      setState("failed");
    }
  }
  return (
    <div className="copy-row">
      <button type="button" className="button-secondary" onClick={copy}>{label}</button>
      <span role="status" className={`copy-status ${state === "failed" ? "is-error" : ""}`}>
        {state === "done" ? "✓ Copied" : state === "failed" ? "Copying isn’t available here" : ""}
      </span>
    </div>
  );
}

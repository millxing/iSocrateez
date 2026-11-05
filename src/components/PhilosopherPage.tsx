import { navigateRadios } from "./radioNavigation";
import { useLayoutEffect, useRef, useState } from "react";
import type { PhilosophyGroup } from "../../shared/contracts";
import { philosophyProfiles } from "../../shared/philosophyProfiles";
import { PageHeader } from "./PageHeader";
import { matchesPhilosopher } from "../philosopherSearch";

interface PhilosopherPageProps {
  initialId: string | null;
  onSubmit: (profileId: string) => void;
  onBack: () => void;
}

const GROUPS: { id: PhilosophyGroup; label: string }[] = [
  { id: "ancient", label: "Ancient Greece & Rome" },
  { id: "eastern", label: "Asian & African traditions" },
  { id: "religious", label: "Religious traditions" },
  { id: "modern", label: "Modern" },
  { id: "contemporary", label: "Contemporary" }
];

export function PhilosopherPage({ initialId, onSubmit, onBack }: PhilosopherPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const blurbRef = useRef<HTMLParagraphElement>(null);
  const selected = philosophyProfiles.find((p) => p.id === selectedId);
  const visible = philosophyProfiles.filter((p) => matchesPhilosopher(p, query));
  const hiddenByFilter = Boolean(selected) && !visible.some((p) => p.id === selectedId);

  useLayoutEffect(() => {
    // Offer "Read more" only when the summary is actually truncated.
    const el = blurbRef.current;
    setClamped(Boolean(el && !expanded && el.scrollHeight > el.clientHeight + 1));
  }, [selectedId, expanded]);

  const firstFocusable = visible.some((p) => p.id === selectedId) ? selectedId : visible[0]?.id;

  return (
    <div className="wizard-card philosopher-page">
      <PageHeader step="Step 2 of 4 · Philosopher" title="Choose a philosopher">
        The advice will be written in this thinker’s voice, or in the spirit of the tradition.
      </PageHeader>
      <div className="philosopher-layout">
        <div className="wizard-scroll philosopher-list">
          <div className="philosopher-search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            <input
              type="search"
              aria-label="Filter philosophers"
              placeholder="Search by name, place, religion or idea"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="philosopher-groups" role="radiogroup" onKeyDown={navigateRadios} aria-label="Philosophers">
            {GROUPS.map((group) => {
              const members = visible.filter((p) => p.group === group.id);
              if (members.length === 0) return null;
              return (
                <section key={group.id} className="philosopher-group">
                  <h3 className="philosopher-group-label">{group.label}</h3>
                  <div className="philosopher-grid">
                    {members.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={p.id === selectedId}
                        tabIndex={p.id === firstFocusable ? 0 : -1}
                        className={`philosopher-chip ${p.id === selectedId ? "is-selected" : ""}`}
                        title={`${p.representative} · ${p.name}`}
                        onClick={() => { setSelectedId(p.id); setExpanded(false); }}
                      >
                        <span className="philosopher-monogram" aria-hidden="true">{MONOGRAMS.get(p.id)}</span>
                        <span className="philosopher-chip-text">
                          <span className="philosopher-chip-name">{p.representative}</span>
                          <span className="philosopher-chip-school">{p.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
            {visible.length === 0 && (
              <p className="empty-note">No philosophers match “{query}”. <button type="button" className="link-button" onClick={() => setQuery("")}>Clear filter</button></p>
            )}
          </div>
        </div>

        <aside className={`selection-panel ${selected ? "has-selection" : ""}`} aria-live="polite" aria-label="Selected philosopher">
          {hiddenByFilter && <p className="selection-filter-note">Your selection is hidden by the filter.</p>}
          {selected ? (
            <>
              <div className="selection-heading">
                <span className="philosopher-monogram selection-monogram" aria-hidden="true">{MONOGRAMS.get(selected.id)}</span>
                <div>
                  <p className="selection-name">{selected.representative}</p>
                  <p className="selection-school">{selected.name} · {selected.speaker.years}</p>
                </div>
              </div>
              <p ref={blurbRef} className={`philosopher-blurb ${expanded ? "is-expanded" : ""}`} id="philosopher-summary">{selected.summary}</p>
              {(clamped || expanded) && <button type="button" className="link-button blurb-toggle" aria-expanded={expanded} aria-controls="philosopher-summary" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Show less" : "Read more"}
              </button>}
            </>
          ) : (
            <p className="selection-empty">Select a philosopher to read a short summary of their outlook.</p>
          )}
        </aside>
      </div>
      <div className="button-row">
        <button className="button-back" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="button-primary"
          type="button"
          disabled={!selected}
          onClick={() => selected && onSubmit(selected.id)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/** Two-letter badges, unique across the catalogue (e.g. Epictetus "Ep", Epicurus "Ec"). */
const MONOGRAMS = (() => {
  const used = new Set<string>();
  const result = new Map<string, string>();
  for (const profile of philosophyProfiles) {
    const words = profile.representative
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter((w) => /^[A-ZÀ-Þ]/.test(w) && !/^(The|Jr\.?|Sr\.?)$/.test(w));
    const base = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? profile.representative).slice(0, 2);
    let mark = base[0].toUpperCase() + base.slice(1).toLowerCase();
    if (words.length > 1) mark = base.toUpperCase();
    const letters = (words[words.length - 1] ?? profile.representative).toLowerCase().replace(/[^a-z]/g, "");
    const candidates = [mark, letters[0]?.toUpperCase() + (letters[1] ?? ""),
      ...[...letters.slice(1)].filter((c) => !"aeiou".includes(c)).map((c) => letters[0].toUpperCase() + c)];
    mark = candidates.find((c) => !used.has(c)) ?? mark;
    used.add(mark);
    result.set(profile.id, mark);
  }
  return result;
})();

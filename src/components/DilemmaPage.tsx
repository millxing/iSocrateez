import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SAMPLE_DILEMMAS, SampleDilemma, matchesSample, shuffledSamples } from "../sampleDilemmas";
import { PageHeader } from "./PageHeader";

interface DilemmaPageProps {
  initialDilemma: string;
  /** Reports the text that would be submitted, so the shell knows about unsaved edits. */
  onDraftChange?: (text: string) => void;
  onSubmit: (dilemma: string) => void;
}

export function DilemmaPage({ initialDilemma, onDraftChange, onSubmit }: DilemmaPageProps) {
  const initialExample = SAMPLE_DILEMMAS.find((s) => s.text === initialDilemma);
  // Own text and example choice are kept separately so browsing examples never erases a draft.
  const [ownText, setOwnText] = useState(initialExample ? "" : initialDilemma);
  const [exampleTitle, setExampleTitle] = useState<string | undefined>(initialExample?.title);
  const [mode, setMode] = useState<"own" | "example">(initialExample ? "example" : "own");
  // New random order on each visit to this page; fixed while the user is on it.
  const [samples] = useState(() => shuffledSamples(initialExample?.title));
  // Kept here, not in the list, so the search survives a switch to "Write my own" and back.
  const [query, setQuery] = useState("");

  const selected = SAMPLE_DILEMMAS.find((s) => s.title === exampleTitle);
  const dilemma = mode === "example" ? selected?.text ?? "" : ownText;
  const canContinue = Boolean(dilemma.trim());
  useEffect(() => { onDraftChange?.(dilemma); }, [dilemma, onDraftChange]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    // Grow with the text; CSS min/max-height keep it within a comfortable range.
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [ownText, mode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canContinue) {
      onSubmit(dilemma.trim());
    }
  }

  return (
    <div className="wizard-card dilemma-page">
      <form className="wizard-form" onSubmit={handleSubmit}>
        <div className="wizard-scroll">
          <PageHeader step="Step 1 of 4" title="Dilemma">
            Describe the choice you’re facing: what happened, who is affected, and the options you’re weighing. Or start from an example.
          </PageHeader>
          <div className="mode-toggle" role="group" aria-label="Dilemma source">
            <button
              type="button"
              className={`mode-toggle-option ${mode === "own" ? "is-active" : ""}`}
              aria-pressed={mode === "own"}
              onClick={() => setMode("own")}
            >
              Write my own
            </button>
            <button
              type="button"
              className={`mode-toggle-option ${mode === "example" ? "is-active" : ""}`}
              aria-pressed={mode === "example"}
              onClick={() => setMode("example")}
            >
              Choose an example
            </button>
          </div>
          <div className="dilemma-body">
            {mode === "example" ? (
              <div className={`example-split ${selected ? "has-selection" : ""}`}>
                <ExampleList
                  samples={samples}
                  query={query}
                  onQueryChange={setQuery}
                  selectedTitle={selected?.title}
                  onPick={setExampleTitle}
                />
                <div className="example-preview" aria-live="polite">
                  {selected ? (
                    <>
                      <p className="eyebrow">Selected example</p>
                      <h3 className="example-preview-title">{selected.title}</h3>
                      <p>{selected.text}</p>
                    </>
                  ) : (
                    <p className="example-preview-empty">
                      Pick an example on the left to read it here.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="textarea-wrap">
                <textarea
                  ref={textareaRef}
                  id="dilemma"
                  aria-label="Dilemma"
                  name="dilemma"
                  value={ownText}
                  onChange={(e) => setOwnText(e.target.value)}
                  className="wizard-textarea"
                  placeholder="For example: My manager asked me to quietly adjust some figures so our team hits its target. I'm not comfortable, but pushing back could cost me…"
                  rows={8}
                />
              </div>
            )}
          </div>
        </div>
        <div className="button-row dilemma-actions">
          <button className="button-primary dilemma-continue" type="submit" disabled={!canContinue}>
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

function ExampleList({
  samples,
  query,
  onQueryChange,
  selectedTitle,
  onPick
}: {
  samples: SampleDilemma[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedTitle?: string;
  onPick: (title: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const visible = samples.filter((sample) => matchesSample(sample, query));
  return (
    <div className="example-list-wrap">
      <div className="example-search">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
        <input
          type="search"
          aria-label="Search examples"
          placeholder="Search examples"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            // Down arrow moves from the search box into the results.
            if (event.key !== "ArrowDown") return;
            const first = listRef.current?.querySelector<HTMLButtonElement>(".example-option");
            if (!first) return;
            event.preventDefault();
            first.focus();
          }}
        />
      </div>
      <div
        ref={listRef}
        className="example-list"
        role="group"
        aria-label="Example dilemmas"
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".example-option"));
          const i = items.indexOf(document.activeElement as HTMLButtonElement);
          if (i < 0) return;
          event.preventDefault();
          items[Math.min(items.length - 1, Math.max(0, i + (event.key === "ArrowDown" ? 1 : -1)))].focus();
        }}
      >
        {visible.length === 0 && (
          <p className="example-list-empty" role="status">No examples match “{query.trim()}”.</p>
        )}
        {visible.map((sample) => {
          const active = sample.title === selectedTitle;
          const id = `example-${sample.title.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <button
              key={sample.title}
              type="button"
              aria-pressed={active}
              aria-labelledby={id}
              className={`example-option ${active ? "is-active" : ""}`}
              onClick={() => onPick(sample.title)}
            >
              <span className="choice-label" id={id}>{sample.title}</span>
              {/* Narrow screens read the selection inline instead of in a separate pane. */}
              {active && <span className="example-option-text">{sample.text}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

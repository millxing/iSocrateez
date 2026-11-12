import { describe, expect, it } from "vitest";
import { SAMPLE_DILEMMAS, matchesSample, shuffledSamples } from "./sampleDilemmas";

describe("shuffledSamples", () => {
  it("keeps every example exactly once", () => {
    const titles = shuffledSamples().map((s) => s.title);
    expect(titles).toHaveLength(SAMPLE_DILEMMAS.length);
    expect(new Set(titles)).toEqual(new Set(SAMPLE_DILEMMAS.map((s) => s.title)));
  });

  it("changes the order", () => {
    const original = SAMPLE_DILEMMAS.map((s) => s.title).join("|");
    const random = () => 0;
    expect(shuffledSamples(undefined, random).map((s) => s.title).join("|")).not.toBe(original);
  });

  it("puts a pinned title first", () => {
    const title = SAMPLE_DILEMMAS[SAMPLE_DILEMMAS.length - 1].title;
    expect(shuffledSamples(title)[0].title).toBe(title);
  });

  it("ignores an unknown pinned title", () => {
    expect(shuffledSamples("No such example")).toHaveLength(SAMPLE_DILEMMAS.length);
  });
});

describe("matchesSample", () => {
  const find = (title: string) => SAMPLE_DILEMMAS.find((s) => s.title === title)!;

  it("matches every example on an empty query", () => {
    expect(SAMPLE_DILEMMAS.every((s) => matchesSample(s, "  "))).toBe(true);
  });

  it("matches word starts in the title and text, ignoring case and apostrophes", () => {
    expect(matchesSample(find("The Footbridge"), "FOOT")).toBe(true);
    expect(matchesSample(find("The Student’s Choice"), "students")).toBe(true);
    expect(matchesSample(find("The Murderer at the Door"), "kant lie")).toBe(true);
  });

  it("matches hidden keywords", () => {
    expect(matchesSample(find("The Child Beneath the City"), "omelas")).toBe(true);
    expect(matchesSample(find("The Captain’s Offer"), "williams")).toBe(true);
  });

  it("needs every word to match", () => {
    expect(matchesSample(find("The Footbridge"), "trolley omelas")).toBe(false);
  });

  it("finds the classical examples as a group", () => {
    expect(SAMPLE_DILEMMAS.filter((s) => matchesSample(s, "classical"))).toHaveLength(11);
  });
});

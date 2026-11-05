import { describe, expect, it } from "vitest";
import { philosophyProfiles } from "../shared/philosophyProfiles";
import { matchesPhilosopher } from "./philosopherSearch";

const find = (query: string) =>
  philosophyProfiles.filter((p) => matchesPhilosopher(p, query)).map((p) => p.representative).sort();

describe("philosopher search", () => {
  it("finds Chinese thinkers by country, nationality or region", () => {
    const chinese = ["Confucius", "Laozi", "Mencius", "Zhuangzi"];
    expect(find("china")).toEqual(chinese);
    expect(find("Chinese")).toEqual(chinese);
    expect(find("chin")).toEqual(chinese);
    expect(find("asia")).toEqual(expect.arrayContaining([...chinese, "Siddhartha Gautama (the Buddha)"]));
  });

  it("keeps African and Asian traditions apart", () => {
    expect(find("asia")).not.toContain("The Ubuntu tradition");
    expect(find("africa")).toContain("The Ubuntu tradition");
  });

  it("requires every word to match", () => {
    expect(find("stoic rome")).toEqual(["Epictetus", "Marcus Aurelius", "Seneca"]);
    expect(find("stoic emperor")).toEqual(["Marcus Aurelius"]);
  });

  it("matches alternative spellings, accents and ideas", () => {
    expect(find("lao tzu")).toEqual(["Laozi"]);
    expect(find("soren")).toEqual(["Søren Kierkegaard"]);
    expect(find("islam")).toEqual(["Al-Ghazali"]);
    expect(find("civil rights")).toEqual(["Martin Luther King Jr."]);
  });

  it("shows everyone for an empty query", () => {
    expect(find("  ")).toHaveLength(philosophyProfiles.length);
  });
});

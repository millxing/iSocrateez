import { describe, expect, it } from "vitest";
import { MAX_DILEMMA_CHARACTERS } from "../shared/contracts";
import { readDilemmaFile } from "./dilemmaFile";

function file(content: string, name = "dilemma.txt", type = "text/plain") {
  const f = new File([content], name, { type });
  // jsdom has no Blob.text(); browsers do.
  if (!f.text) Object.defineProperty(f, "text", { value: async () => content });
  return f;
}

describe("readDilemmaFile", () => {
  it("reads a text file and normalizes line endings, a byte-order mark and edge spaces", async () => {
    expect(await readDilemmaFile(file("﻿  First line\r\nSecond line\r\n\n"))).toEqual({
      ok: true,
      text: "First line\nSecond line"
    });
  });

  it("keeps markdown as written", async () => {
    const text = "# My dilemma\n\n- Option A\n- Option B";
    expect(await readDilemmaFile(file(text, "notes.md", ""))).toEqual({ ok: true, text });
  });

  it("refuses other file types", async () => {
    expect(await readDilemmaFile(file("{}", "data.json", "application/json"))).toEqual({
      ok: false,
      error: "Choose a .txt or .md file."
    });
  });

  it("refuses binary content with a text extension", async () => {
    expect(await readDilemmaFile(file("abc\u0000def"))).toEqual({ ok: false, error: "That file is not plain text." });
  });

  it("refuses an empty file", async () => {
    expect(await readDilemmaFile(file("  \n "))).toEqual({ ok: false, error: "That file is empty." });
  });

  it("refuses text over the limit and accepts text at the limit", async () => {
    expect(await readDilemmaFile(file("a".repeat(MAX_DILEMMA_CHARACTERS)))).toMatchObject({ ok: true });
    expect(await readDilemmaFile(file("a".repeat(MAX_DILEMMA_CHARACTERS + 1)))).toEqual({
      ok: false,
      error: "That file has 12,001 characters. The limit is 12,000."
    });
  });

  it("refuses a very large file without reading it", async () => {
    const result = await readDilemmaFile(file("a".repeat(MAX_DILEMMA_CHARACTERS * 4 + 1)));
    expect(result).toEqual({ ok: false, error: "That file is too long. The limit is 12,000 characters." });
  });
});

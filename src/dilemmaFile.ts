import { MAX_DILEMMA_CHARACTERS } from "../shared/contracts";

export const DILEMMA_FILE_ACCEPT = ".txt,.md,.markdown,text/plain,text/markdown";

export type DilemmaFileResult = { ok: true; text: string } | { ok: false; error: string };

const LIMIT = MAX_DILEMMA_CHARACTERS.toLocaleString("en-US");

function isTextFile(file: File): boolean {
  // The picker's accept list is only a hint: "All files" lets anything through.
  return /\.(txt|md|markdown)$/i.test(file.name) || file.type === "text/plain" || file.type === "text/markdown";
}

/** Reads a .txt or .md file into dilemma text, or explains why it can't be used. */
export async function readDilemmaFile(file: File): Promise<DilemmaFileResult> {
  if (!isTextFile(file)) {
    return { ok: false, error: "Choose a .txt or .md file." };
  }
  // A UTF-8 character is at most 4 bytes, so a bigger file can't fit. Skip reading it.
  if (file.size > MAX_DILEMMA_CHARACTERS * 4) {
    return { ok: false, error: `That file is too long. The limit is ${LIMIT} characters.` };
  }
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return { ok: false, error: "The file could not be read. Try again." };
  }
  if (raw.includes("\u0000")) {
    return { ok: false, error: "That file is not plain text." };
  }
  const text = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  if (!text) {
    return { ok: false, error: "That file is empty." };
  }
  if (text.length > MAX_DILEMMA_CHARACTERS) {
    return {
      ok: false,
      error: `That file has ${text.length.toLocaleString("en-US")} characters. The limit is ${LIMIT}.`
    };
  }
  return { ok: true, text };
}

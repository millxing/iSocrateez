/** Helpers shared by the verdict check (run.ts) and the reasoning test (reasoningRun.ts): model calls, retries, cache files. */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

let workdir: string | undefined;

function runProcess(command: string, args: string[], stdin: string): Promise<{ code: number; stdout: string; stderr: string }> {
  workdir ??= mkdtempSync(join(tmpdir(), "isocrateez-verdict-"));
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    // Force subscription sign-in: no API keys.
    delete env.ANTHROPIC_API_KEY;
    const child = spawn(command, args, { cwd: workdir, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 10 * 60 * 1000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? -1, stdout, stderr }); });
    child.stdin.end(stdin);
  });
}

/** One user message, no tools, no settings: as near to the app's API call as the CLI allows. */
export async function callClaude(model: string, effort: string, prompt: string): Promise<string> {
  const { code, stdout, stderr } = await runProcess("claude", [
    "-p", "--model", model, "--effort", effort,
    "--system-prompt", "", "--tools", "", "--setting-sources", "",
    "--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence",
    "--output-format", "json"
  ], prompt);
  if (code !== 0) throw new Error(`claude exited ${code}: ${(stderr || stdout).slice(0, 400)}`);
  const parsed = JSON.parse(stdout) as { result?: string; is_error?: boolean };
  if (parsed.is_error || !parsed.result) throw new Error(`claude returned an error: ${stdout.slice(0, 400)}`);
  return parsed.result;
}

export async function withRetry<T>(label: string, action: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.error(`  ! ${label} attempt ${attempt} failed: ${String(error).slice(0, 200)}`);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 15000));
    }
  }
  throw lastError;
}

export async function pool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
  }));
}

export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/** One prompt to a Codex model (OpenAI), read-only sandbox, no saved session. Returns the last message. */
export async function callCodex(model: string, effort: string, prompt: string): Promise<string> {
  const out = join(mkdtempSync(join(tmpdir(), "isocrateez-codex-")), "out.txt");
  const { code, stdout, stderr } = await runProcess("codex", [
    "exec", "-m", model, "-c", `model_reasoning_effort=${effort}`,
    "--skip-git-repo-check", "--sandbox", "read-only", "--ephemeral", "-o", out, "-"
  ], prompt);
  if (code !== 0) throw new Error(`codex exited ${code}: ${(stderr || stdout).slice(-400)}`);
  const text = existsSync(out) ? readFileSync(out, "utf8").trim() : "";
  if (!text) throw new Error(`codex returned no message: ${(stderr || stdout).slice(-400)}`);
  return text;
}

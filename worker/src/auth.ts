interface TokenPayload {
  exp: number;
}

function toBase64Url(value: ArrayBuffer | string): string {
  const text =
    typeof value === "string"
      ? btoa(value)
      : btoa(String.fromCharCode(...new Uint8Array(value)));

  return text.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return toBase64Url(signature);
}

export async function createSignedToken(
  payload: TokenPayload,
  secret: string
): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = await sign(`${header}.${body}`, secret);

  return `${header}.${body}.${signature}`;
}

export async function verifySignedToken(
  token: string,
  secret: string
): Promise<TokenPayload | null> {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const expected = await sign(`${header}.${body}`, secret);
  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as TokenPayload;
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

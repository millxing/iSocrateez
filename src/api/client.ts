import type {
  AdviceRequest,
  AdviceResponse,
  SessionResponse
} from "../../shared/contracts";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function createSession(password: string): Promise<SessionResponse> {
  return request<SessionResponse>("/api/session", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export async function requestAdvice(payload: AdviceRequest, signal?: AbortSignal): Promise<AdviceResponse> {
  return request<AdviceResponse>("/api/advice", {
    method: "POST",
    body: JSON.stringify(payload),
    signal
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the advice server. Check that the backend is running.", 0);
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(data?.error || "Request failed.", response.status);
  }

  return data as T;
}

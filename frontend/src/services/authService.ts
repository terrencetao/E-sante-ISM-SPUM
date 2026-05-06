import api from "./api";
import type { AuthTokenResponse, JwtPayload, RoleName } from "../types/api";

const AUTH_TOKEN_KEY = "access_token";
const AUTH_EMAIL_KEY = "current_email";
const AUTH_ROLE_KEY = "current_role";
const AUTH_SESSION_EVENT = "auth-session-changed";

function emitAuthSessionChanged(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export async function login(email: string, pin: string): Promise<AuthTokenResponse> {
  const { data } = await api.post<AuthTokenResponse>("/auth/login", { email, pin });
  setAuthSession(data.access_token, data.email ?? email, data.role_name);
  return data;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  emitAuthSessionChanged();
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthSession(accessToken: string, email?: string, roleName?: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (email) {
    localStorage.setItem(AUTH_EMAIL_KEY, email);
  }

  const resolvedRole = roleName ?? getTokenPayloadFromToken(accessToken)?.role;
  if (resolvedRole) {
    localStorage.setItem(AUTH_ROLE_KEY, resolvedRole);
  }

  emitAuthSessionChanged();
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function getTokenPayload(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(segments[1])) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

function getTokenPayloadFromToken(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(segments[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getCurrentRole(): RoleName | null {
  const fromStorage = localStorage.getItem(AUTH_ROLE_KEY);
  if (fromStorage) {
    return fromStorage as RoleName;
  }
  return getTokenPayload()?.role ?? null;
}

export function getCurrentEmail(): string | null {
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function isDevEnvironment(): boolean {
  return (import.meta.env.VITE_APP_ENV ?? "dev") === "dev";
}

export function onAuthSessionChange(listener: () => void): () => void {
  window.addEventListener(AUTH_SESSION_EVENT, listener);
  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, listener);
  };
}

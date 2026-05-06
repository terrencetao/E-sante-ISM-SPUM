import api from "./api";
import type { AuthTokenResponse, JwtPayload, RoleName } from "../types/api";

export async function login(email: string, pin: string): Promise<AuthTokenResponse> {
  const { data } = await api.post<AuthTokenResponse>("/auth/login", { email, pin });
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export function logout(): void {
  localStorage.removeItem("access_token");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
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

export function getCurrentRole(): RoleName | null {
  return getTokenPayload()?.role ?? null;
}

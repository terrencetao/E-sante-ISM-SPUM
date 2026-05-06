import api from "./api";
import type { AuthTokenResponse } from "../types/api";

export async function login(email: string, pin: string): Promise<AuthTokenResponse> {
  const { data } = await api.post<AuthTokenResponse>("/auth/login", { email, pin });
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export function logout(): void {
  localStorage.removeItem("access_token");
}

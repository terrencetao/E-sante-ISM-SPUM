import api from "./api";
import { setAuthSession } from "./authService";
import type { DevResetSystemResponse, DevSwitchUserResponse } from "../types/api";

export async function devSwitchUser(targetEmail: string): Promise<DevSwitchUserResponse> {
  const { data } = await api.post<DevSwitchUserResponse>("/admin/dev/switch-user", {
    target_email: targetEmail,
  });
  setAuthSession(data.access_token, data.email, data.role_name);
  return data;
}

export async function devResetSystem(): Promise<DevResetSystemResponse> {
  const { data } = await api.post<DevResetSystemResponse>("/admin/dev/reset-system", {});
  return data;
}

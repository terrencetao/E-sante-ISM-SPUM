import api from "./api";
import type { ResetPinResponse, User, UserCreateInput } from "../types/api";

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function createUser(payload: UserCreateInput): Promise<ResetPinResponse> {
  const { data } = await api.post<ResetPinResponse>("/users", payload);
  return data;
}

export async function resetUserPin(userId: string): Promise<ResetPinResponse> {
  const { data } = await api.post<ResetPinResponse>(`/users/${userId}/reset-pin`);
  return data;
}

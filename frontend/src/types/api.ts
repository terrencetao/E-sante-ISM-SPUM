export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  email?: string;
  role_name?: RoleName;
};

export type RoleName =
  | "administrator_system"
  | "administrator_campaign"
  | "intervenant_terrain"
  | "analyste"
  | "developer_superuser";

export type JwtPayload = {
  sub: string;
  role: RoleName;
  iat: number;
  exp: number;
};

export type Assignment = {
  id: string;
  campaign_id: string;
  health_area_id: string;
  status: string;
  assigned_at: string;
};

export type AssignmentResponse = {
  assignment: Assignment | null;
};

export type SyncResponse = {
  accepted: string[];
  conflicts: Array<{ conflict_id: string; data_id: string | null; reason: string }>;
  timestamp: string;
};

export type DataStatusResponse = {
  timestamp: string;
  total: number;
  pending: number;
  synced: number;
  conflicts: number;
};

export type CollectedDataInput = {
  campaign_id: string;
  health_area_id: string;
  village_id: string | null;
  data_payload: Record<string, unknown>;
  source_timestamp: string;
};

export type User = {
  id: string;
  email: string;
  role_name: RoleName;
  is_active: boolean;
  must_change_pin: boolean;
  created_at: string;
  updated_at: string;
};

export type UserCreateInput = {
  email: string;
  role_name: RoleName;
};

export type ResetPinResponse = {
  user_id: string;
  temporary_pin: string;
};

export type HealthArea = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Village = {
  id: string;
  health_area_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AnalyticsSummary = {
  total_records: number;
  by_campaign: Record<string, number>;
  by_health_area: Record<string, number>;
};

export type CollectedDataRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  health_area_id: string;
  village_id: string | null;
  data_payload: Record<string, unknown>;
  sync_status: string;
  source: string;
  source_timestamp: string;
  created_at: string;
  updated_at: string;
};

export type ConflictLog = {
  id: string;
  data_id: string | null;
  local_value: Record<string, unknown>;
  server_value: Record<string, unknown> | null;
  resolution_strategy: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  status: string;
  ip_address: string | null;
  timestamp: string;
};

export type DevSwitchUserResponse = {
  access_token: string;
  token_type: string;
  email: string;
  role_name: RoleName;
};

export type DevResetSystemResponse = {
  status: string;
  deleted_collected_data: number;
  deleted_assignments: number;
  deleted_campaigns: number;
  deleted_villages: number;
  deleted_health_areas: number;
  deleted_conflicts: number;
  deleted_audit_logs: number;
  deleted_users: number;
};

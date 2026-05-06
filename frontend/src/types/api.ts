export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
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

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID NULL,
  old_value JSONB NULL,
  new_value JSONB NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  ip_address VARCHAR(64) NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conflict_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_id UUID NULL REFERENCES collected_data(id),
  local_value JSONB NOT NULL,
  server_value JSONB NULL,
  resolution_strategy VARCHAR(30) NOT NULL DEFAULT 'last_write_win',
  resolved_at TIMESTAMP NULL,
  resolved_by UUID NULL REFERENCES users(id),
  resolution_notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Dawnexus Social v1.0.0 Production Database Schema
-- Multi-Tenant Architecture with Strict Workspace Scoping & RLS
-- Safe, Idempotent, Isolated with 'social_' table prefix

CREATE TABLE IF NOT EXISTS social_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT DEFAULT 'General Business',
  require_approval BOOLEAN DEFAULT TRUE,
  max_campaign_daily_budget NUMERIC(10, 2) DEFAULT 500.00,
  created_by TEXT REFERENCES social_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS social_connected_accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  account_type TEXT NOT NULL CHECK (account_type IN ('instagram_business', 'facebook_page', 'linkedin_page', 'linkedin_profile')),
  account_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  permissions TEXT[] DEFAULT '{}',
  encrypted_token TEXT,
  token_expires_at TIMESTAMPTZ,
  followers_count INT DEFAULT 0,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_oauth_states (
  state_token TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS social_media_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  size_bytes BIGINT DEFAULT 0,
  source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'ai_generated')),
  dimensions JSONB,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  target_platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  author_id TEXT,
  author_name TEXT NOT NULL,
  approver_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  publish_errors JSONB,
  media_assets JSONB DEFAULT '[]',
  platform_variations JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_content_approvals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_scheduled_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  error_message TEXT,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_publishing_attempts (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES social_scheduled_jobs(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  provider_post_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retrying')),
  request_payload JSONB,
  response_payload JSONB,
  error_details TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_campaigns (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'linkedin')),
  ad_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
  daily_budget NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_campaign_metrics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES social_campaigns(id) ON DELETE CASCADE,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(10, 2) DEFAULT 0.00,
  cpc NUMERIC(10, 2) DEFAULT 0.00,
  ctr NUMERIC(5, 2) DEFAULT 0.00,
  conversions INT DEFAULT 0,
  cpl NUMERIC(10, 2) DEFAULT 0.00,
  roas NUMERIC(5, 2) DEFAULT 0.00,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS social_ai_generations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  platform TEXT,
  generated_content TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_mcp_credentials (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_mcp_audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  credential_id TEXT REFERENCES social_mcp_credentials(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  client_ip TEXT,
  parameters JSONB,
  status TEXT NOT NULL,
  execution_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES social_workspaces(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'mcp_assistant', 'scheduler_engine')),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social_publish', 'campaign_change', 'mcp_access', 'security', 'approval')),
  details TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_social_members_user ON social_workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_ws_status ON social_posts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_sched ON social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_jobs_run ON social_scheduled_jobs(run_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_social_campaigns_ws ON social_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_mcp_hash ON social_mcp_credentials(key_hash);
CREATE INDEX IF NOT EXISTS idx_social_audit_ws ON social_audit_logs(workspace_id, created_at DESC);


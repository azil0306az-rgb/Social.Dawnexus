export type PlatformType = 'instagram' | 'facebook' | 'linkedin';

export type AccountStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: PlatformType;
  accountType: 'instagram_business' | 'facebook_page' | 'linkedin_page' | 'linkedin_profile';
  accountName: string;
  handle: string;
  avatarUrl?: string;
  status: AccountStatus;
  permissions: string[];
  followersCount: number;
  lastSyncAt: string;
  tokenExpiresAt?: string;
  errorMessage?: string;
  isMock?: boolean;
}

export type PostStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'scheduled' 
  | 'published' 
  | 'failed';

export interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  sizeBytes: number;
  source: 'upload' | 'ai_generated';
  dimensions?: { width: number; height: number };
}

export interface PostVariation {
  platform: PlatformType;
  caption: string;
  hashtags?: string[];
}

export interface Post {
  id: string;
  workspaceId: string;
  caption: string;
  media: MediaAsset[];
  targetPlatforms: PlatformType[];
  targetAccountIds: string[];
  status: PostStatus;
  scheduledFor?: string;
  publishedAt?: string;
  authorName: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  variations?: Partial<Record<PlatformType, PostVariation>>;
  publishErrors?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetricSnapshot {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpc: number;
  ctr: number;
  conversions: number;
  cpl: number; // cost per lead
  roas: number;
}

export interface AdCampaign {
  id: string;
  workspaceId: string;
  platform: 'meta' | 'linkedin';
  name: string;
  objective: 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS';
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'PENDING_CONFIRMATION';
  dailyBudget: number;
  lifetimeBudget?: number;
  currency: string;
  metrics: CampaignMetricSnapshot;
  aiRecommendations: string[];
  startDate: string;
  endDate?: string;
  adAccountId: string;
  adAccountName: string;
  lastUpdated: string;
}

export interface McpApiKey {
  id: string;
  workspaceId: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  status: 'active' | 'revoked';
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorType: 'user' | 'mcp_assistant' | 'scheduler_engine';
  actorName: string;
  action: string;
  category: 'social_publish' | 'campaign_change' | 'mcp_access' | 'security' | 'approval';
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  businessType: string;
  requireApprovalForPublishing: boolean;
  maxCampaignDailySpendLimit: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  currentWorkspaceId: string;
  workspaces: Workspace[];
}

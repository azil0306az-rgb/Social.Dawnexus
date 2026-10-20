import { SocialAccount, Post, AdCampaign, McpApiKey, AuditLog, PlatformType, PostStatus } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_POSTS, INITIAL_CAMPAIGNS, INITIAL_MCP_KEYS, INITIAL_AUDIT_LOGS } from '../data/mockData';

const STORAGE_KEYS = {
  ACCOUNTS: 'dawnexus_social_accounts_v1',
  POSTS: 'dawnexus_social_posts_v1',
  CAMPAIGNS: 'dawnexus_social_campaigns_v1',
  MCP_KEYS: 'dawnexus_social_mcp_keys_v1',
  AUDIT_LOGS: 'dawnexus_social_audit_logs_v1',
};

class DataService {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  // --- ACCOUNTS ---
  getAccounts(workspaceId: string): SocialAccount[] {
    const list = this.get<SocialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    return list.filter(a => a.workspaceId === workspaceId);
  }

  connectAccount(account: Omit<SocialAccount, 'id' | 'lastSyncAt'>): SocialAccount {
    const list = this.get<SocialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const newAcc: SocialAccount = {
      ...account,
      id: `acc_${account.platform}_${Date.now()}`,
      lastSyncAt: 'Just now',
    };
    list.push(newAcc);
    this.set(STORAGE_KEYS.ACCOUNTS, list);
    this.logAction(account.workspaceId, 'user', 'User', `Connected ${account.platform} account (${account.handle})`, 'security', 'info');
    return newAcc;
  }

  disconnectAccount(workspaceId: string, accountId: string): void {
    let list = this.get<SocialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const target = list.find(a => a.id === accountId);
    list = list.filter(a => a.id !== accountId);
    this.set(STORAGE_KEYS.ACCOUNTS, list);
    if (target) {
      this.logAction(workspaceId, 'user', 'User', `Disconnected ${target.platform} account (${target.handle})`, 'security', 'warning');
    }
  }

  reconnectAccount(workspaceId: string, accountId: string): void {
    const list = this.get<SocialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const acc = list.find(a => a.id === accountId);
    if (acc) {
      acc.status = 'connected';
      acc.lastSyncAt = 'Just now';
      acc.errorMessage = undefined;
      this.set(STORAGE_KEYS.ACCOUNTS, list);
      this.logAction(workspaceId, 'user', 'User', `Re-authorized ${acc.platform} token credentials`, 'security', 'info');
    }
  }

  // --- POSTS ---
  getPosts(workspaceId: string): Post[] {
    const list = this.get<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    return list.filter(p => p.workspaceId === workspaceId);
  }

  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post {
    const list = this.get<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const now = new Date().toISOString();
    const newPost: Post = {
      ...post,
      id: `post_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newPost);
    this.set(STORAGE_KEYS.POSTS, list);
    this.logAction(
      post.workspaceId,
      'user',
      post.authorName || 'User',
      `Created new post #${newPost.id.slice(-4)} (${post.status}) for [${post.targetPlatforms.join(', ')}]`,
      'social_publish',
      'info'
    );
    return newPost;
  }

  updatePost(workspaceId: string, postId: string, updates: Partial<Post>): Post | null {
    const list = this.get<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const idx = list.findIndex(p => p.id === postId && p.workspaceId === workspaceId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.set(STORAGE_KEYS.POSTS, list);
    return list[idx];
  }

  updatePostStatus(workspaceId: string, postId: string, status: PostStatus, approverName?: string): Post | null {
    const list = this.get<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const post = list.find(p => p.id === postId && p.workspaceId === workspaceId);
    if (!post) return null;

    post.status = status;
    post.updatedAt = new Date().toISOString();
    if (status === 'approved' && approverName) {
      post.approverName = approverName;
      post.approvedAt = new Date().toISOString();
      this.logAction(workspaceId, 'user', approverName, `Approved post #${postId.slice(-4)} for publishing`, 'approval', 'info');
    } else if (status === 'published') {
      post.publishedAt = new Date().toISOString();
      this.logAction(workspaceId, 'scheduler_engine', 'Dawnexus Scheduler', `Published post #${postId.slice(-4)} successfully`, 'social_publish', 'info');
    }
    this.set(STORAGE_KEYS.POSTS, list);
    return post;
  }

  deletePost(workspaceId: string, postId: string): void {
    let list = this.get<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    list = list.filter(p => !(p.id === postId && p.workspaceId === workspaceId));
    this.set(STORAGE_KEYS.POSTS, list);
    this.logAction(workspaceId, 'user', 'User', `Deleted post #${postId.slice(-4)}`, 'social_publish', 'warning');
  }

  // --- CAMPAIGNS ---
  getCampaigns(workspaceId: string): AdCampaign[] {
    const list = this.get<AdCampaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    return list.filter(c => c.workspaceId === workspaceId);
  }

  updateCampaignStatus(workspaceId: string, campaignId: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'): void {
    const list = this.get<AdCampaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    const cmp = list.find(c => c.id === campaignId && c.workspaceId === workspaceId);
    if (cmp) {
      cmp.status = status;
      cmp.lastUpdated = 'Just now';
      this.set(STORAGE_KEYS.CAMPAIGNS, list);
      this.logAction(workspaceId, 'user', 'User', `Changed campaign status to ${status} on Meta Ads: "${cmp.name}"`, 'campaign_change', 'warning');
    }
  }

  updateCampaignBudget(workspaceId: string, campaignId: string, newDailyBudget: number): void {
    const list = this.get<AdCampaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    const cmp = list.find(c => c.id === campaignId && c.workspaceId === workspaceId);
    if (cmp) {
      const oldBudget = cmp.dailyBudget;
      cmp.dailyBudget = newDailyBudget;
      cmp.lastUpdated = 'Just now';
      this.set(STORAGE_KEYS.CAMPAIGNS, list);
      this.logAction(
        workspaceId,
        'user',
        'User',
        `Adjusted campaign daily budget from $${oldBudget} to $${newDailyBudget} (Confirmed) for "${cmp.name}"`,
        'campaign_change',
        'warning'
      );
    }
  }

  // --- MCP API KEYS ---
  getMcpKeys(workspaceId: string): McpApiKey[] {
    const list = this.get<McpApiKey[]>(STORAGE_KEYS.MCP_KEYS, INITIAL_MCP_KEYS);
    return list.filter(k => k.workspaceId === workspaceId);
  }

  createMcpKey(workspaceId: string, name: string): { key: McpApiKey; fullSecret: string } {
    const list = this.get<McpApiKey[]>(STORAGE_KEYS.MCP_KEYS, INITIAL_MCP_KEYS);
    const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    const fullSecret = `dwnx_live_${randomHex}`;
    const newKey: McpApiKey = {
      id: `key_${Date.now()}`,
      workspaceId,
      name: name || 'AI Assistant Client',
      keyPrefix: fullSecret.substring(0, 14),
      maskedKey: `${fullSecret.substring(0, 14)}••••••••••••••••••••${fullSecret.slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    list.unshift(newKey);
    this.set(STORAGE_KEYS.MCP_KEYS, list);
    this.logAction(workspaceId, 'user', 'User', `Generated new MCP API Key: "${newKey.name}"`, 'mcp_access', 'info');
    return { key: newKey, fullSecret };
  }

  revokeMcpKey(workspaceId: string, keyId: string): void {
    const list = this.get<McpApiKey[]>(STORAGE_KEYS.MCP_KEYS, INITIAL_MCP_KEYS);
    const k = list.find(item => item.id === keyId && item.workspaceId === workspaceId);
    if (k) {
      k.status = 'revoked';
      k.revokedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.MCP_KEYS, list);
      this.logAction(workspaceId, 'user', 'User', `Revoked MCP API access key "${k.name}"`, 'security', 'critical');
    }
  }

  // --- AUDIT LOGS ---
  getAuditLogs(workspaceId: string): AuditLog[] {
    const list = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return list.filter(l => l.workspaceId === workspaceId);
  }

  logAction(
    workspaceId: string,
    actorType: 'user' | 'mcp_assistant' | 'scheduler_engine',
    actorName: string,
    action: string,
    category: 'social_publish' | 'campaign_change' | 'mcp_access' | 'security' | 'approval',
    severity: 'info' | 'warning' | 'critical'
  ): void {
    const list = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      workspaceId,
      actorType,
      actorName,
      action,
      category,
      details: `Triggered at ${new Date().toLocaleTimeString()} via Dawnexus Secure Gateway.`,
      timestamp: 'Just now',
      severity,
    };
    list.unshift(newLog);
    // Keep max 100 logs in storage
    this.set(STORAGE_KEYS.AUDIT_LOGS, list.slice(0, 100));
  }

  // --- AI COPYWRITING SIMULATOR ---
  async generateAiCaption(topic: string, platform: PlatformType, tone: string = 'Professional & Engaging'): Promise<{ caption: string; hashtags: string[] }> {
    await new Promise(r => setTimeout(r, 600)); // Simulate AI model inference
    
    if (platform === 'linkedin') {
      return {
        caption: `In today's fast-moving market, ${topic.toLowerCase() || 'accelerating growth'} requires moving beyond traditional playbooks.\n\nAt Dawnexus, we've observed that high-performing teams combine automated workflows with rigorous human oversight to drive sustainable scale.\n\nKey takeaways:\n• Streamlined multi-channel deployment\n• Unified attribution across Meta & professional networks\n• Measurable efficiency gains without losing brand integrity\n\nWhat are your priorities for this quarter? Let's discuss in the comments.`,
        hashtags: ['#Dawnexus', '#B2BGrowth', '#DigitalStrategy', '#MarketingAutomation', '#Innovation']
      };
    } else if (platform === 'instagram') {
      return {
        caption: `Elevate your digital footprint with ${topic || 'next-generation brand experiences'}. ✨\n\nSwipe to see our methodology in action. From automated content scheduling to precision audience segmentation, we build systems that scale effortlessly. 🚀\n\nDrop a comment or link in bio to learn more.`,
        hashtags: ['#Dawnexus', '#GrowthMarketing', '#DesignInspiration', '#CreativeAgency', '#ContentStrategy']
      };
    } else {
      return {
        caption: `Ready to transform your brand's reach? ${topic ? `Discover how ${topic} delivers measurable impact.` : 'Our latest case study breaks down full-funnel digital acceleration.'}\n\nRead the full breakdown on dawnexus.in or schedule a strategy session today.`,
        hashtags: ['#Dawnexus', '#DigitalAgency', '#BusinessGrowth', '#MarketingTips']
      };
    }
  }
}

export const dataService = new DataService();

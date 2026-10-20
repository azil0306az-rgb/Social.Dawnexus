import { SocialAccount, Post, AdCampaign, McpApiKey, AuditLog, PlatformType, PostStatus } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_POSTS, INITIAL_CAMPAIGNS, INITIAL_MCP_KEYS, INITIAL_AUDIT_LOGS } from '../data/mockData';

class DataService {
  private cache = {
    accounts: new Map<string, SocialAccount[]>(),
    posts: new Map<string, Post[]>(),
    campaigns: new Map<string, AdCampaign[]>(),
    mcpKeys: new Map<string, McpApiKey[]>(),
    auditLogs: new Map<string, AuditLog[]>(),
  };

  // --- ACCOUNTS ---
  async fetchAccounts(workspaceId: string): Promise<SocialAccount[]> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/accounts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          this.cache.accounts.set(workspaceId, data.accounts);
          return data.accounts;
        }
      }
    } catch (e) {
      // Return cached
    }
    return this.getAccounts(workspaceId);
  }

  getAccounts(workspaceId: string): SocialAccount[] {
    return this.cache.accounts.get(workspaceId) || [];
  }

  async connectAccount(account: Omit<SocialAccount, 'id' | 'lastSyncAt'>): Promise<SocialAccount> {
    try {
      const res = await fetch(`/api/workspaces/${account.workspaceId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(account),
      });
      if (res.ok) {
        const data = await res.json();
        const created: SocialAccount = {
          ...account,
          id: data.accountId || `acc_${Date.now()}`,
          lastSyncAt: 'Just now',
        };
        const current = this.getAccounts(account.workspaceId);
        this.cache.accounts.set(account.workspaceId, [...current, created]);
        return created;
      }
    } catch {
      // Fallback
    }

    const newAcc: SocialAccount = {
      ...account,
      id: `acc_${account.platform}_${Date.now()}`,
      lastSyncAt: 'Just now',
    };
    const current = this.getAccounts(account.workspaceId);
    this.cache.accounts.set(account.workspaceId, [...current, newAcc]);
    return newAcc;
  }

  async disconnectAccount(workspaceId: string, accountId: string): Promise<void> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Fallback
    }
    const current = this.getAccounts(workspaceId).filter(a => a.id !== accountId);
    this.cache.accounts.set(workspaceId, current);
  }

  reconnectAccount(workspaceId: string, accountId: string): void {
    const list = this.getAccounts(workspaceId);
    const acc = list.find(a => a.id === accountId);
    if (acc) {
      acc.status = 'connected';
      acc.lastSyncAt = 'Just now';
      acc.errorMessage = undefined;
    }
  }

  // --- POSTS ---
  async fetchPosts(workspaceId: string): Promise<Post[]> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/posts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.posts) {
          this.cache.posts.set(workspaceId, data.posts);
          return data.posts;
        }
      }
    } catch {
      // Return cached
    }
    return this.getPosts(workspaceId);
  }

  getPosts(workspaceId: string): Post[] {
    return this.cache.posts.get(workspaceId) || INITIAL_POSTS.filter(p => p.workspaceId === workspaceId);
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    try {
      const res = await fetch(`/api/workspaces/${post.workspaceId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(post),
      });
      if (res.ok) {
        const data = await res.json();
        const created: Post = {
          ...post,
          id: data.postId || `post_${Date.now()}`,
          status: data.status || post.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const current = this.getPosts(post.workspaceId);
        this.cache.posts.set(post.workspaceId, [created, ...current]);
        return created;
      }
    } catch {
      // Fallback
    }

    const fallback: Post = {
      ...post,
      id: `post_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = this.getPosts(post.workspaceId);
    this.cache.posts.set(post.workspaceId, [fallback, ...current]);
    return fallback;
  }

  async updatePostStatus(workspaceId: string, postId: string, status: PostStatus, approverName?: string): Promise<Post | null> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
    } catch {
      // Fallback
    }

    const current = this.getPosts(workspaceId);
    const post = current.find(p => p.id === postId);
    if (!post) return null;

    post.status = status;
    post.updatedAt = new Date().toISOString();
    if (status === 'approved' && approverName) {
      post.approverName = approverName;
      post.approvedAt = new Date().toISOString();
    } else if (status === 'published') {
      post.publishedAt = new Date().toISOString();
    }
    return post;
  }

  async deletePost(workspaceId: string, postId: string): Promise<void> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Fallback
    }
    const current = this.getPosts(workspaceId).filter(p => p.id !== postId);
    this.cache.posts.set(workspaceId, current);
  }

  // --- CAMPAIGNS ---
  async fetchCampaigns(workspaceId: string): Promise<AdCampaign[]> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/campaigns`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) {
          this.cache.campaigns.set(workspaceId, data.campaigns);
          return data.campaigns;
        }
      }
    } catch {
      // Return cached
    }
    return this.getCampaigns(workspaceId);
  }

  getCampaigns(workspaceId: string): AdCampaign[] {
    return this.cache.campaigns.get(workspaceId) || INITIAL_CAMPAIGNS.filter(c => c.workspaceId === workspaceId);
  }

  async updateCampaignStatus(workspaceId: string, campaignId: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'): Promise<void> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
    } catch {
      // Fallback
    }
    const list = this.getCampaigns(workspaceId);
    const cmp = list.find(c => c.id === campaignId);
    if (cmp) {
      cmp.status = status;
      cmp.lastUpdated = 'Just now';
    }
  }

  async updateCampaignBudget(workspaceId: string, campaignId: string, newDailyBudget: number): Promise<void> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dailyBudget: newDailyBudget }),
      });
    } catch {
      // Fallback
    }
    const list = this.getCampaigns(workspaceId);
    const cmp = list.find(c => c.id === campaignId);
    if (cmp) {
      cmp.dailyBudget = newDailyBudget;
      cmp.lastUpdated = 'Just now';
    }
  }

  // --- MCP API KEYS ---
  async fetchMcpKeys(workspaceId: string): Promise<McpApiKey[]> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/mcp-keys`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.keys) {
          const keys = data.keys.map((k: any) => ({
            id: k.id,
            workspaceId: k.workspace_id,
            name: k.name,
            keyPrefix: k.key_prefix,
            maskedKey: k.masked_key,
            createdAt: k.created_at,
            lastUsedAt: k.last_used_at,
            revokedAt: k.revoked_at,
            status: k.status,
          }));
          this.cache.mcpKeys.set(workspaceId, keys);
          return keys;
        }
      }
    } catch {
      // Return cached
    }
    return this.getMcpKeys(workspaceId);
  }

  getMcpKeys(workspaceId: string): McpApiKey[] {
    return this.cache.mcpKeys.get(workspaceId) || INITIAL_MCP_KEYS.filter(k => k.workspaceId === workspaceId);
  }

  async createMcpKey(workspaceId: string, name: string): Promise<{ key: McpApiKey; fullSecret: string }> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/mcp-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        const current = this.getMcpKeys(workspaceId);
        this.cache.mcpKeys.set(workspaceId, [data.key, ...current]);
        return data;
      }
    } catch {
      // Fallback
    }

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
    const current = this.getMcpKeys(workspaceId);
    this.cache.mcpKeys.set(workspaceId, [newKey, ...current]);
    return { key: newKey, fullSecret };
  }

  async revokeMcpKey(workspaceId: string, keyId: string): Promise<void> {
    try {
      await fetch(`/api/workspaces/${workspaceId}/mcp-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Fallback
    }
    const current = this.getMcpKeys(workspaceId);
    const k = current.find(item => item.id === keyId);
    if (k) {
      k.status = 'revoked';
      k.revokedAt = new Date().toISOString();
    }
  }

  // --- AUDIT LOGS ---
  async fetchAuditLogs(workspaceId: string): Promise<AuditLog[]> {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/audit-logs`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          this.cache.auditLogs.set(workspaceId, data.logs);
          return data.logs;
        }
      }
    } catch {
      // Return cached
    }
    return this.getAuditLogs(workspaceId);
  }

  getAuditLogs(workspaceId: string): AuditLog[] {
    return this.cache.auditLogs.get(workspaceId) || INITIAL_AUDIT_LOGS.filter(l => l.workspaceId === workspaceId);
  }

  // --- AI COPYWRITING ENGINE ---
  async generateAiCaption(topic: string, platform: PlatformType): Promise<{ caption: string; hashtags: string[] }> {
    await new Promise(r => setTimeout(r, 500));
    
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

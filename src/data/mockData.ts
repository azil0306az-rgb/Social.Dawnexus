import { SocialAccount, Post, AdCampaign, McpApiKey, AuditLog } from '../types';

export const INITIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc_ig_01',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'instagram',
    accountType: 'instagram_business',
    accountName: 'Dawnexus Official',
    handle: '@dawnexus.in',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    status: 'connected',
    permissions: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_read_engagement'
    ],
    followersCount: 14250,
    lastSyncAt: 'Just now',
    tokenExpiresAt: '2026-12-19T10:00:00Z',
    isMock: false,
  },
  {
    id: 'acc_fb_01',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'facebook',
    accountType: 'facebook_page',
    accountName: 'Dawnexus Digital Agency',
    handle: 'dawnexus.agency',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    status: 'connected',
    permissions: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'ads_read'
    ],
    followersCount: 8920,
    lastSyncAt: '5 mins ago',
    tokenExpiresAt: '2026-12-19T10:00:00Z',
    isMock: false,
  },
  {
    id: 'acc_li_01',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'linkedin',
    accountType: 'linkedin_page',
    accountName: 'Dawnexus Technologies',
    handle: 'company/dawnexus',
    avatarUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80',
    status: 'connected',
    permissions: [
      'w_organization_social',
      'r_organization_social',
      'rw_organization_admin'
    ],
    followersCount: 6410,
    lastSyncAt: '12 mins ago',
    tokenExpiresAt: '2026-11-20T10:00:00Z',
    isMock: false,
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_001',
    workspaceId: 'ws_dawnexus_prod',
    caption: 'Discover how autonomous AI models & structured MCP integrations are redefining B2B growth workflows in 2026. Read our latest deep dive on dawnexus.in.',
    media: [
      {
        id: 'med_01',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        name: 'ai-architecture-banner.jpg',
        sizeBytes: 842000,
        source: 'upload',
      }
    ],
    targetPlatforms: ['instagram', 'facebook', 'linkedin'],
    targetAccountIds: ['acc_ig_01', 'acc_fb_01', 'acc_li_01'],
    status: 'published',
    publishedAt: '2026-10-19T14:30:00Z',
    authorName: 'Arun Kumar',
    approverName: 'Arun Kumar',
    approvedAt: '2026-10-19T14:00:00Z',
    createdAt: '2026-10-19T12:00:00Z',
    updatedAt: '2026-10-19T14:30:00Z',
  },
  {
    id: 'post_002',
    workspaceId: 'ws_dawnexus_prod',
    caption: 'Transform your brand authority with real-time video generation and precision Meta advertising funnels. 🚀 Swipe for our Q3 agency benchmark metrics.',
    media: [
      {
        id: 'med_02',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        name: 'meta-metrics-breakdown.jpg',
        sizeBytes: 1240000,
        source: 'upload',
      }
    ],
    targetPlatforms: ['instagram', 'linkedin'],
    targetAccountIds: ['acc_ig_01', 'acc_li_01'],
    status: 'scheduled',
    scheduledFor: '2026-10-21T11:00:00Z',
    authorName: 'Arun Kumar',
    approverName: 'Arun Kumar',
    approvedAt: '2026-10-20T09:15:00Z',
    createdAt: '2026-10-20T08:45:00Z',
    updatedAt: '2026-10-20T09:15:00Z',
  },
  {
    id: 'post_003',
    workspaceId: 'ws_dawnexus_prod',
    caption: 'Behind the scenes: Deploying real-time MCP tool bridges for our enterprise marketing clients. What tools would you like your AI assistant to run natively?',
    media: [
      {
        id: 'med_03',
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        name: 'terminal-code-screenshot.png',
        sizeBytes: 654000,
        source: 'upload',
      }
    ],
    targetPlatforms: ['linkedin'],
    targetAccountIds: ['acc_li_01'],
    status: 'pending_approval',
    scheduledFor: '2026-10-22T15:00:00Z',
    authorName: 'Marketing Team',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'post_004',
    workspaceId: 'ws_dawnexus_prod',
    caption: 'Drafting new client case study: 380% ROAS improvement using automated audience segment exclusions on Meta Ads.',
    media: [],
    targetPlatforms: ['facebook', 'linkedin'],
    targetAccountIds: ['acc_fb_01', 'acc_li_01'],
    status: 'draft',
    authorName: 'Arun Kumar',
    createdAt: '2026-10-20T09:30:00Z',
    updatedAt: '2026-10-20T09:30:00Z',
  }
];

export const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'cmp_meta_01',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'meta',
    name: 'Dawnexus — Enterprise AI Growth Funnel (Q4)',
    objective: 'OUTCOME_LEADS',
    status: 'ACTIVE',
    dailyBudget: 150,
    currency: 'USD',
    adAccountId: 'act_982341209341',
    adAccountName: 'Dawnexus Agency Ads',
    startDate: '2026-10-01',
    lastUpdated: '10 mins ago',
    metrics: {
      impressions: 48920,
      reach: 34100,
      clicks: 1420,
      spend: 642.50,
      cpc: 0.45,
      ctr: 2.90,
      conversions: 84,
      cpl: 7.65,
      roas: 4.8,
    },
    aiRecommendations: [
      'Scale daily budget by 15% on high-performing Lookalike (1%) audience in Chennai & Bangalore.',
      'Creative #3 has 4.1% CTR; allocate 60% of ad set spend to it.',
      'Exclude users who visited /contact in the last 7 days to eliminate ad spend fatigue.'
    ]
  },
  {
    id: 'cmp_meta_02',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'meta',
    name: 'VKV Realty — Premium Villa Showcase Leads',
    objective: 'OUTCOME_LEADS',
    status: 'ACTIVE',
    dailyBudget: 200,
    currency: 'USD',
    adAccountId: 'act_982341209341',
    adAccountName: 'Dawnexus Agency Ads',
    startDate: '2026-10-05',
    lastUpdated: '1 hour ago',
    metrics: {
      impressions: 62400,
      reach: 41800,
      clicks: 1890,
      spend: 910.00,
      cpc: 0.48,
      ctr: 3.02,
      conversions: 112,
      cpl: 8.12,
      roas: 5.6,
    },
    aiRecommendations: [
      'Instagram Stories placement yields ₹42 lower Cost per Lead than Desktop Feed.',
      'Add WhatsApp Business Click-to-Chat CTA to capture immediate high-intent buyers.'
    ]
  },
  {
    id: 'cmp_meta_03',
    workspaceId: 'ws_dawnexus_prod',
    platform: 'meta',
    name: 'Dawnexus Brand Retargeting (Video Views)',
    objective: 'OUTCOME_AWARENESS',
    status: 'PAUSED',
    dailyBudget: 50,
    currency: 'USD',
    adAccountId: 'act_982341209341',
    adAccountName: 'Dawnexus Agency Ads',
    startDate: '2026-09-15',
    lastUpdated: '2 days ago',
    metrics: {
      impressions: 21500,
      reach: 16200,
      clicks: 340,
      spend: 210.00,
      cpc: 0.62,
      ctr: 1.58,
      conversions: 12,
      cpl: 17.50,
      roas: 2.1,
    },
    aiRecommendations: [
      'Campaign is paused. Refresh video creative with fresh customer testimonials before unpausing.'
    ]
  }
];

export const INITIAL_MCP_KEYS: McpApiKey[] = [
  {
    id: 'key_01',
    workspaceId: 'ws_dawnexus_prod',
    name: 'Claude Desktop — Production Assistant',
    keyPrefix: 'dwnx_live_cd78',
    maskedKey: 'dwnx_live_cd78••••••••••••••••••••39ba',
    createdAt: '2026-10-15T11:20:00Z',
    lastUsedAt: '25 mins ago',
    status: 'active',
  },
  {
    id: 'key_02',
    workspaceId: 'ws_dawnexus_prod',
    name: 'ChatGPT Custom GPT — Marketing Copilot',
    keyPrefix: 'dwnx_live_gpt9',
    maskedKey: 'dwnx_live_gpt9••••••••••••••••••••8812',
    createdAt: '2026-10-18T09:00:00Z',
    lastUsedAt: '2 hours ago',
    status: 'active',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_01',
    workspaceId: 'ws_dawnexus_prod',
    actorType: 'mcp_assistant',
    actorName: 'Claude Desktop',
    action: 'Retrieved connected accounts & scheduled posts calendar',
    category: 'mcp_access',
    details: 'Tool execution: get_calendar_events { date_range: "2026-10-20_to_2026-10-31" }',
    timestamp: '25 mins ago',
    severity: 'info',
  },
  {
    id: 'aud_02',
    workspaceId: 'ws_dawnexus_prod',
    actorType: 'user',
    actorName: 'Arun Kumar',
    action: 'Approved scheduled post #post_002 for Instagram & LinkedIn',
    category: 'approval',
    details: 'Scheduled publication set for 2026-10-21 11:00 UTC',
    timestamp: '1 hour ago',
    severity: 'info',
  },
  {
    id: 'aud_03',
    workspaceId: 'ws_dawnexus_prod',
    actorType: 'user',
    actorName: 'Arun Kumar',
    action: 'Updated campaign daily budget with safety confirmation',
    category: 'campaign_change',
    details: 'Campaign "Enterprise AI Growth Funnel": Daily budget adjusted to $150/day. Consequential 2-step confirmation passed.',
    timestamp: '3 hours ago',
    severity: 'warning',
  },
  {
    id: 'aud_04',
    workspaceId: 'ws_dawnexus_prod',
    actorType: 'scheduler_engine',
    actorName: 'Dawnexus Cron Engine',
    action: 'Published scheduled post #post_001 successfully',
    category: 'social_publish',
    details: 'Meta Graph API & LinkedIn API confirmed live container IDs.',
    timestamp: 'Yesterday at 14:30',
    severity: 'info',
  }
];

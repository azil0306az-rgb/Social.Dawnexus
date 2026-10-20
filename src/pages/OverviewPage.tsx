import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  PenTool, 
  CalendarDays, 
  Megaphone, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { NavigationTab } from '../components/layout/AppShell';

interface OverviewPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { currentWorkspace } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [accounts, setAccounts] = useState(() => dataService.getAccounts(workspaceId));
  const [posts, setPosts] = useState(() => dataService.getPosts(workspaceId));
  const [campaigns, setCampaigns] = useState(() => dataService.getCampaigns(workspaceId));

  useEffect(() => {
    async function loadData() {
      const [accs, psts, cmps] = await Promise.all([
        dataService.fetchAccounts(workspaceId),
        dataService.fetchPosts(workspaceId),
        dataService.fetchCampaigns(workspaceId),
      ]);
      setAccounts(accs);
      setPosts(psts);
      setCampaigns(cmps);
    }
    loadData();
  }, [workspaceId]);

  const pendingApprovals = posts.filter(p => p.status === 'pending_approval');
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');

  // Aggregated metric calculations
  const totalSpend = activeCampaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
  const totalImpressions = activeCampaigns.reduce((sum, c) => sum + c.metrics.impressions, 0);
  const totalConversions = activeCampaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);
  const avgRoas = activeCampaigns.length > 0 
    ? (activeCampaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / activeCampaigns.length).toFixed(1) 
    : '0';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Overview Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">{currentWorkspace?.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Social & Advertising Operations
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Unified control center for official Meta & LinkedIn publishing, real-time campaign performance, and AI Model Context Protocol integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="md" 
            leftIcon={<Cpu className="w-4 h-4 text-[#C7FF4D]" />}
            onClick={() => onNavigate('mcp')}
          >
            MCP Assistant
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate('posts')}
          >
            Create Post
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected Accounts */}
        <div className="bg-[#0B0B0B] border border-[#252525] rounded-xl p-5 hover:border-[#333333] transition-colors relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#A5A5A5] mb-3">
            <span>Connected Channels</span>
            <Share2 className="w-4 h-4 text-[#C7FF4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{accounts.length}</span>
            <span className="text-xs text-[#A5A5A5]">platforms</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#C7FF4D]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tokens healthy & verified</span>
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="bg-[#0B0B0B] border border-[#252525] rounded-xl p-5 hover:border-[#333333] transition-colors relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#A5A5A5] mb-3">
            <span>Upcoming Publications</span>
            <CalendarDays className="w-4 h-4 text-[#C7FF4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{scheduledPosts.length}</span>
            <span className="text-xs text-[#A5A5A5]">queued</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#A5A5A5]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next post in 24 hours</span>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-[#0B0B0B] border border-[#252525] rounded-xl p-5 hover:border-[#333333] transition-colors relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#A5A5A5] mb-3">
            <span>Meta Ads 30D Spend</span>
            <Megaphone className="w-4 h-4 text-[#C7FF4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">${totalSpend.toFixed(2)}</span>
            <span className="text-xs text-[#A5A5A5]">{activeCampaigns.length} active</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#C7FF4D]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Avg. ROAS {avgRoas}x</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#0B0B0B] border border-[#252525] rounded-xl p-5 hover:border-[#333333] transition-colors relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#A5A5A5] mb-3">
            <span>Governance & Gate</span>
            <ShieldCheck className="w-4 h-4 text-[#C7FF4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{pendingApprovals.length}</span>
            <span className="text-xs text-[#A5A5A5]">awaiting sign-off</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
            {pendingApprovals.length > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Approval required before publish</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C7FF4D]" />
                <span className="text-[#A5A5A5]">All drafts approved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Scheduled Content & Channels Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content Calendar & Upcoming Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Scheduled & Recent Posts</h3>
                <p className="text-xs text-[#A5A5A5] mt-0.5">Multi-platform publication schedule</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('posts')}
              >
                View Studio
              </Button>
            </div>

            {posts.length === 0 ? (
              <EmptyState
                icon={<PenTool className="w-6 h-6" />}
                title="No posts created yet"
                description="Draft your first multi-platform update with AI caption assistance or manual media uploads."
                actionLabel="Create First Post"
                onAction={() => onNavigate('posts')}
              />
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 4).map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-xl bg-[#141414] border border-[#252525] hover:border-[#333333] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                      {post.media.length > 0 ? (
                        <img
                          src={post.media[0].url}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-lg object-cover border border-[#252525] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#0B0B0B] border border-[#252525] flex items-center justify-center text-[#A5A5A5] shrink-0">
                          <PenTool className="w-5 h-5 text-[#666666]" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white line-clamp-1">
                          {post.caption}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant={post.status} size="sm" />
                          <span className="text-[11px] text-[#A5A5A5]">
                            {post.scheduledFor 
                              ? `Scheduled: ${new Date(post.scheduledFor).toLocaleDateString()}` 
                              : post.publishedAt 
                              ? `Published: ${new Date(post.publishedAt).toLocaleDateString()}` 
                              : 'Draft in progress'}
                          </span>
                          <span className="text-[11px] text-[#666666]">•</span>
                          <span className="text-[11px] text-[#A5A5A5] uppercase tracking-wide">
                            {post.targetPlatforms.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigate('posts')}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Campaigns Spotlight */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Meta Advertising Snapshot</h3>
                <p className="text-xs text-[#A5A5A5] mt-0.5">Real-time performance from authorized ad accounts</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('campaigns')}
              >
                All Campaigns
              </Button>
            </div>

            <div className="space-y-3">
              {activeCampaigns.map((cmp) => (
                <div key={cmp.id} className="p-4 rounded-xl bg-[#141414] border border-[#252525] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-white">{cmp.name}</span>
                      <Badge variant="active" size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#A5A5A5] font-mono">
                      <span>Budget: ${cmp.dailyBudget}/day</span>
                      <span>•</span>
                      <span>Spend: ${cmp.metrics.spend.toFixed(2)}</span>
                      <span>•</span>
                      <span className="text-[#C7FF4D]">ROAS: {cmp.metrics.roas}x</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <p className="text-[#A5A5A5]">Leads</p>
                      <p className="font-bold text-white">{cmp.metrics.conversions}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#A5A5A5]">Cost / Lead</p>
                      <p className="font-bold text-[#C7FF4D]">${cmp.metrics.cpl.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Connected Accounts Status & MCP Connection Card */}
        <div className="space-y-6">
          {/* Connected Accounts Card */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Social Channels</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('accounts')}
              >
                Manage
              </Button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-3.5 rounded-xl bg-[#141414] border border-[#252525] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={acc.avatarUrl} 
                      alt={acc.accountName}
                      className="w-9 h-9 rounded-lg object-cover border border-[#252525]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{acc.accountName}</p>
                      <p className="text-[11px] text-[#A5A5A5]">{acc.handle}</p>
                    </div>
                  </div>
                  <Badge variant={acc.status} size="sm" />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate('accounts')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Connect New Account
            </Button>
          </div>

          {/* Model Context Protocol Quick Status */}
          <div className="bg-gradient-to-br from-[#0B0B0B] to-[#121808] border border-[#C7FF4D]/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_25px_-5px_rgba(199,255,77,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#C7FF4D]/10 text-[#C7FF4D]">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#C7FF4D] tracking-wider uppercase font-mono">
                  Remote MCP Server
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#C7FF4D] shadow-[0_0_6px_#C7FF4D]" />
            </div>

            <p className="text-xs text-white font-medium mb-1.5">
              ChatGPT & Claude Integration
            </p>
            <p className="text-xs text-[#A5A5A5] leading-relaxed mb-4">
              Your AI assistants can securely draft posts, inspect calendars, and fetch campaign metrics without sharing access tokens.
            </p>

            <div className="p-2.5 rounded-lg bg-[#050505] border border-[#252525] font-mono text-[11px] text-[#C7FF4D] mb-4 truncate">
              https://social.dawnexus.in/mcp/sse
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('mcp')}
            >
              Configure AI Assistants
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


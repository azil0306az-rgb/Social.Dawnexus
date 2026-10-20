import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  BookOpen, 
  Terminal, 
  Sparkles,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { McpApiKey } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const McpConnectionsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [keys, setKeys] = useState<McpApiKey[]>(() => dataService.getMcpKeys(workspaceId));
  const [activeTab, setActiveTab] = useState<'claude' | 'chatgpt'>('claude');
  const [createdSecretData, setCreatedSecretData] = useState<{ key: McpApiKey; fullSecret: string } | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Revoke modal state
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedKeyToRevoke, setSelectedKeyToRevoke] = useState<McpApiKey | null>(null);

  const refreshKeys = () => {
    setKeys(dataService.getMcpKeys(workspaceId));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    setIsGeneratingKey(true);
    const result = dataService.createMcpKey(workspaceId, newKeyName);
    setCreatedSecretData(result);
    setNewKeyName('');
    setIsGeneratingKey(false);
    refreshKeys();
  };

  const handleRevokeConfirm = () => {
    if (!selectedKeyToRevoke) return;
    dataService.revokeMcpKey(workspaceId, selectedKeyToRevoke.id);
    refreshKeys();
  };

  const mcpEndpointSse = 'https://social.dawnexus.in/mcp/sse';
  const mcpEndpointMessages = 'https://social.dawnexus.in/mcp/messages';

  const claudeDesktopConfig = `{
  "mcpServers": {
    "dawnexus-social": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "--url",
        "${mcpEndpointSse}",
        "--header",
        "Authorization: Bearer YOUR_WORKSPACE_API_KEY"
      ]
    }
  }
}`;

  const availableMcpTools = [
    {
      name: 'get_connected_accounts',
      desc: 'Retrieve authorized Instagram, Facebook, and LinkedIn channels, handles, and connection health.',
      scope: 'read_accounts',
    },
    {
      name: 'create_draft_post',
      desc: 'Create or update a draft post with captions, platform tags, and target channels.',
      scope: 'write_drafts',
    },
    {
      name: 'generate_post_captions',
      desc: 'Propose tailored captions and hashtags aligned with brand tone of voice.',
      scope: 'ai_creative',
    },
    {
      name: 'get_content_calendar',
      desc: 'Query scheduled, pending, and published posts within any date range.',
      scope: 'read_calendar',
    },
    {
      name: 'get_advertising_metrics',
      desc: 'Fetch impressions, clicks, spend, conversions, and ROAS for active Meta campaigns.',
      scope: 'read_campaigns',
    },
    {
      name: 'get_campaign_recommendations',
      desc: 'Retrieve AI optimization advice for audience segments and placement performance.',
      scope: 'read_insights',
    },
    {
      name: 'schedule_approved_post',
      desc: 'Schedule pre-approved draft content for official publication.',
      scope: 'schedule_content',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Model Context Protocol (MCP)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">ChatGPT & Claude Native Bridge</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI Assistant Connections
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Connect Claude Desktop, Claude Enterprise, or ChatGPT to your Dawnexus Social workspace using the official Model Context Protocol. Manage content, calendars, and campaigns directly from your conversational assistant.
          </p>
        </div>

        <Badge variant="lime" size="md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tenant Isolated Server</span>
        </Badge>
      </div>

      {/* Secret Creation Banner (One-Time Reveal) */}
      {createdSecretData && (
        <div className="p-5 rounded-2xl bg-[#0B0B0B] border-2 border-[#C7FF4D] space-y-3 shadow-[0_0_30px_-5px_rgba(199,255,77,0.2)] animate-in slide-in-from-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#C7FF4D] font-bold text-sm">
              <Key className="w-4 h-4" />
              <span>New MCP API Key Generated — Save It Now</span>
            </div>
            <button
              onClick={() => setCreatedSecretData(null)}
              className="text-[#A5A5A5] hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-[#A5A5A5]">
            This secret will never be shown again. Copy it immediately to configure Claude or ChatGPT:
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#050505] border border-[#252525] font-mono text-xs text-[#C7FF4D]">
            <span className="flex-1 truncate select-all">{createdSecretData.fullSecret}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(createdSecretData.fullSecret, 'newKey')}
              leftIcon={copiedText === 'newKey' ? <Check className="w-3.5 h-3.5 text-[#C7FF4D]" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedText === 'newKey' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* 2-Column: Setup Instructions & Tool Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client Configuration Guide (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-5">
            {/* Platform Selector */}
            <div className="flex items-center justify-between pb-4 border-b border-[#252525]">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#C7FF4D]" />
                <span>Integration Instructions</span>
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#252525]">
                <button
                  onClick={() => setActiveTab('claude')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'claude' 
                      ? 'bg-[#C7FF4D] text-[#050505] font-bold shadow-[0_0_8px_#C7FF4D]' 
                      : 'text-[#A5A5A5] hover:text-white'
                  }`}
                >
                  Claude Desktop
                </button>
                <button
                  onClick={() => setActiveTab('chatgpt')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'chatgpt' 
                      ? 'bg-[#C7FF4D] text-[#050505] font-bold shadow-[0_0_8px_#C7FF4D]' 
                      : 'text-[#A5A5A5] hover:text-white'
                  }`}
                >
                  ChatGPT Custom GPT
                </button>
              </div>
            </div>

            {/* Remote Endpoint Reference */}
            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Remote MCP Server URL (SSE Transport)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#141414] border border-[#252525] font-mono text-xs text-[#C7FF4D]">
                <span className="flex-1 truncate">{mcpEndpointSse}</span>
                <button
                  onClick={() => copyToClipboard(mcpEndpointSse, 'sseUrl')}
                  className="p-1 rounded text-[#A5A5A5] hover:text-[#C7FF4D]"
                  title="Copy Endpoint"
                >
                  {copiedText === 'sseUrl' ? <Check className="w-4 h-4 text-[#C7FF4D]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tab: Claude Desktop */}
            {activeTab === 'claude' ? (
              <div className="space-y-4">
                <div className="text-xs text-[#A5A5A5] leading-relaxed space-y-2">
                  <p>
                    <strong className="text-white">Step 1:</strong> Open your Claude Desktop configuration file at:
                  </p>
                  <p className="font-mono text-white p-2 rounded-lg bg-[#141414] border border-[#252525]">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </p>
                  <p>
                    <strong className="text-white">Step 2:</strong> Add the Dawnexus Social remote MCP server definition:
                  </p>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-[#050505] border border-[#252525] text-xs font-mono text-[#A5A5A5] overflow-x-auto leading-relaxed">
                    {claudeDesktopConfig}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3 text-xs"
                    onClick={() => copyToClipboard(claudeDesktopConfig, 'claudeConfig')}
                    leftIcon={copiedText === 'claudeConfig' ? <Check className="w-3.5 h-3.5 text-[#C7FF4D]" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedText === 'claudeConfig' ? 'Copied' : 'Copy JSON'}
                  </Button>
                </div>

                <p className="text-xs text-[#A5A5A5]">
                  <strong className="text-white">Step 3:</strong> Restart Claude Desktop. The hammer icon will illuminate, granting Claude access to your workspace tools.
                </p>
              </div>
            ) : (
              /* Tab: ChatGPT Custom GPT */
              <div className="space-y-4">
                <div className="text-xs text-[#A5A5A5] leading-relaxed space-y-2">
                  <p>
                    <strong className="text-white">Step 1:</strong> Navigate to <strong className="text-white">ChatGPT → My GPTs → Create a GPT → Configure → Actions</strong>.
                  </p>
                  <p>
                    <strong className="text-white">Step 2:</strong> Import OpenAPI schema from your Dawnexus Social instance:
                  </p>
                  <p className="font-mono text-white p-2 rounded-lg bg-[#141414] border border-[#252525]">
                    https://social.dawnexus.in/mcp/openapi.json
                  </p>
                  <p>
                    <strong className="text-white">Step 3:</strong> Under <strong className="text-white">Authentication</strong>, select <strong className="text-white">API Key</strong> with Auth Type: <strong className="text-white">Bearer</strong>. Paste your generated workspace API key.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] text-xs text-[#A5A5A5] space-y-2">
                  <p className="text-[#C7FF4D] font-bold">Privacy & Tenant Isolation:</p>
                  <p>
                    ChatGPT only receives responses for tools explicitly invoked. Your social platform access tokens and client database secrets are never transmitted.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active API Keys Table */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Workspace MCP API Keys</h3>
                <p className="text-xs text-[#A5A5A5] mt-0.5">Customer-scoped access credentials</p>
              </div>
            </div>

            {/* Create Key Form */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#141414] border border-[#252525]">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. My Mac Claude Desktop..."
                className="flex-1 bg-[#0B0B0B] border border-[#252525] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7FF4D]"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                isLoading={isGeneratingKey}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Generate Key
              </Button>
            </div>

            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="p-3.5 rounded-xl bg-[#141414] border border-[#252525] flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-white">{k.name}</span>
                      <Badge variant={k.status === 'active' ? 'active' : 'paused'} size="sm">
                        {k.status}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-[#A5A5A5]">{k.maskedKey}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#666666] mt-1">
                      <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                      {k.lastUsedAt && <span>• Last used: {k.lastUsedAt}</span>}
                    </div>
                  </div>

                  {k.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedKeyToRevoke(k);
                        setRevokeModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Available MCP Tools Roster (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
              <div>
                <h3 className="font-bold text-white text-base">Authorized MCP Tools</h3>
                <p className="text-xs text-[#A5A5A5] mt-0.5">Capabilities exposed to AI assistant</p>
              </div>
              <Badge variant="lime" size="sm">
                7 Tools Live
              </Badge>
            </div>

            <p className="text-xs text-[#A5A5A5] leading-relaxed">
              When Claude or ChatGPT connects with your workspace key, the server exposes strictly the following tools:
            </p>

            <div className="space-y-3">
              {availableMcpTools.map((t) => (
                <div key={t.name} className="p-3 rounded-xl bg-[#141414] border border-[#252525] space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono font-bold text-[#C7FF4D]">{t.name}</code>
                    <span className="text-[10px] font-mono text-[#666666]">{t.scope}</span>
                  </div>
                  <p className="text-[11px] text-[#A5A5A5] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Security Architecture Box */}
          <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Lock className="w-4 h-4 text-[#C7FF4D]" />
              <span>Multi-Tenant Safety Guarantee</span>
            </div>
            <p className="text-xs text-[#A5A5A5] leading-relaxed">
              Every tool invocation enforces strict server-side tenant scoping. An AI assistant cannot query data outside the workspace ID bound to the Bearer token. Sensitive operations like publishing require draft approval in the portal.
            </p>
          </div>
        </div>
      </div>

      {/* Revocation Modal */}
      {selectedKeyToRevoke && (
        <ConfirmationModal
          isOpen={revokeModalOpen}
          onClose={() => setRevokeModalOpen(false)}
          onConfirm={handleRevokeConfirm}
          title={`Revoke API Key "${selectedKeyToRevoke.name}"?`}
          description="Revoking this key immediately terminates access for any connected AI client (Claude or ChatGPT). You will need to generate a new key and update your client config."
          consequentialDetails={{
            actionLabel: 'Revoke MCP Credentials',
            currentValue: selectedKeyToRevoke.maskedKey,
            newValue: 'REVOKED',
          }}
          confirmButtonText="Yes, Revoke Key Immediately"
          variant="danger"
        />
      )}
    </div>
  );
};

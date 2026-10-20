import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  ShieldCheck, 
  ExternalLink, 
  Key, 
  Trash2,
  Lock,
  Layers
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook, LinkedinIcon as Linkedin } from '../components/common/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { SocialAccount, PlatformType } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const SocialAccountsPage: React.FC = () => {
  const { currentWorkspace, isDemoMode } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [accounts, setAccounts] = useState<SocialAccount[]>(() => dataService.getAccounts(workspaceId));
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [selectedAccountToDisconnect, setSelectedAccountToDisconnect] = useState<SocialAccount | null>(null);
  const [isConnectingPlatform, setIsConnectingPlatform] = useState<PlatformType | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState<SocialAccount | null>(null);

  const refreshAccounts = () => {
    setAccounts(dataService.getAccounts(workspaceId));
  };

  const handleConnect = async (platform: PlatformType) => {
    setIsConnectingPlatform(platform);
    // Simulate official OAuth authorization roundtrip
    await new Promise(r => setTimeout(r, 700));

    let newAccount: Omit<SocialAccount, 'id' | 'lastSyncAt'>;

    if (platform === 'instagram') {
      newAccount = {
        workspaceId,
        platform: 'instagram',
        accountType: 'instagram_business',
        accountName: `${currentWorkspace?.name || 'Dawnexus'} Instagram`,
        handle: `@${(currentWorkspace?.slug || 'dawnexus')}.social`,
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
        status: 'connected',
        permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_read_engagement'],
        followersCount: 12400,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isMock: isDemoMode,
      };
    } else if (platform === 'facebook') {
      newAccount = {
        workspaceId,
        platform: 'facebook',
        accountType: 'facebook_page',
        accountName: `${currentWorkspace?.name || 'Dawnexus'} Facebook Page`,
        handle: `${currentWorkspace?.slug || 'dawnexus'}.fb`,
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
        status: 'connected',
        permissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'ads_read'],
        followersCount: 8900,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isMock: isDemoMode,
      };
    } else {
      newAccount = {
        workspaceId,
        platform: 'linkedin',
        accountType: 'linkedin_page',
        accountName: `${currentWorkspace?.name || 'Dawnexus'} Company Page`,
        handle: `company/${currentWorkspace?.slug || 'dawnexus'}`,
        avatarUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80',
        status: 'connected',
        permissions: ['w_organization_social', 'r_organization_social'],
        followersCount: 5200,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isMock: isDemoMode,
      };
    }

    dataService.connectAccount(newAccount);
    refreshAccounts();
    setIsConnectingPlatform(null);
  };

  const handleDisconnectConfirm = () => {
    if (!selectedAccountToDisconnect) return;
    dataService.disconnectAccount(workspaceId, selectedAccountToDisconnect.id);
    refreshAccounts();
  };

  const handleReconnect = (acc: SocialAccount) => {
    dataService.reconnectAccount(workspaceId, acc.id);
    refreshAccounts();
  };

  const platformsConfig = [
    {
      id: 'instagram' as PlatformType,
      name: 'Instagram Professional',
      subtitle: 'Business & Creator Accounts via Meta Graph API',
      icon: Instagram,
      accentColor: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      requiredScopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_read_engagement'],
      description: 'Publishes single images, carousels, and reels containers. Requires your Instagram account to be linked to an authorized Facebook Page.',
    },
    {
      id: 'facebook' as PlatformType,
      name: 'Facebook Pages',
      subtitle: 'Official Organization Pages via Meta Graph API',
      icon: Facebook,
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-600/20',
      requiredScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'ads_read'],
      description: 'Publishes status updates, photo albums, and video feeds. Grants read-only ad account visibility for unified campaign attribution.',
    },
    {
      id: 'linkedin' as PlatformType,
      name: 'LinkedIn Company & Personal',
      subtitle: 'Community Management & Organization API',
      icon: Linkedin,
      accentColor: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      requiredScopes: ['w_organization_social', 'r_organization_social', 'openid'],
      description: 'Publishes long-form thought leadership, multi-image articles, and company page milestones to verified corporate networks.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Integration Gateway
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">OAuth 2.0 Credentials</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Social Media Accounts
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Authorize official platform APIs with encrypted token storage. Dawnexus Social never asks for account passwords and adheres to official Meta and LinkedIn data security policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="lime" size="md">
            <Lock className="w-3 h-3" />
            <span>AES-256 Token Vault</span>
          </Badge>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {platformsConfig.map((platform) => {
          const Icon = platform.icon;
          const connectedAccounts = accounts.filter(a => a.platform === platform.id);
          const isConnected = connectedAccounts.length > 0;

          return (
            <div 
              key={platform.id}
              className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 flex flex-col justify-between hover:border-[#333333] transition-all relative overflow-hidden group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${platform.bgColor} ${platform.borderColor} border`}>
                      <Icon className={`w-6 h-6 ${platform.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base tracking-tight">{platform.name}</h3>
                      <p className="text-xs text-[#A5A5A5]">{platform.subtitle}</p>
                    </div>
                  </div>

                  <Badge 
                    variant={isConnected ? 'connected' : 'disconnected'} 
                    size="sm"
                  />
                </div>

                <p className="text-xs text-[#A5A5A5] leading-relaxed mb-5">
                  {platform.description}
                </p>

                {/* Connected Instances */}
                {isConnected ? (
                  <div className="space-y-3 mb-6">
                    <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
                      Authorized Accounts ({connectedAccounts.length})
                    </p>
                    {connectedAccounts.map((acc) => (
                      <div 
                        key={acc.id}
                        className="p-3.5 rounded-xl bg-[#141414] border border-[#252525] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={acc.avatarUrl}
                              alt="Avatar"
                              className="w-8 h-8 rounded-lg object-cover border border-[#252525]"
                            />
                            <div>
                              <p className="text-xs font-bold text-white truncate max-w-[140px]">{acc.accountName}</p>
                              <p className="text-[10px] text-[#A5A5A5] font-mono">{acc.handle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowPermissionsModal(acc)}
                              className="p-1.5 rounded-lg text-[#A5A5A5] hover:text-[#C7FF4D] hover:bg-[#0B0B0B] transition-colors"
                              title="View API Permissions"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAccountToDisconnect(acc);
                                setDisconnectModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#A5A5A5] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Disconnect Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#252525] text-[#A5A5A5]">
                          <span>Followers: <strong className="text-white font-mono">{acc.followersCount.toLocaleString()}</strong></span>
                          <span>Synced: <strong className="text-white">{acc.lastSyncAt}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#141414]/50 border border-[#252525] border-dashed text-center mb-6">
                    <p className="text-xs text-[#A5A5A5]">No account linked for this workspace.</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#252525] flex items-center gap-2">
                <Button
                  variant={isConnected ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full"
                  isLoading={isConnectingPlatform === platform.id}
                  onClick={() => handleConnect(platform.id)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isConnected ? 'Connect Another' : `Connect ${platform.name.split(' ')[0]}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Architecture & Official API Compliance Card */}
      <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#C7FF4D]/10 text-[#C7FF4D]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">OAuth Security & Platform Compliance</h3>
            <p className="text-xs text-[#A5A5A5]">How Dawnexus Social safeguards your integrations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A5A5A5]">
          <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] space-y-1.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#C7FF4D]" />
              <span>Zero Password Storage</span>
            </p>
            <p className="leading-relaxed">
              We never collect or store your social network passwords. Authentication occurs strictly via official Meta and LinkedIn OAuth 2.0 consent screens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] space-y-1.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C7FF4D]" />
              <span>Strict Workspace Isolation</span>
            </p>
            <p className="leading-relaxed">
              Social accounts are bound to your tenant workspace. Team members in other organizations have zero access to your connected profiles or publishing tokens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] space-y-1.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#C7FF4D]" />
              <span>Proactive Reconnection</span>
            </p>
            <p className="leading-relaxed">
              If an authorization expires after 60 days, our system alerts you immediately so scheduled content continues publishing without interruption.
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title={`Disconnect ${selectedAccountToDisconnect?.accountName}?`}
        description="Disconnecting this account will remove its publishing permissions and pause any upcoming scheduled posts targeted exclusively to this channel."
        consequentialDetails={{
          actionLabel: 'Revoke Social Account Access',
          currentValue: selectedAccountToDisconnect?.handle,
          newValue: 'Disconnected from Workspace',
          affectedPlatforms: selectedAccountToDisconnect ? [selectedAccountToDisconnect.platform] : [],
        }}
        confirmButtonText="Yes, Disconnect Account"
        variant="danger"
      />

      {/* Permissions Detail Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#252525]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#C7FF4D]" />
                <h3 className="font-bold text-white">Granted API Scopes</h3>
              </div>
              <button 
                onClick={() => setShowPermissionsModal(null)}
                className="text-[#A5A5A5] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#A5A5A5] my-4">
              Scopes authorized by official platform for <strong className="text-white">{showPermissionsModal.accountName}</strong>:
            </p>

            <div className="space-y-2 mb-6">
              {showPermissionsModal.permissions.map((perm) => (
                <div key={perm} className="p-2.5 rounded-lg bg-[#141414] border border-[#252525] flex items-center justify-between text-xs">
                  <code className="text-[#C7FF4D] font-mono">{perm}</code>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7FF4D]" />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowPermissionsModal(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

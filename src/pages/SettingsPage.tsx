import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  History, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Save,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { currentWorkspace, updateWorkspaceSettings, user } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [businessType, setBusinessType] = useState(currentWorkspace?.businessType || '');
  const [requireApproval, setRequireApproval] = useState(currentWorkspace?.requireApprovalForPublishing ?? true);
  const [maxSpendLimit, setMaxSpendLimit] = useState(currentWorkspace?.maxCampaignDailySpendLimit || 500);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState(() => dataService.getAuditLogs(workspaceId));

  useEffect(() => {
    async function loadLogs() {
      const logs = await dataService.fetchAuditLogs(workspaceId);
      setAuditLogs(logs);
    }
    loadLogs();
  }, [workspaceId]);

  const handleSaveWorkspaceSettings = async () => {
    await updateWorkspaceSettings({
      name: wsName,
      businessType,
      requireApprovalForPublishing: requireApproval,
      maxCampaignDailySpendLimit: maxSpendLimit,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Workspace Administration
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">{currentWorkspace?.slug}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Governance & Security Controls
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Configure approval workflows, advertising safety caps, organization information, and review immutable audit trail events.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C7FF4D]/10 border border-[#C7FF4D]/30 text-xs text-[#C7FF4D] font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization & Safeguard Policies (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#C7FF4D]" />
              <span>Workspace Profile</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Workspace Display Name
              </label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C7FF4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Business & Industry Category
              </label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C7FF4D]"
              />
            </div>
          </div>

          {/* Publishing Governance & Ad Spend Limits */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C7FF4D]" />
              <span>Publishing & Financial Safeguards</span>
            </h3>

            {/* Manual Approval Toggle */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white">Require Manual Approval Before Publishing</p>
                <p className="text-[11px] text-[#A5A5A5] mt-1 leading-relaxed">
                  When enabled, all drafted or scheduled posts (including those created by AI assistants via MCP) must be explicitly signed off by a workspace administrator before releasing to official social APIs.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="accent-[#C7FF4D] w-5 h-5 rounded cursor-pointer shrink-0 mt-0.5"
              />
            </div>

            {/* Campaign Max Daily Cap */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#252525] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">Hard Daily Spend Cap on Meta Ads</p>
                <span className="text-xs font-mono font-bold text-[#C7FF4D]">${maxSpendLimit} / day</span>
              </div>
              <p className="text-[11px] text-[#A5A5A5] leading-relaxed">
                Prevents accidental budget inflation. Any campaign budget modification above this limit is rejected immediately.
              </p>
              <input
                type="range"
                min={50}
                max={3000}
                step={50}
                value={maxSpendLimit}
                onChange={(e) => setMaxSpendLimit(Number(e.target.value))}
                className="w-full accent-[#C7FF4D] cursor-pointer"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleSaveWorkspaceSettings}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Governance Settings
            </Button>
          </div>
        </div>

        {/* Right Column: User Profile & Audit Trail History (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Info */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <User className="w-4 h-4 text-[#C7FF4D]" />
              <span>Administrator Identity</span>
            </h3>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141414] border border-[#252525]">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt="Profile"
                className="w-12 h-12 rounded-xl object-cover border border-[#252525]"
              />
              <div>
                <p className="text-sm font-bold text-white">{user?.fullName}</p>
                <p className="text-xs text-[#A5A5A5] font-mono">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#C7FF4D]/10 text-[#C7FF4D] border border-[#C7FF4D]/30">
                  Role: Owner
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail Logs */}
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C7FF4D]" />
                <h3 className="font-bold text-white text-base">Immutable Audit Trail</h3>
              </div>
              <span className="text-xs font-mono text-[#A5A5A5]">{auditLogs.length} events</span>
            </div>

            <p className="text-xs text-[#A5A5A5] leading-relaxed">
              Every sensitive action—including post publishing, budget modifications, deletions, and MCP tool triggers—is recorded with timestamp and actor origin.
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-[#141414] border border-[#252525] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {log.actorType === 'mcp_assistant' && <Cpu className="w-3.5 h-3.5 text-[#C7FF4D]" />}
                      <span>{log.action}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#666666]">{log.timestamp}</span>
                  </div>
                  <p className="text-[#A5A5A5] text-[11px] font-mono">{log.details}</p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-[#666666]">
                    <span>Actor: <strong className="text-white">{log.actorName}</strong></span>
                    <span>• Category: {log.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


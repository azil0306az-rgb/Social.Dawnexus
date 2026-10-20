import React, { useState } from 'react';
import { 
  Megaphone, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Play, 
  Pause, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight,
  Sliders,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { AdCampaign } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const CampaignsPage: React.FC = () => {
  const { currentWorkspace, isDemoMode } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => dataService.getCampaigns(workspaceId));
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  
  // Consequential action confirmation modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    campaign: AdCampaign;
    actionType: 'PAUSE' | 'RESUME' | 'UPDATE_BUDGET';
    newBudget?: number;
  } | null>(null);
  const [budgetEditModalOpen, setBudgetEditModalOpen] = useState<AdCampaign | null>(null);
  const [newBudgetValue, setNewBudgetValue] = useState<number>(100);

  const refreshCampaigns = () => {
    setCampaigns(dataService.getCampaigns(workspaceId));
  };

  const initiateStatusChange = (campaign: AdCampaign, newStatus: 'ACTIVE' | 'PAUSED') => {
    setPendingAction({
      campaign,
      actionType: newStatus === 'ACTIVE' ? 'RESUME' : 'PAUSE',
    });
    setConfirmModalOpen(true);
  };

  const initiateBudgetChange = (campaign: AdCampaign) => {
    setNewBudgetValue(campaign.dailyBudget);
    setBudgetEditModalOpen(campaign);
  };

  const handleBudgetModalProceed = () => {
    if (!budgetEditModalOpen) return;
    setPendingAction({
      campaign: budgetEditModalOpen,
      actionType: 'UPDATE_BUDGET',
      newBudget: newBudgetValue,
    });
    setBudgetEditModalOpen(null);
    setConfirmModalOpen(true);
  };

  const handleExecuteConfirmedAction = () => {
    if (!pendingAction) return;

    if (pendingAction.actionType === 'PAUSE') {
      dataService.updateCampaignStatus(workspaceId, pendingAction.campaign.id, 'PAUSED');
    } else if (pendingAction.actionType === 'RESUME') {
      dataService.updateCampaignStatus(workspaceId, pendingAction.campaign.id, 'ACTIVE');
    } else if (pendingAction.actionType === 'UPDATE_BUDGET' && pendingAction.newBudget !== undefined) {
      dataService.updateCampaignBudget(workspaceId, pendingAction.campaign.id, pendingAction.newBudget);
    }

    refreshCampaigns();
    setPendingAction(null);
  };

  // Aggregated totals
  const totalSpend = campaigns.reduce((acc, c) => acc + c.metrics.spend, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.metrics.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.metrics.clicks, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0);
  const overallCpl = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Meta Advertising
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">Ad Account: act_982341209341</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Campaign Performance & Guardrails
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Live metrics from authorized Meta Ad Accounts. All consequential budget or status modifications enforce strict financial confirmation safeguards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="lime" size="md">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Budget Cap: ${currentWorkspace?.maxCampaignDailySpendLimit}/day</span>
          </Badge>
        </div>
      </div>

      {/* Aggregate KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Total 30D Spend</p>
          <p className="text-xl font-bold font-mono text-white">${totalSpend.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Impressions</p>
          <p className="text-xl font-bold font-mono text-white">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Link Clicks</p>
          <p className="text-xl font-bold font-mono text-white">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Leads / Conversions</p>
          <p className="text-xl font-bold font-mono text-[#C7FF4D]">{totalConversions}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Blended Cost/Lead</p>
          <p className="text-xl font-bold font-mono text-white">${overallCpl}</p>
        </div>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">Active & Paused Campaigns</h3>
          <span className="text-xs text-[#A5A5A5] font-mono">{campaigns.length} campaigns tracked</span>
        </div>

        {campaigns.map((cmp) => {
          const isPaused = cmp.status === 'PAUSED';

          return (
            <div
              key={cmp.id}
              className={`p-6 rounded-2xl bg-[#0B0B0B] border transition-all ${
                isPaused ? 'border-[#202020] opacity-85' : 'border-[#252525] hover:border-[#383838]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-base text-white">{cmp.name}</span>
                    <Badge variant={isPaused ? 'paused' : 'active'} size="sm" />
                    <Badge variant="meta" size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A5A5A5] font-mono">
                    <span>Objective: {cmp.objective.replace('OUTCOME_', '')}</span>
                    <span>•</span>
                    <span>Started: {cmp.startDate}</span>
                    <span>•</span>
                    <span>Sync: {cmp.lastUpdated}</span>
                  </div>
                </div>

                {/* Status & Budget Controls */}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initiateBudgetChange(cmp)}
                    leftIcon={<Sliders className="w-3.5 h-3.5" />}
                  >
                    Adjust Budget (${cmp.dailyBudget}/d)
                  </Button>

                  {isPaused ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => initiateStatusChange(cmp, 'ACTIVE')}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => initiateStatusChange(cmp, 'PAUSED')}
                      leftIcon={<Pause className="w-3.5 h-3.5" />}
                    >
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              {/* Performance Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-4 border-b border-[#252525] text-xs font-mono">
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">Spend</p>
                  <p className="font-bold text-white text-sm mt-0.5">${cmp.metrics.spend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">Impressions</p>
                  <p className="font-bold text-white text-sm mt-0.5">{cmp.metrics.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">Clicks (CTR)</p>
                  <p className="font-bold text-white text-sm mt-0.5">{cmp.metrics.clicks} ({cmp.metrics.ctr}%)</p>
                </div>
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">Avg. CPC</p>
                  <p className="font-bold text-white text-sm mt-0.5">${cmp.metrics.cpc.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">Leads</p>
                  <p className="font-bold text-[#C7FF4D] text-sm mt-0.5">{cmp.metrics.conversions}</p>
                </div>
                <div>
                  <p className="text-[#A5A5A5] text-[11px]">ROAS</p>
                  <p className="font-bold text-[#C7FF4D] text-sm mt-0.5">{cmp.metrics.roas}x</p>
                </div>
              </div>

              {/* AI Recommendations */}
              {cmp.aiRecommendations.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#141414] border border-[#252525]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#C7FF4D] mb-2 font-mono uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Optimization Insights</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#A5A5A5]">
                    {cmp.aiRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#C7FF4D]">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adjust Budget Modal */}
      {budgetEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white">Adjust Daily Ad Budget</h3>
                <p className="text-xs text-[#A5A5A5] mt-0.5">{budgetEditModalOpen.name}</p>
              </div>
              <button 
                onClick={() => setBudgetEditModalOpen(null)} 
                className="text-[#A5A5A5] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                New Daily Spend ($ USD)
              </label>
              <input
                type="number"
                min={10}
                max={currentWorkspace?.maxCampaignDailySpendLimit || 1000}
                value={newBudgetValue}
                onChange={(e) => setNewBudgetValue(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#C7FF4D]"
              />
              <p className="text-[11px] text-[#A5A5A5] mt-1.5">
                Current budget: ${budgetEditModalOpen.dailyBudget}/day. Workspace maximum limit: ${currentWorkspace?.maxCampaignDailySpendLimit}/day.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252525]">
              <Button variant="ghost" size="sm" onClick={() => setBudgetEditModalOpen(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleBudgetModalProceed}>
                Proceed to Safeguard Check
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Consequential Action Confirmation Modal */}
      {pendingAction && (
        <ConfirmationModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setPendingAction(null);
          }}
          onConfirm={handleExecuteConfirmedAction}
          title={
            pendingAction.actionType === 'PAUSE' 
              ? 'Pause Meta Advertising Campaign?' 
              : pendingAction.actionType === 'RESUME' 
              ? 'Resume Meta Campaign Delivery?' 
              : 'Update Daily Budget on Live Ad Account?'
          }
          description={
            pendingAction.actionType === 'PAUSE'
              ? 'Pausing will immediately halt ad impression delivery across Facebook and Instagram feeds.'
              : pendingAction.actionType === 'RESUME'
              ? 'Resuming will reactivate auction bidding on Meta Ads using your configured daily budget.'
              : 'This action will immediately update Meta Graph API spend limits. Ensure your monthly ad account budget allows for this change.'
          }
          consequentialDetails={{
            actionLabel: pendingAction.actionType === 'UPDATE_BUDGET' ? 'Daily Budget Adjustment' : 'Campaign Delivery Toggle',
            currentValue: pendingAction.actionType === 'UPDATE_BUDGET' ? `$${pendingAction.campaign.dailyBudget}/day` : pendingAction.campaign.status,
            newValue: pendingAction.actionType === 'UPDATE_BUDGET' ? `$${pendingAction.newBudget}/day` : pendingAction.actionType === 'PAUSE' ? 'PAUSED' : 'ACTIVE',
            estimatedCostImpact: pendingAction.newBudget 
              ? `Est. monthly shift: ~$${((pendingAction.newBudget - pendingAction.campaign.dailyBudget) * 30).toFixed(0)} USD` 
              : undefined,
            affectedPlatforms: ['Meta Ads (Facebook & Instagram)'],
          }}
          confirmButtonText="Confirm & Submit to Meta Graph API"
          variant={pendingAction.actionType === 'PAUSE' ? 'warning' : 'primary'}
        />
      )}
    </div>
  );
};


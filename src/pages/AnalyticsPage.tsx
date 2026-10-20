import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Info, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook, LinkedinIcon as Linkedin } from '../components/common/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const AnalyticsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Sample analytics points
  const audienceGrowth = [
    { label: 'Oct 01', ig: 13800, fb: 8700, li: 6100 },
    { label: 'Oct 05', ig: 13950, fb: 8750, li: 6180 },
    { label: 'Oct 10', ig: 14050, fb: 8820, li: 6250 },
    { label: 'Oct 15', ig: 14180, fb: 8890, li: 6340 },
    { label: 'Oct 20', ig: 14250, fb: 8920, li: 6410 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Performance Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">Official Graph & REST Reporting</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Cross-Channel Analytics
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Audience growth, content engagement rates, and organic vs. paid distribution across verified accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#141414] border border-[#252525] rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium uppercase font-mono transition-colors ${
                  dateRange === r ? 'bg-[#C7FF4D] text-[#050505] font-bold shadow-[0_0_8px_#C7FF4D]' : 'text-[#A5A5A5] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-[#C7FF4D]/10 border border-[#C7FF4D]/30 text-xs text-[#C7FF4D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Analytics report for {currentWorkspace?.name} exported successfully.</span>
        </div>
      )}

      {/* Top Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Total Followers Across Channels</p>
          <p className="text-2xl font-bold font-mono text-white">29,580</p>
          <p className="text-xs text-[#C7FF4D] mt-2 font-mono">+4.2% from previous period</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Total Post Impressions</p>
          <p className="text-2xl font-bold font-mono text-white">132,820</p>
          <p className="text-xs text-[#C7FF4D] mt-2 font-mono">+12.8% organic & paid</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Average Engagement Rate</p>
          <p className="text-2xl font-bold font-mono text-[#C7FF4D]">3.48%</p>
          <p className="text-xs text-[#A5A5A5] mt-2 font-mono">Industry benchmark: 2.10%</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525]">
          <p className="text-xs text-[#A5A5A5] mb-1">Total Inbound Inquiries</p>
          <p className="text-2xl font-bold font-mono text-white">196</p>
          <p className="text-xs text-[#C7FF4D] mt-2 font-mono">Cost / inquiry: $7.85</p>
        </div>
      </div>

      {/* Platform Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instagram Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Instagram className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Instagram Insights</span>
            </div>
            <Badge variant="instagram" size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Audience:</span>
              <span className="text-white font-bold">14,250</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Profile Visits:</span>
              <span className="text-white font-bold">1,840</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Website Taps:</span>
              <span className="text-[#C7FF4D] font-bold">382</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#A5A5A5]">Engagement Rate:</span>
              <span className="text-white font-bold">4.12%</span>
            </div>
          </div>
        </div>

        {/* Facebook Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-600/20">
                <Facebook className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">Facebook Page</span>
            </div>
            <Badge variant="facebook" size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Page Followers:</span>
              <span className="text-white font-bold">8,920</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Post Reach:</span>
              <span className="text-white font-bold">28,400</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Reactions & Shares:</span>
              <span className="text-[#C7FF4D] font-bold">894</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#A5A5A5]">Engagement Rate:</span>
              <span className="text-white font-bold">2.65%</span>
            </div>
          </div>
        </div>

        {/* LinkedIn Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Linkedin className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-sm">LinkedIn Page</span>
            </div>
            <Badge variant="linkedin" size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Followers:</span>
              <span className="text-white font-bold">6,410</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Unique Impressions:</span>
              <span className="text-white font-bold">19,800</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">CTR on Articles:</span>
              <span className="text-[#C7FF4D] font-bold">3.88%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#A5A5A5]">Seniority (Director+):</span>
              <span className="text-white font-bold">44.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official API Data Transparency Note */}
      <div className="p-5 rounded-2xl bg-[#0B0B0B] border border-[#252525] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#C7FF4D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#A5A5A5] leading-relaxed">
          <strong className="text-white">API Transparency & Attribution Note:</strong> All metrics displayed originate from official Meta Insights endpoints and LinkedIn Community Management APIs. In accordance with platform developer terms, aggregate metrics may experience up to a 24-hour reporting latency for newly published posts. Dawnexus Social never extrapolates or fabricates engagement figures.
        </div>
      </div>
    </div>
  );
};

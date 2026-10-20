import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles,
  Cpu,
  Layers
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook, LinkedinIcon as Linkedin } from '../components/common/SocialIcons';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const HelpCentrePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // First-time onboarding checklist
  const [checklist, setChecklist] = useState([
    { id: 1, title: 'Authorize first social channel (Instagram, Facebook or LinkedIn)', completed: true },
    { id: 2, title: 'Compose & preview your first multi-platform draft', completed: true },
    { id: 3, title: 'Inspect the 30-day interactive scheduling calendar', completed: true },
    { id: 4, title: 'Generate a workspace MCP API Key for Claude or ChatGPT', completed: false },
    { id: 5, title: 'Configure Meta Ads read permissions or test sandbox metrics', completed: false },
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(c => c.completed).length;

  const faqs = [
    {
      q: 'Why does Instagram publishing require a Facebook Page connection?',
      a: 'Meta’s official Instagram Graph API requires an Instagram Professional (Business or Creator) account linked to a verified Facebook Page. Personal Instagram profiles cannot be published to programmatically via Meta’s official API without risking account restriction.',
      category: 'Meta & Instagram',
    },
    {
      q: 'What is the Model Context Protocol (MCP) and how does Dawnexus Social use it?',
      a: 'MCP is an open standard created by Anthropic that allows AI assistants like Claude Desktop and ChatGPT to interact directly with external tools and databases. Dawnexus Social hosts a remote MCP server at /mcp/sse, enabling AI models to draft posts, query scheduled calendars, and check campaign ROI securely within your isolated workspace.',
      category: 'AI & MCP',
    },
    {
      q: 'How does Dawnexus Social protect against accidental ad spend spikes?',
      a: 'Every campaign budget change or reactivation triggers an explicit two-step confirmation safeguard. The dialog computes the estimated financial impact before execution and checks the workspace daily spend cap.',
      category: 'Advertising Safeguards',
    },
    {
      q: 'Can team members in other workspaces view my social tokens or posts?',
      a: 'No. Dawnexus Social employs strict multi-tenant row-level isolation. Each workspace has independent access credentials, post drafts, and MCP API keys. Access tokens are encrypted using AES-256 and never returned to browser clients or AI models.',
      category: 'Security & Privacy',
    },
    {
      q: 'What are the official media format requirements for video publishing?',
      a: 'For Instagram Reels and Facebook Video: MP4 or MOV container, H.264 video codec, AAC audio, maximum file size of 100MB, and aspect ratios of 9:16 (vertical Reels) or 1:1 / 4:5 for feed posts.',
      category: 'Publishing Guidelines',
    },
    {
      q: 'What happens if a social authorization token expires?',
      a: 'Long-lived Meta and LinkedIn access tokens last approximately 60 days. Dawnexus Social monitors token health and highlights accounts needing re-authorization in the Social Accounts tab with a 1-click reconnect flow before scheduled posts fail.',
      category: 'Integration Maintenance',
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Documentation & Guides
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">Official API Reference</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Help Centre & First-Time Onboarding
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Everything you need to connect your accounts, configure MCP assistants, schedule content, and operate compliant Meta & LinkedIn campaigns.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl">
        <Search className="w-5 h-5 text-[#A5A5A5] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides, permissions, error codes, MCP setup..."
          className="w-full bg-[#0B0B0B] border border-[#252525] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C7FF4D] focus:ring-1 focus:ring-[#C7FF4D]"
        />
      </div>

      {/* First-Time Onboarding Checklist */}
      <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C7FF4D]/10 text-[#C7FF4D]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">First-Time Setup Checklist</h3>
              <p className="text-xs text-[#A5A5A5]">Complete these 5 steps to reach full operating proficiency</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#C7FF4D]">
            {completedCount} / {checklist.length} Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#C7FF4D] transition-all duration-300"
            style={{ width: `${(completedCount / checklist.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2 pt-2">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-[#252525] hover:border-[#383838] transition-colors text-left"
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                item.completed ? 'bg-[#C7FF4D] border-[#C7FF4D] text-[#050505]' : 'border-[#333333]'
              }`}>
                {item.completed && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <span className={`text-xs ${
                item.completed ? 'text-white line-through opacity-70' : 'text-white font-medium'
              }`}>
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Platform Setup Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 w-fit">
            <Instagram className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Instagram Setup Guide</h4>
          <ol className="text-xs text-[#A5A5A5] space-y-2 list-decimal list-inside leading-relaxed">
            <li>Switch your account to Professional (Business or Creator) in the Instagram app.</li>
            <li>Link it to a Facebook Page under Page Settings → Linked Accounts.</li>
            <li>In Social Accounts, click Connect Instagram and log into the admin Facebook account.</li>
            <li>Grant <code className="text-[#C7FF4D]">instagram_content_publish</code> permissions.</li>
          </ol>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 w-fit">
            <Linkedin className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">LinkedIn Page Publishing</h4>
          <ol className="text-xs text-[#A5A5A5] space-y-2 list-decimal list-inside leading-relaxed">
            <li>Ensure you are an Organization Super Admin on your LinkedIn Company Page.</li>
            <li>Click Connect LinkedIn and accept the Community Management OAuth prompt.</li>
            <li>Select whether to post as your individual profile or official company page.</li>
            <li>Ensure uploaded images meet the 1.91:1 or 1:1 aspect ratio specs.</li>
          </ol>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#252525] space-y-3">
          <div className="p-2.5 rounded-xl bg-[#C7FF4D]/10 text-[#C7FF4D] w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Claude & ChatGPT Setup</h4>
          <ol className="text-xs text-[#A5A5A5] space-y-2 list-decimal list-inside leading-relaxed">
            <li>Go to AI Assistant / MCP Connections tab.</li>
            <li>Generate a new Bearer API Key for your workspace.</li>
            <li>Copy the SSE endpoint: <code className="text-[#C7FF4D]">https://social.dawnexus.in/mcp/sse</code></li>
            <li>Add the configuration block to your Claude Desktop config JSON.</li>
          </ol>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Frequently Asked Questions</h3>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                className="rounded-xl bg-[#141414] border border-[#252525] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-white hover:text-[#C7FF4D] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#A5A5A5] font-mono text-[11px]">[{faq.category}]</span>
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#A5A5A5]" /> : <ChevronDown className="w-4 h-4 text-[#A5A5A5]" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#A5A5A5] leading-relaxed border-t border-[#1F1F1F]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

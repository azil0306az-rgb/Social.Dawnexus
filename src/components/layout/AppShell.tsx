import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Share2, 
  PenTool, 
  CalendarDays, 
  Megaphone, 
  BarChart3, 
  Cpu, 
  HelpCircle, 
  Settings, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  Building2,
  Sparkles,
  LogOut,
  Bell
} from 'lucide-react';
import { DawnexusSocialLogo } from '../brand/DawnexusSocialLogo';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export type NavigationTab = 
  | 'overview' 
  | 'accounts' 
  | 'posts' 
  | 'calendar' 
  | 'campaigns' 
  | 'analytics' 
  | 'mcp' 
  | 'help' 
  | 'settings';

interface AppShellProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { user, currentWorkspace, workspaces, switchWorkspace, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'accounts', label: 'Social Accounts', icon: Share2 },
    { id: 'posts', label: 'Posts Studio', icon: PenTool },
    { id: 'calendar', label: 'Content Calendar', icon: CalendarDays },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'mcp', label: 'AI Assistant / MCP', icon: Cpu, badge: 'Remote MCP' },
    { id: 'help', label: 'Help Centre', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-[#C7FF4D] selection:text-[#050505]">
      {/* Top Banner (Production Release Status) */}
      <aside aria-label="Environment Mode Indicator" className="w-full bg-[#0B0B0B] border-b border-[#252525] px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C7FF4D] shadow-[0_0_6px_#C7FF4D]" />
          <span className="text-[#A5A5A5]">Dawnexus Social:</span>
          <span className="font-semibold text-white font-mono">v1.0.0 Production</span>
          <span className="text-[#666666] hidden sm:inline">|</span>
          <span className="text-[#A5A5A5] hidden sm:inline">Node: <code className="text-white font-mono">social.dawnexus.in</code></span>
          <span className="text-[#666666] hidden md:inline">|</span>
          <span className="text-[#C7FF4D] hidden md:inline font-mono">Database: Supabase PostgreSQL (RLS Active)</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A5A5A5] hover:text-[#C7FF4D] transition-colors text-[11px] font-mono hidden sm:inline"
          >
            API Health
          </a>
          <a
            href="https://dawnexus.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A5A5A5] hover:text-[#C7FF4D] transition-colors flex items-center gap-1 text-[11px]"
          >
            <span>Main Agency Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-[#0B0B0B] border-r border-[#252525] transition-all duration-300 relative z-20 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Lockup Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#252525]">
            <div className="overflow-hidden">
              {isSidebarCollapsed ? (
                <DawnexusSocialLogo variant="symbol" size="md" />
              ) : (
                <DawnexusSocialLogo variant="full" size="md" />
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg text-[#A5A5A5] hover:text-white hover:bg-[#141414] transition-colors"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Workspace Selector Dropdown */}
          <div className="p-3 border-b border-[#252525] relative">
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#252525] hover:border-[#333333] transition-colors ${
                isSidebarCollapsed ? 'px-2' : 'px-3'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-[#C7FF4D]/10 border border-[#C7FF4D]/30 flex items-center justify-center text-[#C7FF4D] shrink-0 font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                {!isSidebarCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                      {currentWorkspace?.name || 'Select Workspace'}
                    </p>
                    <p className="text-[10px] text-[#A5A5A5] capitalize">
                      {currentWorkspace?.role || 'Member'}
                    </p>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#A5A5A5] shrink-0" />}
            </button>

            {/* Dropdown Menu */}
            {isWorkspaceMenuOpen && (
              <div className="absolute left-3 right-3 top-16 bg-[#0E0E0E] border border-[#252525] rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-semibold text-[#666666] uppercase tracking-wider">
                  Your Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      ws.id === currentWorkspace?.id
                        ? 'bg-[#C7FF4D]/10 text-[#C7FF4D] font-medium'
                        : 'text-[#A5A5A5] hover:text-white hover:bg-[#141414]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === currentWorkspace?.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-[#C7FF4D]/10 text-white font-semibold border border-[#C7FF4D]/30 shadow-[0_0_15px_-3px_rgba(199,255,77,0.15)]'
                      : 'text-[#A5A5A5] hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#C7FF4D]' : 'text-[#A5A5A5] group-hover:text-white'
                    }`} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && 'badge' in item && item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C7FF4D]/20 text-[#C7FF4D] font-bold border border-[#C7FF4D]/30">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#C7FF4D]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer User / Status Area */}
          <div className="p-3 border-t border-[#252525]">
            <div className={`flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#252525] ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-lg object-cover border border-[#252525]"
                />
                {!isSidebarCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                    <p className="text-[10px] text-[#A5A5A5] truncate">{user?.email}</p>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <button
                  onClick={logout}
                  className="p-1 rounded-lg text-[#A5A5A5] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden flex flex-col w-full">
          <header className="h-16 px-4 bg-[#0B0B0B] border-b border-[#252525] flex items-center justify-between">
            <DawnexusSocialLogo variant="full" size="sm" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-[#141414] border border-[#252525] text-white"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="bg-[#0B0B0B] border-b border-[#252525] p-4 space-y-1 animate-in slide-in-from-top duration-200">
              <div className="mb-3 pb-3 border-b border-[#252525]">
                <p className="text-xs text-[#A5A5A5] mb-1">Active Workspace:</p>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#C7FF4D]" />
                  <span>{currentWorkspace?.name}</span>
                </p>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm ${
                      isActive
                        ? 'bg-[#C7FF4D]/15 text-[#C7FF4D] font-semibold border border-[#C7FF4D]/30'
                        : 'text-[#A5A5A5] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#050505] p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


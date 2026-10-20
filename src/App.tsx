import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppShell, NavigationTab } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { SocialAccountsPage } from './pages/SocialAccountsPage';
import { PostsPage } from './pages/PostsPage';
import { CalendarPage } from './pages/CalendarPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { McpConnectionsPage } from './pages/McpConnectionsPage';
import { HelpCentrePage } from './pages/HelpCentrePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');

  // Sync with window.location.hash or pathname if requested
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as NavigationTab;
      const validTabs: NavigationTab[] = [
        'overview', 'accounts', 'posts', 'calendar', 'campaigns', 'analytics', 'mcp', 'help', 'settings'
      ];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage onNavigate={handleSelectTab} />;
      case 'accounts':
        return <SocialAccountsPage />;
      case 'posts':
        return <PostsPage />;
      case 'calendar':
        return <CalendarPage onNavigateToComposer={() => handleSelectTab('posts')} />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'mcp':
        return <McpConnectionsPage />;
      case 'help':
        return <HelpCentrePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={handleSelectTab} />;
    }
  };

  return (
    <AuthProvider>
      <AppShell currentTab={currentTab} onSelectTab={handleSelectTab}>
        {renderActivePage()}
      </AppShell>
    </AuthProvider>
  );
};

export default App;

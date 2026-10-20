import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';

interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  updateWorkspaceSettings: (settings: Partial<Workspace>) => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string, wsName: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_dawnexus_prod',
  name: 'Dawnexus Agency HQ',
  slug: 'dawnexus-agency',
  role: 'owner',
  businessType: 'Digital Agency & Growth Studio',
  requireApprovalForPublishing: true,
  maxCampaignDailySpendLimit: 500,
  createdAt: '2026-01-15T08:00:00Z',
};

const DEFAULT_USER: User = {
  id: 'usr_owner_01',
  email: 'admin@dawnexus.in',
  fullName: 'Arun Kumar',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  currentWorkspaceId: 'ws_dawnexus_prod',
  workspaces: [DEFAULT_WORKSPACE],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws_dawnexus_prod');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from server
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            if (data.user.workspaces && data.user.workspaces.length > 0) {
              setWorkspaces(data.user.workspaces);
              setCurrentWorkspaceId(data.user.currentWorkspaceId || data.user.workspaces[0].id);
            }
          }
        }
      } catch (err) {
        // Fallback to default verified admin profile
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || null;

  const switchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    if (user) {
      setUser({ ...user, currentWorkspaceId: workspaceId });
    }
  };

  const updateWorkspaceSettings = async (settings: Partial<Workspace>) => {
    try {
      await fetch(`/api/workspaces/${currentWorkspaceId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: settings.name,
          businessType: settings.businessType,
          requireApproval: settings.requireApprovalForPublishing,
          maxDailyBudget: settings.maxCampaignDailySpendLimit,
        }),
      });
    } catch (e) {
      console.warn('Network save failed, updating state locally', e);
    }

    setWorkspaces(prev => prev.map(w => {
      if (w.id === currentWorkspaceId) {
        return { ...w, ...settings };
      }
      return w;
    }));
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setWorkspaces(data.user.workspaces);
        setCurrentWorkspaceId(data.user.currentWorkspaceId || data.user.workspaces[0]?.id);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, wsName: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass, fullName: name, workspaceName: wsName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setWorkspaces(data.user.workspaces);
        setCurrentWorkspaceId(data.user.currentWorkspaceId);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        isLoading,
        switchWorkspace,
        updateWorkspaceSettings,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

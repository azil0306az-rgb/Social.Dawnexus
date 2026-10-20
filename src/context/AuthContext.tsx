import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';

interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  switchWorkspace: (workspaceId: string) => void;
  updateWorkspaceSettings: (settings: Partial<Workspace>) => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string, wsName: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_dawnexus_prod',
    name: 'Dawnexus Agency HQ',
    slug: 'dawnexus-agency',
    role: 'owner',
    businessType: 'Digital Agency & Growth Studio',
    requireApprovalForPublishing: true,
    maxCampaignDailySpendLimit: 500,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'ws_client_vkv',
    name: 'VKV Realty & Living',
    slug: 'vkv-realty',
    role: 'admin',
    businessType: 'Real Estate Developer',
    requireApprovalForPublishing: false,
    maxCampaignDailySpendLimit: 1200,
    createdAt: '2026-03-10T12:00:00Z',
  }
];

const DEFAULT_USER: User = {
  id: 'usr_owner_01',
  email: 'admin@dawnexus.in',
  fullName: 'Arun Kumar',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  currentWorkspaceId: 'ws_dawnexus_prod',
  workspaces: DEFAULT_WORKSPACES,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws_dawnexus_prod');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || null;

  const switchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    if (user) {
      setUser({ ...user, currentWorkspaceId: workspaceId });
    }
  };

  const updateWorkspaceSettings = async (settings: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === currentWorkspaceId) {
        return { ...w, ...settings };
      }
      return w;
    }));
  };

  const login = async (email: string, _pass: string) => {
    setIsLoading(true);
    // Simulating verified authentication
    setTimeout(() => {
      setUser({
        id: 'usr_' + Date.now(),
        email,
        fullName: email.split('@')[0].toUpperCase(),
        currentWorkspaceId: 'ws_dawnexus_prod',
        workspaces: DEFAULT_WORKSPACES,
      });
      setIsLoading(false);
    }, 400);
    return true;
  };

  const register = async (email: string, _pass: string, name: string, wsName: string) => {
    setIsLoading(true);
    const newWs: Workspace = {
      id: 'ws_' + Date.now(),
      name: wsName || 'My Workspace',
      slug: (wsName || 'my-workspace').toLowerCase().replace(/\s+/g, '-'),
      role: 'owner',
      businessType: 'General Business',
      requireApprovalForPublishing: false,
      maxCampaignDailySpendLimit: 250,
      createdAt: new Date().toISOString(),
    };
    const newUser: User = {
      id: 'usr_' + Date.now(),
      email,
      fullName: name,
      currentWorkspaceId: newWs.id,
      workspaces: [newWs],
    };
    setTimeout(() => {
      setWorkspaces([newWs]);
      setCurrentWorkspaceId(newWs.id);
      setUser(newUser);
      setIsLoading(false);
    }, 400);
    return true;
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        isLoading,
        isDemoMode,
        setIsDemoMode,
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

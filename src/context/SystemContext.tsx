import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePerfil } from '../hooks/usePerfil';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import type { UserProfile } from '../types';

interface SystemContextType {
  perfil: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEmpresa: boolean;
  isClient: boolean;
  isDriver: boolean;
  userStatus: 'pendente' | 'aprovado' | 'bloqueado' | null;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
  useAuth(); 
  const { data: perfil, isLoading, refetch } = usePerfil();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('rm_mute_notifications') !== 'true';
  });

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (!newState) {
      localStorage.setItem('rm_mute_notifications', 'true');
    } else {
      localStorage.removeItem('rm_mute_notifications');
    }
  };

  // Ativa as notificações em tempo real de forma global e persistente
  useRealtimeNotifications(() => {
    refetch();
  });

  const userPerfil = perfil as UserProfile | null;

  const value = {
    perfil: userPerfil,
    isLoading,
    isAdmin: userPerfil?.role === 'admin' || userPerfil?.role === 'operador',
    isEmpresa: userPerfil?.role === 'empresa',
    isClient: userPerfil?.role === 'cliente',
    isDriver: userPerfil?.role === 'motorista',
    userStatus: userPerfil?.status || null,
    soundEnabled,
    toggleSound,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}

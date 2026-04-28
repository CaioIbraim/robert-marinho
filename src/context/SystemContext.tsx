import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePerfil } from '../hooks/usePerfil';
import type { UserProfile } from '../types';

interface SystemContextType {
  perfil: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isDriver: boolean;
  userStatus: 'pendente' | 'aprovado' | 'bloqueado' | null;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
  useAuth(); 
  const { data: perfil, isLoading } = usePerfil();

  const userPerfil = perfil as UserProfile | null;

  const value = {
    perfil: userPerfil,
    isLoading,
    isAdmin: userPerfil?.role === 'admin' || userPerfil?.role === 'operador',
    isClient: userPerfil?.role === 'cliente', // Empresa agora mapeia para Cliente no DB
    isDriver: userPerfil?.role === 'motorista',
    userStatus: userPerfil?.status || null,
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

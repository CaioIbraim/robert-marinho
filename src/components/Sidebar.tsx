import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Truck,
  Users,
  FileText,
  DollarSign,
  LogOut,
  Menu,
  X,
  PlusCircle
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react'; // ✅ AQUI

import { useAuthStore } from '../stores/authStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const SidebarItem = ({ to, icon: Icon, label, onClick }: SidebarItemProps) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors',
          isActive
            ? 'bg-primary text-white shadow-md'
            : 'text-text-muted hover:bg-border/50 hover:text-text'
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 bg-surface border-r border-border w-64 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:block",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LOGO<span className="text-primary">FRETE</span></span>
            </div>
            <button onClick={onClose} className="lg:hidden text-text-muted hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <SidebarItem to="/dashboard" icon={BarChart3} label="Dashboard" onClick={onClose} />
            <SidebarItem to="/empresas" icon={Building2} label="Empresas" onClick={onClose} />
            <SidebarItem to="/motoristas" icon={Users} label="Motoristas" onClick={onClose} />
            <SidebarItem to="/veiculos" icon={Truck} label="Veículos" onClick={onClose} />
            <SidebarItem to="/ordens" icon={FileText} label="Ordens de Serviço" onClick={onClose} />
            <SidebarItem to="/financeiro" icon={DollarSign} label="Financeiro" onClick={onClose} />
            <SidebarItem to="/usuarios" icon={PlusCircle} label="Usuários" onClick={onClose} />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <LogOut size={20} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

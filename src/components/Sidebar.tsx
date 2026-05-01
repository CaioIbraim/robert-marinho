
import { NavLink, useNavigate } from 'react-router-dom';

import {
  FaChartBar,
  FaBuilding,
  FaTruck,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaTimes,
  FaDollarSign,
  FaBell,
  FaMap,
  FaTag,
  FaClipboardCheck,
  FaPlusCircle,
  FaShieldAlt
} from 'react-icons/fa';


import type { IconType } from 'react-icons';

import { useAuthStore } from '../stores/authStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  to: string;
  icon: IconType;
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
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
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

      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-surface border-r border-border w-64 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">




              <div className="h-8 md:h-10 rounded-lg flex items-center justify-center text-white">
                <img src="/logo.png" alt="Robert Marinho Logística" className="h-8 md:h-10" />
              </div>
             


               
            
            
          



            </div>

            <button onClick={onClose} className="lg:hidden text-text-muted hover:text-white">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <SidebarItem to="/admin/dashboard" icon={FaChartBar} label="Dashboard" onClick={onClose} />
            <SidebarItem to="/admin/empresas" icon={FaBuilding} label="Empresas" onClick={onClose} />
            <SidebarItem to="/admin/motoristas" icon={FaUsers} label="Motoristas" onClick={onClose} />
            <SidebarItem to="/admin/veiculos" icon={FaTruck} label="Veículos" onClick={onClose} />
            <SidebarItem to="/admin/ordens" icon={FaFileAlt} label="Ordens de Serviço" onClick={onClose} />
            <SidebarItem to="/admin/tarifarios" icon={FaTag} label="Tabela de Tarifas" onClick={onClose} />
            <SidebarItem to="/admin/financeiro" icon={FaDollarSign} label="Financeiro" onClick={onClose} />
            <SidebarItem to="/admin/fechamento" icon={FaClipboardCheck} label="Fechamento OS" onClick={onClose} />

            <SidebarItem to="/admin/notificacoes" icon={FaBell} label="Notificações" onClick={onClose} />
            <SidebarItem to="/admin/mapa" icon={FaMap} label="Mapa de Rotas" onClick={onClose} />
            <SidebarItem to="/admin/usuarios" icon={FaPlusCircle} label="Aprovação de Acessos" onClick={onClose} />
            <SidebarItem to="/admin/perfis" icon={FaShieldAlt} label="Gestão de Perfis" onClick={onClose} />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <FaSignOutAlt size={18} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
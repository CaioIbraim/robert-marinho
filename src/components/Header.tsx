import { Menu, Bell, User as UserIcon, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Header = ({ onMenuOpen }: { onMenuOpen: () => void }) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-surface border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuOpen}
          className="lg:hidden p-2 text-text-muted hover:bg-border/50 rounded-md"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-text-muted w-64">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-text-muted hover:bg-border/50 rounded-md relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-surface" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-medium text-text">{user?.email?.split('@')[0] || 'Usuário'}</p>
            <p className="text-xs text-text-muted">Administrador</p>
          </div>
          <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

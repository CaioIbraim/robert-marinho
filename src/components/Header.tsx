import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

import { useNotificacoesNaoLidas } from '../hooks/useNotificacoesNaoLidas';
import { useRealtimeNotificacoes } from '../hooks/useRealtimeNotificacoes';
import { useNotificacoes } from '../hooks/useNotificacoes';

import { usePerfil } from '../hooks/usePerfil';
import { useRealtimePerfil } from '../hooks/useRealtimePerfil';

import { showConfirm, showToast } from '../utils/swal';

export const Header = ({ onMenuOpen }: { onMenuOpen: () => void }) => {
  const { data: perfil } = usePerfil();
  useRealtimePerfil();

  const { data: lista = [] } = useNotificacoes();
  const { data: notificacoes } = useNotificacoesNaoLidas();
  useRealtimeNotificacoes();

  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  const navigate = useNavigate();

  // 🔐 LOGOUT
  const handleLogout = async () => {
    const confirm = await showConfirm(
      'Sair do sistema',
      'Deseja realmente sair?'
    );

    if (!confirm.isConfirmed) return;

    try {
      await supabase.auth.signOut();
      showToast('Logout realizado com sucesso');
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast('Erro ao sair', 'error');
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-2 text-text-muted hover:bg-border/50 rounded-md"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-text-muted w-64 focus-within:ring-1 focus-within:ring-primary">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar ordens, motoristas..."
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* 🔔 NOTIFICAÇÕES */}
        <div className="relative">
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="p-2 text-text-muted hover:bg-border/50 rounded-md relative"
          >
            <Bell size={20} />

            {(notificacoes ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {notificacoes ?? 0}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-sm">Notificações</p>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {lista.length === 0 ? (
                  <div className="p-4 text-sm text-text-muted">
                    Nenhuma notificação
                  </div>
                ) : (
                  lista.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 border-b border-border hover:bg-border/30"
                    >
                      <p className="text-sm font-medium">{n.titulo}</p>
                      <p className="text-xs text-text-muted">
                        {n.mensagem}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-border text-center">
                <button
                  onClick={() => {
                    setOpenNotif(false);
                    navigate('/admin/notificacoes');
                  }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 👤 USER DROPDOWN */}
        <div className="relative">

          <div
            onClick={() => setOpenUser(!openUser)}
            className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer hover:opacity-80 transition"
          >
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-text">
                {perfil?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-text-muted capitalize">
                {perfil?.tipo || 'Operador'}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full overflow-hidden bg-border">
              {perfil?.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  {perfil?.nome?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>

          {/* DROPDOWN */}
          {openUser && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50">

              <button
                onClick={() => {
                  setOpenUser(false);
                  navigate('/config/profile');
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-border/30 transition"
              >
                Meu Perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} />
                Sair
              </button>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
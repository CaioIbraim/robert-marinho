import { Navigate, Outlet } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

interface RoleProtectedRouteProps {
  allowedRoles: ('admin' | 'operador' | 'motorista' | 'cliente')[];
  redirectPath?: string;
}

export const RoleProtectedRoute = ({ 
  allowedRoles, 
  redirectPath = '/admin/login' 
}: RoleProtectedRouteProps) => {
  const { perfil, isLoading, userStatus } = useSystem();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se o perfil for nulo, significa que não está autenticado e o perfil não foi carregado
  if (!perfil) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(perfil.role)) {
    // Redirecionamento inteligente baseado nas roles permitidas na rota
    const fallback = allowedRoles.includes('cliente') 
      ? '/portal/login' 
      : (allowedRoles.includes('motorista') ? '/motorista/login' : '/admin/login');
    return <Navigate to={fallback} replace />;
  }

  // Verificação de status para clientes
  if (perfil.role === 'cliente' && userStatus !== 'aprovado') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Aguardando Aprovação</h1>
        <p className="text-zinc-500 max-w-sm">
          Seu cadastro foi recebido com sucesso. Um administrador revisará seu acesso em breve. 
          Você receberá uma notificação ou mensagem assim que for liberado.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-8 text-primary hover:underline font-bold uppercase tracking-widest text-xs"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return <Outlet />;
};

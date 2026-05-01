import { Navigate, Outlet } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

interface RoleProtectedRouteProps {
  allowedRoles: ('admin' | 'operador' | 'motorista' | 'cliente' | 'empresa')[];
  redirectPath?: string;
}

export const RoleProtectedRoute = ({ 
  allowedRoles, 
  redirectPath = '/login' 
}: RoleProtectedRouteProps) => {
  const { perfil, isLoading } = useSystem();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Não autenticado
  if (!perfil) {
    return <Navigate to={redirectPath} replace />;
  }

  // 2. Não autorizado (role errada)
  if (!allowedRoles.includes(perfil.role)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  // 3. Aguardando aprovação (empresa e motorista)
  if ((perfil.role === 'empresa' || perfil.role === 'motorista') && perfil.aprovado_operador === false) {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  // 4. Verificação legada/específica para cliente (se necessário)
  if (perfil.role === 'cliente' && (perfil as any).status !== 'aprovado') {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  return <Outlet />;
};

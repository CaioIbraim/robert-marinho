import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { SystemProvider } from "./context/SystemContext";

// Public Pages
import Landing from "./pages/public/Landing";
import { ServiceLanding } from "./pages/public/ServiceLanding";

// Portal Cliente
import { PortalLogin } from "./pages/client/PortalLogin";
import { PrePortalLanding } from "./pages/client/PrePortalLanding";
import { PreCadastro } from "./pages/client/PreCadastro";
import ClientDashboard from "./pages/client/ClientDashboard";

// Autenticação
import { AdminLogin } from "./pages/auth/AdminLogin";
import { MotoristaLogin } from "./pages/auth/MotoristaLogin";

// Motorista
import MotoristaDashboard from "./pages/driver/MotoristaDashboard";

// Admin Pages
import { Dashboard } from "./pages/admin/Dashboard";
import { Empresas } from "./pages/admin/Empresas";
import { Motoristas } from "./pages/admin/Motoristas";
import { Veiculos } from "./pages/admin/Veiculos";
import { Ordens } from "./pages/admin/Ordens";
import { Tarifarios } from "./pages/admin/Tarifarios";
import { Financeiro } from "./pages/admin/Financeiro";
import { FechamentoFinanceiro } from "./pages/admin/FechamentoFinanceiro";
import { Notificacoes } from "./pages/admin/Notificacoes";
import { MapaRota } from "./pages/admin/MapaRota";
import { OrdemDetalhe } from './pages/admin/OrdemDetalhe';
import { EmpresaDetalhe } from './pages/admin/EmpresaDetalhe';
import { MotoristaDetalhe } from './pages/admin/MotoristaDetalhe';
import { AprovacaoUsuarios } from './pages/admin/AprovacaoUsuarios';
import { Profile } from './pages/admin/Profile';

function App() {
  return (
    <BrowserRouter>
      <SystemProvider>
        <Routes>
          
          {/* ===================== */}
          {/* Páginas Públicas       */}
          {/* ===================== */}
          <Route path="/" element={<Landing />} />
          <Route path="/servico/:slug" element={<ServiceLanding />} />
          <Route path="/portal-clientes" element={<PrePortalLanding />} />
          <Route path="/pre-cadastro" element={<PreCadastro />} />
          
          {/* ===================== */}
          {/* Logins                */}
          {/* ===================== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/motorista/login" element={<MotoristaLogin />} />

          {/* ===================== */}
          {/* Portal do Cliente      */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['cliente']} redirectPath="/portal/login" />}>
            <Route path="/portal/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* ===================== */}
          {/* Portal do Motorista   */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['motorista']} redirectPath="/motorista/login" />}>
            <Route path="/motorista/dashboard" element={<MotoristaDashboard />} />
          </Route>

          {/* ===================== */}
          {/* Painel Administrativo */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin', 'operador']} redirectPath="/admin/login" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/empresas/:id" element={<EmpresaDetalhe />} />
              <Route path="/motoristas" element={<Motoristas />} />
              <Route path="/motoristas/:id" element={<MotoristaDetalhe />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/ordens" element={<Ordens />} />
              <Route path="/ordens/:id" element={<OrdemDetalhe />} />
              <Route path="/tarifarios" element={<Tarifarios />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/fechamento" element={<FechamentoFinanceiro />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/mapa" element={<MapaRota />} />
              <Route path="/usuarios" element={<AprovacaoUsuarios />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Compatibilidade de rotas antigas */}
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SystemProvider>
    </BrowserRouter>
  );
}

export default App;
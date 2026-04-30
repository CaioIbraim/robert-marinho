import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OperadorDashboardLayout } from './layouts/OperadorDashboardLayout';
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { SystemProvider } from "./context/SystemContext";
import { RedirectToAdmin } from './components/RedirectToAdmin';
import { NotFound } from './pages/NotFound';
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
import { OperadorLogin } from "./pages/auth/OperadorLogin";

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
import { ConfigProfile } from './pages/config/ConfigProfile';

// Operador Pages
import { OperadorDashboard } from "./pages/operador/Dashboard";
import { OperadorOrdens } from "./pages/operador/Ordens";
import { OperadorOrdemDetalhe } from './pages/operador/OrdemDetalhe';
import { Profile } from './pages/operador/Profile';

function App() {
  return (
    <BrowserRouter>
      <SystemProvider>
        <Routes>

          {/* ===================== */}
          {/* Páginas Públicas */}
          {/* ===================== */}
          <Route path="/" element={<Landing />} />
          <Route path="/servico/:slug" element={<ServiceLanding />} />
          <Route path="/portal-clientes" element={<PrePortalLanding />} />
          <Route path="/pre-cadastro" element={<PreCadastro />} />

          {/* ===================== */}
          {/* Logins */}
          {/* ===================== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/motorista/login" element={<MotoristaLogin />} />
          <Route path="/operador/login" element={<OperadorLogin />} />

          {/* ===================== */}
          {/* Redirects (FORA de áreas protegidas) */}
          {/* ===================== */}
          <Route path="/dashboard" element={<RedirectToAdmin />} />
          <Route path="/empresas" element={<RedirectToAdmin to="/admin/empresas" />} />
          <Route path="/motoristas" element={<RedirectToAdmin to="/admin/motoristas" />} />
          <Route path="/veiculos" element={<RedirectToAdmin to="/admin/veiculos" />} />
          <Route path="/ordens" element={<RedirectToAdmin to="/admin/ordens" />} />
          <Route path="/tarifarios" element={<RedirectToAdmin to="/admin/tarifarios" />} />
          <Route path="/financeiro" element={<RedirectToAdmin to="/admin/financeiro" />} />
          <Route path="/fechamento" element={<RedirectToAdmin to="/admin/fechamento" />} />
          <Route path="/notificacoes" element={<RedirectToAdmin to="/admin/notificacoes" />} />
          <Route path="/mapa" element={<RedirectToAdmin to="/admin/mapa" />} />
          <Route path="/usuarios" element={<RedirectToAdmin to="/admin/usuarios" />} />
          <Route path="/profile" element={<RedirectToAdmin to="/admin/profile" />} />

          {/* ===================== */}
          {/* Configuração (multi-role) */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['cliente', 'motorista', 'admin', 'operador']} redirectPath="/" />}>
              <Route path="/config/profile" element={<ConfigProfile />} />
          </Route>

          {/* ===================== */}
          {/* Portal Cliente */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['cliente']} redirectPath="/portal/login" />}>
            <Route path="/portal/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* ===================== */}
          {/* Motorista */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['motorista']} redirectPath="/motorista/login" />}>
            <Route path="/motorista/dashboard" element={<MotoristaDashboard />} />
          </Route>

          {/* ===================== */}
          {/* Admin */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/empresas" element={<Empresas />} />
              <Route path="/admin/empresas/:id" element={<EmpresaDetalhe />} />
              <Route path="/admin/motoristas" element={<Motoristas />} />
              <Route path="/admin/motoristas/:id" element={<MotoristaDetalhe />} />
              <Route path="/admin/veiculos" element={<Veiculos />} />
              <Route path="/admin/ordens" element={<Ordens />} />
              <Route path="/admin/ordens/:id" element={<OrdemDetalhe />} />
              <Route path="/admin/tarifarios" element={<Tarifarios />} />
              <Route path="/admin/financeiro" element={<Financeiro />} />
              <Route path="/admin/fechamento" element={<FechamentoFinanceiro />} />
              <Route path="/admin/notificacoes" element={<Notificacoes />} />
              <Route path="/admin/mapa" element={<MapaRota />} />
              <Route path="/admin/usuarios" element={<AprovacaoUsuarios />} />
            </Route>
          </Route>

          {/* ===================== */}
          {/* Operador */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['operador']} redirectPath="/operador/login" />}>
            <Route element={<OperadorDashboardLayout />}>
              <Route path="/operador/dashboard" element={<OperadorDashboard />} />
              <Route path="/operador/ordens" element={<OperadorOrdens />} />
              <Route path="/operador/ordens/:id" element={<OperadorOrdemDetalhe />} />
              <Route path="/operador/profile" element={<Profile />} />
              <Route path="/operador/notificacoes" element={<Notificacoes />} />
            </Route>
          </Route>

          {/* ===================== */}
          {/* Fallback */}
          {/* ===================== */}
          
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </SystemProvider>
    </BrowserRouter>
  );
}

export default App;
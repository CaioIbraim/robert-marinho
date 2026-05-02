import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OperadorDashboardLayout } from './layouts/OperadorDashboardLayout';
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { SystemProvider } from "./context/SystemContext";
import { RedirectToAdmin } from './components/RedirectToAdmin';
import { NotFound } from './pages/NotFound';

// Public Pages
import Landing from "./pages/public/Landing";
import { ServiceLanding } from "./pages/public/ServiceLanding";

// Auth & Logins Específicos (Restaurando Layouts Originais)
import { Login as LoginGlobal } from "./pages/auth/Login";
import { AdminLogin } from "./pages/auth/AdminLogin";
import { OperadorLogin } from "./pages/auth/OperadorLogin";
import { MotoristaLogin } from "./pages/auth/MotoristaLogin";
import { PortalLogin } from "./pages/client/PortalLogin";
import ClientDashboard from "./pages/client/ClientDashboard";

import { SignupEmpresa } from "./pages/auth/SignupEmpresa";
import { SignupMotorista } from "./pages/auth/SignupMotorista";
import { RedefinirSenha } from "./pages/auth/RedefinirSenha";
import { EsqueciSenha } from "./pages/auth/EsqueciSenha";
import { AguardandoAprovacao } from "./pages/auth/AguardandoAprovacao";
import { NaoAutorizado } from "./pages/auth/NaoAutorizado";

// Admin & Operador
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
import { GestaoPerfis } from './pages/admin/GestaoPerfis';

import { OperadorDashboard } from "./pages/operador/Dashboard";
import { OperadorOrdens } from "./pages/operador/Ordens";
import { OperadorOrdemDetalhe } from './pages/operador/OrdemDetalhe';
import { Profile } from './pages/operador/Profile';
import { ConfigProfile } from './pages/config/ConfigProfile';

// Novas Roles: Empresa & Motorista
import { EmpresaDashboard } from "./pages/empresa/Dashboard";
import MotoristaDashboard from "./pages/driver/MotoristaDashboard";
import { MotoristaOrdemDetalhe } from './pages/driver/MotoristaOrdemDetalhe';

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
          
          {/* ===================== */}
          {/* Autenticação Global & Cadastro */}
          {/* ===================== */}
          <Route path="/login" element={<LoginGlobal />} />
          <Route path="/cadastro/empresa" element={<SignupEmpresa />} />
          <Route path="/cadastro/motorista" element={<SignupMotorista />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />

          {/* ===================== */}
          {/* Logins Específicos (Layouts Diferenciados) */}
          {/* ===================== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/motorista/login" element={<MotoristaLogin />} />
          <Route path="/operador/login" element={<OperadorLogin />} />

          {/* ===================== */}
          {/* Redirects */}
          {/* ===================== */}
          <Route path="/dashboard" element={<RedirectToAdmin />} />
          <Route path="/profile" element={<RedirectToAdmin to="/admin/profile" />} />

          {/* ===================== */}
          {/* Área: ADMIN */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} redirectPath="/admin/login" />}>
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
              <Route path="/admin/perfis" element={<GestaoPerfis />} />
              <Route path="/admin/profile" element={<ConfigProfile />} />
            </Route>
          </Route>

          {/* ===================== */}
          {/* Área: OPERADOR */}
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
          {/* Área: EMPRESA */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['empresa']} redirectPath="/login" />}>
            <Route path="/empresa/dashboard" element={<EmpresaDashboard />} />
          </Route>

          {/* ===================== */}
          {/* Área: MOTORISTA */}
          {/* ===================== */}
          <Route element={<RoleProtectedRoute allowedRoles={['motorista']} redirectPath="/motorista/login" />}>
            <Route path="/motorista/dashboard" element={<MotoristaDashboard />} />
            <Route path="/motorista/ordem/:id" element={<MotoristaOrdemDetalhe />} />
          </Route>

          {/* Area: PORTAL CLIENTE */}
          <Route element={<RoleProtectedRoute allowedRoles={['cliente']} redirectPath="/portal/login" />}>
             <Route path="/portal/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SystemProvider>
    </BrowserRouter>
  );
}

export default App;
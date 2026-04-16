import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Empresas } from './pages/Empresas';
import { Motoristas } from './pages/Motoristas';
import { Veiculos } from './pages/Veiculos';
import { Ordens } from './pages/Ordens';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Landing } from "./pages/Landing";
import { Profile } from './pages/Profile';
import { Financeiro } from './pages/Financeiro';
import { Notificacoes } from './pages/Notificacoes';
import { MapaRota } from './pages/MapaRota';
import { LoadingOverlay } from './components/ui/LoadingOverlay';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p>Esta funcionalidade está em desenvolvimento.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
          
        {/* Landing (página pública) */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard (com layout correto) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/motoristas" element={<Motoristas />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/ordens" element={<Ordens />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/mapa" element={<MapaRota />} />
          <Route path="/usuarios" element={<Placeholder title="Gestão de Usuários" />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <LoadingOverlay />
    </BrowserRouter>
  );
}

export default App;
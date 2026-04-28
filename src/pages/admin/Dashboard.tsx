import { FaFileAlt, FaUsers, FaTruck, FaDollarSign } from 'react-icons/fa';
import { Card } from '../../components/ui/Card';
import { useDashboard } from '../../hooks/useDashboard';
import { useComparativo } from '../../hooks/useComparativo';
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard';
import { FaturamentoChart } from '../../components/FaturamentoChart';
import { OrdensRecentes } from '../../components/OrdensRecentes';
import { OrdensPendentes } from '../../components/OrdensPendentes';
import { Link } from 'react-router-dom';
import { Plus, ListTodo, Route as RouteIcon, Calendar} from 'lucide-react';
import { useState, useEffect } from 'react';
import { empresaService } from '../../services/empresas.service';
import { motoristaService } from '../../services/motoristas.service';
import { veiculoService } from '../../services/veiculos.service';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/datepicker-custom.css';

import type { IconType } from 'react-icons';
import type {
  Empresa,
  Veiculo,
  Motorista,
  DashboardFilters,
  DashboardData,
  ComparativoData
} from '../../types/dashboard';

/* =========================
   STAT CARD
========================= */
interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon: IconType;
  trend?: number;
}

const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <Card className="flex flex-col gap-2 hover:scale-[1.02] transition-transform">
    <div className="flex items-center justify-between">
      <div className="p-3 bg-primary/10 text-primary rounded-lg">
        <Icon size={18} />
      </div>

      {trend !== undefined && (
        <span className={`text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '+' : ''}
          {trend}
        </span>
      )}
    </div>

    <div>
      <p className="text-sm text-text-muted">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value ?? 0}</h3>
    </div>
  </Card>
);

/* =========================
   DASHBOARD
========================= */
export const Dashboard = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    empresaId: '',
    veiculoId: '',
    motoristaId: '',
  });

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);

  /* =========================
     FETCH AUX
  ========================= */
  useEffect(() => {
    const fetchAux = async () => {
      const [e, v, m] = await Promise.all([
        empresaService.getAll(),
        veiculoService.getAll(),
        motoristaService.getAll()
      ]);

      setEmpresas(e);
      setVeiculos(v);
      setMotoristas(m);
    };

    fetchAux();
  }, []);

  /* =========================
     HOOKS
  ========================= */
  const { data, isLoading } = useDashboard({
    ...filters,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }) as {
    data: DashboardData | undefined;
    isLoading: boolean;
  };

  const { data: comparativo } = useComparativo() as {
    data: ComparativoData | undefined;
  };

  useRealtimeDashboard();

  /* =========================
     HANDLERS
  ========================= */
  const handleDateChange =
    (field: 'startDate' | 'endDate') =>
    (date: Date | null) => {
      setFilters((prev) => ({
        ...prev,
        [field]: date ? format(date, 'yyyy-MM-dd') : '',
      }));
    };

  const setRange = (days: number) => {
    setFilters((prev) => ({
      ...prev,
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    }));
  };

  const setThisMonth = () => {
    setFilters((prev) => ({
      ...prev,
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }));
  };

  /* =========================
     LOADING
  ========================= */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        <p className="text-text-muted animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-text-muted">Visão geral da operação</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/ordens" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
            <Plus size={16} />
            <span className="font-semibold">Nova Ordem</span>
          </Link>

          <Link to="/admin/motoristas" className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-text px-4 py-2 rounded-lg text-sm transition-colors">
            <ListTodo size={16} />
            <span>Motoristas</span>
          </Link>

          <Link to="/admin/veiculos" className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-text px-4 py-2 rounded-lg text-sm transition-colors">
            <RouteIcon size={16} />
            <span>Veículos</span>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="bg-surface/50 border-primary/20 !p-6">
        <div className="flex flex-col gap-6">

          {/* atalhos */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] uppercase font-bold text-text-muted self-center mr-2">Atalhos:</span>

            {[{ label: 'Hoje', days: 0 }, { label: '7 Dias', days: 7 }, { label: '30 Dias', days: 30 }, { label: '90 Dias', days: 90 }].map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.days)}
                className="px-3 py-1 text-xs font-medium rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-text-muted"
              >
                {r.label}
              </button>
            ))}

            <button
              onClick={setThisMonth}
              className="px-3 py-1 text-xs font-medium rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-text-muted"
            >
              Este Mês
            </button>
          </div>

          {/* grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

            {/* DATA INÍCIO */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <Calendar size={12} /> De
              </label>

              <DatePicker
                selected={filters.startDate ? parseISO(filters.startDate + 'T00:00:00') : null}
                onChange={handleDateChange('startDate')}
                dateFormat="dd/MM/yyyy"
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white input-focus"
              />
            </div>

            {/* DATA FIM */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <Calendar size={12} /> Até
              </label>

              <DatePicker
                selected={filters.endDate ? parseISO(filters.endDate + 'T00:00:00') : null}
                onChange={handleDateChange('endDate')}
                dateFormat="dd/MM/yyyy"
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white input-focus"
              />
            </div>

            {/* EMPRESA */}
            <select
              value={filters.empresaId}
              onChange={(e) => setFilters(prev => ({ ...prev, empresaId: e.target.value }))}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todas Empresas</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.razao_social}</option>
              ))}
            </select>

            {/* VEICULO */}
            <select
              value={filters.veiculoId}
              onChange={(e) => setFilters(prev => ({ ...prev, veiculoId: e.target.value }))}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todos Veículos</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
              ))}
            </select>

            {/* MOTORISTA */}
            <select
              value={filters.motoristaId}
              onChange={(e) => setFilters(prev => ({ ...prev, motoristaId: e.target.value }))}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todos Motoristas</option>
              {motoristas.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>

          </div>
        </div>
      </Card>

      {/* KPIs COMPLETOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title={(() => {
            const hoje = format(new Date(), 'yyyy-MM-dd');
            const start = filters.startDate;
            const end = filters.endDate;
            if (!start && !end) return 'Ordens';
            if (start === end && start === hoje) return 'Ordens Hoje';
            const s = start ? format(parseISO(start + 'T00:00:00'), 'dd/MM') : '?';
            const e = end ? format(parseISO(end + 'T00:00:00'), 'dd/MM') : '?';
            return `Ordens ${s} - ${e}`;
          })()}
          value={data?.ordens}
          icon={FaFileAlt}
          trend={comparativo ? (data?.ordens || 0) - comparativo.ontem : 0}
        />

        <StatCard
          title="Motoristas Ativos"
          value={data?.motoristas}
          icon={FaUsers}
        />

        <StatCard
          title="Veículos Ativos"
          value={data?.veiculos}
          icon={FaTruck}
        />

        <StatCard
          title="Faturamento"
          value={`R$ ${data?.faturamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}`}
          icon={FaDollarSign}
        />

        <StatCard
          title="Custos (Repasse)"
          value={`R$ ${data?.repasse?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}`}
          icon={FaTruck}
        />

        <StatCard
          title="Lucro Líquido"
          value={`R$ ${data?.lucro?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}`}
          icon={FaDollarSign}
        />
      </div>

      {/* GRÁFICO */}
      <Card title="Faturamento Mensal">
        <FaturamentoChart />
      </Card>

      {/* GRID INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card title="Ordens Recentes">
          <OrdensRecentes />
        </Card>

        <Card title="Ordens Pendentes">
          <OrdensPendentes />
        </Card>

      </div>
    </div>
  );
};
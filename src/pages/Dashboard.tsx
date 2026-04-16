import { FaFileAlt, FaUsers, FaTruck, FaDollarSign } from 'react-icons/fa';
import { Card } from '../components/ui/Card';
import { useDashboard } from '../hooks/useDashboard';
import { useComparativo } from '../hooks/useComparativo';
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard';
import { FaturamentoChart } from '../components/FaturamentoChart';
import { OrdensRecentes } from '../components/OrdensRecentes';
import { OrdensPendentes } from '../components/OrdensPendentes';
import { Link } from 'react-router-dom';
import { Plus, ListTodo, Route as RouteIcon, Calendar, Filter as FilterIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { empresaService } from '../services/empresas.service';
import { motoristaService } from '../services/motoristas.service';
import { veiculoService } from '../services/veiculos.service';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/datepicker-custom.css'; // Vou criar esse arquivo para o tema dark

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
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
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  </Card>
);

export const Dashboard = () => {
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    empresaId: '',
    veiculoId: '',
    motoristaId: '',
  });

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<any[]>([]);

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

  const { data, isLoading } = useDashboard({
    ...filters,
    startDate: filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : undefined,
    endDate: filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : undefined,
  });

  const setRange = (days: number) => {
    setFilters({
      ...filters,
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const setThisMonth = () => {
    setFilters({
      ...filters,
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
  };
  const { data: comparativo } = useComparativo();

  useRealtimeDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        <p className="text-text-muted animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-text-muted">Visão geral da operação</p>
        </div>
        
        {/* Atalhos Rápidos */}
        <div className="flex flex-wrap gap-3">
          <Link to="/ordens" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
            <Plus size={16} />
            <span className="font-semibold">Nova Ordem</span>
          </Link>
          <Link to="/motoristas" className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-text px-4 py-2 rounded-lg text-sm transition-colors">
            <ListTodo size={16} />
            <span>Motoristas</span>
          </Link>
          <Link to="/veiculos" className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-text px-4 py-2 rounded-lg text-sm transition-colors">
            <RouteIcon size={16} />
            <span>Veículos</span>
          </Link>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card className="bg-surface/50 border-primary/20 !p-6">
        <div className="flex flex-col gap-6">
          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] uppercase font-bold text-text-muted self-center mr-2">Atalhos:</span>
            {[
              { label: 'Hoje', days: 0 },
              { label: '7 Dias', days: 7 },
              { label: '30 Dias', days: 30 },
              { label: '90 Dias', days: 90 },
            ].map((r) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <Calendar size={12} /> De
              </label>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={filters.startDate ? new Date(filters.startDate) : null}
                  onChange={(date) => setFilters({ ...filters, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white input-focus"
                  placeholderText="Data Início"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <Calendar size={12} /> Até
              </label>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={filters.endDate ? new Date(filters.endDate) : null}
                  onChange={(date) => setFilters({ ...filters, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white input-focus"
                  placeholderText="Data Fim"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <FilterIcon size={12} /> Empresa
              </label>
              <select 
                value={filters.empresaId}
                onChange={(e) => setFilters({...filters, empresaId: e.target.value})}
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white appearance-none h-[38px]"
              >
                <option value="">Todas Empresas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <FilterIcon size={12} /> Veículo
              </label>
              <select 
                value={filters.veiculoId}
                onChange={(e) => setFilters({...filters, veiculoId: e.target.value})}
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white appearance-none h-[38px]"
              >
                <option value="">Todos Veículos</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-2">
                <FilterIcon size={12} /> Motorista
              </label>
              <select 
                value={filters.motoristaId}
                onChange={(e) => setFilters({...filters, motoristaId: e.target.value})}
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white appearance-none h-[38px]"
              >
                <option value="">Todos Motoristas</option>
                {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ordens Hoje"
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

      {/* Gráfico */}
      <Card title="Faturamento Mensal">
        <FaturamentoChart />
      </Card>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ordens recentes */}
        <Card title="Ordens Recentes">
          <OrdensRecentes />
        </Card>

        {/* Ordens pendentes */}
        <Card title="Ordens Pendentes">
          <OrdensPendentes />
        </Card>

      </div>
    </div>
  );
};
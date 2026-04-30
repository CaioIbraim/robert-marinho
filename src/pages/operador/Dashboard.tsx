import { FaFileAlt, FaUsers, FaTruck } from 'react-icons/fa';
import { Card } from '../../components/ui/Card';
import { useDashboard } from '../../hooks/useDashboard';
import { useComparativo } from '../../hooks/useComparativo';
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard';
import { OrdensRecentes } from '../../components/OrdensRecentes';
import { OrdensPendentes } from '../../components/OrdensPendentes';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { empresaService } from '../../services/empresas.service';
import { motoristaService } from '../../services/motoristas.service';
import { veiculoService } from '../../services/veiculos.service';
import { format, subDays, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
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
export const OperadorDashboard = () => {
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
  const heatmapData = (() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    if (data?.ordensList) {
      data.ordensList.forEach(o => {
        if (o.data_execucao) {
          const date = parseISO(o.data_execucao);
          if (isValid(date)) {
            const hour = date.getHours();
            hours[hour].count++;
          }
        }
      });
    }
    const maxCount = Math.max(...hours.map(h => h.count), 1);
    return hours.map(h => ({ ...h, intensity: h.count / maxCount }));
  })();

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
          <Link to="/operador/ordens" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
            <Plus size={16} />
            <span className="font-semibold">Nova Ordem</span>
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

        {/* HEATMAP MIGRADO DA TELA DE ORDENS */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 !p-4 bg-surface/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Calor de Demanda Operacional (Picos de Horário)
            </h4>
            <span className="text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded border border-border">Baseado nos últimos 30 dias</span>
          </div>
          <div className="flex gap-1 h-12">
            {heatmapData.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all relative group ${
                  h.intensity === 0 ? 'bg-border/20' :
                  h.intensity < 0.3 ? 'bg-emerald-500/40' :
                  h.intensity < 0.6 ? 'bg-amber-500/60' :
                  'bg-red-500/80 hover:bg-red-500'
                }`}
                title={`${h.hour.toString().padStart(2, '0')}:00 - ${h.count} ordens`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {h.hour}:00 - {h.count} OS
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-text-muted uppercase tracking-tighter">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </Card>

      </div>


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
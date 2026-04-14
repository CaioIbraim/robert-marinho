import { FaFileAlt, FaUsers, FaTruck, FaDollarSign } from 'react-icons/fa';
import { Card } from '../components/ui/Card';
import { useDashboard } from '../hooks/useDashboard';
import { useComparativo } from '../hooks/useComparativo';
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard';
import { FaturamentoChart } from '../components/FaturamentoChart';
import { OrdensRecentes } from '../components/OrdensRecentes';
import { OrdensPendentes } from '../components/OrdensPendentes'

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
  const { data, isLoading } = useDashboard();
  const { data: comparativo } = useComparativo();

  useRealtimeDashboard();

  if (isLoading) {
    return <div className="text-white">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-text-muted">Visão geral da operação</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ordens Hoje"
          value={data?.ordens}
          icon={FaFileAlt}
          trend={comparativo ? data.ordens - comparativo.ontem : 0}
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
          value={`R$ ${data?.faturamento?.toFixed(2) || 0}`}
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
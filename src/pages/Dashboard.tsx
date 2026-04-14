import { 
  FileText, 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: { 
  title: string; 
  value: string; 
  icon: any; 
  trend?: 'up' | 'down'; 
  trendValue?: string 
}) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="p-3 bg-primary/10 text-primary rounded-lg">
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </Card>
);

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-text-muted">Resumo da operação logística hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Ordens" 
          value="1,284" 
          icon={FileText} 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          title="Faturamento" 
          value="R$ 48.290" 
          icon={DollarSign} 
          trend="up" 
          trendValue="+8.5%" 
        />
        <StatCard 
          title="Motoristas Ativos" 
          value="45" 
          icon={Users} 
          trend="down" 
          trendValue="-2" 
        />
        <StatCard 
          title="Veículos Disponíveis" 
          value="18" 
          icon={Truck} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card title="Atividades Recentes" className="lg:col-span-2">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-border/50 flex flex-shrink-0 items-center justify-center text-primary">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text">Ordem #1234{i} atualizada</p>
                    <span className="text-xs text-text-muted">2h atrás</span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">Status alterado para 'Em Trânsito' pela transportadora ABC.</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Orders */}
        <Card title="Ordens Pendentes">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-border/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">OS #449{i}</p>
                  <p className="text-xs text-text-muted">São Paulo - Rio de Janeiro</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">R$ 1.200</p>
                  <span className="text-[10px] uppercase font-bold text-yellow-500">Pendente</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-sm font-medium text-primary hover:underline">
            Ver todas as ordens
          </button>
        </Card>
      </div>
    </div>
  );
};

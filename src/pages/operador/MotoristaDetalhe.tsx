import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motoristaService } from '../../services/motoristas.service';
import { ordemService } from '../../services/ordens.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  IdCard, 
  Calendar,
  Truck,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { formatDateBR } from '../../utils/date';
import type { Motorista, OrdemServico } from '../../types';

export const MotoristaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'historico'>('info');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [motData, ordensData] = await Promise.all([
          motoristaService.getById(id!),
          ordemService.getAll()
        ]);
        
        setMotorista(motData);
        setOrdens(ordensData.filter(o => o.motorista_id === id));
      } catch (err) {
        console.error('Erro ao carregar detalhes do motorista:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-text-muted">Carregando perfil do motorista...</div>;
  if (!motorista) return <div className="p-6 text-center text-red-500">Motorista não encontrado.</div>;

  const totalRepasse = ordens.reduce((acc, curr) => acc + (curr.valor_custo_motorista || 0), 0);
  const veiculosUtilizados = Array.from(new Set(ordens.map(o => o.veiculo?.placa).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/motoristas')} className="hover:bg-white/5">
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-border overflow-hidden">
                <User size={40} />
             </div>
             <div>
                <h1 className="text-3xl font-bold text-white leading-tight">{motorista.nome}</h1>
                <p className="text-text-muted flex items-center gap-2">
                   <Briefcase size={14} /> {motorista.tipo_vinculo === 'fixo' ? 'Motorista CLT' : 'Motorista Agregado'}
                </p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <StatusBadge status={motorista.status === 'ativo' ? 'concluido' : 'atrasado'} />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
         <button 
           onClick={() => setActiveTab('info')}
           className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
         >
           Dados e Documentos
         </button>
         <button 
           onClick={() => setActiveTab('historico')}
           className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'historico' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
         >
           Histórico de Viagens
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INFO ESQUERDA */}
        {activeTab === 'info' && (
          <>
            <div className="lg:col-span-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Informações Pessoais">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <IdCard size={18} className="text-text-muted" />
                           <div>
                              <p className="text-[10px] uppercase font-bold text-text-muted">CPF</p>
                              <p className="text-sm text-white">{motorista.cpf}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Phone size={18} className="text-text-muted" />
                           <div>
                              <p className="text-[10px] uppercase font-bold text-text-muted">Telefone</p>
                              <p className="text-sm text-white">{motorista.telefone}</p>
                           </div>
                        </div>
                        {motorista.email && (
                          <div className="flex items-center gap-3">
                             <Mail size={18} className="text-text-muted" />
                             <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted">E-mail</p>
                                <p className="text-sm text-white">{motorista.email}</p>
                             </div>
                          </div>
                        )}
                     </div>
                  </Card>

                  <Card title="Habilitação (CNH)">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded bg-zinc-800 text-primary font-bold text-sm">{motorista.categoria_cnh || 'B'}</div>
                           <div>
                              <p className="text-[10px] uppercase font-bold text-text-muted">Registro CNH</p>
                              <p className="text-sm text-white">{motorista.cnh}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Calendar size={18} className="text-text-muted" />
                           <div>
                              <p className="text-[10px] uppercase font-bold text-text-muted">Validade</p>
                              <p className={`text-sm font-bold ${motorista.validade_cnh && new Date(motorista.validade_cnh) < new Date() ? 'text-red-500' : 'text-white'}`}>
                                 {motorista.validade_cnh ? formatDateBR(motorista.validade_cnh) : '--/--/----'}
                              </p>
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>

               <Card title="Dados de Pagamento (PIX)">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                     <div className="p-3 rounded-full bg-primary/10 text-primary"><CreditCard size={24} /></div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-primary/70">Chave PIX para Repasse</p>
                        <p className="text-lg font-mono font-bold text-white tracking-widest">{motorista.pix_key || 'Não cadastrada'}</p>
                     </div>
                  </div>
               </Card>

               <Card title="Veículos Recentemente Operados">
                  <div className="flex flex-wrap gap-3">
                     {veiculosUtilizados.length > 0 ? veiculosUtilizados.map(placa => (
                        <div key={placa} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border">
                           <Truck size={16} className="text-text-muted" />
                           <span className="text-sm font-mono font-bold text-white uppercase italic">{placa}</span>
                        </div>
                     )) : (
                        <p className="text-sm text-text-muted italic">Nenhum veículo registrado em viagens.</p>
                     )}
                  </div>
               </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-primary/5 border-primary/20">
                  <div className="flex flex-col items-center text-center py-4">
                     <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <TrendingUp size={32} />
                     </div>
                     <p className="text-4xl font-black text-white">{ordens.length}</p>
                     <p className="text-xs text-text-muted uppercase font-bold mt-1">Viagens Realizadas</p>
                  </div>
               </Card>

               <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex flex-col items-center text-center py-4">
                     <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 flex items-center justify-center">
                        <DollarSign size={32} />
                     </div>
                     <p className="text-3xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRepasse)}
                     </p>
                     <p className="text-xs text-text-muted uppercase font-bold mt-1">Total Recebido (Repasses)</p>
                  </div>
               </Card>
            </div>
          </>
        )}

        {/* HISTÓRICO DE VIAGENS */}
        {activeTab === 'historico' && (
          <div className="lg:col-span-12">
            <Card className="!p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">OS #</th>
                        <th className="px-6 py-4">Empresa</th>
                        <th className="px-6 py-4">Roteiro (Origem → Destino)</th>
                        <th className="px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-right">Repasse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ordens.map(os => (
                        <tr key={os.id} className="hover:bg-border/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/ordens/${os.id}`)}>
                          <td className="px-6 py-4 text-white font-medium">{formatDateBR(os.data_execucao)}</td>
                          <td className="px-6 py-4 text-primary font-mono font-bold">{os.numero_os || os.id.slice(0,8)}</td>
                          <td className="px-6 py-4 text-text-muted">{os.empresa?.razao_social}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-white">
                               <span className="text-xs">{os.origem.split(',')[0]}</span>
                               <ArrowLeft size={12} className="rotate-180 text-text-muted" />
                               <span className="text-xs">{os.destino.split(',')[0]}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-muted font-mono uppercase text-xs italic">{os.veiculo?.placa}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_custo_motorista || 0)}
                          </td>
                        </tr>
                      ))}
                      {ordens.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-text-muted italic">Nenhuma viagem registrada.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

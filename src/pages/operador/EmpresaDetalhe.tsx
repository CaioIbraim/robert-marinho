import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { empresaService } from '../../services/empresas.service';
import { ordemService } from '../../services/ordens.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Search
} from 'lucide-react';
import { formatDateBR } from '../../utils/date';
import type { Empresa, OrdemServico } from '../../types';
import { supabase } from '../../lib/supabaseClient';

export const EmpresaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'ordens' | 'usuarios'>('info');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [empData, ordensData] = await Promise.all([
          empresaService.getById(id!),
          ordemService.getAll() // Filtered below
        ]);
        
        setEmpresa(empData);
        setOrdens(ordensData.filter(o => o.empresa_id === id));
        
        // Tentar carregar usuários vinculados (assumindo tabela profiles ou meta-data)
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('empresa_id', id);
        
        setUsuarios(usersData || []);
      } catch (err) {
        console.error('Erro ao carregar detalhes da empresa:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-text-muted">Carregando perfil...</div>;
  if (!empresa) return <div className="p-6 text-center text-red-500">Empresa não encontrada.</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/operador/empresas')} className="hover:bg-white/5">
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Building2 size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-bold text-white leading-tight">{empresa.razao_social}</h1>
                <p className="text-text-muted flex items-center gap-2">
                   <FileText size={14} /> CNPJ: {empresa.cnpj}
                </p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <StatusBadge status={empresa.status === 'ativo' ? 'concluido' : 'atrasado'} />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
         <button 
           onClick={() => setActiveTab('info')}
           className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
         >
           Visão Geral
         </button>
         <button 
           onClick={() => setActiveTab('ordens')}
           className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'ordens' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
         >
           Ordens de Serviço
         </button>
         <button 
           onClick={() => setActiveTab('usuarios')}
           className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'usuarios' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
         >
           Contatos / Usuários
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INFO GERAL */}
        {activeTab === 'info' && (
          <>
            <div className="lg:col-span-8 space-y-6">
               <Card title="Dados de Contato">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                        <div className="p-3 rounded-full bg-zinc-800 text-zinc-400"><Mail size={20} /></div>
                        <div>
                           <p className="text-[10px] uppercase font-bold text-text-muted">E-mail Corporativo</p>
                           <p className="text-base text-white">{empresa.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                        <div className="p-3 rounded-full bg-zinc-800 text-zinc-400"><Phone size={20} /></div>
                        <div>
                           <p className="text-[10px] uppercase font-bold text-text-muted">Telefone / WhatsApp</p>
                           <p className="text-base text-white">{empresa.telefone}</p>
                        </div>
                     </div>
                  </div>
               </Card>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="flex flex-col items-center justify-center text-center py-8">
                     <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                        <Calendar size={24} />
                     </div>
                     <p className="text-3xl font-black text-white">{ordens.length}</p>
                     <p className="text-xs text-text-muted uppercase font-bold tracking-widest mt-1">Total de OS</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center text-center py-8">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                        <DollarSign size={24} />
                     </div>
                     <p className="text-3xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(ordens.reduce((acc, current) => acc + (current.valor_faturamento || 0), 0))}
                     </p>
                     <p className="text-xs text-text-muted uppercase font-bold tracking-widest mt-1">Volume Negociado</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center text-center py-8">
                     <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                        <TrendingUp size={24} />
                     </div>
                     <p className="text-3xl font-black text-white">{Math.round(ordens.length / 4)}</p>
                     <p className="text-xs text-text-muted uppercase font-bold tracking-widest mt-1">Média Mensal</p>
                  </Card>
               </div>
            </div>

            <div className="lg:col-span-4">
               <Card title="Última Atividade" className="h-full">
                  <div className="space-y-4">
                     {ordens.slice(0, 5).map(os => (
                        <div key={os.id} className="p-3 rounded-lg bg-surface/50 border border-border flex items-center justify-between">
                           <div>
                              <p className="text-xs font-bold text-white">#{os.numero_os || os.id.slice(0,8)}</p>
                              <p className="text-[10px] text-text-muted">{formatDateBR(os.data_execucao)}</p>
                           </div>
                           <StatusBadge status={os.status} className="text-[9px] px-1.5 py-0.5" />
                        </div>
                     ))}
                     {ordens.length === 0 && <p className="text-sm text-text-muted italic text-center py-8">Sem histórico recente.</p>}
                  </div>
               </Card>
            </div>
          </>
        )}

        {/* LISTAGEM DE ORDENS */}
        {activeTab === 'ordens' && (
          <div className="lg:col-span-12">
            <Card className="!p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">OS #</th>
                        <th className="px-6 py-4">Origem / Destino</th>
                        <th className="px-6 py-4">Passageiro</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ordens.map(os => (
                        <tr key={os.id} className="hover:bg-border/20 transition-colors cursor-pointer" onClick={() => navigate(`/operador/ordens/${os.id}`)}>
                          <td className="px-6 py-4 text-white font-medium">{formatDateBR(os.data_execucao)}</td>
                          <td className="px-6 py-4 text-primary font-mono font-bold">{os.numero_os || os.id.slice(0,8)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-white text-xs">{os.origem.split(',')[0]}</span>
                               <span className="text-text-muted text-[10px]">→ {os.destino.split(',')[0]}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-muted italic">{os.passageiro || '--'}</td>
                          <td className="px-6 py-4"><StatusBadge status={os.status} /></td>
                          <td className="px-6 py-4 text-right font-bold text-white">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_faturamento)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </Card>
          </div>
        )}

        {/* USUÁRIOS / CONTATOS */}
        {activeTab === 'usuarios' && (
          <div className="lg:col-span-12">
            <Card className="!p-0">
               <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mb-6 border border-border">
                     <Users size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Contatos da Empresa</h3>
                  <p className="text-text-muted max-w-md mb-8">Gerencie as pessoas autorizadas a solicitar serviços por esta empresa e seus respectivos acessos ao portal do cliente.</p>
                  
                  {usuarios.length > 0 ? (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                       {usuarios.map(u => (
                         <div key={u.id} className="p-4 border border-border rounded-xl bg-surface/50 flex items-center gap-4 hover:border-primary transition-all group">
                            <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center font-bold text-text-muted group-hover:text-primary transition-colors">
                               {u.full_name?.[0] || 'U'}
                            </div>
                            <div>
                               <p className="font-bold text-white">{u.full_name}</p>
                               <p className="text-xs text-text-muted">{u.email}</p>
                               <span className="inline-block mt-2 px-2 py-0.5 bg-zinc-800 text-[9px] uppercase font-black rounded text-zinc-400 border border-zinc-700">{u.role}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-border rounded-3xl w-full max-w-md flex flex-col items-center">
                       <Search size={32} className="text-text-muted mb-4 opacity-50" />
                       <p className="text-sm text-text-muted font-medium mb-1">Nenhum operadoristrador vinculado</p>
                       <p className="text-[10px] text-zinc-500 uppercase font-black">Aguardando convite de acesso</p>
                    </div>
                  )}
               </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

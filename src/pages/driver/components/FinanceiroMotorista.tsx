import { DollarSign, ArrowUpRight, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface FinanceiroMotoristaProps {
  earnings: any[];
}

export const FinanceiroMotorista = ({ earnings }: FinanceiroMotoristaProps) => {
  const totalGeral = earnings.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const pendente = earnings.filter(e => e.status === 'pendente').reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const pago = earnings.filter(e => e.status === 'pago').reduce((acc, curr) => acc + (curr.valor || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
       {/* CARDS DE RESUMO */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8">
                <TrendingUp className="w-12 h-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
             </div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Total Ganho</p>
             <h3 className="text-4xl font-black text-white italic leading-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
             </h3>
             <div className="mt-6 flex items-center gap-2 text-green-500">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Acumulado</span>
             </div>
          </div>

          <div className="bg-zinc-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl group">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Pendente</p>
             <h3 className="text-4xl font-black text-orange-500 italic leading-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendente)}
             </h3>
             <div className="mt-6 flex items-center gap-2 text-zinc-600">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Repasse</span>
             </div>
          </div>

          <div className="bg-zinc-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl group">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Já Recebido</p>
             <h3 className="text-4xl font-black text-green-500 italic leading-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pago)}
             </h3>
             <div className="mt-6 flex items-center gap-2 text-zinc-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Transferências Concluídas</span>
             </div>
          </div>
       </div>

       {/* LISTA DE REPASSES */}
       <div className="bg-zinc-900/40 rounded-[40px] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5">
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Detalhamento de Pagamentos</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-white/5">
                      <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Data</th>
                      <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Atendimento</th>
                      <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Valor</th>
                      <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {earnings.length > 0 ? (
                      earnings.map((e) => (
                         <tr key={e.id} className="group hover:bg-white/5 transition-all">
                            <td className="px-8 py-6">
                               <p className="text-white font-bold text-sm">
                                  {format(new Date(e.data_pagamento || e.created_at), "dd/MM/yyyy")}
                               </p>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
                                  {e.ordem?.origem?.split(',')[0]} → {e.ordem?.destino?.split(',')[0]}
                               </p>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-primary font-black text-sm">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.valor)}
                               </p>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${e.status === 'pago' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                  {e.status}
                               </span>
                            </td>
                         </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={4} className="px-8 py-20 text-center">
                            <DollarSign className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest">Nenhum repasse registrado</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

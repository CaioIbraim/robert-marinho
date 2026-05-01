import { useState } from "react";
import { FileText, Calendar, CheckCircle, Clock, Filter, TrendingUp, AlertCircle } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinanceiroClienteProps {
  financeiro: any[];
}

export const FinanceiroCliente = ({ financeiro }: FinanceiroClienteProps) => {
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const filteredData = financeiro.filter(fatura => {
    const matchStatus = filterStatus === "todos" || fatura.status === filterStatus;
    let matchDate = true;
    if (dateRange.start && dateRange.end) {
      const date = new Date(fatura.data_vencimento);
      matchDate = isWithinInterval(date, { 
        start: parseISO(dateRange.start), 
        end: parseISO(dateRange.end) 
      });
    }
    return matchStatus && matchDate;
  });

  const totalPago = financeiro
    .filter(f => f.status === 'pago')
    .reduce((acc, curr) => acc + curr.valor, 0);
  
  const totalPendente = financeiro
    .filter(f => f.status !== 'pago')
    .reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* TOTALS CARDS */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-24 h-24 text-green-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
               <CheckCircle className="w-3 h-3 text-green-500" /> Total Quitado
            </p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter">
               R$ {totalPago.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-4">Fluxo acumulado com sucesso</p>
         </div>

         <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[40px] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <AlertCircle className="w-24 h-24 text-amber-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
               <Clock className="w-3 h-3 text-amber-500" /> Pendente de Recebimento
            </p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter">
               R$ {totalPendente.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-amber-500/60 text-[9px] font-bold uppercase tracking-widest mt-4">Aguardando processamento bancário</p>
         </div>
      </div>

      {/* FILTERS */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 flex flex-wrap gap-6 items-center">
         <div className="flex items-center gap-3 text-zinc-500 mr-4">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtros Avançados</span>
         </div>
         
         <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
            {['todos', 'pago', 'pendente'].map(s => (
               <button 
                 key={s}
                 onClick={() => setFilterStatus(s)}
                 className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary text-white' : 'text-zinc-600 hover:text-white'}`}
               >
                 {s}
               </button>
            ))}
         </div>

         <div className="flex items-center gap-4 bg-zinc-950 px-4 py-2 rounded-xl border border-white/5">
            <input 
              type="date" 
              className="bg-transparent text-white text-xs outline-none focus:text-primary transition-colors" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-zinc-700 text-xs text-bold uppercase tracking-tighter">até</span>
            <input 
              type="date" 
              className="bg-transparent text-white text-xs outline-none focus:text-primary transition-colors" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
         </div>
      </div>

      <div className="grid gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((fatura: any, i) => (
            <div key={i} className="bg-zinc-900/40 rounded-[32px] p-6 md:p-10 border border-white/5 flex flex-col md:flex-row justify-between items-center group hover:bg-zinc-900/60 transition-all gap-6 md:gap-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center flex-1 w-full sm:w-auto">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-all duration-500 transform group-hover:scale-110">
                  <FileText className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xl md:text-2xl font-black text-white hover:text-primary transition-colors cursor-default">
                    {format(new Date(fatura.data_vencimento), "MMMM yyyy", { locale: ptBR }).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                     <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                       <Calendar className="w-3 h-3" /> Vencimento: {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                     </p>
                     {fatura.status === 'pago' ? (
                       <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                         <CheckCircle className="w-3 h-3" /> Quitado
                       </span>
                     ) : (
                       <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                         <Clock className="w-3 h-3" /> Aguardando
                       </span>
                     )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Total da Fatura</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter">
                    R$ {fatura.valor.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button className="bg-white text-zinc-950 hover:bg-primary hover:text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-black/20 hover:-translate-y-1 active:translate-y-0">
                   Visualizar PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5 opacity-50">
             <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
             <p className="text-zinc-600 uppercase tracking-[0.3em] font-black text-xs">Nenhum lançamento filtrado</p>
             <p className="text-zinc-500 text-[9px] mt-2 uppercase tracking-widest">Ajuste os filtros acima para ver outros períodos</p>
          </div>
        )}
      </div>
    </div>
  );
};

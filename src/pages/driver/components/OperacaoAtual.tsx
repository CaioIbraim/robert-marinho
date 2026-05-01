import { useState } from "react";
import { 
  MapPin, 
  CheckCircle, 
  Navigation, 
  MessageSquare, 
  AlertTriangle,
  Clock,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "../../../lib/supabaseClient";
import { showToast } from "../../../utils/swal";
import { getLocalISOString } from "../../../utils/date";
import { notificationService } from "../../../services/notifications.service";

interface OperacaoAtualProps {
  ordem: any;
  onUpdate: () => void;
}

export const OperacaoAtual = ({ ordem, onUpdate }: OperacaoAtualProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!ordem) {
    return (
      <div className="py-24 text-center bg-zinc-900/30 rounded-[40px] border border-white/5">
         <Navigation className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
         <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Nenhuma Operação Ativa</h3>
         <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">Selecione uma viagem na lista para iniciar o atendimento</p>
      </div>
    );
  }

  const handleStatusChange = async (campo: 'horario_inicio' | 'horario_fim') => {
    setLoading(campo);
    try {
      const agora = getLocalISOString();
      const updates: any = { [campo]: agora };
      
      if (campo === 'horario_inicio') updates.status = 'em_andamento';
      if (campo === 'horario_fim') {
        const paradasPendentes = ordem.paradas?.filter((p: any) => !p.realizada) || [];
        if (paradasPendentes.length > 0) {
           showToast(`Você ainda possui ${paradasPendentes.length} paradas pendentes!`, 'warning');
           setLoading(null);
           return;
        }
        updates.status = 'concluido';
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(updates)
        .eq('id', ordem.id);

      if (error) throw error;
      
      const osNumero = ordem.numero_os || ordem.id.slice(0,8).toUpperCase();
      const acaoMsg = campo === 'horario_inicio' ? `O motorista iniciou o atendimento da OS #${osNumero}` : `O motorista finalizou a OS #${osNumero}`;
      
      await notificationService.create({
        titulo: campo === 'horario_inicio' ? 'Check-in Motorista' : 'Viagem Finalizada',
        mensagem: acaoMsg,
        tipo: 'success',
        user_id: ordem.empresa_id,
        link: `/ordens` // Admin/Operador can see
      });

      showToast(campo === 'horario_inicio' ? 'Partida registrada!' : 'Viagem finalizada com sucesso!', 'success');
      onUpdate();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleCheckinParada = async (paradaId: string) => {
    setLoading(paradaId);
    try {
      const agora = getLocalISOString();
      const { error } = await supabase
        .from('ordem_servico_paradas')
        .update({ realizada: true, horario_realizado: agora })
        .eq('id', paradaId);

      if (error) throw error;
      
      const osNumero = ordem.numero_os || ordem.id.slice(0,8).toUpperCase();
      await notificationService.create({
        titulo: 'Parada Realizada',
        mensagem: `O motorista confirmou uma parada na OS #${osNumero}`,
        tipo: 'info',
        user_id: ordem.empresa_id,
        link: `/ordens` // Admin/Operador can see
      });

      showToast('Parada confirmada!', 'success');
      onUpdate();
    } catch (err) {
       console.error(err);
       showToast('Erro ao confirmar parada', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
       {/* ESQUERDA: INFOS E BOTÕES */}
       <div className="space-y-8">
          <div className="bg-zinc-900/50 rounded-[40px] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1 italic">Atendimento em Curso</h3>
                  <h2 className="text-3xl font-black text-white italic">OS #{ordem.numero_os || ordem.id.slice(0,8).toUpperCase()}</h2>
                </div>
                <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ordem.status}</span>
                </div>
             </div>

             <div className="space-y-6 mb-10">
                <div className="flex gap-6 items-start">
                   <div className="w-1 bg-zinc-800 h-16 rounded-full relative mt-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border-4 border-zinc-900"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-green-500 border-4 border-zinc-900"></div>
                   </div>
                   <div className="space-y-4 flex-1">
                      <div>
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Ponto de Partida</p>
                         <p className="text-white font-bold leading-tight">{ordem.origem}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Destino Final</p>
                         <p className="text-white font-bold leading-tight">{ordem.destino}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => !ordem.horario_inicio && handleStatusChange('horario_inicio')}
                  disabled={!!ordem.horario_inicio || loading === 'horario_inicio'}
                  className={`py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${ordem.horario_inicio ? 'bg-zinc-800 text-zinc-500 border border-white/5 opacity-60' : 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95'}`}
                >
                   {loading === 'horario_inicio' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                   {ordem.horario_inicio ? `Iniciado às ${format(parseISO(ordem.horario_inicio), 'HH:mm')}` : 'Check-in Partida'}
                </button>
                <button 
                  onClick={() => !ordem.horario_fim && handleStatusChange('horario_fim')}
                  disabled={!ordem.horario_inicio || !!ordem.horario_fim || loading === 'horario_fim'}
                  className={`py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${ordem.horario_fim ? 'bg-zinc-800 text-zinc-500 border border-white/5 opacity-60' : !ordem.horario_inicio ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-30' : 'bg-white text-zinc-950 shadow-xl shadow-white/5 active:scale-95'}`}
                >
                   {loading === 'horario_fim' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                   {ordem.horario_fim ? `Finalizado às ${format(parseISO(ordem.horario_fim), 'HH:mm')}` : 'Finalizar Viagem'}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <button className="bg-zinc-900/40 p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all flex flex-col items-center gap-3 group">
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-primary transition-colors">
                   <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Chat</span>
             </button>
             <button className="bg-zinc-900/40 p-6 rounded-3xl border border-white/5 hover:border-red-500/20 transition-all flex flex-col items-center gap-3 group">
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-red-500 transition-colors">
                   <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pânico</span>
             </button>
             <a 
               href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ordem.destino)}`} 
               target="_blank" 
               rel="noreferrer"
               className="bg-zinc-900/40 p-6 rounded-3xl border border-white/5 hover:border-blue-500/20 transition-all flex flex-col items-center gap-3 group"
             >
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-blue-500 transition-colors">
                   <Navigation className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">GPS</span>
             </a>
          </div>
       </div>

       {/* DIREITA: ITINERÁRIO E PARADAS */}
       <div className="space-y-6">
          <div className="bg-zinc-900/40 rounded-[40px] p-8 md:p-12 border border-white/5 h-full relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
                <MapPin className="w-10 h-10 text-primary/10" />
             </div>
             <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10">Cronograma de Paradas</h3>

             <div className="space-y-8">
                {ordem.paradas?.map((parada: any, idx: number) => (
                   <div key={parada.id} className="flex gap-6 items-start group">
                      <div className="flex flex-col items-center">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${parada.realizada ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-zinc-800 text-zinc-500 border border-white/5 group-hover:border-primary/30'}`}>
                            {parada.realizada ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                         </div>
                         {idx < (ordem.paradas?.length || 0) - 1 && (
                            <div className="w-1 bg-zinc-800 h-10 rounded-full my-2"></div>
                         )}
                      </div>
                      <div className="flex-1 bg-zinc-950/30 rounded-2xl p-6 border border-white/5 group-hover:bg-zinc-950/50 transition-all flex items-center justify-between gap-4">
                         <div>
                            <p className="text-white font-bold leading-tight">{parada.endereco_ponto}</p>
                            {parada.realizada && parada.horario_realizado && (
                               <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> Realizado às {format(parseISO(parada.horario_realizado), 'HH:mm')}
                               </p>
                            )}
                         </div>
                         {!parada.realizada && (
                            <button 
                              onClick={() => handleCheckinParada(parada.id)}
                              disabled={loading === parada.id}
                              className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                            >
                               {loading === parada.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                            </button>
                         )}
                      </div>
                   </div>
                ))}

                {!ordem.paradas || ordem.paradas.length === 0 && (
                   <div className="py-20 text-center opacity-40 grayscale">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Nenhuma parada intermediária agendada</p>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

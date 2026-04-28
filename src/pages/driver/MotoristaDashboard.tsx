import { useState, useEffect } from 'react';
import { LogOut, MapPin, CheckCircle, Clock, Loader2, Route, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

type Parada = {
  id: string;
  endereco_ponto: string;
  horario_previsto: string | null;
  observacoes: string | null;
  ordem_parada: number;
  realizada: boolean;
  horario_realizado: string | null;
};

type Ordem = {
  id: string;
  numero_os: string | null;
  origem: string;
  destino: string;
  status: string;
  data_execucao: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  passageiro: string | null;
  empresa: { razao_social: string } | null;
  paradas?: Parada[];
  valor_custo_motorista?: number;
  motorista_tipo_vinculo?: string;
};

export default function MotoristaDashboard() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [motoristaId, setMotoristaId] = useState<string | null>(null);
  const [tipoVinculo, setTipoVinculo] = useState<string | null>(null);
  const [selectedOrdem, setSelectedOrdem] = useState<Ordem | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadMotorista();
  }, [user?.id]);

  const loadMotorista = async () => {
    if (!user?.id) return;
    // Busca o motorista pelo perfil_id
    const { data: motorista } = await supabase
      .from('motoristas')
      .select('id, tipo_vinculo')
      .eq('perfil_id', user.id)
      .maybeSingle();

    if (motorista) {
      setMotoristaId(motorista.id);
      setTipoVinculo(motorista.tipo_vinculo);
      await loadOrdens(motorista.id, motorista.tipo_vinculo);
    }
    setIsLoading(false);
  };

  const loadOrdens = async (mId: string, currentTipoVinculo: string) => {
    const { data } = await supabase
      .from('ordens_servico')
      .select(`
        id, numero_os, origem, destino, status, data_execucao,
        horario_inicio, horario_fim, passageiro, valor_custo_motorista,
        empresa:empresas!empresa_id(razao_social)
      `)
      .eq('motorista_id', mId)
      .in('status', ['pendente', 'em_andamento'])
      .order('data_execucao', { ascending: true });
    
    // Anexa o tipo de vinculo para facilitar no render, ou você pode colocar no state
    const ordensData = (data as unknown as Ordem[] || []).map(o => ({ ...o, motorista_tipo_vinculo: currentTipoVinculo }));
    setOrdens(ordensData);
  };

  const loadParadas = async (ordemId: string) => {
    const { data } = await supabase
      .from('ordem_servico_paradas')
      .select('*')
      .eq('ordem_id', ordemId)
      .order('ordem_parada', { ascending: true });
    return (data as Parada[]) || [];
  };

  const openOrdem = async (ordem: Ordem) => {
    const paradas = await loadParadas(ordem.id);
    setSelectedOrdem({ ...ordem, paradas });
  };

  const handleCheckin = async (paradaId: string, ordemId: string) => {
    setCheckingIn(paradaId);
    const agora = new Date().toISOString();
    await supabase
      .from('ordem_servico_paradas')
      .update({ realizada: true, horario_realizado: agora })
      .eq('id', paradaId);

    // Recarrega paradas
    const paradas = await loadParadas(ordemId);
    if (selectedOrdem) setSelectedOrdem({ ...selectedOrdem, paradas });
    motoristaId && tipoVinculo && (await loadOrdens(motoristaId, tipoVinculo));
    setCheckingIn(null);
  };

  const handleCheckinOS = async (ordemId: string, campo: 'horario_inicio' | 'horario_fim') => {
    const agora = new Date().toISOString();
    await supabase.from('ordens_servico').update({ [campo]: agora }).eq('id', ordemId);
    motoristaId && tipoVinculo && (await loadOrdens(motoristaId, tipoVinculo));
    if (selectedOrdem) {
      setSelectedOrdem({ ...selectedOrdem, [campo]: agora });
    }
  };

  const statusColor: Record<string, string> = {
    pendente: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    em_andamento: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    concluido: 'text-green-400 bg-green-400/10 border-green-400/20',
    cancelado: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!motoristaId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-6">
          <Route className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Perfil não vinculado</h1>
        <p className="text-zinc-500 max-w-sm">
          Seu cadastro ainda não foi vinculado a um motorista. Aguarde a aprovação do administrador.
        </p>
        <button onClick={() => signOut().then(() => navigate('/motorista/login'))}
          className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-primary uppercase tracking-widest transition">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-xs font-black text-white">RM</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Portal do Motorista</p>
            <p className="text-xs font-bold text-white">{user?.email}</p>
          </div>
        </div>
        <button onClick={() => signOut().then(() => navigate('/motorista/login'))}
          className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-primary uppercase tracking-widest transition">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Detail Panel */}
      {selectedOrdem ? (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <button onClick={() => setSelectedOrdem(null)}
            className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition">
            ← Voltar às Ordens
          </button>

          {/* OS Header */}
          <div className="bg-zinc-900/60 rounded-3xl p-6 border border-white/5">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
              OS #{selectedOrdem.numero_os || selectedOrdem.id.slice(0, 8).toUpperCase()}
            </p>
            <h2 className="text-xl font-black text-white mb-1">
              {selectedOrdem.origem} <span className="text-primary">→</span> {selectedOrdem.destino}
            </h2>
            <p className="text-zinc-500 text-sm">{selectedOrdem.empresa?.razao_social}</p>
            <p className="text-zinc-500 text-xs mt-1">
              {selectedOrdem.passageiro && `Passageiro: ${selectedOrdem.passageiro}`}
            </p>
            {selectedOrdem.motorista_tipo_vinculo === 'terceiro' && selectedOrdem.valor_custo_motorista ? (
              <div className="mt-4 inline-block bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">💰 Repasse dessa OS</p>
                <p className="text-orange-300 font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrdem.valor_custo_motorista)}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => !selectedOrdem.horario_inicio && handleCheckinOS(selectedOrdem.id, 'horario_inicio')}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${
                  selectedOrdem.horario_inicio
                    ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                    : 'bg-primary hover:bg-red-700 text-white'
                }`}>
                <CheckCircle className="w-4 h-4" />
                {selectedOrdem.horario_inicio
                  ? `Check-in ${format(parseISO(selectedOrdem.horario_inicio), 'HH:mm')}`
                  : 'Fazer Check-in'}
              </button>
              <button
                onClick={() => selectedOrdem.horario_inicio && !selectedOrdem.horario_fim && handleCheckinOS(selectedOrdem.id, 'horario_fim')}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${
                  selectedOrdem.horario_fim
                    ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                    : !selectedOrdem.horario_inicio
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}>
                <Clock className="w-4 h-4" />
                {selectedOrdem.horario_fim
                  ? `Check-out ${format(parseISO(selectedOrdem.horario_fim), 'HH:mm')}`
                  : 'Fazer Check-out'}
              </button>
            </div>
          </div>

          {/* Paradas */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">Paradas Programadas</h3>
            <div className="space-y-3">
              {/* Ponto de Partida */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {(selectedOrdem.paradas?.length ?? 0) > 0 && <div className="w-0.5 h-6 bg-zinc-700 my-1" />}
                </div>
                <div className="flex-1 bg-zinc-900/40 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Partida</p>
                  <p className="text-white font-bold">{selectedOrdem.origem}</p>
                </div>
              </div>

              {selectedOrdem.paradas?.map((parada, idx) => (
                <div key={parada.id} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${parada.realizada ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {parada.realizada ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < (selectedOrdem.paradas?.length ?? 1) - 1 && <div className="w-0.5 h-6 bg-zinc-700 my-1" />}
                  </div>
                  <div className="flex-1 bg-zinc-900/40 rounded-2xl p-4 border border-white/5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-white font-bold text-sm">{parada.endereco_ponto}</p>
                        {parada.horario_previsto && (
                          <p className="text-zinc-500 text-xs mt-0.5">
                            Prev: {format(parseISO(parada.horario_previsto), 'HH:mm', { locale: ptBR })}
                          </p>
                        )}
                        {parada.observacoes && (
                          <p className="text-zinc-400 text-xs italic mt-1">{parada.observacoes}</p>
                        )}
                        {parada.realizada && parada.horario_realizado && (
                          <p className="text-green-500 text-xs mt-1 font-bold">
                            ✓ Realizada às {format(parseISO(parada.horario_realizado), 'HH:mm')}
                          </p>
                        )}
                      </div>
                      {!parada.realizada && (
                        <button
                          onClick={() => handleCheckin(parada.id, selectedOrdem.id)}
                          disabled={checkingIn === parada.id}
                          className="flex-shrink-0 bg-primary hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition active:scale-95 disabled:opacity-50">
                          {checkingIn === parada.id ? '...' : 'Check-in'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Destino final */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-zinc-900/40 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Destino</p>
                  <p className="text-white font-bold">{selectedOrdem.destino}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lista de Ordens */
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="pt-4">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Minhas Corridas</h1>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold text-xs">
              {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {ordens.length === 0 ? (
            <div className="py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
              <Route className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-600 uppercase tracking-widest font-bold text-[10px]">Nenhuma corrida ativa</p>
            </div>
          ) : (
            ordens.map(ordem => (
              <button key={ordem.id} onClick={() => openOrdem(ordem)}
                className="w-full text-left bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:border-primary/30 hover:bg-zinc-900/60 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${statusColor[ordem.status]}`}>
                        {ordem.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-600 font-mono">
                        #{ordem.numero_os || ordem.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {ordem.origem} <span className="text-primary text-base">→</span> {ordem.destino}
                    </p>
                    {ordem.passageiro && (
                      <p className="text-zinc-500 text-xs mt-1">{ordem.passageiro}</p>
                    )}
                    {ordem.motorista_tipo_vinculo === 'terceiro' && ordem.valor_custo_motorista && (
                      <p className="text-orange-400 font-bold text-xs mt-1">
                        Repasse: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_custo_motorista)}
                      </p>
                    )}
                    <p className="text-zinc-600 text-xs mt-2">
                      {format(parseISO(ordem.data_execucao), "dd/MM · HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-primary transition mt-1" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

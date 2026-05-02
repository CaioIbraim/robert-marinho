import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  Car,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Navigation,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { notificationService } from '../../services/notifications.service';
import { showToast } from '../../utils/swal';
import { useSystem } from '../../context/SystemContext';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getTimeLabel = (timestamp?: string | null) => {
  if (!timestamp) return '--:--';
  const t = timestamp.includes('T') ? timestamp.split('T')[1] : timestamp;
  return t.slice(0, 5);
};

const parseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  try {
    return parseISO(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const MotoristaOrdemDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { perfil, isLoading: isPerfilLoading } = useSystem();

  const [ordem, setOrdem] = useState<any | null>(null);
  const [_motorista, setMotorista] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cienciaConfirmada, setCienciaConfirmada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guards ──────────────────────────────
  useEffect(() => {
    if (isPerfilLoading) return;

    // 1. Não logado → login do motorista
    if (!perfil) {
      navigate('/motorista/login', { replace: true });
      return;
    }

    // 2. Role errada → login do motorista
    if (perfil.role !== 'motorista') {
      navigate('/motorista/login', { replace: true });
      return;
    }

    // 3. Perfil pendente de aprovação → aguardando aprovação
    if (perfil.aprovado_operador === false) {
      navigate('/aguardando-aprovacao', { replace: true });
    }
  }, [perfil, isPerfilLoading, navigate]);

  // ── Fetch da OS e do motorista vinculado ────
  useEffect(() => {
    if (!id || !perfil?.id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Buscar o motorista vinculado ao perfil atual
        const { data: motoristaData, error: mErr } = await supabase
          .from('motoristas')
          .select('*')
          .eq('perfil_id', perfil.id)
          .maybeSingle();

        if (mErr || !motoristaData) {
          setError('Seu perfil de motorista não foi encontrado no sistema.');
          setIsLoading(false);
          return;
        }
        setMotorista(motoristaData);

        // 2. Buscar a OS
        const { data: ordemData, error: oErr } = await supabase
          .from('ordens_servico')
          .select(`
            *,
            empresa:empresas(*),
            veiculo:veiculos(*),
            paradas:ordem_servico_paradas(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (oErr || !ordemData) {
          setError('Ordem de serviço não encontrada.');
          setIsLoading(false);
          return;
        }

        // 3. Verificar se a OS pertence ao motorista
        if (ordemData.motorista_id !== motoristaData.id) {
          setError('Você não tem permissão para acessar esta ordem de serviço.');
          setIsLoading(false);
          return;
        }

        setOrdem(ordemData);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar a ordem de serviço.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, perfil?.id]);

  // ── Confirmar ciência ────────────────────────
  const handleConfirmarCiencia = async () => {
    if (!ordem || !perfil) return;
    setIsConfirming(true);

    try {
      const osNumero = ordem.numero_os || ordem.id.slice(0, 8).toUpperCase();

      await notificationService.create({
        titulo: '✅ Ciência Confirmada pelo Motorista',
        mensagem: `O motorista ${perfil.full_name} confirmou o recebimento e ciência da OS #${osNumero} (${ordem.origem} → ${ordem.destino}).`,
        tipo: 'success',
        user_id: 'broadcast', // Notifica admins/operadores
        link: `/operador/ordens/${ordem.id}`,
      });

      setCienciaConfirmada(true);
      showToast('Ciência confirmada! Redirecionando...', 'success');

      setTimeout(() => {
        navigate('/motorista/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast('Erro ao confirmar ciência. Tente novamente.', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Computed: bloqueios de data ──────────────
  const dataExecucao = parseDate(ordem?.data_execucao);
  const isExecucaoHoje = dataExecucao ? isToday(dataExecucao) : false;
  const isExecucaoFutura = dataExecucao ? isBefore(new Date(), startOfDay(dataExecucao)) : false;
  const checkinBloqueado = !isExecucaoHoje; // Check-in liberado apenas na data de execução
  const isOSFinalizada = ordem?.status === 'concluido' || ordem?.status === 'cancelado';

  // ── Status badge ─────────────────────────────
  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; color: string; dot: string }> = {
      pendente:     { label: 'Aguardando',    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  dot: 'bg-amber-400' },
      em_andamento: { label: 'Em Andamento',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',    dot: 'bg-blue-400 animate-pulse' },
      concluido:    { label: 'Concluída',     color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
      cancelado:    { label: 'Cancelada',     color: 'text-red-400 bg-red-400/10 border-red-400/20',       dot: 'bg-red-400' },
    };
    return map[status] || map['pendente'];
  };

  // ── Loading state ────────────────────────────
  if (isPerfilLoading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">
            Carregando Ordem de Serviço...
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">
          Acesso Negado
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mb-8">{error}</p>
        <button
          onClick={() => navigate('/motorista/dashboard')}
          className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!ordem) return null;

  const statusConfig = getStatusConfig(ordem.status);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-primary/30">
      {/* ── Header ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/motorista/dashboard')}
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white border border-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">
              Ordem de Serviço
            </p>
            <h1 className="text-lg font-black text-white italic uppercase">
              OS #{ordem.numero_os || ordem.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${statusConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* ── Itinerário Card ───────────────── */}
        <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-8">
            Itinerário Completo
          </p>

          <div className="flex gap-6 items-stretch">
            {/* Timeline */}
            <div className="flex flex-col items-center pt-1">
              <div className="w-4 h-4 rounded-full bg-red-500 border-4 border-zinc-900 flex-shrink-0" />
              <div className="flex-1 w-0.5 bg-gradient-to-b from-red-500/50 to-emerald-500/50 my-2 min-h-[3rem]" />
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-zinc-900 flex-shrink-0" />
            </div>

            {/* Addresses */}
            <div className="flex flex-col gap-6 flex-1">
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Origem</p>
                <p className="text-white font-bold text-lg leading-tight">{ordem.origem}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Destino</p>
                <p className="text-white font-bold text-lg leading-tight">{ordem.destino}</p>
              </div>
            </div>

            {/* Navigate CTA */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ordem.destino)}`}
              target="_blank"
              rel="noreferrer"
              className="self-end mb-1 w-12 h-12 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 transition-all hover:scale-105"
              title="Abrir no Google Maps"
            >
              <Navigation className="w-5 h-5" />
            </a>
          </div>

          {/* Stops preview */}
          {ordem.paradas?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">
                {ordem.paradas.length} paradas intermediárias
              </p>
              {ordem.paradas.map((p: any, i: number) => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/5 text-zinc-500 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{p.endereco_ponto}</p>
                    {p.horario_previsto && (
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Previsto: {getTimeLabel(p.horario_previsto)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Detalhes da OS ───────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              icon: <Calendar className="w-5 h-5" />,
              label: 'Data Execução',
              value: dataExecucao
                ? format(dataExecucao, "dd 'de' MMM", { locale: ptBR })
                : '---',
              highlight: isExecucaoHoje,
            },
            {
              icon: <Clock className="w-5 h-5" />,
              label: 'Horário',
              value: getTimeLabel(ordem.horario_inicio) !== '--:--'
                ? getTimeLabel(ordem.horario_inicio)
                : dataExecucao
                  ? format(dataExecucao, 'HH:mm')
                  : '---',
            },
            {
              icon: <User className="w-5 h-5" />,
              label: 'Passageiro',
              value: ordem.passageiro || 'Não informado',
            },
            {
              icon: <Car className="w-5 h-5" />,
              label: 'Veículo',
              value: ordem.veiculo
                ? `${ordem.veiculo.placa} · ${ordem.veiculo.modelo}`
                : '---',
            },
            {
              icon: <Building2 className="w-5 h-5" />,
              label: 'Empresa',
              value: ordem.empresa?.razao_social || '---',
              colSpan: 2,
            },
            {
              icon: <MapPin className="w-5 h-5" />,
              label: 'Voucher',
              value: ordem.voucher || 'Sem voucher',
              colSpan: 2,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-zinc-900/40 rounded-2xl p-5 border transition-all ${
                item.highlight
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-white/5'
              } ${(item as any).colSpan === 2 ? 'col-span-2' : ''}`}
            >
              <div className={`mb-2 ${item.highlight ? 'text-primary' : 'text-zinc-600'}`}>
                {item.icon}
              </div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className={`font-bold text-sm leading-tight ${item.highlight ? 'text-primary' : 'text-white'}`}>
                {item.value}
              </p>
              {item.label === 'Data Execução' && isExecucaoHoje && (
                <span className="mt-1 inline-block text-[9px] font-black uppercase text-primary tracking-widest">
                  Hoje ✓
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Observações ──────────────────── */}
        {ordem.observacoes_gerais && (
          <div className="bg-zinc-900/40 rounded-[2rem] border border-white/5 p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3">
              Observações Gerais
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed">{ordem.observacoes_gerais}</p>
          </div>
        )}

        {/* ── CTA: Confirmar Ciência ────────── */}
        {!isOSFinalizada && (
          <div className="bg-zinc-900/60 rounded-[2.5rem] border border-white/5 p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-tight text-lg">
                  Confirmar Ciência
                </h3>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                  Ao confirmar, você declara estar ciente desta OS e de todas as suas condições. O operador será notificado.
                </p>
              </div>
            </div>

            {cienciaConfirmada ? (
              <div className="flex items-center gap-3 py-5 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[11px]">
                    Ciência Confirmada!
                  </p>
                  <p className="text-zinc-500 text-xs">Redirecionando para o dashboard...</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConfirmarCiencia}
                disabled={isConfirming}
                className="w-full py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isConfirming ? 'Confirmando...' : 'Confirmar Recebimento e Ciência'}
              </button>
            )}
          </div>
        )}

        {/* ── Aviso de check-in bloqueado ───── */}
        {!isOSFinalizada && (
          <div className={`rounded-[2rem] border p-6 flex items-start gap-4 ${
            isExecucaoHoje
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-zinc-800/30 border-white/5'
          }`}>
            {isExecucaoHoje ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : checkinBloqueado ? (
              <Lock className="w-6 h-6 text-zinc-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-black uppercase tracking-widest text-[11px] mb-1 ${
                isExecucaoHoje ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {isExecucaoHoje
                  ? 'Check-in disponível hoje!'
                  : isExecucaoFutura
                    ? 'Check-in ainda não liberado'
                    : 'Data de execução passou'}
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {isExecucaoHoje
                  ? 'O check-in pode ser realizado no painel de operação.'
                  : isExecucaoFutura
                    ? `O check-in só será liberado em ${dataExecucao ? format(dataExecucao, "dd/MM/yyyy", { locale: ptBR }) : '---'}.`
                    : 'Entre em contato com a base para regularizar esta OS.'}
              </p>
              {isExecucaoHoje && (
                <button
                  onClick={() => navigate('/motorista/dashboard')}
                  className="mt-4 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all flex items-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Ir para Operação
                </button>
              )}
            </div>
          </div>
        )}

        {/* OS Finalizada banner */}
        {isOSFinalizada && (
          <div className={`rounded-[2rem] border p-6 flex items-center gap-4 ${
            ordem.status === 'concluido'
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <CheckCircle className={`w-8 h-8 ${ordem.status === 'concluido' ? 'text-emerald-400' : 'text-red-400'}`} />
            <div>
              <p className={`font-black uppercase tracking-widest text-[11px] ${
                ordem.status === 'concluido' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {ordem.status === 'concluido' ? 'OS Concluída' : 'OS Cancelada'}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                {ordem.status === 'concluido' ? 'Esta viagem foi finalizada com sucesso.' : 'Esta ordem de serviço foi cancelada.'}
              </p>
            </div>
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
};

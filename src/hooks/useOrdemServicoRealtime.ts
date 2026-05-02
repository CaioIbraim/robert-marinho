/**
 * useOrdemServicoRealtime
 *
 * Hook universal que escuta mudanças em `ordens_servico` via:
 * 1. Supabase Realtime (postgres_changes) — imediato quando habilitado no projeto
 * 2. Polling a cada 5s como fallback robusto
 *
 * Chame `onUpdate` passando qualquer callback (loadData / refetch / etc.)
 * Opcionalmente passe `onDriverAction` para receber eventos específicos de check-in/checkout
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface OrdemServicoRealtimeOptions {
  /** Chamado toda vez que qualquer OS é inserida ou atualizada */
  onUpdate: () => void;
  /**
   * Chamado quando o motorista faz check-in (horario_inicio) ou check-out (horario_fim).
   * Recebe o payload da OS atualizada para montar o alerta.
   */
  onDriverAction?: (payload: {
    type: 'checkin' | 'checkout' | 'assigned';
    ordem: any;
  }) => void;
  /** ID do canal Supabase — use um único por instância para evitar duplicatas */
  channelId?: string;
  /** Intervalo do polling em ms (padrão: 5000) */
  pollInterval?: number;
}

export const useOrdemServicoRealtime = ({
  onUpdate,
  onDriverAction,
  channelId = 'ordens-realtime',
  pollInterval = 5000,
}: OrdemServicoRealtimeOptions) => {
  // Refs para comparar o hash das últimas OS e evitar renders desnecessários
  const lastHashRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const onDriverActionRef = useRef(onDriverAction);

  // Mantém as refs sempre atualizadas sem re-criar efeitos
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onDriverActionRef.current = onDriverAction; }, [onDriverAction]);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval>;
    let isActive = true;

    // ─── 1. Supabase Realtime via postgres_changes ────────────────────────
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordens_servico' },
        () => {
          if (!isActive) return;
          poll(); // Executa o poll imediatamente quando algo muda, garantindo a comparação correta do status
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Realtime] Canal ordens_servico inscrito com sucesso.');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] Canal com problema, fallback polling ativo.');
        }
      });

    // ─── 2. Polling Fallback ──────────────────────────────────────────────
    // Verifica mudanças reais comparando um hash do updated_at mais recente
    const poll = async () => {
      if (!isActive) return;
      try {
        const { data, error } = await supabase
          .from('ordens_servico')
          .select('id, updated_at, horario_inicio, horario_fim, status, motorista_id, empresa_id, numero_os, motorista:motoristas(nome)')
          .order('updated_at', { ascending: false })
          .limit(20);

        if (error || !data || !isActive) return;

        const hash = data.map(o => `${o.id}:${o.updated_at}:${o.status}:${o.motorista_id || 'null'}`).join('|');

        if (hash !== lastHashRef.current) {
          const prev = lastHashRef.current;
          lastHashRef.current = hash;

          // Só chama onUpdate se já tivemos um hash anterior (não é o primeiro load)
          if (prev !== '') {
            // Detecta ações de motorista comparando registros
            if (onDriverActionRef.current && prev) {
              const prevIds = new Map(
                prev.split('|').map(s => {
                  const [id, , status, motoristaId] = s.split(':');
                  return [id, { status, motoristaId }];
                })
              );
              data.forEach(o => {
                const prevData = prevIds.get(o.id);
                if (prevData && prevData.status !== o.status) {
                  if (o.status === 'em_andamento') {
                    onDriverActionRef.current!({ type: 'checkin', ordem: o });
                  } else if (o.status === 'concluido') {
                    onDriverActionRef.current!({ type: 'checkout', ordem: o });
                  }
                }
                if (prevData && prevData.motoristaId !== String(o.motorista_id || 'null') && o.motorista_id) {
                  onDriverActionRef.current!({ type: 'assigned', ordem: o });
                }
              });
            }
            onUpdateRef.current();
          } else {
            // Primeiro load — apenas registra o hash sem disparar update
            lastHashRef.current = hash;
          }
        }
      } catch {
        // silencioso — polling continuará na próxima iteração
      }
    };

    // Inicializa o hash na montagem
    poll();
    pollTimer = setInterval(poll, pollInterval);

    return () => {
      isActive = false;
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [channelId, pollInterval]);
};

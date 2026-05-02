import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

interface OrdemServicoRealtimeOptions {
  onUpdate: () => void;
  onDriverAction?: (payload: {
    type: 'checkin' | 'checkout' | 'assigned';
    ordem: any;
  }) => void;
  channelId?: string;
  pollInterval?: number;
  empresaId?: string;
  motoristaId?: string;
  requireFilter?: boolean;
}

export const useOrdemServicoRealtime = ({
  onUpdate,
  onDriverAction,
  channelId = 'ordens-realtime',
  pollInterval = 5000,
  empresaId,
  motoristaId,
  requireFilter = false,
}: OrdemServicoRealtimeOptions) => {
  const lastStateRef = useRef<Record<string, string>>({});
  const hasLoadedOnceRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const onDriverActionRef = useRef(onDriverAction);

  // Mantém um ID único ESTÁVEL para esta instância do hook
  const uniqueId = useMemo(() => {
    return `${channelId}_${Math.random().toString(36).substring(7)}`;
  }, [channelId]);

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onDriverActionRef.current = onDriverAction; }, [onDriverAction]);

  useEffect(() => {
    let isActive = true;
    let pollTimer: ReturnType<typeof setInterval>;
    let channel: any = null;

    // Resetar estado local apenas se os IDs mudarem significativamente
    lastStateRef.current = {};
    hasLoadedOnceRef.current = false;

    const poll = async () => {
      if (!isActive) return;

      try {
        let query = supabase
          .from('ordens_servico')
          .select('id, updated_at, horario_inicio, horario_fim, status, motorista_id, empresa_id, numero_os, motorista:motoristas(nome)')
          .order('updated_at', { ascending: false });

        if (empresaId) query = query.eq('empresa_id', empresaId);
        if (motoristaId) query = query.eq('motorista_id', motoristaId);

        // Segurança: Se filtro é obrigatório mas não temos IDs, não buscamos nada
        if (requireFilter && !empresaId && !motoristaId) {
           hasLoadedOnceRef.current = true;
           return;
        }

        const { data, error } = await query.limit(50);
        if (error || !data || !isActive) return;

        const currentState: Record<string, string> = {};
        data.forEach(o => {
          currentState[o.id] = JSON.stringify({
            status: o.status,
            motoristaId: String(o.motorista_id || 'null'),
            updated_at: o.updated_at,
            horario_inicio: o.horario_inicio,
            horario_fim: o.horario_fim
          });
        });

        if (hasLoadedOnceRef.current) {
          let hasChange = false;
          
          data.forEach(o => {
            const prevJson = lastStateRef.current[o.id];
            if (prevJson) {
              const prev = JSON.parse(prevJson);
              const currentMId = String(o.motorista_id || 'null');
              
              if (prev.status !== o.status) {
                hasChange = true;
                if (onDriverActionRef.current) {
                  if (o.status === 'em_andamento') onDriverActionRef.current({ type: 'checkin', ordem: o });
                  else if (o.status === 'concluido') onDriverActionRef.current({ type: 'checkout', ordem: o });
                }
              }
              if (prev.motoristaId === 'null' && currentMId !== 'null') {
                hasChange = true;
                if (onDriverActionRef.current) onDriverActionRef.current({ type: 'assigned', ordem: o });
              }
              if (!hasChange && prevJson !== currentState[o.id]) {
                hasChange = true;
              }
            } else {
              hasChange = true;
            }
          });

          if (!hasChange && Object.keys(lastStateRef.current).length !== data.length) {
            hasChange = true;
          }

          if (hasChange) {
            onUpdateRef.current();
          }
        }

        lastStateRef.current = currentState;
        hasLoadedOnceRef.current = true;
      } catch (err) { }
    };

    // Subscrição Supabase Realtime
    channel = supabase.channel(uniqueId);

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, () => {
         if (isActive) setTimeout(poll, 801); // Delay levemente diferente para evitar hits simultâneos
      })
      .subscribe();

    // Listener de Eventos Locais (Broadcast interno do navegador)
    const handleLocalUpdate = () => { if (isActive) poll(); };
    window.addEventListener('rm_updateData', handleLocalUpdate);

    poll();
    pollTimer = setInterval(poll, pollInterval);

    return () => {
      isActive = false;
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('rm_updateData', handleLocalUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [uniqueId, pollInterval, empresaId, motoristaId, requireFilter]);
};

import { useEffect } from 'react';
import { supabase, systemChannel } from '../lib/supabaseClient';
import { showToast } from '../utils/swal';

export const useRealtimeNotifications = (onNewNotification?: () => void) => {
  useEffect(() => {
    let isActive = true;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const role = user.user_metadata?.role;

      // 1. WebSocket via Supabase Broadcast (rápido se habilitado no Dashboard)
      systemChannel
        .on(
          'broadcast',
          { event: 'new_notification' },
          (payload) => {
            if (!isActive) return;
            const newNotif = payload.payload as any;
            
            if (newNotif.user_id && newNotif.user_id !== user.id && role !== 'admin' && role !== 'operador') return;

            if (newNotif.tipo === 'success') showToast(newNotif.mensagem, 'success');
            else if (newNotif.tipo === 'error') showToast(newNotif.mensagem, 'error');
            else if (newNotif.tipo === 'warning') showToast(newNotif.mensagem, 'warning');
            else showToast(newNotif.mensagem, 'info');

            if (onNewNotification) onNewNotification();
            document.dispatchEvent(new CustomEvent('rm_updateData'));
          }
        )
        .subscribe();

      // 2. Polling Fallback Robusto (Sem dependência do relógio local/DB estrito)
      const shownNotifs = new Set<string>();
      const hookStartTime = new Date();
      hookStartTime.setMinutes(hookStartTime.getMinutes() - 1);
      const baselineTime = hookStartTime.toISOString();
      
      const interval = setInterval(async () => {
        if (!isActive) return;
        
        try {
          let query = supabase.from('notificacoes')
            .select('*')
            .eq('lida', false)
            .gt('created_at', baselineTime);
            
          if (role !== 'admin' && role !== 'operador') {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
          }

          const { data, error } = await query;
          
          if (!error && data && data.length > 0) {
            let hasNew = false;
            
            data.forEach((newNotif: any) => {
               if (!shownNotifs.has(newNotif.id)) {
                 shownNotifs.add(newNotif.id);
                 hasNew = true;
                 if (newNotif.tipo === 'success') showToast(newNotif.mensagem, 'success');
                 else if (newNotif.tipo === 'error') showToast(newNotif.mensagem, 'error');
                 else if (newNotif.tipo === 'warning') showToast(newNotif.mensagem, 'warning');
                 else showToast(newNotif.mensagem, 'info');
               }
            });

            // Só recarrega os dados da tela se de fato capturou algo de verdade
            if (hasNew) {
               document.dispatchEvent(new CustomEvent('rm_updateData'));
               if (onNewNotification) onNewNotification();
            }
          }
        } catch (err) {
          // ignora erros
        }
      }, 10000); // 10 segundos

      return () => {
        clearInterval(interval);
        // systemChannel permanece disponível
      };
    };

    const cleanupPromise = setupRealtime();

    return () => {
      isActive = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [onNewNotification]);
};

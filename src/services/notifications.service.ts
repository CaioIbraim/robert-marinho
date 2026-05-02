import { supabase } from '../lib/supabaseClient';

export const notificationService = {
  /**
   * Cria uma notificação no banco e tenta disparar um broadcast via WebSocket
   */
  async create(data: {
    titulo: string;
    mensagem: string;
    tipo?: 'info' | 'success' | 'warning' | 'error';
    user_id?: string | 'broadcast';
    link?: string;
  }) {
    try {
      const targetUserId = data.user_id === 'broadcast' ? null : data.user_id;

      // 1. Persiste no banco de dados
      const { data: insertedData, error } = await supabase
        .from('notificacoes')
        .insert({
          titulo: data.titulo,
          mensagem: data.mensagem,
          tipo: data.tipo || 'info',
          user_id: targetUserId,
          link: data.link,
          lida: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { error };
      }

      // 2. Dispara Broadcast via WebSocket para ALERTA INSTANTÂNEO
      // Usamos um canal fixo 'global_notifications' para que todos os ouvintes sintonizados recebam.
      const broadcastChannel = supabase.channel('global_notifications');
      
      broadcastChannel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: insertedData
      });

      return { data: insertedData };
    } catch (err) {
      console.error('Notification Service Catch:', err);
      return { error: err };
    }
  },

  async markAsRead(id: string) {
    return await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
  },

  async markAllAsRead(userId: string) {
    return await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userId)
      .eq('lida', false);
  },

  async getUnreadCount(userId: string, role?: string) {
    let query = supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('lida', false);

    if (role === 'admin' || role === 'operador') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      query = query.eq('user_id', userId);
    }

    return await query;
  }
};

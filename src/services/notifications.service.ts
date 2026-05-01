import { supabase, systemChannel } from '../lib/supabaseClient';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationDTO {
  user_id?: string;
  titulo: string;
  mensagem: string;
  tipo?: NotificationType;
  link?: string;
}

export const notificationService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const role = user.user_metadata?.role;
    let query = supabase.from('notificacoes').select('*');

    if (role === 'admin' || role === 'operador') {
      // Admin e Operador veem todas (ou poderiam ver; mas para não poluir poderíamos apenas ver as destinadas a eles ou broadcast)
      // Vamos assumir que veem todas.
    } else {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(dto: CreateNotificationDTO) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('NotificationService: Usuário não autenticado.');
        return null;
      }

      let finalUserId: string | null = user.id;
      if (dto.user_id === 'broadcast') finalUserId = null;
      else if (dto.user_id !== undefined) finalUserId = dto.user_id;

      const notifData = {
        titulo: dto.titulo,
        mensagem: dto.mensagem,
        tipo: dto.tipo || 'info',
        link: dto.link || null,
        user_id: finalUserId,
        lida: false
      };

      const { error } = await supabase
        .from('notificacoes')
        .insert([notifData]);

      if (error) {
        console.error('NotificationService Insert Error:', error);
        return null;
      }

      // Se não tiver joined ainda, tentamos emitir de qualquer jeito 
      // ou apenas enviar (o client supabase fará queue/drop caso não aguarde o sub)
      systemChannel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notifData
      });

      return true;
    } catch (err) {
      console.error('NotificationService Catch:', err);
      return null;
    }
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userData.user.id)
      .eq('lida', false);
    
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

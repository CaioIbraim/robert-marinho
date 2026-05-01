import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Canal único global para broadcast de notificações, instanciado 1 vez por cliente
export const systemChannel = supabase.channel('system_notifications', {
  config: {
    broadcast: { self: true, ack: false },
  },
});

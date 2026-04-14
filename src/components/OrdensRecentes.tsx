import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const OrdensRecentes = () => {
  const { data } = useQuery({
    queryKey: ['ordens-recentes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ordens_servico')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      return data;
    }
  });

  return (
    <div className="space-y-3">
      {data?.map((item) => (
        <div key={item.id} className="border-b border-border pb-2">
          <p className="text-sm text-white">
            OS #{item.numero_os || item.id.slice(0, 6)}
          </p>
          <p className="text-xs text-text-muted">{item.status}</p>
        </div>
      ))}
    </div>
  );
};
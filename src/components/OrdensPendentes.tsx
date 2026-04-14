import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';


export const OrdensPendentes = () => {
  const { data } = useQuery({
    queryKey: ['ordens-pendentes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('status', 'pendente')
        .limit(5);

      return data;
    }
  });

  return (
    <div className="space-y-3">
      {data?.map((item) => (
        <div key={item.id} className="p-3 bg-border/20 rounded-lg">
          <p className="text-sm font-medium">
            OS #{item.numero_os || item.id.slice(0, 6)}
          </p>
          <p className="text-xs text-text-muted">
            {item.origem} → {item.destino}
          </p>
        </div>
      ))}
    </div>
  );
};
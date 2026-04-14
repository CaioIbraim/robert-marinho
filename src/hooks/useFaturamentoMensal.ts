// hooks/useFaturamentoMensal.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface Params {
  startDate?: string; // '2025-12-01'
  endDate?: string;   // '2026-04-30'
}

export const useFaturamentoMensal = ({ startDate, endDate }: Params) => {
  return useQuery({
    queryKey: ['faturamento-mensal', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('recebimentos')
        .select('valor, data_pagamento')
        .eq('status', 'pago');

      // 📅 aplica filtro de período
      if (startDate) query = query.gte('data_pagamento', startDate);
      if (endDate) query = query.lte('data_pagamento', endDate);

      const { data, error } = await query;

      if (error) throw error;

      const grouped: Record<string, number> = {};

      data?.forEach((item) => {
        const date = new Date(item.data_pagamento);

        // 🔥 chave única: ano + mês
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

        grouped[key] = (grouped[key] || 0) + Number(item.valor);
      });

      // 📊 ordenar cronologicamente + formatar label
      return Object.entries(grouped)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([key, valor]) => {
          const [year, month] = key.split('-');

          const label = new Date(Number(year), Number(month) - 1)
            .toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

          return {
            mes: label,
            valor: Number(valor.toFixed(2))
          };
        });
    }
  });
};
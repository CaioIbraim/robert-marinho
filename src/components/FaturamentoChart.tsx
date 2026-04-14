import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFaturamentoMensal } from '../hooks/useFaturamentoMensal';

export const FaturamentoChart = () => {
 
  const { data } = useFaturamentoMensal({
  startDate: '2025-12-01',
  endDate: '2026-04-30'
});

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="valor" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
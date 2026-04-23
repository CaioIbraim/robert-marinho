import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordemService } from '../services/ordens.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDateBR, formatDateTimeBR } from '../utils/date';
import type { OrdemServico } from '../types';
import { ArrowLeft, FileText } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { generatePaymentReceipt } from '../utils/exportRecibo';

export const OrdemDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordemService.getById(id!);
        setOrdem(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);


  const handleGenerateReceipt = async () => {
    if (!ordem) return;
    await generatePaymentReceipt(ordem, ordem.empresa);
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!ordem) return <div className="p-6">Ordem não encontrada.</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Ordem de Serviço #{ordem.numero_os || '---'}
            </h1>
            <p className="text-text-muted">
              {ordem.origem} → {ordem.destino}
            </p>
          </div>
        </div>

        {/* STATUS NO HEADER */}
        <StatusBadge status={ordem.status} className="px-3 py-1 text-xs" />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">

          {/* TRAJETO */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Trajeto</h2>
            <div className="flex items-center gap-2 text-lg">
              <span>{ordem.origem}</span>
              <span className="text-primary">→</span>
              <span>{ordem.destino}</span>
            </div>
          </Card>

          {/* CRONOGRAMA */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Cronograma</h2>
            <div className="space-y-2 text-sm">
              <p>Data: {formatDateBR(ordem.data_execucao)}</p>
              <p>Check-in: {formatDateTimeBR(ordem.horario_inicio)}</p>
              <p>Check-out: {ordem.horario_fim ? formatDateTimeBR(ordem.horario_fim) : '--'}</p>
            </div>
          </Card>

          {/* PASSAGEIRO */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Passageiro</h2>
            <p>{ordem.passageiro || '—'}</p>
            <p className="text-xs text-text-muted mt-2">
              Voucher: {ordem.voucher || '—'}
            </p>
          </Card>

        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          {/* STATUS (EXTRA) */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Status</h2>
            <StatusBadge status={ordem.status} className="px-3 py-1 text-xs" />
          </Card>

          {/* EMPRESA */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Empresa</h2>
            <p>{ordem.empresa?.razao_social}</p>
          </Card>

          {/* MOTORISTA */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Motorista</h2>
            <p>{ordem.motorista?.nome}</p>
            <p className="text-xs text-text-muted">
              {ordem.veiculo?.placa} - {ordem.veiculo?.modelo}
            </p>
          </Card>

          {/* FINANCEIRO */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Financeiro</h2>
            <p className="text-xl font-bold text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(ordem.valor_faturamento)}
            </p>

            {ordem.valor_custo_motorista && (
              <p className="text-sm text-text-muted mt-2">
                Custo: R$ {Number(ordem.valor_custo_motorista).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </p>
            )}

            {/* LUCRO */}
            {ordem.valor_custo_motorista && (
              <p className="text-sm text-blue-400 mt-2 font-semibold">
                Lucro: R$ {(ordem.valor_faturamento - ordem.valor_custo_motorista).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </p>
            )}
          </Card>

          {/* AÇÕES */}
          <Card>
            <div className="flex flex-col gap-3">
                <Button
                    onClick={handleGenerateReceipt}
                    disabled={ordem.status !== 'concluido'}
                    className="flex items-center gap-2"
                    >
                    <FileText size={16} />
                    Gerar Recibo
                </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
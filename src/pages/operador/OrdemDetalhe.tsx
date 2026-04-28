import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordemService } from '../../services/ordens.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateBR, formatDateTimeBR } from '../../utils/date';
import type { OrdemServico } from '../../types';
import { ArrowLeft, FileText, MapPin, Navigation, Clock, Calendar, Users, Car, DollarSign, TrendingUp, Info } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { generatePaymentReceipt } from '../../utils/export';
import QRCode from 'qrcode';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { showToast } from '../../utils/swal';
import { notificationService } from '../../services/notifications.service';
import Swal from 'sweetalert2';

export const OperadorOrdemDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [paradas, setParadas] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Atualiza a cada 10 segundos para precisão no faturamento dinâmico
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordemService.getById(id!);
        setOrdem(data);
        if ((data as any).paradas) setParadas((data as any).paradas);
        
        // Verificação de cancelamento automático por atraso (> 60 min)
        if (data.status === 'pendente') {
          const scheduled = parseISO(data.data_execucao);
          const now = new Date();
          const delay = differenceInMinutes(now, scheduled);
          
          if (delay > 60) {
            await ordemService.update(id!, { 
              status: 'cancelado', 
              observacoes_gerais: (data.observacoes_gerais || '') + '\n[SISTEMA] Cancelada automaticamente por atraso superior a 60 minutos no check-in.' 
            });
            showToast('Ordem cancelada automaticamente por atraso superior a 30 minutos.', 'error');
            window.location.reload();
            return;
          }
        }
        
        // Gerar QR Code PIX
        if (data) {
          const valor = Number(data.valor_faturamento || 0);
          const payloadPix = `00020126580014BR.GOV.BCB.PIX0114SUA_CHAVE_PIX520400005303986540${valor.toFixed(2)}5802BR5913ROBERT MARINHO6009SAO PAULO62070503***6304`;
          const url = await QRCode.toDataURL(payloadPix);
          setQrCodeUrl(url);
          
          // Estimar Rota
          calculateDistance(data.origem, data.destino);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const calculateDistance = async (origem: string, destino: string) => {
    try {
      setCalculatingRoute(true);
      const geocode = async (loc: string) => {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc + ', Brasil')}&format=json&limit=1`);
        const d = await r.json();
        return d && d.length > 0 ? [parseFloat(d[0].lat), parseFloat(d[0].lon)] : null;
      };

      const [c1, c2] = await Promise.all([geocode(origem), geocode(destino)]);
      if (c1 && c2) {
        // Usa a API do OSRM para calcular a distância real por ruas/rodovias
        const url = `https://router.project-osrm.org/route/v1/driving/${c1[1]},${c1[0]};${c2[1]},${c2[0]}?overview=false`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.routes && data.routes.length > 0) {
          setDistanceKm(Math.round(data.routes[0].distance / 1000));
        }
      }
    } catch (e) {
      console.warn('Erro ao calcular distância', e);
    } finally {
      setCalculatingRoute(false);
    }
  };


  const handleCheckIn = async () => {
    if (!ordem) return;
    try {
      const scheduled = parseISO(ordem.data_execucao);
      const nowRaw = new Date();
      const now = format(nowRaw, "yyyy-MM-dd'T'HH:mm:ss");
      
      let extraCharge = 0;
      let waitTimeMinutes = 0;
      
      if (nowRaw > scheduled) {
        waitTimeMinutes = differenceInMinutes(nowRaw, scheduled);
        // Comercial: 30 min de tolerância, depois R$ 100/hora (R$ 1.66 por minuto)
        if (waitTimeMinutes > 30) {
          extraCharge = (waitTimeMinutes - 30) * (100 / 60);
        }
      }

      const total = (ordem.valor_faturamento || 0) + extraCharge;

      const result = await Swal.fire({
        title: 'Confirmar Check-in',
        html: `
          <div style="text-align: left; font-size: 14px; color: #fff;">
            <p><b>📍 Agendado:</b> ${formatDateTimeBR(ordem.data_execucao)}</p>
            <p><b>⏰ Atual:</b> ${formatDateTimeBR(nowRaw)}</p>
            ${waitTimeMinutes > 0 ? `
              <div style="margin-top: 15px; padding: 10px; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 8px;">
                <p style="color: #f97316; font-weight: bold; margin-bottom: 5px;">⚠️ TEMPO DE ESPERA: ${waitTimeMinutes} min</p>
                <p><b>Tolerância:</b> 30 min</p>
                <p><b>Adicional (R$ 100/h):</b> R$ ${extraCharge.toFixed(2)}</p>
                <p><b>Novo Total:</b> R$ ${total.toFixed(2)}</p>
              </div>
            ` : '<p style="color: #22c55e; margin-top: 10px;">✅ No horário esperado.</p>'}
            <p style="margin-top: 15px; font-size: 12px; color: #999;">Deseja confirmar o início deste serviço?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Início',
        cancelButtonText: 'Cancelar',
        background: '#1a1a1a',
        confirmButtonColor: '#ff2d2d',
      });

      if (!result.isConfirmed) return;

      setUpdating(true);

      // Persiste no banco de dados
      await ordemService.update(id!, { 
        horario_inicio: now, 
        status: 'em_andamento',
        valor_faturamento: total
      });

      // Notificação de Auditoria
      if (extraCharge > 0) {
        await notificationService.create({
          titulo: `Adicional de Espera - OS #${ordem.numero_os || id?.slice(0,8)}`,
          mensagem: `Atraso de ${waitTimeMinutes} min. Adicional: R$ ${extraCharge.toFixed(2)}. Novo total: R$ ${total.toFixed(2)}.`,
          tipo: 'info',
          link: `/admin/ordens/${id}`
        });
      }

      showToast('Check-in realizado com sucesso!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao realizar check-in', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckOut = async () => {
    if (!ordem || !ordem.horario_inicio) return;
    try {
      const nowRaw = new Date();
      const now = format(nowRaw, "yyyy-MM-dd'T'HH:mm:ss");
      const duration = differenceInMinutes(nowRaw, parseISO(ordem.horario_inicio));

      const result = await Swal.fire({
        title: 'Finalizar Serviço (Check-out)',
        html: `
          <div style="text-align: left; font-size: 14px; color: #fff;">
            <p><b>🏁 Horário de Início:</b> ${formatDateTimeBR(ordem.horario_inicio)}</p>
            <p><b>⏰ Horário de Término:</b> ${formatDateTimeBR(nowRaw)}</p>
            <p style="margin-top: 10px;"><b>⏱️ Duração da Viagem:</b> ${duration} min</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">Confirmar o encerramento desta ordem de serviço?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Finalizar OS',
        cancelButtonText: 'Manter em Aberto',
        background: '#1a1a1a',
        confirmButtonColor: '#10b981',
      });

      if (!result.isConfirmed) return;

      setUpdating(true);
      await ordemService.update(id!, { horario_fim: now, status: 'concluido' });
      showToast('Serviço finalizado com sucesso!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao realizar check-out', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!ordem) return;
    await generatePaymentReceipt(ordem, ordem.empresa, paradas);
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!ordem) return <div className="p-6">Ordem não encontrada.</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-white/5">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Ordem de Serviço <span className="text-primary">#{ordem.numero_os || ordem.id.slice(0, 8)}</span>
            </h1>
            <p className="text-text-muted flex items-center gap-2">
              <Calendar size={14} /> {formatDateBR(ordem.data_execucao)} às {formatDateTimeBR(ordem.data_execucao).split(' ')[1]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex gap-2 mr-4">
              {!ordem.horario_inicio && ordem.status !== 'cancelado' && (
                <Button 
                  size="sm" 
                  onClick={handleCheckIn} 
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest px-4"
                >
                  Confirmar Check-in
                </Button>
              )}
              {ordem.horario_inicio && !ordem.horario_fim && (
                <Button 
                  size="sm" 
                  onClick={handleCheckOut} 
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest px-4"
                >
                  Finalizar (Check-out)
                </Button>
              )}
           </div>
           <div className="w-px h-8 bg-border hidden sm:block mr-2" />
           <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] text-text-muted uppercase font-black">Status da OS</span>
              <StatusBadge status={ordem.status} className="mt-1" />
           </div>
           <div className="w-px h-8 bg-border hidden sm:block" />
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-text-muted uppercase font-black text-right">Pagamento</span>
              <StatusBadge status={ordem.financeiro_status || 'pendente'} className="mt-1" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA PRINCIPAL (ESQUERDA) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TRAJETO */}
            <Card className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Navigation size={64} className="text-primary" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Rota e Trajeto
              </h2>
              <div className="space-y-6 relative">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-muted">Origem</p>
                    <p className="text-lg font-medium text-white">{ordem.origem}</p>
                  </div>
                </div>

                {/* Paradas Intermediárias */}
                {paradas.length > 0 && (
                  <div className="space-y-4 relative">
                    <div className="absolute left-[4px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-border/50" />
                    {paradas.map((p, idx) => (
                      <div key={p.id} className="flex items-start gap-3 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-blue-400">Parada {idx + 1}</p>
                          <p className="text-base font-medium text-white">{p.endereco_ponto}</p>
                          {p.horario_previsto && (
                            <p className="text-[10px] text-text-muted mt-0.5">Previsto: {formatDateTimeBR(p.horario_previsto).split(' ')[1]}</p>
                          )}
                          {p.observacoes && (
                            <p className="text-[10px] text-text-muted italic mt-0.5">"{p.observacoes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="absolute left-[4px] top-[24px] bottom-[24px] w-0.5 border-l-2 border-dashed border-border/50" />
                
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-muted">Destino</p>
                    <p className="text-lg font-medium text-white">{ordem.destino}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-muted">
                    <TrendingUp size={16} />
                    <span className="text-sm font-medium">Distância Estimada:</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {calculatingRoute ? 'Calculando...' : distanceKm ? `${distanceKm} km` : '—'}
                  </span>
                </div>
              </div>
            </Card>

            {/* CRONOGRAMA */}
            <Card className="relative group">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" /> Cronograma de Execução
              </h2>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-surface/50 border border-border flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Calendar size={18} /></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted">Agendado Para</p>
                        <p className="text-sm font-bold text-white">{formatDateTimeBR(ordem.data_execucao)}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-surface/50 border border-border">
                    <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Check-in Realizado</p>
                    {ordem.horario_inicio ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/50 font-mono uppercase">{formatDateTimeBR(ordem.horario_inicio).split(' ')[0]}</p>
                        <p className="text-xl font-black text-blue-400">{formatDateTimeBR(ordem.horario_inicio).split(' ')[1]}</p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-zinc-700">--:--</p>
                    )}
                    {(() => {
                      const scheduled = parseISO(ordem.data_execucao);
                      const now = new Date();
                      const referenceTime = ordem.horario_inicio ? parseISO(ordem.horario_inicio) : now;
                      
                      // Só mostra atraso se a OS não estiver cancelada e já passou do horário
                      if (referenceTime > scheduled && ordem.status !== 'cancelado') {
                        const wait = differenceInMinutes(referenceTime, scheduled);
                        return (
                          <div className="mt-2 text-[9px] font-black bg-orange-500/10 text-orange-500 uppercase px-2 py-0.5 rounded border border-orange-500/20 w-fit">
                            {ordem.horario_inicio ? 'Atraso Confirmado: ' : 'Atraso em Tempo Real: '} {wait} min
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="p-3 rounded-xl bg-surface/50 border border-border">
                    <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Check-out Realizado</p>
                    {ordem.horario_fim ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/50 font-mono uppercase">{formatDateTimeBR(ordem.horario_fim).split(' ')[0]}</p>
                        <p className="text-xl font-black text-emerald-400">{formatDateTimeBR(ordem.horario_fim).split(' ')[1]}</p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-zinc-700">--:--</p>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                   <Info size={16} className="text-primary" />
                   <p className="text-xs text-text-muted italic">Tempo total estimado em rota: <span className="text-white font-bold">{distanceKm ? `${Math.floor((distanceKm * 1.5) / 60)}h ${Math.round((distanceKm * 1.5) % 60)}min` : 'Calculando...'}</span></p>
                </div>
              </div>
            </Card>
          </div>

          {/* PASSAGEIRO E INFO EXTRA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="md:col-span-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={16} className="text-purple-400" /> Detalhes do Passageiro
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-xl font-bold text-text-muted">
                    {ordem.passageiro?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{ordem.passageiro || '—'}</p>
                    <p className="text-sm text-text-muted flex items-center gap-2">
                       Voucher/Cod: <span className="font-mono text-primary">{ordem.voucher || 'Sem código'}</span>
                    </p>
                  </div>
                </div>
             </Card>

             <Card className="flex flex-col items-center justify-center text-center">
                <Button 
                  onClick={handleGenerateReceipt} 
                  disabled={ordem.status !== 'concluido'}
                  className="w-full h-full flex flex-col gap-2 py-6 bg-surface border-border hover:border-primary group transition-all"
                  variant="ghost"
                >
                  <FileText size={32} className="text-text-muted group-hover:text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted group-hover:text-white">Gerar Recibo PDF</span>
                </Button>
             </Card>
          </div>
        </div>

        {/* SIDEBAR (DIREITA) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FINANCEIRO */}
          <Card className="border-l-4 border-l-emerald-500/50">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" /> Resumo Financeiro
            </h2>
            
            <div className="space-y-4">


              {typeof ordem.valor_custo_motorista === 'number' ? (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-red-400">
                    <span>REPASSE (CUSTO):</span>
                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_custo_motorista)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-blue-400 border-t border-border/50 pt-2">
                    <span>LUCRO LÍQUIDO:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_faturamento - (ordem.valor_custo_motorista || 0))}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-surface/50 border border-dashed border-border text-center">
                   <p className="text-[10px] font-bold text-text-muted uppercase">Sem dados de repasse</p>
                </div>
              )}

              {/* ADICIONAL DE ESPERA */}
              {(() => {
                const totalInDB = ordem.valor_faturamento || 0;
                const scheduled = parseISO(ordem.data_execucao);
                const referenceTime = ordem.horario_inicio ? parseISO(ordem.horario_inicio) : currentTime;

                if (referenceTime > scheduled && ordem.status !== 'cancelado') {
                   const wait = differenceInMinutes(referenceTime, scheduled);
                   
                   let baseValue = totalInDB;
                   let extraValue = 0;
                   let displayTotal = totalInDB;

                   if (ordem.horario_inicio) {
                      // Já foi gravado no banco incluindo o extra
                      // Re-calculamos a base para exibição baseada na regra de 30m
                      if (wait > 30) {
                        extraValue = (wait - 30) * (100 / 60);
                        baseValue = totalInDB - extraValue;
                      } else {
                        baseValue = totalInDB;
                        extraValue = 0;
                      }
                      displayTotal = totalInDB;
                   } else {
                      // Ainda não gravou o extra, o totalInDB é a base
                      if (wait > 30) {
                        extraValue = (wait - 30) * (100 / 60);
                      }
                      displayTotal = totalInDB + extraValue;
                   }

                   return (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2 mt-4 animate-in fade-in duration-500 relative overflow-hidden">
                           <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-orange-500">VALOR BASE:</span>
                              <span className="text-white/60">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseValue)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2">
                                 {ordem.horario_inicio ? (
                                    <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
                                 ) : (
                                    <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
                                 )}
                                 {ordem.horario_inicio ? 'Espera Confirmada' : 'Espera em Acúmulo'} ({wait} min)
                              </span>
                              <span className="text-sm font-bold text-white">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extraValue)}</span>
                           </div>
                           
                           {!ordem.horario_inicio && (
                              <div className="absolute bottom-0 left-0 h-0.5 bg-orange-500/30 w-full overflow-hidden">
                                 <div className="h-full bg-orange-500 animate-[loading_2s_linear_infinite]" style={{ width: '30%' }}></div>
                              </div>
                           )}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <span className="text-sm text-emerald-500 font-bold uppercase tracking-widest">Total Corrigido:</span>
                          <span className="text-2xl font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayTotal)}
                          </span>
                        </div>
                      </div>
                   );
                }
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted font-medium">Valor Total:</span>
                    <span className="text-2xl font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_faturamento)}
                    </span>
                  </div>
                );
              })()}

              {/* PIX QR CODE */}
              <div className="pt-4 border-t border-border mt-4 flex flex-col items-center">
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter mb-3">Escaneie para Pagar (PIX)</p>
                 <div className="p-3 bg-white rounded-xl shadow-xl">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="PIX QR Code" className="w-32 h-32" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 animate-pulse rounded-md" />
                    )}
                 </div>
                 <p className="text-[9px] text-text-muted mt-2 italic text-center">Favorecido: Robert Marinho Logística Ltda.</p>
              </div>
            </div>
          </Card>

          {/* MOTORISTA & VEÍCULO */}
          <Card className="bg-surface/30">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Car size={16} className="text-zinc-400" /> Operador do Serviço
            </h2>
            
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                 <div className="p-3 rounded-full bg-zinc-800 text-zinc-400"><Users size={20} /></div>
                 <div>
                    <p className="text-[10px] uppercase font-bold text-text-muted">Motorista</p>
                    <p className="text-base font-bold text-white">{ordem.motorista?.nome}</p>
                 </div>
              </div>

              <div className="pt-1">
                 <Button variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest border border-border hover:bg-white/5" onClick={() => navigate(`/admin/motoristas/${ordem.motorista_id}`)}>
                    Ver Perfil do Motorista
                 </Button>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-xs text-text-muted">Veículo:</span>
                   <span className="text-xs font-bold text-white font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded italic">{ordem.veiculo?.placa}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs text-text-muted">Modelo:</span>
                   <span className="text-xs font-bold text-white">{ordem.veiculo?.modelo}</span>
                 </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                 <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Info size={16} />
                 </div>
                 <p className="text-[10px] text-text-muted leading-tight">Certificado de motorista verificado e habilitado para serviço executivo.</p>
              </div>
            </div>
          </Card>

          {/* CLIENTE (EMPRESA) */}
          <Card className="border-t-4 border-t-primary">
            <h2 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4">Dados da Empresa</h2>
            <div className="space-y-4">
               <div>
                  <p className="font-black text-white text-base leading-tight uppercase">{ordem.empresa?.razao_social}</p>
                  <p className="text-xs text-text-muted mt-1 opacity-70">CNPJ: {ordem.empresa?.cnpj}</p>
               </div>
               <div className="pt-2">
                  <Button variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest border border-border hover:bg-white/5" onClick={() => navigate(`/admin/empresas/${ordem.empresa_id}`)}>
                    Ver Perfil do Cliente
                  </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
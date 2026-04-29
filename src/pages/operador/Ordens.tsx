import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Download, FileText, ChevronLeft, ChevronRight, Filter, Eye, Clock, RefreshCw } from 'lucide-react';
import { FaUsers, FaBuilding } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import type { OrdemServicoFormData } from '../../schemas';
import { ordemService } from '../../services/ordens.service';
import { empresaService } from '../../services/empresas.service';
import { motoristaService } from '../../services/motoristas.service';
import { veiculoService } from '../../services/veiculos.service';
import { tarifarioService } from '../../services/tarifarios.service';
import { notificationService } from '../../services/notifications.service';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { showToast, showConfirm } from '../../utils/swal';
import type { OrdemServico, Empresa, Motorista, Veiculo, Tarifario } from '../../types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateBR, formatDateTimeBR } from '../../utils/date';
import { exportToExcel, exportToPDF, generatePaymentReceipt } from '../../utils/export';
import { ModalOS } from '../../components/ui/ModalOS';
import { useNavigate } from 'react-router-dom';
import { QuickCreateOS } from './QuickCreateOS';


export const OperadorOrdens = () => {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [tipoMotoristaFilter, setTipoMotoristaFilter] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [ordemToConfirm, setOrdemToConfirm] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState({ forma_pagamento: 'pix', data_pagamento: new Date().toISOString().split('T')[0] });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusOrdemTarget, setStatusOrdemTarget] = useState<OrdemServico | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  // FormData para edição (passado ao ModalOS)
  const [editingFormData, setEditingFormData] = useState<OrdemServicoFormData | null>(null);

  const { setGlobalLoading } = useLoadingStore();


  const loadData = async () => {
    try {
      const [ordensData, empresasData, motoristasData, veiculosData, tarifariosData] = await Promise.all([
        ordemService.getAll(),
        empresaService.getAll(),
        motoristaService.getAll(),
        veiculoService.getAll(),
        tarifarioService.getAll(),
      ]);
      setOrdens(ordensData);
      setEmpresas(empresasData);
      setMotoristas(motoristasData);
      setVeiculos(veiculosData);
      setTarifarios(tarifariosData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  type Parada = {
    endereco_ponto: string;
    horario_previsto: string;
    observacoes: string;
    ordem_parada: number;
  };

  // Handler principal — chamado pelo ModalOS
  const handleSaveOS = async (data: OrdemServicoFormData, paradas: Parada[]) => {
    try {
      setGlobalLoading(true);

      let finalTarifarioId = data.tarifario_id && data.tarifario_id !== '' ? data.tarifario_id : null;

      if (!finalTarifarioId && data.origem && data.destino) {
        try {
          const { data: existingTarifa } = await supabase
            .from('tarifarios').select('id')
            .eq('origem', data.origem).eq('destino', data.destino).maybeSingle();
          if (existingTarifa) {
            finalTarifarioId = existingTarifa.id;
          } else {
            const { data: newTarifa } = await supabase
              .from('tarifarios')
              .insert({ origem: data.origem, destino: data.destino, valor_venda: data.valor_faturamento || 0, valor_custo: data.valor_custo_motorista || 0 })
              .select().maybeSingle();
            if (newTarifa) finalTarifarioId = newTarifa.id;
          }
        } catch (e) { console.warn(e); }
      }

      const payload = {
        ...data,
        tarifario_id: finalTarifarioId,
        numero_os: data.numero_os && data.numero_os !== '' ? data.numero_os : null,
        horario_inicio: data.horario_inicio && data.horario_inicio !== '' ? data.horario_inicio : null,
        horario_fim: data.horario_fim && data.horario_fim !== '' ? data.horario_fim : null,
      };

      let ordemId = editingId;

      if (editingId) {
        await ordemService.update(editingId, payload);
        if (data.status === 'concluido') {
          const { data: fin } = await supabase.from('recebimentos').select('status').eq('ordem_id', editingId).maybeSingle();
          if (fin?.status !== 'pago') setOrdemToConfirm(editingId);
        }
        showToast('Ordem atualizada!');
      } else {
        const novaOrdem = await ordemService.create(payload);
        ordemId = novaOrdem?.id || null;
        await notificationService.create({ titulo: 'Nova Ordem Criada', mensagem: `Nova OS para ${data.destino} criada.`, tipo: 'success', link: '/ordens' });
        showToast('Nova ordem criada!');
      }

      // Salva paradas
      if (ordemId) {
        // Remove paradas antigas em edição SE houver um ID (garante limpeza)
        if (editingId) {
          await supabase.from('ordem_servico_paradas').delete().eq('ordem_id', ordemId);
        }

        // Insere novas paradas se houver
        if (paradas.length > 0) {
          const dataExec = data.data_execucao?.split('T')[0] || new Date().toISOString().split('T')[0];
          await supabase.from('ordem_servico_paradas').insert(
            paradas.filter(p => p.endereco_ponto).map(p => ({
              ordem_id: ordemId,
              endereco_ponto: p.endereco_ponto,
              horario_previsto: p.horario_previsto ? `${dataExec}T${p.horario_previsto}:00` : null,
              observacoes: p.observacoes || null,
              ordem_parada: p.ordem_parada,
            }))
          );
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setEditingFormData(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar ordem', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };


  const handleConfirmPayment = async () => {
    if (ordemToConfirm) {
      setGlobalLoading(true);
      await supabase.from('recebimentos').update({
        status: 'pago',
        forma_pagamento: confirmData.forma_pagamento,
        data_pagamento: confirmData.data_pagamento
      }).eq('ordem_id', ordemToConfirm);

      await notificationService.create({
        titulo: 'Pagamento Confirmado',
        mensagem: `O recebimento da OS vinculada foi confirmado via ${confirmData.forma_pagamento.toUpperCase()}.`,
        tipo: 'success',
        link: '/financeiro'
      });

      setOrdemToConfirm(null);
      setGlobalLoading(false);
      showToast('Recebimento confirmado!');
    }
  };

  const handleEdit = (ordem: OrdemServico) => {
    setEditingId(ordem.id);
    // Monta o objeto de dados para o ModalOS
    const formData: OrdemServicoFormData = {
      empresa_id: ordem.empresa_id,
      motorista_id: ordem.motorista_id,
      veiculo_id: ordem.veiculo_id,
      tarifario_id: ordem.tarifario_id || '',
      origem: ordem.origem,
      destino: ordem.destino,
      passageiro: ordem.passageiro || '',
      voucher: ordem.voucher || '',
      data_execucao: ordem.data_execucao,
      horario_inicio: ordem.horario_inicio || '',
      horario_fim: ordem.horario_fim || '',
      valor_faturamento: ordem.valor_faturamento,
      valor_custo_motorista: ordem.valor_custo_motorista || 0,
      status: ordem.status,
      numero_os: ordem.numero_os || '',
      tipo_cobranca: ordem.tipo_cobranca || '',
      possui_retorno: ordem.possui_retorno || false,
      classificacao_trajeto: ordem.classificacao_trajeto || '',
      atividade_motivo: ordem.atividade_motivo || '',
      divisao_departamento: ordem.divisao_departamento || '',
      autorizado_por: ordem.autorizado_por || '',
      centro_custo_cliente: ordem.centro_custo_cliente || '',
      numero_requisicao_bu: ordem.numero_requisicao_bu || '',
      forma_faturamento: ordem.forma_faturamento || '',
      observacoes_gerais: ordem.observacoes_gerais || '',
      trajeto_manual: ordem.trajeto_manual || true,
    };
    setEditingFormData(formData);
    setIsModalOpen(true);
  };

  const handleOpenStatusModal = (ordem: OrdemServico) => {
    setStatusOrdemTarget(ordem);
    setNewStatus(ordem.status);
    setStatusModalOpen(true);
  };

  const handleQuickStatusChange = async () => {
    if (!statusOrdemTarget) return;

    try {
      setGlobalLoading(true);
      await ordemService.update(statusOrdemTarget.id, { status: newStatus as any });

      if (statusOrdemTarget.status !== newStatus) {
        const statusMap: Record<string, string> = {
          'pendente': 'Pendente',
          'em_andamento': 'Em Andamento',
          'concluido': 'Concluída',
          'cancelado': 'Cancelada'
        };

        await notificationService.create({
          titulo: `Status Atualizado (${statusMap[newStatus]})`,
          mensagem: `A OS para ${statusOrdemTarget.destino} foi atualizada rapidamente para ${statusMap[newStatus]}.`,
          tipo: newStatus === 'concluido' ? 'success' : newStatus === 'cancelado' ? 'error' : 'info',
          link: '/ordens'
        });

        if (newStatus === 'concluido') {
          setOrdemToConfirm(statusOrdemTarget.id);
        }
      }

      showToast('Status atualizado!');
      setStatusModalOpen(false);
      setStatusOrdemTarget(null);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Tem certeza?', 'Deseja realmente excluir esta ordem de serviço?');
    if (result.isConfirmed) {
      try {
        setGlobalLoading(true);
        const ordemToDelete = ordens.find(o => o.id === id);
        await ordemService.delete(id);

        await notificationService.create({
          titulo: 'Ordem de Serviço Excluída',
          mensagem: `A OS para ${ordemToDelete?.destino || 'Desconhecido'} foi removida do sistema.`,
          tipo: 'error'
        });

        showToast('Ordem excluída!');
        loadData();
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };


  const filteredOrdens = ordens.filter(o => {
    const matchSearch =
      ((o.origem?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.destino?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.passageiro?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.empresa?.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === '' || o.status === statusFilter;
    const matchEmpresa = empresaFilter === '' || o.empresa_id === empresaFilter;
    const matchTipo = tipoMotoristaFilter === '' ||
      (tipoMotoristaFilter === 'terceiro' ? o.motorista?.tipo_vinculo === 'terceiro' : o.motorista?.tipo_vinculo !== 'terceiro');
    
    let matchData = true;
    if (filterDataInicio || filterDataFim) {
      const dataExec = o.data_execucao ? new Date(o.data_execucao.split('T')[0]) : null;
      if (dataExec) {
        if (filterDataInicio) {
          const dtInicio = new Date(filterDataInicio);
          if (dataExec < dtInicio) matchData = false;
        }
        if (filterDataFim) {
           const dtFim = new Date(filterDataFim);
           if (dataExec > dtFim) matchData = false;
        }
      } else {
        matchData = false;
      }
    }

    return matchSearch && matchStatus && matchEmpresa && matchTipo && matchData;
  });

  const totalPages = Math.ceil(filteredOrdens.length / itemsPerPage);
  const paginatedOrdens = filteredOrdens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    const data = filteredOrdens.map(o => ({
      'Nº OS': o.id || '---',
      Data: formatDateBR(o.data_execucao),
      Empresa: o.empresa?.razao_social || '',
      Passageiro: o.passageiro || '',
      Voucher: o.voucher || '',
      Itinerario: `${o.origem} -> ${o.destino}`,
      'Subrotas/Paradas': (o as any).paradas?.map((p: any) => p.endereco_ponto).join('; ') || '---',
      Horario_Inicio: formatDateTimeBR(o.horario_inicio),
      Horario_Fim: formatDateTimeBR(o.horario_fim),
      Motorista: o.motorista?.nome || '',
      Tipo_Motorista: o.motorista?.tipo_vinculo || '',
      Veiculo: o.veiculo?.placa || '',
      Valor: o.valor_faturamento,
      Custo_Motorista: o.valor_custo_motorista || '',
      Lucro: o.valor_custo_motorista ? o.valor_faturamento - o.valor_custo_motorista : o.valor_faturamento,
      Status: o.status
    }));
    exportToExcel(data, `ordens_servico_filtradas_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportFaturamento = () => {
    const data = filteredOrdens
      .filter(o => o.status === 'concluido')
      .map(o => ({
        os: o.id || '—',
        data: formatDateBR(o.data_execucao),
        passageiro: o.passageiro || '—',
        itinerario: `${o.origem} → ${o.destino}`,
        horario_inicial: formatDateTimeBR(o.horario_inicio),
        horario_final: formatDateTimeBR(o.horario_fim),
        valor: `R$ ${Number(o.valor_faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }));
    const columns = [
      { header: 'OS', dataKey: 'os' },
      { header: 'Data', dataKey: 'data' },
      { header: 'Passageiro', dataKey: 'passageiro' },
      { header: 'Itinerário', dataKey: 'itinerario' },
      { header: 'Horário Inicial', dataKey: 'horario_inicial' },
      { header: 'Horário Final', dataKey: 'horario_final' },
      { header: 'Valor', dataKey: 'valor' },
    ];
    exportToPDF(data, columns, 'faturamento', 'Relatório de Faturamento');
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-text-muted">Gerencie os transportes e fretes.</p>
        </div>
          <Button onClick={() => {
          setEditingId(null);
          setEditingFormData(null);
          setIsModalOpen(true);
        }} className="flex gap-2">
          <Plus size={20} /> Nova Ordem Completa
        </Button>

       
        
      </div>

      <Card className="!p-0 overflow-visible">
         <QuickCreateOS
            empresas={empresas}
            motoristas={motoristas}
            veiculos={veiculos}
            onSuccess={loadData}
          />

        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">



          
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por origem, destino ou empresa..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <select
                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm input-focus text-white appearance-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Todos Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluída</option>
                <option value="cancelado">Cancelada</option>
              </select>
            </div>

            <div className="relative w-full sm:w-44">
              <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <select
                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm input-focus text-white appearance-none"
                value={tipoMotoristaFilter}
                onChange={(e) => { setTipoMotoristaFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Todos Motoristas</option>
                <option value="fixo">Frota Própria (Fixo)</option>
                <option value="terceiro">Terceiros (Freelance)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-44">
              <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <select
                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm input-focus text-white appearance-none"
                value={empresaFilter}
                onChange={(e) => { setEmpresaFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Todas Empresas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1">
               <input
                 type="date"
                 className="bg-transparent border-none text-xs text-white focus:ring-0 p-1"
                 value={filterDataInicio}
                 onChange={(e) => { setFilterDataInicio(e.target.value); setCurrentPage(1); }}
                 title="De"
               />
               <span className="text-text-muted text-[10px]">até</span>
               <input
                 type="date"
                 className="bg-transparent border-none text-xs text-white focus:ring-0 p-1"
                 value={filterDataFim}
                 onChange={(e) => { setFilterDataFim(e.target.value); setCurrentPage(1); }}
                 title="Até"
               />
            </div>

            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="p-2 bg-surface border border-border rounded-md hover:border-green-500 hover:text-green-500 text-text-muted transition-colors tooltip-trigger" title="Exportar para Excel">
                <Download size={18} />
              </button>
              <button onClick={handleExportFaturamento} className="p-2 bg-surface border border-border rounded-md hover:border-blue-500 hover:text-blue-500 text-text-muted transition-colors tooltip-trigger flex items-center gap-2 text-xs font-bold" title="Exportar para Faturamento">
                <FileText size={18} />
                <span className="hidden lg:inline">FATURAMENTO</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">





          
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Empresa</th>
                <th className="px-6 py-4">Trajeto (Origem - Destino)</th>
                <th className="px-6 py-4">Motorista / Veículo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPageLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : paginatedOrdens.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Nenhuma ordem encontrada.</td></tr>
              ) : paginatedOrdens.map((ordem) => (
                <tr key={ordem.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                          {(() => {
                            const d = ordem.data_execucao;
                            const dateObj = d ? (d.length === 10 ? parseISO(d + 'T00:00:00') : parseISO(d)) : null;
                            const isDateValid = dateObj && isValid(dateObj);

                            return (
                              <>
                                <span className="text-[10px] font-bold text-primary uppercase leading-none">
                                  {isDateValid ? format(dateObj, 'MMM', { locale: ptBR }) : '---'}
                                </span>
                                <span className="text-sm font-black text-white leading-none mt-0.5">
                                  {isDateValid ? format(dateObj, 'dd') : '--'}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm line-clamp-1">{ordem.empresa?.razao_social}</span>
                          <span className="text-[10px] text-primary font-black tracking-widest uppercase">OS #{ordem.numero_os || ordem.id.slice(0, 8) || '---'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-1 mt-1 pt-2 border-t border-border/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Agendado</span>
                          <div className="flex items-center gap-1 text-orange-400">
                            <Clock size={10} />
                            <span className="text-[10px] font-black">
                              {ordem.data_execucao ? formatDateTimeBR(ordem.data_execucao).split(' ')[1] : '--:--'}
                            </span>
                          </div>
                        </div>

                        <div className="w-px h-6 bg-border/50" />

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Realizado</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-blue-400">
                              <span className="text-[10px] font-black whitespace-nowrap">
                                IN: {ordem.horario_inicio ? formatDateTimeBR(ordem.horario_inicio).split(' ')[1] : '--:--'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400">
                              <span className="text-[10px] font-black whitespace-nowrap">
                                OUT: {ordem.horario_fim ? formatDateTimeBR(ordem.horario_fim).split(' ')[1] : '--:--'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <span className="text-white font-medium">{ordem.origem}</span>
                      <span className="text-primary">→</span>
                      <span className="text-white font-medium">{ordem.destino}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{ordem.motorista?.nome}</span>
                      <span className="text-xs text-text-muted font-bold uppercase">{ordem.veiculo?.placa} - {ordem.veiculo?.modelo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(ordem.valor_faturamento)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ordem.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {ordem.status === 'concluido' && (
                        <button onClick={() => generatePaymentReceipt(ordem, ordem.empresa)} className="p-1.5 text-text-muted hover:text-blue-500 transition-colors tooltip-trigger" title="Gerar Recibo">
                          <FileText size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/operador/ordens/${ordem.id}`)}
                        className="p-1.5 text-text-muted hover:text-cyan-400 transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEdit(ordem)} className="p-1.5 text-text-muted hover:text-primary transition-colors tooltip-trigger" title="Editar">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleOpenStatusModal(ordem)} className="p-1.5 text-text-muted hover:text-orange-500 transition-colors tooltip-trigger" title="Alterar Status Rápido">
                        <RefreshCw size={18} />
                      </button>
                      <button onClick={() => handleDelete(ordem.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors tooltip-trigger" title="Excluir">
                        <Trash2 size={18} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Página {currentPage} de {totalPages} (Total: {filteredOrdens.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* UI do Modal modularizado */}
      <ModalOS
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setEditingFormData(null);
        }}
        onSave={handleSaveOS}
        editingData={editingFormData}
        editingId={editingId}
        motoristas={motoristas}
        empresas={empresas}
        veiculos={veiculos}
        tarifarios={tarifarios}
      />

      {/* Modal de Confirmação de Recebimento Automático */}
      {ordemToConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in">
            <h3 className="text-lg font-bold text-white mb-2">Ordem Concluída!</h3>
            <p className="text-sm text-text-muted mb-4">Deseja registrar o recebimento desse frete agora mesmo?</p>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-muted">Forma de Pagamento</label>
                <select
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                  value={confirmData.forma_pagamento}
                  onChange={(e) => setConfirmData({ ...confirmData, forma_pagamento: e.target.value })}
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-muted">Data do Pagamento</label>
                <DatePicker
                  selected={confirmData.data_pagamento ? parseISO(confirmData.data_pagamento + 'T00:00:00') : null}
                  onChange={(date: Date | null) => setConfirmData({ ...confirmData, data_pagamento: date ? format(date, 'yyyy-MM-dd') : '' })}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button type="button" variant="ghost" onClick={() => setOrdemToConfirm(null)}>Mais tarde</Button>
                <Button type="button" onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700">Confirmar Recebimento</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Status Change */}
      {statusModalOpen && statusOrdemTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in">
            <h3 className="text-lg font-bold text-white mb-2">Alterar Status</h3>
            <p className="text-sm text-text-muted mb-4">
              Ordem: {statusOrdemTarget.origem} → {statusOrdemTarget.destino}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm text-text-muted">Novo Status</label>
              <select
                className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluída</option>
                <option value="cancelado">Cancelada</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleQuickStatusChange} className="bg-primary hover:opacity-90">Salvar Status</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

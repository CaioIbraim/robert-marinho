import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Download, FileText, ChevronLeft, ChevronRight, Filter, Eye, Clock, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, MapPin } from 'lucide-react';
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
import { format, parseISO, isValid, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateBR, formatDateTimeBR, getTimeFromDate, getWaitTimeInMinutes } from '../../utils/date';
import { exportToExcel, exportToPDF, generatePaymentReceipt } from '../../utils/export';
import { ModalOS } from '../../components/ui/ModalOS';
import { useNavigate } from 'react-router-dom';
import { QuickCreateOS } from './QuickCreateOS';

// 🔥 Tipos auxiliares
type Parada = {
  endereco_ponto: string;
  horario_previsto: string;
  observacoes: string;
  ordem_parada: number;
};

type SortConfig = {
  key: keyof OrdemServico | null;
  direction: 'asc' | 'desc';
};

type StatusCounts = {
  pendente: number;
  em_andamento: number;
  concluido: number;
  cancelado: number;
};

// 🎨 Mapa de cores por status para sombreamento das linhas
const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-500/5',
  em_andamento: 'bg-blue-500/5',
  concluido: 'bg-emerald-500/5',
  cancelado: 'bg-red-500/5',
};

// 🕐 Mapa de labels para status
const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluída',
  cancelado: 'Cancelada'
};

export const OperadorOrdens = () => {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [tipoMotoristaFilter, setTipoMotoristaFilter] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔃 Estado para ordenação da tabela
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const [ordemToConfirm, setOrdemToConfirm] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState({ 
    forma_pagamento: 'pix', 
    data_pagamento: new Date().toLocaleDateString('en-CA') 
  });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusOrdemTarget, setStatusOrdemTarget] = useState<OrdemServico | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  
  // 🕐 Novos campos para check-in/check-out no modal de status
  const [statusCheckIn, setStatusCheckIn] = useState<string>('');
  const [statusCheckOut, setStatusCheckOut] = useState<string>('');

  const [ordemFormData, setOrdemFormData] = useState<OrdemServicoFormData | null>(null);

  const { setGlobalLoading } = useLoadingStore();

  // 🔴 Realtime: Subscription para atualizações automáticas
  useEffect(() => {
    const channel = supabase
      .channel('ordens_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordem_servico' },
        () => {
          // Debounce para evitar múltiplas requisições
          const timeout = setTimeout(() => {
            loadData();
          }, 300);
          return () => clearTimeout(timeout);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // 🔃 Handler para ordenação de colunas
  const handleSort = (key: keyof OrdemServico) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // 🎨 Função para obter classe de background por status
  const getStatusRowClass = (status: string) => {
    return STATUS_COLORS[status] || '';
  };

  // ⚠️ Função para detectar atraso operacional
  const isOrdemAtrasada = useCallback((ordem: OrdemServico) => {
    if (!ordem.horario_inicio || ordem.status === 'concluido' || ordem.status === 'cancelado') return false;
    const now = new Date();
    const scheduledStart = parseISO(ordem.horario_inicio);
    return isBefore(scheduledStart, now) && !ordem.horario_fim;
  }, []);

  // 📊 Contagem de ordens por status
  const statusCounts = useMemo((): StatusCounts => {
    return ordens.reduce((acc, o) => {
      if (acc[o.status as keyof StatusCounts] !== undefined) {
        acc[o.status as keyof StatusCounts]++;
      }
      return acc;
    }, { pendente: 0, em_andamento: 0, concluido: 0, cancelado: 0 });
  }, [ordens]);

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
        if (editingId) {
          await supabase.from('ordem_servico_paradas').delete().eq('ordem_id', ordemId);
        }
        if (paradas.length > 0) {
          const dataExec = data.data_execucao?.split('T')[0] || new Date().toLocaleDateString('en-CA');
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
      setOrdemFormData(null);
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
    if (ordem.status === 'concluido') {
      showToast('Ordens concluídas não podem ser editadas.', 'warning');
      return;
    }
    setEditingId(ordem.id);
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
    setOrdemFormData(formData);
    setIsModalOpen(true);
  };

  const handleOpenStatusModal = (ordem: OrdemServico) => {
    setStatusOrdemTarget(ordem);
    setNewStatus(ordem.status);
    // 🕐 Preenche check-in/check-out se existirem formatados
    setStatusCheckIn(getTimeFromDate(ordem.horario_inicio));
    setStatusCheckOut(getTimeFromDate(ordem.horario_fim));
    setStatusModalOpen(true);
  };

  const handleQuickStatusChange = async () => {
    if (!statusOrdemTarget) return;

    try {
      if (newStatus === 'em_andamento') {
        const confirmResult = await showConfirm(
          'Iniciar Atendimento?',
          `Deseja iniciar o atendimento para a OS ${statusOrdemTarget.id.slice(0, 8)}? O horário de check-in será registrado.`
        );
        if (!confirmResult.isConfirmed) return;
      }

      if (newStatus === 'cancelado') {
        const confirmResult = await showConfirm(
          'Cancelar Ordem?',
          'Esta ação é irreversível. Deseja realmente cancelar esta OS?'
        );
        if (!confirmResult.isConfirmed) return;
      }

      setGlobalLoading(true);
      
      const updatePayload: Partial<OrdemServico> = { 
        status: newStatus as any,
        data_execucao: statusOrdemTarget.data_execucao,
        ...(statusCheckIn && { horario_inicio: statusCheckIn }),
        ...(statusCheckOut && { horario_fim: statusCheckOut })
      };
      
      await ordemService.update(statusOrdemTarget.id, updatePayload);

      if (statusOrdemTarget.status !== newStatus) {
        await notificationService.create({
          titulo: `Status Atualizado (${STATUS_LABELS[newStatus]})`,
          mensagem: `A OS para ${statusOrdemTarget.destino} foi atualizada rapidamente para ${STATUS_LABELS[newStatus]}.`,
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
    const ordemToDelete = ordens.find(o => o.id === id);
    if (ordemToDelete?.status === 'concluido') {
      showToast('Ordens concluídas não podem ser excluídas.', 'error');
      return;
    }

    const result = await showConfirm('Tem certeza?', 'Deseja realmente excluir esta ordem de serviço?');
    if (result.isConfirmed) {
      try {
        setGlobalLoading(true);
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

  // 🔃 Função de comparação para ordenação
  const compareValues = (a: any, b: any, direction: 'asc' | 'desc') => {
    if (a === b) return 0;
    if (a == null) return direction === 'asc' ? -1 : 1;
    if (b == null) return direction === 'asc' ? 1 : -1;
    
    const comparison = a > b ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  };

  const filteredOrdens = useMemo(() => {
    let result = ordens.filter(o => {
      const matchSearch =
        ((o.origem?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (o.destino?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (o.passageiro?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (o.empresa?.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (o.motorista?.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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

    // 🔃 Aplicar ordenação
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal: any = a[sortConfig.key!];
        let bVal: any = b[sortConfig.key!];
        
        // Tratamento especial para campos aninhados
        if (sortConfig.key === 'empresa_id' && a.empresa) aVal = a.empresa.razao_social;
        if (sortConfig.key === 'empresa_id' && b.empresa) bVal = b.empresa.razao_social;
        if (sortConfig.key === 'motorista_id' && a.motorista) aVal = a.motorista.nome;
        if (sortConfig.key === 'motorista_id' && b.motorista) bVal = b.motorista.nome;
        if (sortConfig.key === 'veiculo_id' && a.veiculo) aVal = a.veiculo.placa;
        if (sortConfig.key === 'veiculo_id' && b.veiculo) bVal = b.veiculo.placa;
        
        return compareValues(aVal, bVal, sortConfig.direction);
      });
    }

    return result;
  }, [ordens, searchTerm, statusFilter, empresaFilter, tipoMotoristaFilter, filterDataInicio, filterDataFim, sortConfig]);

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

  // 🔃 Renderiza ícone de ordenação no header da tabela
  const renderSortIcon = (columnKey: keyof OrdemServico) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="ml-1 text-text-muted/50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-primary" />
      : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  // 📊 Componente de chips de status com contagem
  const StatusFilterChips = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(statusCounts).map(([status, count]) => (
        <button
          key={status}
          onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
            statusFilter === status 
              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
              : 'bg-surface border-border text-text-muted hover:border-primary/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            status === 'pendente' ? 'bg-amber-500' :
            status === 'em_andamento' ? 'bg-blue-500' :
            status === 'concluido' ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
          {STATUS_LABELS[status]}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            statusFilter === status ? 'bg-white/20' : 'bg-border'
          }`}>
            {count}
          </span>
        </button>
      ))}
      {statusFilter && (
        <button
          onClick={() => setStatusFilter('')}
          className="px-2 py-1.5 text-xs text-text-muted hover:text-white transition-colors"
        >
          Limpar filtro
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-text-muted">Gerencie os transportes e fretes.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost"
            onClick={() => setIsQuickCreateOpen(true)}
            className="flex gap-2 border border-primary/20 text-primary hover:bg-primary/10"
          >
            <Plus size={20} /> Cadastro Rápido
          </Button>
          <Button onClick={() => {
            setEditingId(null);
            setOrdemFormData(null);
            setIsModalOpen(true);
          }} className="flex gap-2">
            <Plus size={20} /> Nova Ordem Completa
          </Button>
        </div>
      </div>

      {/* 📊 Chips de filtro por status */}
      <StatusFilterChips />

      {/* Modal Cadastro Rápido */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button 
                onClick={() => setIsQuickCreateOpen(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors p-2 bg-background border border-border rounded-full"
              >
                ✕
              </button>
              <QuickCreateOS
                empresas={empresas}
                motoristas={motoristas}
                veiculos={veiculos}
                onSuccess={() => {
                  loadData();
                  setIsQuickCreateOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por origem, destino, empresa ou motorista..."
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
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => handleSort('data_execucao')}
                >
                  <div className="flex items-center gap-1">
                    Data / Empresa
                    {renderSortIcon('data_execucao')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => handleSort('origem')}
                >
                  <div className="flex items-center gap-1">
                    Trajeto
                    {renderSortIcon('origem')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => handleSort('motorista_id')}
                >
                  <div className="flex items-center gap-1">
                    Motorista / Veículo
                    {renderSortIcon('motorista_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none text-right"
                  onClick={() => handleSort('valor_faturamento')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor
                    {renderSortIcon('valor_faturamento')}
                  </div>
                </th>
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
                <tr 
                  key={ordem.id} 
                  className={`hover:bg-border/30 transition-colors group ${getStatusRowClass(ordem.status)}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20 relative">
                          {/* ⚠️ Indicador visual de atraso operacional */}
                          {isOrdemAtrasada(ordem) && (
                            <AlertTriangle size={10} className="absolute -top-1 -right-1 text-amber-500 bg-background rounded-full p-0.5" />
                          )}
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

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 ml-1 mt-1 pt-2 border-t border-border/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Agendado</span>
                          <div className="flex items-center gap-1 text-orange-400">
                             <Clock size={10} />
                             <span className="text-[10px] font-black">{ordem.data_execucao ? formatDateTimeBR(ordem.data_execucao).split(' ')[1] : '--:--'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Check-in</span>
                          <div className="flex items-center gap-1 text-blue-400">
                             <span className="text-[10px] font-black">{ordem.horario_inicio ? getTimeFromDate(ordem.horario_inicio) : '--:--'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Check-out</span>
                          <div className="flex items-center gap-1 text-emerald-400">
                             <span className="text-[10px] font-black">{ordem.horario_fim ? getTimeFromDate(ordem.horario_fim) : '--:--'}</span>
                          </div>
                        </div>

                        {ordem.horario_inicio && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Espera</span>
                            {(() => {
                              const wait = getWaitTimeInMinutes(ordem.data_execucao, ordem.horario_inicio);
                              return (
                                <span className={`text-[10px] font-black ${wait > 15 ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {wait} min
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-text-muted">
                        <span className="text-white font-medium">{ordem.origem}</span>
                        <span className="text-primary">→</span>
                        <span className="text-white font-medium">{ordem.destino}</span>
                      </div>
                      {((ordem as any).paradas?.length > 0) && (
                        <button 
                          onClick={() => navigate(`/operador/ordens/${ordem.id}`)}
                          className="flex items-center gap-1 text-primary hover:text-primary-hover w-fit mt-1.5 transition-all group/route"
                          title="Clique para ver paradas/rota"
                        >
                          <MapPin size={12} className="group-hover/route:animate-bounce" />
                          <span className="text-[10px] font-black uppercase tracking-tight border-b border-primary/20 group-hover/route:border-primary">
                            {(ordem as any).paradas.length} paradas programadas
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{ordem.motorista?.nome}</span>
                      <span className="text-xs text-text-muted font-bold uppercase">{ordem.veiculo?.placa} - {ordem.veiculo?.modelo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-right">
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
                         onClick={() => handleOpenStatusModal(ordem)}
                         className="p-1.5 text-text-muted hover:text-primary transition-colors flex items-center gap-1 bg-surface border border-border rounded-md"
                         title="Alterar Status Rápido"
                      >
                         <RefreshCw size={16} />
                         <span className="text-[10px] font-bold uppercase hidden lg:block">Status</span>
                      </button>

                      <button 
                        className="p-1.5 text-text-muted hover:text-white transition-colors bg-surface border border-border rounded-md"
                        onClick={() => navigate(`/operador/ordens/${ordem.id}`)}
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      
                      <button 
                        disabled={ordem.status === 'concluido'}
                        className={`p-1.5 text-text-muted hover:text-primary transition-colors bg-surface border border-border rounded-md ${ordem.status === 'concluido' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleEdit(ordem)}
                        title={ordem.status === 'concluido' ? "OS Concluída - Edição Bloqueada" : "Editar Ordem"}
                      >
                        <Pencil size={18} />
                      </button>
                      
                      <button 
                        disabled={ordem.status === 'concluido'}
                        className={`p-1.5 text-text-muted hover:text-red-500 transition-colors bg-surface border border-border rounded-md ${ordem.status === 'concluido' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleDelete(ordem.id)}
                        title={ordem.status === 'concluido' ? "OS Concluída - Exclusão Bloqueada" : "Excluir Ordem"}
                      >
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

      <ModalOS
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setOrdemFormData(null);
        }}
        onSave={handleSaveOS}
        editingData={ordemFormData}
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
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white shadow-sm"
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
            <p className="text-sm text-text-muted mb-4 text-center">
              Ordem: {statusOrdemTarget.origem} → {statusOrdemTarget.destino}
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Novo Status</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Check-in</label>
                  <input
                    type="time"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white input-focus"
                    value={statusCheckIn}
                    onChange={(e) => setStatusCheckIn(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Check-out</label>
                  <input
                    type="time"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white input-focus"
                    value={statusCheckOut}
                    onChange={(e) => setStatusCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={handleQuickStatusChange} className="bg-primary hover:opacity-90">Salvar Status</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
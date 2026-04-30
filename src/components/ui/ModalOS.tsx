import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ordemServicoSchema } from '../../schemas';
import type { OrdemServicoFormData } from '../../schemas';
import { supabase } from '../../lib/supabaseClient';
import type { Empresa, Motorista, Veiculo, Tarifario } from '../../types';
import { FormDatePicker } from '../ui/FormDatePicker';
import { 
  X, Settings, Users, Route, Plus, Trash2, ChevronRight, 
  ChevronLeft, MapPin, Navigation, CheckCircle, Loader2, RotateCcw
} from 'lucide-react';
import { Button } from './Button';

import { format } from 'date-fns';
import { getTimeFromDate } from '../../utils/date';

type Parada = {
  endereco_ponto: string;
  horario_previsto: string;
  observacoes: string;
  ordem_parada: number;
};

type ModalOSProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrdemServicoFormData, paradas: Parada[]) => Promise<void>;
  editingData?: OrdemServicoFormData | null;
  editingId?: string | null;
  empresas: Empresa[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  tarifarios: Tarifario[];
};

type Tab = 'operacional' | 'cliente' | 'rotas';

const TAB_LIST: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'operacional', label: 'Operacional', icon: <Settings className="w-4 h-4" /> },
  { id: 'cliente', label: 'Cliente & Tarifas', icon: <Users className="w-4 h-4" /> },
  { id: 'rotas', label: 'Rotas e Paradas', icon: <Route className="w-4 h-4" /> },
];

export function ModalOS({
  isOpen, onClose, onSave, editingData, editingId,
  empresas, motoristas, veiculos, tarifarios
}: ModalOSProps) {
  const [activeTab, setActiveTab] = useState<Tab>('operacional');
  const [isSaving, setIsSaving] = useState(false);
  const [paradas, setParadas] = useState<Parada[]>([]);

  const {
    register, handleSubmit, reset, watch, setValue, control,
    formState: { errors }
  } = useForm<OrdemServicoFormData>({
    resolver: zodResolver(ordemServicoSchema) as any,
    defaultValues: {
      data_execucao: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      status: 'pendente',
      valor_faturamento: 0,
      possui_retorno: false,
      trajeto_manual: true,
    }
  });

  const watchedMotoristaId = watch('motorista_id');
  const watchedTarifarioId = watch('tarifario_id');
  const selectedMotorista = motoristas.find(m => m.id === watchedMotoristaId);
  const isTerceiro = selectedMotorista?.tipo_vinculo === 'terceiro';

  // Ao selecionar tarifário, auto-popula origem/destino e valor
  useEffect(() => {
    if (watchedTarifarioId && watchedTarifarioId !== '') {
      const tar = tarifarios.find(t => t.id === watchedTarifarioId);
      if (tar) {
        setValue('origem', tar.origem);
        setValue('destino', tar.destino);
        setValue('valor_faturamento', tar.valor_venda);
        if (tar.valor_custo) setValue('valor_custo_motorista', tar.valor_custo);
      }
    }
  }, [watchedTarifarioId]);

  // Popula formulário ao editar
  useEffect(() => {
    if (editingData) {
      reset(editingData);
      // Carrega paradas existentes
      if (editingId) loadParadas(editingId);
    } else {
      reset({
        data_execucao: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        status: 'pendente',
        valor_faturamento: 0,
        possui_retorno: false,
        trajeto_manual: true,
      });
      setParadas([]);
    }
    setActiveTab('operacional');
  }, [editingData, isOpen]);

  const loadParadas = async (ordemId: string) => {
    const { data } = await supabase
      .from('ordem_servico_paradas')
      .select('*')
      .eq('ordem_id', ordemId)
      .order('ordem_parada', { ascending: true });
    if (data) {
      setParadas(data.map(p => ({
        endereco_ponto: p.endereco_ponto,
        horario_previsto: p.horario_previsto?.slice(11, 16) || '',
        observacoes: p.observacoes || '',
        ordem_parada: p.ordem_parada,
      })));
    }
  };

  const addParada = () => {
    setParadas(prev => [...prev, {
      endereco_ponto: '',
      horario_previsto: '',
      observacoes: '',
      ordem_parada: prev.length + 1,
    }]);
  };

  const removeParada = (idx: number) => {
    setParadas(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, ordem_parada: i + 1 })));
  };

  const updateParada = (idx: number, field: keyof Parada, value: string) => {
    setParadas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const onSubmit = async (data: OrdemServicoFormData) => {
    setIsSaving(true);
    try {
      await onSave(data, paradas);
    } finally {
      setIsSaving(false);
    }
  };

  const getTimeValue = (fieldValue: string | null | undefined) => {
    return getTimeFromDate(fieldValue);
  };

  const setTimeValue = (fieldName: 'horario_inicio' | 'horario_fim', time: string) => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dataExec = watch('data_execucao') || localDate;
    const base = dataExec.includes('T') ? dataExec.split('T')[0] : dataExec;
    setValue(fieldName, `${base}T${time}:00`);
  };

  const tabErrors = {
    operacional: !!(errors.empresa_id || errors.motorista_id || errors.veiculo_id || errors.data_execucao || errors.status),
    cliente: !!(errors.origem || errors.destino || errors.valor_faturamento),
    rotas: false,
  };

  if (!isOpen) return null;

  const fieldClass = "w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all";
  const labelClass = "block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-widest";
  const sectionClass = "space-y-4";
  const sectionTitleClass = "text-[10px] font-black uppercase tracking-widest text-text-muted pb-2 border-b border-border/50 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-primary/90 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <h2 className="text-white font-black uppercase tracking-wider text-lg">
            {editingId ? `Editar OS #${editingId.slice(0, 8).toUpperCase()}` : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : `text-text-muted hover:text-white hover:bg-white/5 ${tabErrors[tab.id] ? 'text-red-400' : ''}`
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tabErrors[tab.id] && <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">

            {/* ===== ABA 1: OPERACIONAL ===== */}
            {activeTab === 'operacional' && (
              <div className="space-y-6">
                <div className={sectionClass}>
                  <p className={sectionTitleClass}><Settings className="w-4 h-4" />Dados Operacionais</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Número da OS</label>
                      <input {...register('numero_os')} className={fieldClass} placeholder="Auto ou manual" />
                    </div>
                    <div>
                      <label className={labelClass}>Status *</label>
                      <select {...register('status')} className={fieldClass}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluída</option>
                        <option value="cancelado">Cancelada</option>
                      </select>
                      {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
                    </div>
                    <div>
                      <FormDatePicker control={control} name="data_execucao" label="Data do Serviço *" showTimeSelect error={errors.data_execucao?.message} />
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <p className={sectionTitleClass}><Users className="w-4 h-4" />Empresa e Passageiro</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Empresa Cliente *</label>
                      <select {...register('empresa_id')} className={`${fieldClass} ${errors.empresa_id ? 'border-red-500' : ''}`}>
                        <option value="">Selecione a empresa</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
                      </select>
                      {errors.empresa_id && <p className="text-red-400 text-xs mt-1">{errors.empresa_id.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Passageiro / Nome</label>
                      <input {...register('passageiro')} className={fieldClass} placeholder="Nome do passageiro" />
                    </div>
                    <div>
                      <label className={labelClass}>Voucher / Autorização</label>
                      <input {...register('voucher')} className={fieldClass} placeholder="Código do voucher" />
                    </div>
                    <div>
                      <label className={labelClass}>Autorizado Por</label>
                      <input {...register('autorizado_por')} className={fieldClass} placeholder="Nome do autorizador" />
                    </div>
                    <div>
                      <label className={labelClass}>Centro de Custo</label>
                      <input {...register('centro_custo_cliente')} className={fieldClass} placeholder="Ex: TI-001" />
                    </div>
                    <div>
                      <label className={labelClass}>Nº Requisição / BU</label>
                      <input {...register('numero_requisicao_bu')} className={fieldClass} placeholder="Número da requisição" />
                    </div>
                    <div>
                      <label className={labelClass}>Divisão / Departamento</label>
                      <input {...register('divisao_departamento')} className={fieldClass} placeholder="Ex: Diretoria, RH" />
                    </div>
                    <div>
                      <label className={labelClass}>Atividade / Motivo</label>
                      <input {...register('atividade_motivo')} className={fieldClass} placeholder="Motivo do transporte" />
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <p className={sectionTitleClass}>🚗 Motorista e Veículo</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Motorista *</label>
                      <select {...register('motorista_id')} className={`${fieldClass} ${errors.motorista_id ? 'border-red-500' : ''}`}>
                        <option value="">Selecione o motorista</option>
                        {motoristas.filter(m => m.status === 'ativo').map(m => (
                          <option key={m.id} value={m.id}>{m.nome} ({m.tipo_vinculo})</option>
                        ))}
                      </select>
                      {errors.motorista_id && <p className="text-red-400 text-xs mt-1">{errors.motorista_id.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Veículo *</label>
                      <select {...register('veiculo_id')} className={`${fieldClass} ${errors.veiculo_id ? 'border-red-500' : ''}`}>
                        <option value="">Selecione o veículo</option>
                        {veiculos.filter(v => v.status === 'ativo').map(v => (
                          <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                        ))}
                      </select>
                      {errors.veiculo_id && <p className="text-red-400 text-xs mt-1">{errors.veiculo_id.message}</p>}
                    </div>
                  </div>

                  {isTerceiro && (
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">⚠️ Motorista Terceiro — Informe o repasse</p>
                      <div>
                        <label className={labelClass}>Repasse ao Motorista (R$)</label>
                        <input {...register('valor_custo_motorista')} type="number" step="0.01" className={fieldClass} placeholder="0.00" />
                      </div>
                    </div>
                  )}
                </div>

                <div className={sectionClass}>
                  <div className="flex items-center justify-between">
                    <p className={sectionTitleClass}>⏰ Cronograma</p>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setValue('data_execucao', format(now, "yyyy-MM-dd'T'HH:mm:ss"));
                        setValue('horario_inicio', format(now, "yyyy-MM-dd'T'HH:mm:ss"));
                      }}
                      className="text-[9px] font-black uppercase tracking-widest bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg transition"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" /> Iniciar Agora
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Check-in (Hora)</label>
                      <input type="time" className={fieldClass}
                        value={getTimeValue(watch('horario_inicio'))}
                        onChange={e => setTimeValue('horario_inicio', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Check-out (Hora)</label>
                      <input type="time" className={fieldClass}
                        value={getTimeValue(watch('horario_fim'))}
                        onChange={e => setTimeValue('horario_fim', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA 2: CLIENTE & TARIFAS ===== */}
            {activeTab === 'cliente' && (
              <div className="space-y-6">
                <div className={sectionClass}>
                  <p className={sectionTitleClass}><Navigation className="w-4 h-4" />Trajeto e Tarifário</p>
                  <div>
                    <label className={labelClass}>Tarifário (Trajeto Cadastrado)</label>
                    <select {...register('tarifario_id')} className={fieldClass}>
                      <option value="">Preenchimento Manual / Sem Tarifário</option>
                      {tarifarios.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.origem} → {t.destino} — R$ {Number(t.valor_venda).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Origem *</label>
                      <input {...register('origem')} className={`${fieldClass} ${errors.origem ? 'border-red-500' : ''}`} placeholder="De onde sai" />
                      {errors.origem && <p className="text-red-400 text-xs mt-1">{errors.origem.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Destino *</label>
                      <input {...register('destino')} className={`${fieldClass} ${errors.destino ? 'border-red-500' : ''}`} placeholder="Para onde vai" />
                      {errors.destino && <p className="text-red-400 text-xs mt-1">{errors.destino.message}</p>}
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <p className={sectionTitleClass}>💰 Financeiro</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Valor do Frete (Venda) *</label>
                      <input {...register('valor_faturamento')} type="number" step="0.01" className={`${fieldClass} ${errors.valor_faturamento ? 'border-red-500' : ''}`} placeholder="0.00" />
                      {errors.valor_faturamento && <p className="text-red-400 text-xs mt-1">{errors.valor_faturamento.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Tipo de Cobrança</label>
                      <select {...register('tipo_cobranca')} className={fieldClass}>
                        <option value="">Selecione</option>
                        <option value="fixo">Fixo</option>
                        <option value="por_km">Por KM</option>
                        <option value="por_hora">Por Hora</option>
                        <option value="por_trecho">Por Trecho</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Forma de Faturamento</label>
                      <select {...register('forma_faturamento')} className={fieldClass}>
                        <option value="">Selecione</option>
                        <option value="nf">Nota Fiscal</option>
                        <option value="recibo">Recibo</option>
                        <option value="boleto">Boleto</option>
                        <option value="pix">PIX</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Classificação do Trajeto</label>
                      <select {...register('classificacao_trajeto')} className={fieldClass}>
                        <option value="">Selecione</option>
                        <option value="urbano">Urbano</option>
                        <option value="intermunicipal">Intermunicipal</option>
                        <option value="interestadual">Interestadual</option>
                        <option value="aeroporto">Aeroporto</option>
                        <option value="executivo">Executivo</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" {...register('possui_retorno')} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm text-white font-medium">Possui retorno (ida e volta)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <p className={sectionTitleClass}>📝 Observações</p>
                  <div>
                    <label className={labelClass}>Observações Gerais</label>
                    <textarea {...register('observacoes_gerais')} rows={3}
                      className={`${fieldClass} resize-none`} placeholder="Informações adicionais sobre a ordem de serviço..." />
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA 3: ROTAS E PARADAS ===== */}
            {activeTab === 'rotas' && (
              <div className="space-y-6">
                <div className={sectionClass}>
                  <p className={sectionTitleClass}><MapPin className="w-4 h-4" />Cadastro de Rotas com Paradas Programadas</p>
                  
                  {/* Visualização da rota */}
                  <div className="space-y-3">
                    
                    {/* Origem */}
                    <div className="flex gap-3 items-stretch">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        {paradas.length > 0 && <div className="w-0.5 flex-1 bg-zinc-700 my-1 min-h-4" />}
                      </div>
                      <div className="flex-1 bg-background border border-border rounded-xl p-3">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Origem (Partida)</p>
                        <p className="text-white font-bold text-sm">{watch('origem') || <span className="text-zinc-600 italic">Não definida ainda</span>}</p>
                        <p className="text-zinc-500 text-xs mt-1">Defina na aba "Cliente & Tarifas"</p>
                      </div>
                    </div>

                    {/* Paradas dinâmicas */}
                    {paradas.map((parada, idx) => (
                      <div key={idx} className="flex gap-3 items-stretch">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-black">
                            {idx + 1}
                          </div>
                          <div className="w-0.5 flex-1 bg-zinc-700 my-1 min-h-4" />
                        </div>
                        <div className="flex-1 bg-background border border-border rounded-xl p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Parada {idx + 1}</p>
                            <button type="button" onClick={() => removeParada(idx)}
                              className="p-1 text-zinc-600 hover:text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                              <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Endereço/Ponto</label>
                              <input
                                type="text"
                                value={parada.endereco_ponto}
                                onChange={e => updateParada(idx, 'endereco_ponto', e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
                                placeholder="Endereço ou local"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Horário Previsto</label>
                              <input
                                type="time"
                                value={parada.horario_previsto}
                                onChange={e => updateParada(idx, 'horario_previsto', e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Observações</label>
                              <input
                                type="text"
                                value={parada.observacoes}
                                onChange={e => updateParada(idx, 'observacoes', e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
                                placeholder="Ex: Coleta de carga"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Botão adicionar parada */}
                    <div className="flex gap-3 items-center">
                      <div className="w-8 flex justify-center flex-shrink-0">
                        <div className="w-0.5 h-full bg-zinc-800" />
                      </div>
                      <button type="button" onClick={addParada}
                        className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-primary hover:text-primary transition-all text-[11px] font-bold uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Adicionar Parada Intermediária
                      </button>
                    </div>

                    {/* Destino */}
                    <div className="flex gap-3 items-stretch">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 bg-background border border-border rounded-xl p-3">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Destino (Final)</p>
                        <p className="text-white font-bold text-sm">{watch('destino') || <span className="text-zinc-600 italic">Não definido ainda</span>}</p>
                        <p className="text-zinc-500 text-xs mt-1">Defina na aba "Cliente & Tarifas"</p>
                      </div>
                    </div>
                  </div>

                  {paradas.length > 0 && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-medium">
                      ℹ️ {paradas.length} parada{paradas.length > 1 ? 's' : ''} programada{paradas.length > 1 ? 's' : ''}. 
                      O motorista receberá esta rota em seu painel e poderá fazer check-in em cada ponto.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer navegação + salvar */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0 bg-surface/50">
            <div className="flex items-center gap-2">
              {activeTab !== 'operacional' && (
                <button type="button" onClick={() => setActiveTab(activeTab === 'rotas' ? 'cliente' : 'operacional')}
                  className="flex items-center gap-2 text-[10px] font-bold text-text-muted hover:text-white uppercase tracking-widest transition">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              {activeTab !== 'rotas' ? (
                <button type="button"
                  onClick={() => setActiveTab(activeTab === 'operacional' ? 'cliente' : 'rotas')}
                  className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-white px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition">
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
              <button type="submit" disabled={isSaving}
                className="flex items-center gap-2 bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingId ? 'Salvar Alterações' : 'Confirmar e Criar OS'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

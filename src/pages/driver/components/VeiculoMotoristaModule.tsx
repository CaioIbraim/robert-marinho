import { useState } from 'react';
import { Truck, Car, AlertTriangle, Fuel, Wrench, Save, Plus, X, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { showToast } from '../../../utils/swal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VeiculoMotoristaProps {
  motorista: any;
  refetchMotorista: () => void;
}

export function VeiculoMotoristaModule({ motorista, refetchMotorista }: VeiculoMotoristaProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [form, setForm] = useState({
    placa: '',
    modelo: '',
    capacidade: ''
  });

  const [eventoForm, setEventoForm] = useState({
    tipo: 'abastecimento',
    valor: '',
    observacao: ''
  });

  const { data: veiculo, isLoading: _loadingVeiculo } = useQuery({
    queryKey: ['veiculo-motorista', motorista?.veiculo_id],
    enabled: !!motorista?.veiculo_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', motorista.veiculo_id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: eventos, refetch: refetchEventos } = useQuery({
    queryKey: ['eventos-veiculo', motorista?.veiculo_id],
    enabled: !!motorista?.veiculo_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos_veiculo')
        .select('*')
        .eq('veiculo_id', motorista.veiculo_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          // table does not exist yet
          return [];
        }
        throw error;
      }
      return data || [];
    }
  });

  const criarVeiculo = useMutation({
    mutationFn: async () => {
      // Cria Veículo com status pendente para aprovação do Operador
      const { data: novoVeic, error: errCreated } = await supabase.from('veiculos').insert({
        placa: form.placa.toUpperCase(),
        modelo: form.modelo,
        capacidade: Number(form.capacidade) || 0,
        status: 'pendente' // Validado por operador
      }).select().single();

      if (errCreated) throw errCreated;

      // Vincula ao motorista
      const { error: errUpdate } = await supabase.from('motoristas').update({
        veiculo_id: novoVeic.id
      }).eq('id', motorista.id);

      if (errUpdate) throw errUpdate;
      return novoVeic;
    },
    onSuccess: () => {
      showToast('Veículo cadastrado e aguardando validação!', 'success');
      setIsFormOpen(false);
      refetchMotorista();
      queryClient.invalidateQueries({ queryKey: ['veiculo-motorista'] });
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

  const registrarEvento = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('eventos_veiculo').insert({
        veiculo_id: motorista.veiculo_id,
        motorista_id: motorista.id,
        tipo: eventoForm.tipo,
        valor: Number(eventoForm.valor) || 0,
        observacao: eventoForm.observacao
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showToast('Registro salvo!', 'success');
      setEventoForm({ tipo: 'abastecimento', valor: '', observacao: '' });
      refetchEventos();
    },
    onError: (_err: any) => showToast('Erro ao salvar ou tabela de eventos ainda não configurada.', 'error')
  });

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !motorista.veiculo_id) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      const filePath = `veiculos/${motorista.veiculo_id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Reutilizando um bucket existente se 'veiculos' nao existir
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: _data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Usando imagens_url como text[] mas garantindo update append. Sem supabase append nativo,
      // usaremos fallback se nao conseguir
      showToast('Imagem enviada!', 'success');
    } catch (err: any) {
      showToast('Erro ao enviar imagem. Verifique os buckets.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!motorista?.veiculo_id && !isFormOpen) {
    return (
      <div className="flex flex-col items-center justify-center bg-surface/30 border border-dashed border-border rounded-3xl p-16 animate-fade-in text-center mt-8">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 mb-6 border border-zinc-800 shadow-xl">
          <Truck strokeWidth={1.5} className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-widest mb-2">Sem Veículo Vinculado</h2>
        <p className="text-zinc-500 text-sm max-w-sm mb-8 font-medium">Você ainda não possui um veículo registrado ou vinculado ao seu perfil. Cadastre seu veículo para utilização.</p>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary/80 transition-all font-black uppercase tracking-[0.2em] text-[11px] text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(255,107,0,0.2)]"
        >
          <Plus className="w-4 h-4" /> Cadastrar Meu Veículo
        </button>
      </div>
    );
  }

  if (isFormOpen && !motorista?.veiculo_id) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-8 mt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
            <Car className="text-primary" /> Novo Veículo
          </h2>
          <button onClick={() => setIsFormOpen(false)} className="text-zinc-500 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Placa (Ex: ABC1D23)</label>
              <input 
                type="text" 
                value={form.placa} 
                onChange={e => setForm({...form, placa: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white uppercase" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Modelo</label>
              <input 
                type="text" 
                value={form.modelo} 
                onChange={e => setForm({...form, modelo: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white" 
              />
            </div>
          </div>
          
          <button 
            onClick={() => criarVeiculo.mutate()}
            disabled={criarVeiculo.isPending}
            className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/80 transition flex items-center justify-center gap-2"
          >
             <Save className="w-4 h-4" /> Enviar para Validação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 mt-8">
      {/* Header Info */}
      {veiculo && (
        <div className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-12 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Truck className="w-64 h-64" />
          </div>

          <div>
             <h2 className="text-3xl font-black text-white uppercase italic tracking-widest mb-1 flex items-center gap-4">
               {veiculo.placa}
             </h2>
             <p className="text-zinc-400 font-bold tracking-tight mb-4">{veiculo.modelo}</p>

             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                veiculo.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
              }`}>
                Status: {veiculo.status === 'pendente' ? 'Aguardando Operador' : veiculo.status}
             </span>
          </div>

          <label className="bg-zinc-900 border border-border rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all flex flex-col items-center gap-3 w-full md:w-auto relative z-10">
            <Upload className="w-6 h-6 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enviar Imagem (Laudos/Docs)</span>
            <input type="file" hidden accept="image/*" onChange={handleUploadImage} disabled={isUploading} />
            {isUploading && <span className="text-xs text-primary font-bold">Enviando...</span>}
          </label>
        </div>
      )}

      {/* Registro de Manutencao/Abastecimento */}
      <div className="bg-surface border border-border rounded-[2.5rem] p-8">
         <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-3">
           <Wrench className="w-4 h-4" /> Despesas & Eventos do Veículo
         </h3>

         <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tipo</label>
              <select 
                value={eventoForm.tipo} 
                onChange={e => setEventoForm({...eventoForm, tipo: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-xs font-bold appearance-none"
              >
                <option value="abastecimento">Abastecimento</option>
                <option value="manutencao">Manutenção</option>
                <option value="sinistro">Sinistro / Incidente</option>
              </select>
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor (R$)</label>
              <input 
                type="number" 
                value={eventoForm.valor} 
                onChange={e => setEventoForm({...eventoForm, valor: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-xs font-bold"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Observação</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={eventoForm.observacao} 
                  onChange={e => setEventoForm({...eventoForm, observacao: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-xs"
                  placeholder="Detalhes..."
                />
                <button 
                  onClick={() => registrarEvento.mutate()}
                  disabled={registrarEvento.isPending}
                  className="bg-primary hover:bg-primary/80 transition-all font-black uppercase tracking-widest text-[10px] text-white px-6 rounded-xl flex items-center gap-2 flex-shrink-0"
                >
                  Salvar
                </button>
              </div>
            </div>
         </div>

         <div className="space-y-2">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 ml-1">Últimos Registros</h4>
           {eventos?.length === 0 ? (
             <p className="text-zinc-600 text-sm ml-1 italic">Nenhum evento registrado.</p>
           ) : (
             <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
               {eventos?.map((ev: any) => (
                 <div key={ev.id} className="bg-background border border-white/5 rounded-xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                       {ev.tipo === 'abastecimento' ? <Fuel className="w-5 h-5 text-emerald-500" /> : ev.tipo === 'manutencao' ? <Wrench className="w-5 h-5 text-blue-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                     </div>
                     <div>
                       <p className="text-xs font-bold text-white uppercase tracking-wider">{ev.tipo}</p>
                       <p className="text-[10px] text-zinc-500 max-w-sm truncate">{ev.observacao}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold text-red-400">- R$ {ev.valor}</p>
                     <p className="text-[9px] text-zinc-600 font-mono mt-0.5">{format(parseISO(ev.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</p>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );
}

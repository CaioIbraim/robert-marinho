import { useState, useEffect } from "react";
import { Send, Clock, MapPin, AlertCircle, Sparkles, Wind, Users as UsersIcon, Loader2, Search, Plus, Trash2 } from "lucide-react";
import { showToast } from "../../../utils/swal";
import { supabase } from "../../../lib/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Parada {
  endereco_ponto: string;
  ordem_parada: number;
}

interface NovaSolicitacaoProps {
  empresaId?: string;
  onSuccess: () => void;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export const NovaSolicitacao = ({ empresaId, onSuccess }: NovaSolicitacaoProps) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState<'origem' | 'destino' | number | null>(null);
  const [form, setForm] = useState({
    motorista_id: '',
    origem: '',
    destino: '',
    data_execucao: '',
    categoria: 'Sedan Executivo',
    passageiro: '',
    observacoes: '',
    climatizacao: '22°C Padrão',
    janelas: 'Fechadas',
    emergencia: false,
    origem_coords: null as [number, number] | null,
    destino_coords: null as [number, number] | null,
    paradas: [] as Parada[]
  });

  useEffect(() => {
    const repeat = localStorage.getItem('rm_repeat_trip');
    if (repeat) {
      const data = JSON.parse(repeat);
      setForm(prev => ({ ...prev, ...data }));
      localStorage.removeItem('rm_repeat_trip');
      showToast('Dados da rota favorita carregados!', 'info');
    }
  }, []);

  const searchAddress = async (type: 'origem' | 'destino' | number) => {
    let query = '';
    if (type === 'origem') query = form.origem;
    else if (type === 'destino') query = form.destino;
    else query = form.paradas[type as number].endereco_ponto;

    if (!query || query.length < 3) return;

    setSearching(type);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        
        if (type === 'origem') {
          setForm(prev => ({ ...prev, origem: display_name, origem_coords: coords }));
        } else if (type === 'destino') {
          setForm(prev => ({ ...prev, destino: display_name, destino_coords: coords }));
        } else {
          const newParadas = [...form.paradas];
          newParadas[type as number].endereco_ponto = display_name;
          setForm(prev => ({ ...prev, paradas: newParadas }));
        }
      } else {
        showToast('Endereço não encontrado. Tente ser mais específico.', 'warning');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(null);
    }
  };

  const addParada = () => {
    setForm(prev => ({
      ...prev,
      paradas: [...prev.paradas, { endereco_ponto: '', ordem_parada: prev.paradas.length + 1 }]
    }));
  };

  const removeParada = (index: number) => {
    const newParadas = form.paradas.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, paradas: newParadas }));
  };

  const checkAvailability = async () => {
    if (!form.motorista_id || !form.data_execucao) return true;
    
    const { data } = await supabase
      .from('ordens_servico')
      .select('id')
      .eq('motorista_id', form.motorista_id)
      .eq('data_execucao', form.data_execucao)
      .neq('status', 'cancelado')
      .limit(1);

    return !(data && data.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        showToast('Este motorista já possui um agendamento para este horário.', 'warning');
        return;
      }

      if (!empresaId) {
        showToast('Nenhuma empresa vinculada ao seu perfil.', 'error');
        return;
      }

      const { data: ordem, error: ordemError } = await supabase.from('ordens_servico').insert({
        empresa_id: empresaId,
        motorista_id: form.motorista_id || null,
        origem: form.origem,
        destino: form.destino,
        data_execucao: form.data_execucao,
        passageiro: form.passageiro,
        observacoes_gerais: `${form.observacoes}\n\n[PREMIUM] Climatização: ${form.climatizacao} | Janelas: ${form.janelas} ${form.emergencia ? '| EMERGÊNCIA' : ''}`,
        status: 'pendente',
        tipo_cobranca: 'FATURADO',
        origem_latitude: form.origem_coords ? form.origem_coords[0] : null,
        origem_longitude: form.origem_coords ? form.origem_coords[1] : null,
        destino_latitude: form.destino_coords ? form.destino_coords[0] : null,
        destino_longitude: form.destino_coords ? form.destino_coords[1] : null,
        origem_lat: form.origem_coords ? form.origem_coords[0] : null,
        origem_lng: form.origem_coords ? form.origem_coords[1] : null,
        destino_lat: form.destino_coords ? form.destino_coords[0] : null,
        destino_lng: form.destino_coords ? form.destino_coords[1] : null,
      }).select().single();

      if (ordemError) throw ordemError;

      if (form.paradas.length > 0 && ordem) {
        const paradasToInsert = form.paradas
          .filter(p => p.endereco_ponto.trim() !== '')
          .map((p, idx) => ({
            ordem_id: ordem.id,
            endereco_ponto: p.endereco_ponto,
            ordem_parada: idx + 1
          }));
        
        if (paradasToInsert.length > 0) {
          const { error: paradasError } = await supabase.from('ordem_servico_paradas').insert(paradasToInsert);
          if (paradasError) console.error("Erro ao salvar paradas:", paradasError);
        }
      }

      showToast('Solicitação enviada com sucesso!', 'success');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter: [number, number] = form.origem_coords || [-23.5505, -46.6333];

  return (
    <div className="max-w-5xl animate-fade-in pb-20">
       <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="h-[400px] lg:h-[700px] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {form.origem_coords && (
                  <Marker position={form.origem_coords}>
                    <Popup>Saída: {form.origem}</Popup>
                  </Marker>
                )}
                {form.destino_coords && (
                  <Marker position={form.destino_coords}>
                    <Popup>Chegada: {form.destino}</Popup>
                  </Marker>
                )}
                <ChangeView center={mapCenter} zoom={13} />
              </MapContainer>
              <div className="absolute top-6 left-6 z-[1000] bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                 <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1 italic">Exclusive LeafMap</p>
                 <p className="text-white font-bold text-xs">Rota Inteligente</p>
              </div>
            </div>
            
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 flex items-center gap-4">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-white font-bold text-sm leading-tight text-zinc-400">Precisão geográfica garantida para a melhor experiência Robert Marinho.</p>
               </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-[40px] p-6 md:p-12 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden h-fit">
            {form.emergencia && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
            )}
            
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Reservar Agora</h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Configure seu itinerário</p>
               </div>
               <button 
                  type="button"
                  onClick={() => setForm({...form, emergencia: !form.emergencia})}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.emergencia ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  {form.emergencia ? '🚨 Emergência' : 'Emergência?'}
               </button>
            </div>

            <div className="grid gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-red-500" /> Ponto de Saída</span>
                    {searching === 'origem' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  </label>
                  <div className="relative">
                    <input 
                      required
                      value={form.origem}
                      onChange={e => setForm({...form, origem: e.target.value})}
                      onBlur={() => searchAddress('origem')}
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:border-primary transition-all text-sm text-white" 
                      placeholder="Busque o endereço de origem..." 
                    />
                    <button type="button" onClick={() => searchAddress('origem')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition">
                       <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {form.paradas.length > 0 && (
                  <div className="space-y-4 py-2 border-l-2 border-dashed border-zinc-800 ml-6 pl-6">
                    {form.paradas.map((parada, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center justify-between">
                          <span>Parada #{idx + 1}</span>
                          {searching === idx && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              value={parada.endereco_ponto}
                              onChange={e => {
                                const newParadas = [...form.paradas];
                                newParadas[idx].endereco_ponto = e.target.value;
                                setForm({...form, paradas: newParadas});
                              }}
                              onBlur={() => searchAddress(idx)}
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-primary transition-all text-xs text-zinc-300" 
                              placeholder="Endereço da parada..." 
                            />
                            <button type="button" onClick={() => searchAddress(idx)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition">
                               <Search className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeParada(idx)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  type="button" 
                  onClick={addParada}
                  className="w-full py-3 bg-zinc-950 border border-zinc-800 border-dashed rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Adicionar Parada Intermediária
                </button>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-green-500" /> Ponto de Chegada</span>
                    {searching === 'destino' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  </label>
                  <div className="relative">
                    <input 
                      required
                      value={form.destino}
                      onChange={e => setForm({...form, destino: e.target.value})}
                      onBlur={() => searchAddress('destino')}
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:border-primary transition-all text-sm text-white" 
                      placeholder="Busque o endereço de destino..." 
                    />
                    <button type="button" onClick={() => searchAddress('destino')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition">
                       <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Data e Hora</label>
                  <input 
                    required
                    value={form.data_execucao}
                    onChange={e => setForm({...form, data_execucao: e.target.value})}
                    type="datetime-local" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all text-sm text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Passageiro</label>
                  <input 
                    required
                    value={form.passageiro}
                    onChange={e => setForm({...form, passageiro: e.target.value})}
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all text-sm text-white" 
                    placeholder="Nome completo..." 
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Instruções VIP
                </label>
                <textarea 
                  value={form.observacoes}
                  onChange={e => setForm({...form, observacoes: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl px-6 py-4 h-24 focus:outline-none focus:border-primary transition-all resize-none text-sm text-white" 
                  placeholder="Ex: Água sem gás, temperatura do ar, trajetos específicos..."
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${form.emergencia ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' : 'bg-primary hover:bg-red-700 text-white shadow-primary/20'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {form.emergencia ? 'Disparar Agendamento de Emergência' : 'Confirmar Solicitação Premium'}
              </button>
            </div>
          </div>
       </form>
    </div>
  );
};

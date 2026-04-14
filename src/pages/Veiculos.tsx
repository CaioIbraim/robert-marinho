import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2} from 'lucide-react';
import { veiculoSchema } from '../schemas';
import type { VeiculoFormData } from '../schemas';
import { veiculoService } from '../services/veiculos.service';
import type { Veiculo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Veiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema) as any,
  });

  const loadVeiculos = async () => {
    try {
      const data = await veiculoService.getAll();
      setVeiculos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVeiculos();
  }, []);

  const onSubmit: SubmitHandler<VeiculoFormData> = async (data) => {
    try {
      if (editingId) {
        await veiculoService.update(editingId, data);
      } else {
        await veiculoService.create(data);
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadVeiculos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingId(veiculo.id);
    reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      capacidade: veiculo.capacidade,
      status: veiculo.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este veículo?')) {
      try {
        await veiculoService.delete(id);
        loadVeiculos();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredVeiculos = veiculos.filter(v => 
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Veículos</h1>
          <p className="text-text-muted">Gerencie a frota de veículos.</p>
        </div>
        <Button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="flex gap-2">
          <Plus size={20} /> Novo Veículo
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa ou modelo..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Capacidade (kg)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : filteredVeiculos.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Nenhum veículo encontrado.</td></tr>
              ) : filteredVeiculos.map((veiculo) => (
                <tr key={veiculo.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary uppercase">{veiculo.placa}</td>
                  <td className="px-6 py-4 font-medium text-white">{veiculo.modelo}</td>
                  <td className="px-6 py-4 text-text-muted">{veiculo.capacidade || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-border/50 text-text-muted text-[10px] uppercase font-bold">
                      {veiculo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(veiculo)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(veiculo.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
               close
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Placa"
                  placeholder="ABC-1234"
                  error={errors.placa?.message}
                  {...register('placa')}
                />
                <Input
                  label="Modelo"
                  placeholder="Ex: FH 540"
                  error={errors.modelo?.message}
                  {...register('modelo')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Capacidade (kg)"
                  type="number"
                  placeholder="Ex: 10000"
                  error={errors.capacidade?.message}
                  {...register('capacidade')}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Status</label>
                  <select 
                    {...register('status')}
                    className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Criar Veículo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

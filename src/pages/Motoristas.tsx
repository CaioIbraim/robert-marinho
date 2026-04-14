import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, X, User } from 'lucide-react';
import { motoristaSchema } from '../schemas';
import type { MotoristaFormData } from '../schemas';
import { motoristaService } from '../services/motoristas.service';
import type { Motorista } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Motoristas = () => {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
  });

  const loadMotoristas = async () => {
    try {
      const data = await motoristaService.getAll();
      setMotoristas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMotoristas();
  }, []);

  const onSubmit = async (data: MotoristaFormData) => {
    try {
      if (editingId) {
        await motoristaService.update(editingId, data);
      } else {
        await motoristaService.create(data);
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadMotoristas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (motorista: Motorista) => {
    setEditingId(motorista.id);
    reset({
      nome: motorista.nome,
      cpf: motorista.cpf,
      telefone: motorista.telefone,
      cnh: motorista.cnh,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este motorista?')) {
      try {
        await motoristaService.delete(id);
        loadMotoristas();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredMotoristas = motoristas.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Motoristas</h1>
          <p className="text-text-muted">Gerencie os motoristas da frota.</p>
        </div>
        <Button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="flex gap-2">
          <Plus size={20} /> Novo Motorista
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
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
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">CNH</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : filteredMotoristas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Nenhum motorista encontrado.</td></tr>
              ) : filteredMotoristas.map((motorista) => (
                <tr key={motorista.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={16} />
                      </div>
                      <span className="font-medium text-white">{motorista.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{motorista.cpf}</td>
                  <td className="px-6 py-4 text-text-muted">{motorista.telefone}</td>
                  <td className="px-6 py-4 text-text-muted">{motorista.cnh}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(motorista)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(motorista.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
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
                {editingId ? 'Editar Motorista' : 'Novo Motorista'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
               <Input
                label="Nome Completo"
                placeholder="Ex: João Silva"
                error={errors.nome?.message}
                {...register('nome')}
              />
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                {...register('cpf')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  error={errors.telefone?.message}
                  {...register('telefone')}
                />
                <Input
                  label="CNH"
                  placeholder="Número da CNH"
                  error={errors.cnh?.message}
                  {...register('cnh')}
                />
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Criar Motorista'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

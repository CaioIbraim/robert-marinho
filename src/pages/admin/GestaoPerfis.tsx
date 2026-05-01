import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Shield, 
  Search, 
  Edit3, 
  CheckCircle, 
  XCircle,
  Building2, 
  UserCircle,
  Loader2,
  Save,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { showToast } from '../../utils/swal';
import type { UserProfile, Empresa, Motorista } from '../../types';

export function GestaoPerfis() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPerfil, setEditingPerfil] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserProfile['role'] | ''>('');
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string>('');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [cpfSincronizacao, setCpfSincronizacao] = useState<string>('');

  // 1. Fetch Perfis
  const { data: perfis, isLoading: loadingPerfis } = useQuery({
    queryKey: ['admin-all-perfis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // 2. Fetch Motoristas (todas para vincular)
  const { data: motoristas } = useQuery({
    queryKey: ['admin-list-motoristas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('motoristas').select('*').order('nome');
      if (error) throw error;
      return data as Motorista[];
    }
  });

  // 3. Fetch Empresas (todas para vincular)
  const { data: empresas } = useQuery({
    queryKey: ['admin-list-empresas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('empresas').select('id, razao_social, perfil_id').order('razao_social');
      if (error) throw error;
      return data as Empresa[];
    }
  });

  const syncMotoristaMutation = useMutation({
    mutationFn: async (vars: { cpf: string, perfil: UserProfile }) => {
      if (!vars.cpf) throw new Error("CPF é obrigatório para sincronização.");
      
      const { data: existing } = await supabase
        .from('motoristas')
        .select('*')
        .or(`cpf.eq.${vars.cpf},perfil_id.eq.${vars.perfil.id}`)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('motoristas')
          .update({ 
            cpf: vars.cpf,
            perfil_id: vars.perfil.id,
            nome: vars.perfil.full_name || 'Motorista sem Nome',
            email: vars.perfil.email,
            status: existing.status === 'pendente' ? 'ativo' : existing.status
          })
          .eq('id', existing.id);
        if (error) throw error;
        return { mode: 'update', id: existing.id };
      } else {
        const { data: created, error } = await supabase
          .from('motoristas')
          .insert({
            cpf: vars.cpf,
            perfil_id: vars.perfil.id,
            nome: vars.perfil.full_name || 'Motorista sem Nome',
            email: vars.perfil.email,
            status: 'ativo',
            telefone: '(00) 00000-0000', // Valor padrão para evitar erro de NOT NULL se houver
            tipo_vinculo: 'terceiro',   // Valor padrão razoável
            cnh: '0000000000'           // Valor padrão para evitar erro
          })
          .select('id')
          .single();
        if (error) throw error;
        return { mode: 'create', id: created.id };
      }
    },
    onSuccess: (res) => {
      showToast(`Base de motoristas sincronizada (${res.mode === 'create' ? 'Novo Registro' : 'Atualizado'})`);
      queryClient.invalidateQueries({ queryKey: ['admin-list-motoristas'] });
      if (res.id) setSelectedMotoristaId(res.id);
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { perfilId: string, role: string, motoristaId: string, empresaId: string }) => {
      if (vars.motoristaId && vars.empresaId) {
        throw new Error("Um perfil não pode estar vinculado a um motorista e uma empresa simultaneamente.");
      }

      const { error: perfilErr } = await supabase.from('perfis').update({
        role: vars.role
      }).eq('id', vars.perfilId);
      if (perfilErr) throw perfilErr;

      await supabase.from('motoristas').update({ perfil_id: null }).eq('perfil_id', vars.perfilId);
      await supabase.from('empresas').update({ perfil_id: null }).eq('perfil_id', vars.perfilId);

      if (vars.motoristaId) {
        const { error: motErr } = await supabase.from('motoristas').update({ perfil_id: vars.perfilId }).eq('id', vars.motoristaId);
        if (motErr) throw motErr;
      }

      if (vars.empresaId) {
        const { error: empErr } = await supabase.from('empresas').update({ perfil_id: vars.perfilId }).eq('id', vars.empresaId);
        if (empErr) throw empErr;
      }
    },
    onSuccess: () => {
      showToast('Perfil atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-all-perfis'] });
      queryClient.invalidateQueries({ queryKey: ['admin-list-motoristas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-list-empresas'] });
      setEditingPerfil(null);
    },
    onError: (err: any) => {
      showToast(err.message, 'error');
    }
  });

  const handleStartEdit = (perfil: UserProfile) => {
    setEditingPerfil(perfil);
    setNewRole(perfil.role);
    
    const linkedMot = motoristas?.find(m => m.perfil_id === perfil.id);
    setSelectedMotoristaId(linkedMot?.id || '');
    setCpfSincronizacao(perfil.cpf || linkedMot?.cpf || '');

    const linkedEmp = empresas?.find(e => e.perfil_id === perfil.id);
    setSelectedEmpresaId(linkedEmp?.id || '');
  };

  const filteredPerfis = perfis?.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gestão de Perfis & Acessos
          </h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Controle Administrativo Total</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-primary/50 w-full md:w-80 transition-all"
          />
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-white/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Usuário</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Nível</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Vínculos Ativos</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingPerfis ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredPerfis?.map(perfil => {
                const linkedMot = motoristas?.find(m => m.perfil_id === perfil.id);
                const linkedEmp = empresas?.find(e => e.perfil_id === perfil.id);

                return (
                  <tr key={perfil.id} className="hover:bg-white/5 transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-black text-sm">
                          {perfil.avatar_url ? <img src={perfil.avatar_url} className="w-full h-full object-cover rounded-xl" /> : (perfil.full_name?.charAt(0) || '?')}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm tracking-tight">{perfil.full_name || 'Usuário RM'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{perfil.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         perfil.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                         perfil.role === 'operador' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                         perfil.role === 'motorista' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                         'bg-blue-500/10 text-blue-500 border-blue-500/20'
                       }`}>
                         {perfil.role}
                       </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {linkedMot && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 rounded-lg text-[9px] font-bold text-zinc-300 border border-white/5">
                            <UserCircle className="w-3 h-3 text-green-500" /> {linkedMot.nome}
                          </span>
                        )}
                        {linkedEmp && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 rounded-lg text-[9px] font-bold text-zinc-300 border border-white/5">
                            <Building2 className="w-3 h-3 text-blue-500" /> {linkedEmp.razao_social}
                          </span>
                        )}
                        {!linkedMot && !linkedEmp && <span className="text-[10px] text-zinc-600 italic">Sem vínculos</span>}
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${perfil.status === 'aprovado' ? 'text-green-500' : 'text-zinc-700'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{perfil.status}</span>
                       </div>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => handleStartEdit(perfil)}
                        className="p-3 text-zinc-500 hover:text-primary transition-colors bg-white/5 rounded-xl border border-white/5 hover:border-primary/20"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingPerfil && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-zinc-950 w-full max-w-xl border border-white/10 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
             
             <button 
               onClick={() => setEditingPerfil(null)}
               className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
             >
               <XCircle className="w-6 h-6" />
             </button>

             <header className="mb-10 text-center">
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Editar Autorizações</h2>
               <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-1">{editingPerfil.full_name}</p>
             </header>

             <div className="space-y-8">
               {/* ROLE SELECT */}
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Nível de Acesso (Role)
                 </label>
                 <select 
                   value={newRole}
                   onChange={e => setNewRole(e.target.value as any)}
                   className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all text-sm appearance-none font-bold"
                 >
                   <option value="cliente">Cliente (Passageiro/Empresa)</option>
                   <option value="motorista">Motorista (Execução)</option>
                   <option value="operador">Operador (Gestão Operacional)</option>
                   <option value="admin">Administrador (Total)</option>
                 </select>
               </div>

               {/* VINCULOS */}
               <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Configurar Vínculos Exclusivos
                 </p>

                 {/* MOTORISTA LINK */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                      <UserCircle className="w-3 h-3" /> Vincular como Motorista
                    </label>
                    <select 
                      value={selectedMotoristaId}
                      onChange={e => {
                        setSelectedMotoristaId(e.target.value);
                        if (e.target.value) setSelectedEmpresaId('');
                        const mot = motoristas?.find(m => m.id === e.target.value);
                        if (mot?.cpf) setCpfSincronizacao(mot.cpf);
                      }}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                    >
                      <option value="">Nenhum Motorista</option>
                      {motoristas?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nome} {m.perfil_id && m.perfil_id !== editingPerfil.id ? '(Ocupado)' : ''}
                        </option>
                      ))}
                    </select>

                    {newRole === 'motorista' && (
                      <div className="pt-4 border-t border-white/5 mt-4 space-y-3">
                         <p className="text-[9px] font-black uppercase text-primary tracking-widest">Sincronização por CPF</p>
                         <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="CPF para vincular/criar"
                              value={cpfSincronizacao}
                              onChange={e => setCpfSincronizacao(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs focus:border-primary transition-all text-white"
                            />
                            <button 
                              onClick={() => syncMotoristaMutation.mutate({ cpf: cpfSincronizacao, perfil: editingPerfil! })}
                              disabled={syncMotoristaMutation.isPending}
                              className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                            >
                               {syncMotoristaMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sincronizar"}
                            </button>
                         </div>
                      </div>
                    )}
                 </div>

                 {/* EMPRESA LINK */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> Vincular como Gestor de Empresa
                    </label>
                    <select 
                      value={selectedEmpresaId}
                      onChange={e => {
                        setSelectedEmpresaId(e.target.value);
                        if (e.target.value) setSelectedMotoristaId(''); // Mutual Exclusivity
                      }}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                    >
                      <option value="">Nenhuma Empresa</option>
                      {empresas?.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.razao_social} {e.perfil_id && e.perfil_id !== editingPerfil.id ? '(Ocupado)' : ''}
                        </option>
                      ))}
                    </select>
                 </div>

                 <div className="flex gap-2 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-500/80 leading-relaxed font-bold">
                       Lembre-se: Vincular um perfil a uma entidade desvinculará qualquer vínculo anterior. 
                       Regra comercial: Perfis não podem ser Motorista e Empresa simultaneamente.
                    </p>
                 </div>
               </div>

               <button 
                 onClick={() => updateMutation.mutate({ 
                   perfilId: editingPerfil.id, 
                   role: newRole || editingPerfil.role,
                   motoristaId: selectedMotoristaId,
                   empresaId: selectedEmpresaId
                 })}
                 disabled={updateMutation.isPending}
                 className="w-full bg-white text-zinc-950 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all shadow-2xl shadow-black/30 disabled:opacity-50"
               >
                 {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Salvar Alterações Críticas
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, Users, Eye, Loader2, Shield, AlertTriangle, Key, Copy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { showToast, showConfirm } from '../../utils/swal';

type PerfilPendente = {
  id: string;
  email: string | null;
  full_name: string | null;
  nome: string | null;
  role: string | null;
  aprovado_operador: boolean;
  created_at: string;
  // Campos extras para leads que ainda não tem perfil
  tipo_lead?: 'empresa' | 'motorista';
  razao_social?: string;
  cpf?: string;
  telefone?: string;
};

const WHATSAPP_ADMIN = '5521993306919';

// Gera senha aleatória forte
function gerarSenhaAleatoria(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const syms = '@#$!&*';
  const all = upper + lower + nums + syms;
  let senha = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    syms[Math.floor(Math.random() * syms.length)],
  ];
  for (let i = 0; i < 8; i++) senha.push(all[Math.floor(Math.random() * all.length)]);
  return senha.sort(() => Math.random() - 0.5).join('');
}

export function AprovacaoUsuarios() {
  const queryClient = useQueryClient();
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilPendente | null>(null);
  const [viewMode, setViewMode] = useState<'pendentes' | 'aprovados'>('pendentes');
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<{ email: string; pass: string } | null>(null);

  const { data: perfis, isLoading } = useQuery({
    queryKey: ['perfis-aprovacao', viewMode],
    queryFn: async () => {
      // 1. Busca perfis pendentes
      const { data: perfisData, error: perfisErr } = await supabase
        .from('perfis')
        .select('*')
        .eq('status', viewMode === 'aprovados' ? 'aprovado' : 'pendente')
        .order('created_at', { ascending: false });

      // 2. Busca leads de empresas pendentes
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'pendente');

      // 3. Busca leads de motoristas pendentes
      const { data: motoristasData } = await supabase
        .from('motoristas')
        .select('*')
        .eq('status', 'pendente');

      if (perfisErr) throw perfisErr;

      const unified: PerfilPendente[] = (perfisData as PerfilPendente[]) || [];

      // Unifica leads de empresas
      empresasData?.forEach(e => {
        if (!unified.some(p => p.email === e.email)) {
          unified.push({
            id: e.id,
            email: e.email,
            full_name: e.nome_fantasia || e.razao_social,
            nome: e.razao_social,
            role: 'cliente',
            aprovado_operador: false,
            created_at: e.created_at,
            tipo_lead: 'empresa',
            telefone: e.telefone
          });
        }
      });

      // Unifica leads de motoristas
      motoristasData?.forEach(m => {
        if (!unified.some(p => p.email === m.email)) {
          unified.push({
            id: m.id,
            email: m.email,
            full_name: m.nome,
            nome: m.nome,
            role: 'motorista',
            aprovado_operador: false,
            created_at: m.created_at,
            tipo_lead: 'motorista',
            cpf: m.cpf,
            telefone: m.telefone
          });
        }
      });

      return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  });

  const aprovaMutation = useMutation({
    mutationFn: async (perfil: PerfilPendente) => {
      const senha = gerarSenhaAleatoria();
      let authUserId = perfil.id;

      // Se for um Lead (Pré-cadastro), precisamos criar a conta no Auth primeiro
      if (perfil.tipo_lead) {
        // Criamos um client temporário para não deslogar o admin
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false } }
        );

        const { data: authData, error: authErr } = await tempClient.auth.signUp({
          email: perfil.email || '',
          password: senha,
          options: {
            data: {
              full_name: perfil.full_name || perfil.nome,
              role: perfil.role,
            }
          }
        });

        if (authErr) throw authErr;
        if (!authData.user) throw new Error("Falha ao criar usuário no Auth.");
        
        authUserId = authData.user.id;

        // Cria o registro na tabela perfis vinculado ao novo Auth User
        const { error: perfilErr } = await supabase.from('perfis').insert({
          id: authUserId,
          email: perfil.email,
          full_name: perfil.full_name || perfil.nome,
          role: perfil.role,
          status: 'aprovado',
          aprovado_operador: true
        });
        if (perfilErr) throw perfilErr;

        // Vincula o perfil ao registro original (empresa ou motorista)
        if (perfil.tipo_lead === 'empresa') {
          await supabase.from('empresas').update({ 
            status: 'ativo',
            // Se houver campo perfil_id ou similar em empresas (no schema não vi, mas pode existir)
          }).eq('id', perfil.id);
        } else if (perfil.tipo_lead === 'motorista') {
          await supabase.from('motoristas').update({ 
            status: 'ativo',
            perfil_id: authUserId 
          }).eq('id', perfil.id);
        }
      } else {
        // Fluxo normal para quem já tem Perfil/Auth (pendente)
        const { error } = await supabase
          .from('perfis')
          .update({ status: 'aprovado', aprovado_operador: true })
          .eq('id', perfil.id);
        if (error) throw error;
      }

      // 3. Notificação interna (se tivermos o ID do usuário)
      if (authUserId) {
        await supabase.from('notificacoes').insert({
          user_id: authUserId,
          titulo: 'Acesso Liberado!',
          mensagem: `Seu cadastro foi aprovado! Sua senha temporária é: ${senha}`,
          tipo: 'success',
          link: '/portal/login'
        });
      }

      return { perfil, senha };
    },
    onSuccess: ({ perfil, senha }) => {
      setLastGeneratedPassword({ email: perfil.email || '', pass: senha });
      showToast(`Acesso de ${perfil.full_name || perfil.email} aprovado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['perfis-aprovacao'] });
      setSelectedPerfil(null);
    },
    onError: (err: any) => {
      console.error(err);
      showToast(err.message || 'Erro ao aprovar usuário', 'error');
    }
  });

  const rejeitaMutation = useMutation({
    mutationFn: async (perfil: PerfilPendente) => {
      if (perfil.tipo_lead === 'empresa') {
        await supabase.from('empresas').delete().eq('id', perfil.id);
      } else if (perfil.tipo_lead === 'motorista') {
        await supabase.from('motoristas').delete().eq('id', perfil.id);
      } else {
        await supabase.from('perfis').delete().eq('id', perfil.id);
      }
    },
    onSuccess: () => {
      showToast('Cadastro rejeitado e removido.', 'error');
      queryClient.invalidateQueries({ queryKey: ['perfis-aprovacao'] });
      setSelectedPerfil(null);
    }
  });

  const handleAprovar = async (perfil: PerfilPendente) => {
    const result = await showConfirm(
      'Aprovar acesso?',
      `Confirma a aprovação de ${perfil.full_name || perfil.email}?\n\nUma conta será criada e uma senha temporária será gerada para o usuário.`
    );
    if (result.isConfirmed) aprovaMutation.mutate(perfil);
  };

  const handleRejeitar = async (perfil: PerfilPendente) => {
    const result = await showConfirm(
      'Rejeitar cadastro?',
      `Deseja rejeitar e remover o cadastro de ${perfil.full_name || perfil.email}? Esta ação é irreversível.`
    );
    if (result.isConfirmed) rejeitaMutation.mutate(perfil);
  };

  const getWhatsAppLink = (perfil: PerfilPendente) => {
    const text = `✅ *Robert Marinho Logística* — Seu acesso foi aprovado!\n\nOlá ${perfil.full_name || ''},\n\nSeu cadastro foi liberado. Por favor, acesse o link abaixo e redefina sua senha:\n\n🔗 ${window.location.origin}/portal/login\n\nAtenciosamente,\nEquipe Robert Marinho Logística\nwww.robertmarinho.com.br`;
    return `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(text)}`;
  };

  const roleLabel: Record<string, { label: string; color: string }> = {
    cliente: { label: 'Cliente', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    motorista: { label: 'Motorista', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    operador: { label: 'Operador', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    admin: { label: 'Admin', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            Aprovação de Cadastros
          </h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os acessos de usuários pendentes de aprovação.</p>
        </div>
        {viewMode === 'pendentes' && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            {perfis?.length ?? 0} Pendentes
          </div>
        )}
      </div>
      
      {/* Alerta de Senha Gerada */}
      {lastGeneratedPassword && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
              <Key className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-green-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Conta Criada com Sucesso</p>
              <p className="text-white font-bold truncate">{lastGeneratedPassword.email}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-background/50 px-4 py-3 rounded-xl border border-border flex items-center gap-4">
              <span className="text-text-muted text-[10px] font-bold uppercase whitespace-nowrap">Senha Temporária:</span>
              <span className="text-white font-mono font-bold tracking-wider">{lastGeneratedPassword.pass}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(lastGeneratedPassword.pass);
                  showToast('Senha copiada!', 'success');
                }}
                className="text-primary hover:text-red-500 transition-colors p-1"
                title="Copiar Senha"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setLastGeneratedPassword(null)}
              className="text-text-muted hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-border rounded-xl hover:bg-white/5 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit">
        {(['pendentes', 'aprovados'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${viewMode === m ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'}`}>
            {m === 'pendentes' ? '⏳ Pendentes' : '✅ Aprovados'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-10 h-10 text-primary" />
        </div>
      ) : perfis?.length === 0 ? (
        <div className="py-20 text-center bg-surface/30 rounded-2xl border border-dashed border-border">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-text-muted text-sm">
            {viewMode === 'pendentes' ? 'Nenhum cadastro aguardando aprovação.' : 'Nenhum usuário aprovado ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {perfis?.map(perfil => (
            <div key={perfil.id}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-all">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black flex-shrink-0">
                {(perfil.full_name || perfil.email || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white">{perfil.full_name || perfil.nome || '—'}</p>
                  {perfil.role && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${roleLabel[perfil.role]?.color || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}`}>
                      {roleLabel[perfil.role]?.label || perfil.role}
                    </span>
                  )}
                  {perfil.tipo_lead && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                      PRÉ-CADASTRO
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-sm">{perfil.email}</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Cadastrado em {format(parseISO(perfil.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {viewMode === 'pendentes' ? (
                  <>
                    <button onClick={() => setSelectedPerfil(perfil === selectedPerfil ? null : perfil)}
                      className="p-2 rounded-xl bg-background border border-border text-text-muted hover:text-white transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRejeitar(perfil)}
                      disabled={rejeitaMutation.isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleAprovar(perfil)}
                      disabled={aprovaMutation.isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50">
                      {aprovaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Aprovar
                    </button>
                  </>
                ) : (
                  <a href={getWhatsAppLink(perfil)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/20 transition">
                    💬 WhatsApp
                  </a>
                )}
              </div>

              {/* Detalhes expansíveis */}
              {selectedPerfil?.id === perfil.id && (
                <div className="w-full sm:col-span-full mt-2 p-4 bg-background rounded-xl border border-border text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-widest font-bold">ID do Perfil</p>
                      <p className="text-white font-mono text-xs">{perfil.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Função Solicitada</p>
                      <p className="text-white">{roleLabel[perfil.role || '']?.label || perfil.role || '—'}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-text-muted mb-2 font-bold uppercase tracking-widest">Notificar via WhatsApp manualmente:</p>
                    <a href={getWhatsAppLink(perfil)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-green-400 hover:underline">
                      💬 Enviar mensagem de aprovação
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

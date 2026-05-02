import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { X, Key, Loader2, Save } from 'lucide-react';
import { showToast } from '../../../utils/swal';

export function RedefinirSenhaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (senha.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'warning');
      return;
    }
    if (senha !== confirmSenha) {
      showToast('As senhas não coincidem.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      showToast('Senha redefinida com sucesso!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao redefinir senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-widest text-center">Redefinir Senha</h2>
          <p className="text-xs text-zinc-500 text-center mt-1">Sua nova senha deve ter no mínimo 6 caracteres</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Nova Senha</label>
            <input 
              type="password" 
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              value={confirmSenha}
              onChange={e => setConfirmSenha(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/80 transition shadow-[0_10px_20px_rgba(255,107,0,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Confirmar Alteração
          </button>
        </div>
      </div>
    </div>
  );
}

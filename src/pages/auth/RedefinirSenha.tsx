import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { senhaFortaSchema } from '../../schemas';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', ok: /[a-z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
    { label: 'Símbolo (@, #, !...)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  return (
    <div className="space-y-3">
      {/* Barra de força */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= score ? colors[score - 1] : 'bg-zinc-800'}`} />
        ))}
      </div>
      {password.length > 0 && (
        <p className={`text-xs font-bold ${score < 3 ? 'text-red-400' : score < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
          {labels[score - 1] || ''}
        </p>
      )}

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-2 text-xs transition-colors ${c.ok ? 'text-green-400' : 'text-zinc-600'}`}>
            {c.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const senhaResult = password ? senhaFortaSchema.safeParse(password) : null;
  const senhaValida = senhaResult?.success ?? false;
  const senhaError = (!senhaResult?.success && senhaResult?.error?.issues?.length) ? senhaResult.error.issues[0].message : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senhaValida) {
      setError(senhaError || 'Senha não atende aos requisitos.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {success ? (
          <div className="text-center space-y-6 bg-zinc-900/60 rounded-3xl p-12 border border-white/5">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Senha Redefinida!</h2>
            <p className="text-zinc-500">Sua nova senha foi salva com sucesso. Redirecionando para o login...</p>
          </div>
        ) : (
          <div className="bg-zinc-900/60 rounded-3xl p-8 border border-white/5 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Redefinir Senha</h2>
              <p className="text-zinc-500 text-sm">
                Por segurança, defina uma nova senha forte para o seu acesso.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nova Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 pl-12 pr-12 rounded-2xl text-white outline-none transition-all"
                    placeholder="Nova senha forte..."
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && <PasswordStrengthBar password={password} />}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Confirmar Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className={`w-full bg-zinc-900 border py-4 pl-12 pr-12 rounded-2xl text-white outline-none transition-all ${
                      confirm && confirm !== password ? 'border-red-500' : 'border-zinc-800 focus:border-primary'
                    }`}
                    placeholder="Repita a senha..."
                  />
                  <button type="button" onClick={() => setShowConfirmPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> As senhas não coincidem
                  </p>
                )}
                {confirm && confirm === password && senhaValida && (
                  <p className="text-green-400 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Senhas coincidem
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !senhaValida || password !== confirm}
                className="w-full h-14 bg-primary hover:bg-red-700 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Salvando...' : 'Confirmar Nova Senha'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

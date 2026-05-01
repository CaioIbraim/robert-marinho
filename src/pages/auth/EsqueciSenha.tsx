import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, ArrowRight, ShieldQuestion } from 'lucide-react';
import { showToast } from '../../utils/swal';

export const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;
      setSent(true);
      showToast('E-mail de recuperação enviado!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao enviar e-mail', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-8 group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar para Login</span>
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2rem] mb-6 border border-primary/20 shadow-2xl shadow-primary/5">
             <ShieldQuestion className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">Recuperar Senha</h1>
          <p className="text-text-muted text-lg tracking-tight">
            Esqueceu sua chave? Não se preocupe, vamos te enviar um link de redefinição.
          </p>
        </div>

        <div className="bg-surface border border-border p-8 rounded-[2.5rem] shadow-2xl">
          {!sent ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">E-mail de Cadastro</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-white input-focus transition-all"
                    placeholder="seu@e-mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest group shadow-lg shadow-primary/20"
                isLoading={loading}
              >
                Enviar Link <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-6 animate-fade-in">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-3xl">
                <p className="text-sm font-bold leading-relaxed">
                  Verifique sua caixa de entrada! Enviamos as instruções de recuperação para <span className="text-white">{email}</span>.
                </p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSent(false)}
                className="text-text-muted hover:text-white"
              >
                Tentar outro e-mail
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

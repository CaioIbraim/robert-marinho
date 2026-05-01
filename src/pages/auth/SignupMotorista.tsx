import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/swal';
import { Truck, Mail, Lock, User, ArrowRight } from 'lucide-react';

export const SignupMotorista = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (form.password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);

      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.nome,
            role: 'motorista',
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Criar Perfil explicitamente (Garante que apareça na gestão como pendente)
        const { error: perfilErr } = await supabase.from('perfis').upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.nome,
          role: 'motorista',
          cpf: form.cpf,
          status: 'pendente',
          aprovado_operador: false
        });

        if (perfilErr) console.error("Erro ao criar perfil:", perfilErr);

        // 3. Criar registro na tabela motoristas (Lead para aprovação)
        const { error: motErr } = await supabase.from('motoristas').insert({
          perfil_id: data.user.id,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cpf: form.cpf,
          status: 'pendente'
        });

        if (motErr) console.error("Erro ao criar motorista:", motErr);

        showToast('Cadastro realizado! Aguarde a aprovação do administrador.', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao criar conta', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Portal do Motorista</h1>
          <p className="text-text-muted mt-2">Cadastre-se para começar a realizar serviços.</p>
        </div>

        <div className="bg-surface border border-border p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="email"
                  required
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Telefone</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input
                    type="text"
                    required
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">CPF</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input
                    type="text"
                    required
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input
                    type="password"
                    required
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                    placeholder="••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Confirmar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input
                    type="password"
                    required
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white input-focus"
                    placeholder="••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest group"
              disabled={loading}
              isLoading={loading}
            >
              Criar Conta <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-border/50">
            <p className="text-sm text-text-muted">
              Já possui conta? {' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

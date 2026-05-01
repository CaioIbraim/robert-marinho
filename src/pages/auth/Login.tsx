import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowRight, ShieldCheck, Truck, Building2 } from 'lucide-react';
import { showToast } from '../../utils/swal';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginData = z.infer<typeof loginSchema>;

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const redirectByRole = (role: string, aprovado: boolean) => {
    if (!aprovado && (role === 'empresa' || role === 'motorista')) {
      navigate('/aguardando-aprovacao');
      return;
    }

    switch (role) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'operador': navigate('/operador/dashboard'); break;
      case 'motorista': navigate('/motorista/dashboard'); break;
      case 'empresa': navigate('/empresa/dashboard'); break;
      case 'cliente': navigate('/portal/dashboard'); break;
      default: navigate('/');
    }
  };

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      // Buscar perfil para saber a role e aprovação
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('role, aprovado_operador')
        .eq('id', authData.user.id)
        .single();

      if (perfilError) throw perfilError;

      redirectByRole(perfil.role, perfil.aprovado_operador ?? true);
      showToast('Bem-vindo de volta!', 'success');
      
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao realizar login', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Se já estiver logado, tenta redirecionar
  useEffect(() => {
    if (isAuthenticated && user) {
        // O useAuth não traz a role direto (geralmente metadata), 
        // mas aqui vamos deixar o useEffect verificar se deve tirar o usuário da tela de login
        // Porém, como precisamos buscar o perfil do banco, o onSubmit já faz isso no login manual.
        // Para autologin (persistido):
        const checkProfile = async () => {
             const { data: perfil } = await supabase
                .from('perfis')
                .select('role, aprovado_operador')
                .eq('id', user.id)
                .single();
             if (perfil) redirectByRole(perfil.role, perfil.aprovado_operador ?? true);
        };
        checkProfile();
    }
  }, [isAuthenticated, user]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* LEFT: FORM */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <img src="/logo.png" alt="Robert Marinho" className="h-10 mb-8" />
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Acesso à Plataforma</h1>
            <p className="text-text-muted mt-3">Bem-vindo de volta! Entre com suas credenciais.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@e-mail.com"
                  className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-white input-focus transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Senha</label>
                <Link to="/esqueci-senha" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Esqueceu?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-white input-focus transition-all"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest group"
              isLoading={isLoading}
            >
              Entrar <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-border/50 text-center">
             <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-4">Ainda não tem conta?</p>
             <div className="grid grid-cols-3 gap-3">
                <Link to="/cadastro/empresa" className="flex flex-col items-center justify-center gap-2 bg-background border border-border hover:border-primary p-3 rounded-xl transition-all">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-white">Empresa</span>
                </Link>
                <Link to="/cadastro/motorista" className="flex flex-col items-center justify-center gap-2 bg-background border border-border hover:border-primary p-3 rounded-xl transition-all">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-white">Motorista</span>
                </Link>
                <Link to="/portal/login" className="flex flex-col items-center justify-center gap-2 bg-background border border-border hover:border-primary p-3 rounded-xl transition-all">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-white">Portal</span>
                </Link>
             </div>
          </div>
        </div>

        {/* RIGHT: DECORATION */}
        <div className="hidden md:block relative bg-zinc-900 border-l border-border">
          <img 
            src="/frota/1.jpg" 
            alt="Dashboard" 
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          
          <div className="relative h-full flex flex-col justify-end p-12">
            <div className="bg-surface/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <h3 className="text-white font-black uppercase tracking-tighter text-xl">Segurança & Controle</h3>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Acesse o ecossistema líder em logística executiva. Gestão de frotas, faturamento automatizado e segurança em tempo real.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

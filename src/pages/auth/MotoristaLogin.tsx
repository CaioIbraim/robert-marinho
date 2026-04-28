import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Truck, ArrowLeft, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginData = z.infer<typeof loginSchema>;

export function MotoristaLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      // Redirecionar para dashboard do motorista (em breve)
      navigate('/motorista/dashboard');

    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;
  if (isAuthenticated && window.location.pathname === '/motorista/login') {
    return <Navigate to="/motorista/dashboard" replace />;

  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDE: BANNER (Desktop) */}
      <div className="hidden md:flex md:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
        <img 
          src="/frota/2.jpg" 
          alt="Banner Motorista" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-110 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/40 to-transparent"></div>
        
        <div className="relative z-10 p-12 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Voltar ao início</span>
          </Link>
          <img src="/logo.png" alt="Logo" className="h-12 mb-8 brightness-0 invert" />
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            SUA JORNADA COMEÇA <span className="text-primary italic">AQUI</span>.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed font-medium">
            Portal exclusivo para motoristas Robert Marinho. Gerencie suas rotas, passageiros e ganhos com facilidade.
          </p>
        </div>

        {/* Abstract design elements */}
        <div className="absolute bottom-10 left-12 flex gap-4">
          <div className="w-12 h-1 bg-primary"></div>
          <div className="w-12 h-1 bg-zinc-800"></div>
          <div className="w-12 h-1 bg-zinc-800"></div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex flex-col p-6 md:p-12 lg:p-24 justify-center items-center bg-zinc-950">
        
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6">
              <Truck className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2 italic">Portal do Motorista</h2>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Faça login para iniciar seu turno</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">E-mail ou CPF</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center w-12 justify-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="motorista@logistica.com"
                    className={`w-full bg-zinc-900 border ${errors.email ? 'border-red-500' : 'border-zinc-800'} focus:border-primary py-4 pl-12 pr-4 rounded-2xl text-white outline-none transition-all placeholder:text-zinc-700`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Senha de Acesso</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center w-12 justify-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={`w-full bg-zinc-900 border ${errors.password ? 'border-red-500' : 'border-zinc-800'} focus:border-primary py-4 pl-12 pr-4 rounded-2xl text-white outline-none transition-all placeholder:text-zinc-700`}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-primary hover:bg-red-700 text-white font-black uppercase tracking-[0.3em] text-xs shadow-lg shadow-red-600/20 transition-all active:scale-95"
              isLoading={isLoading}
            >
              Iniciar Turno
            </Button>
            
            <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-8">
              Problemas com acesso? <a href="https://wa.me/5521993306919" className="text-primary hover:underline italic">Falar com Suporte</a>
            </p>
          </form>

          <footer className="pt-20 text-center">
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">
              Robert Marinho Logística • <a href="https://www.robertmarinho.com.br" className="hover:underline">www.robertmarinho.com.br</a>

            </p>
          </footer>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

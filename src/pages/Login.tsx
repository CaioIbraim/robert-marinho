import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginData = z.infer<typeof loginSchema>;

export const Login = () => {
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (

  <div className="min-h-screen bg-zinc-950 text-zinc-200">



       {/* HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 md:h-10" />
           
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="/#sobre" className="hover:text-red-500 transition">Sobre nós</a>
            <a href="/#frota" className="hover:text-red-500 transition">Nossa Frota</a>
            <a href="/#servicos" className="hover:text-red-500 transition">Serviços</a>
            <a href="/#depoimentos" className="hover:text-red-500 transition">Clientes</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm hover:text-red-500 transition">Acessar sistema</Link>
            <a href="#orcamento" className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-xl font-medium transition">
              Solicitar orçamento
            </a>
          </div>
        </div>
      </header>

    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-text mb-6">Acesse sua conta</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer text-text-muted hover:text-text">
                <input type="checkbox" className="accent-primary rounded" />
                Lembrar-me
              </label>
              <a href="#" className="text-primary hover:underline font-medium">Esqueceu a senha?</a>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Entrar no Sistema
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-text-muted text-sm">
          Painel Administrativo v1.0.0
        </p>
      </div>
    </div>

    {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © {new Date().getFullYear()} Robert Marinho Logística • Todos os direitos reservados.<br />
          Transporte Executivo • Logística Especializada • Rio de Janeiro
        </div>
      </footer>

      {/* Botão WhatsApp Flutuante */}
      <a
        href="https://wa.me/5521994925465?text=Olá!%20Gostaria%20de%20uma%20cotação%20para%20transporte%20executivo%20ou%20logística%20especializada."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl text-4xl z-50 transition hover:scale-110"
      >
        💬
      </a>

  </div>

  );
};

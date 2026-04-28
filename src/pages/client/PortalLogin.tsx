import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Mail, Lock, Building2, UserPlus, Send, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  companyName: z.string().min(3, 'Nome da empresa obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export function PortalLogin() {
  const [mode, setMode] = useState<'login' | 'register' | 'success'>('login');
  const [registeredData, setRegisteredData] = useState<RegisterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login no portal');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      // 2. Criar perfil pendente
      const { error: perfilError } = await supabase
        .from('perfis')
        .insert({
          id: authData.user.id,
          full_name: data.name,
          role: 'cliente',
          status: 'pendente',
          email: data.email,
        });

      if (perfilError) throw perfilError;

      setRegisteredData(data);
      setMode('success');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;
  if (isAuthenticated && mode === 'login') {
    return <Navigate to="/portal/dashboard" replace />;
  }

  const getWhatsAppMessage = () => {
    if (!registeredData) return '';
    const text = `Olá Robert Marinho Logística! Acabei de realizar meu cadastro no Portal do Cliente e gostaria de solicitar a aprovação do meu acesso.\n\n*Dados do Cadastro:*\n👤 *Nome:* ${registeredData.name}\n🏢 *Empresa:* ${registeredData.companyName}\n📄 *CNPJ:* ${registeredData.cnpj}\n📧 *E-mail:* ${registeredData.email}`;
    return `https://wa.me/5521993306919?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
      
      {/* FORM SIDE */}
      <div className="flex-1 flex flex-col p-6 md:p-12 lg:p-24 justify-center items-center bg-zinc-950 order-2 md:order-1">
        
        {/* Mobile Header */}
        <div className="md:hidden w-full flex items-center justify-between mb-12">
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </Link>
          <button onClick={() => setMode('login')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            VOLTAR
          </button>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {mode === 'success' ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 animate-bounce-slow">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Solicitação Enviada</h2>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Excelente, <span className="text-white font-bold">{registeredData?.name.split(' ')[0]}</span>! Seus dados foram salvos em nosso sistema. 
                Para agilizar sua aprovação, você pode notificar nossa equipe operacional agora mesmo via WhatsApp.
              </p>
              
              <div className="space-y-4 pt-4">
                <a 
                  href={getWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-green-600/10 transition-all hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" /> Notificar via WhatsApp
                </a>
                
                <Button 
                  onClick={() => setMode('login')}
                  variant="ghost"
                  className="w-full h-14 rounded-2xl text-zinc-500 hover:text-white font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  Voltar para o Login
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6">
                  {mode === 'login' ? <Building2 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === 'login' ? 'Portal do Cliente' : 'Solicitar Acesso'}
                </h2>
                <p className="text-zinc-500">
                  {mode === 'login' 
                    ? 'Acesse sua área exclusiva para gerenciar solicitações e faturas.' 
                    : 'Preencha os dados abaixo para iniciar sua parceria conosco.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {error}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">E-mail de acesso</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          {...loginForm.register('email')}
                          type="email"
                          placeholder="empresa@contato.com"
                          className={`w-full bg-zinc-900 border ${loginForm.formState.errors.email ? 'border-red-500' : 'border-zinc-800'} focus:border-primary py-4 pl-12 pr-4 rounded-2xl text-white outline-none transition-all placeholder:text-zinc-700`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Senha</label>
                        <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:text-red-400">Esquecer senha?</a>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          {...loginForm.register('password')}
                          type="password"
                          placeholder="••••••••"
                          className={`w-full bg-zinc-900 border ${loginForm.formState.errors.password ? 'border-red-500' : 'border-zinc-800'} focus:border-primary py-4 pl-12 pr-4 rounded-2xl text-white outline-none transition-all placeholder:text-zinc-700`}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-red-700 text-white font-bold uppercase tracking-[0.3em] text-xs shadow-lg shadow-red-600/20 transition-all active:scale-95"
                    isLoading={isLoading}
                  >
                    ENTRAR NO PORTAL
                  </Button>
                  
                  <p className="text-center text-zinc-600 text-sm">
                    Ainda não tem acesso? <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline font-bold uppercase tracking-widest text-[11px]">Solicite aqui</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Seu Nome</label>
                        <input
                          {...registerForm.register('name')}
                          placeholder="Ex: João Silva"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Empresa</label>
                        <input
                          {...registerForm.register('companyName')}
                          placeholder="Razão Social"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">CNPJ</label>
                        <input
                          {...registerForm.register('cnpj')}
                          placeholder="00.000.000/0000-00"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">E-mail Corporativo</label>
                      <input
                        {...registerForm.register('email')}
                        type="email"
                        placeholder="email@empresa.com"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nova Senha</label>
                      <input
                        {...registerForm.register('password')}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-red-700 text-white font-bold uppercase tracking-[0.3em] text-xs shadow-lg shadow-red-600/20 transition-all active:scale-95"
                    isLoading={isLoading}
                  >
                    Enviar Solicitação <Send className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <p className="text-center text-zinc-600 text-sm">
                    Já possui conta? <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-bold uppercase tracking-widest text-[11px]">Voltar para Login</button>
                  </p>
                </form>
              )}

              <footer className="pt-12 text-center">
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                  Robert Marinho Logística • <a href="https://www.robertmarinho.com.br" className="hover:underline">www.robertmarinho.com.br</a>

                </p>
              </footer>
            </>
          )}
        </div>
      </div>

      {/* BANNER SIDE */}
      <div className="hidden md:flex md:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden order-1 md:order-2">
        <img 
          src="/frota/3.jpg" 
          alt="Banner Cliente" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-110 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-bl from-zinc-950 via-zinc-950/40 to-transparent"></div>
        
        <div className="relative z-10 p-12 max-w-lg text-right">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Página Inicial</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
          <img src="/logo.png" alt="Logo" className="h-12 mb-8 brightness-0 invert ml-auto" />
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            CONTROLE TOTAL DA SUA <span className="text-primary">MOBILIDADE</span>.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            {mode === 'login' 
              ? 'Acompanhe suas corridas em tempo real, gerencie faturas e gerencie sua equipe de forma centralizada.'
              : 'Junte-se à Robert Marinho e tenha acesso a uma frota executiva premium disponível a qualquer momento.'}
          </p>
        </div>

        {/* Abstract design elements */}
        <div className="absolute bottom-10 right-12 flex gap-4">
          <div className="w-4 h-1 bg-zinc-700"></div>
          <div className="w-4 h-1 bg-zinc-700"></div>
          <div className="w-12 h-1 bg-primary"></div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5521993306919"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl text-2xl z-50 transition-all hover:scale-110 active:scale-95"
      >
        💬
      </a>

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
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Clock, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AguardandoAprovacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Cadastro em Análise</h1>
        <p className="text-text-muted text-lg mb-8">
          Recebemos seus dados! Sua conta ({user?.email}) está aguardando a aprovação de um operador para acessar todas as funcionalidades da plataforma.
        </p>

        <div className="bg-surface border border-border p-6 rounded-2xl mb-8 flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-text-muted">Suporte</p>
            <p className="text-white font-medium">suporte@robertmarinho.com.br</p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="flex items-center gap-2 text-text-muted hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </Button>
      </div>
    </div>
  );
};

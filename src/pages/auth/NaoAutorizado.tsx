import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NaoAutorizado = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/5">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Acesso Negado</h1>
        <p className="text-text-muted text-lg mb-10 leading-relaxed">
          Você não possui as permissões necessárias para acessar esta área restrita.
        </p>

        <Button 
          onClick={() => navigate('/login')}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

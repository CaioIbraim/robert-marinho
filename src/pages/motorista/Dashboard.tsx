import { Card } from '../../components/ui/Card';
import { usePerfil } from '../../hooks/usePerfil';
import { Truck, MapPin, Navigation, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const MotoristaDashboard = () => {
    const { data: perfil } = usePerfil();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Drive Panel</h1>
                    <p className="text-text-muted mt-1">Olá, {perfil?.full_name || 'Motorista'}</p>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-5 h-5 mr-2" /> Sair
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 p-6 bg-primary/5 border-primary/20">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Minhas Viagens</p>
                        <p className="text-2xl font-black text-white">---</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4 p-6 bg-surface border-border">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Navigation className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Km Rodados</p>
                        <p className="text-2xl font-black text-white">--- km</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4 p-6 bg-surface border-border">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-text-muted" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Pós-Trabalho</p>
                        <p className="text-sm font-black text-primary uppercase tracking-widest">
                            {perfil?.aprovado_operador ? '✅ Online' : '⏳ Aguardando'}
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="relative overflow-hidden group border-border h-64 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                <div className="relative text-center space-y-4">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Navigation className="w-8 h-8 text-text-muted" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Rota do Dia</h2>
                    <p className="text-text-muted text-sm max-w-xs mx-auto">Suas rotas atribuídas aparecerão aqui quando você for escalado pelo operador.</p>
                </div>
            </Card>
        </div>
    );
};

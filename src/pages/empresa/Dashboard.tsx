import { Card } from '../../components/ui/Card';
import { usePerfil } from '../../hooks/usePerfil';
import { Building2, Package, Clock, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const EmpresaDashboard = () => {
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
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Painel da Empresa</h1>
                    <p className="text-text-muted mt-1">Bem-vindo, {perfil?.full_name || 'Empresa'}</p>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-5 h-5 mr-2" /> Sair
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 p-6 bg-primary/5 border-primary/20">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Minhas OS</p>
                        <p className="text-2xl font-black text-white">---</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4 p-6 bg-surface border-border">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Próximas Viagens</p>
                        <p className="text-2xl font-black text-white">---</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4 p-6 bg-surface border-border">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-text-muted" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Status Conta</p>
                        <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                            {perfil?.aprovado_operador ? '✅ Ativo' : '⏳ Pendente'}
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="p-20 text-center border-dashed">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-8 h-8 text-text-muted" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Módulo de Operações</h2>
                    <p className="text-text-muted">Em breve você poderá visualizar suas ordens de serviço e faturamentos diretamente por este painel.</p>
                </div>
            </Card>
        </div>
    );
};

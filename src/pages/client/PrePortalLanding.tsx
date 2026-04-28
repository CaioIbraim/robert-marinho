import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Map, 
  BarChart3, 
  ArrowRight, 
  Layers, 
  Zap, 
} from "lucide-react";

export function PrePortalLanding() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-primary selection:text-white">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-zinc-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="h-8 brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
              <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
              <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            </nav>
            <Link 
              to="/portal/login" 
              className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5"
            >
              Área do Cliente
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-24 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-[10px] font-black uppercase tracking-[0.2em]">
              <Zap className="w-3 h-3" /> Soluções Corporativas
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              A ERA DA <span className="text-primary">MOBILIDADE</span> INTELIGENTE CHEGOU.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-xl mb-12">
              Transforme a logística da sua empresa com nosso portal exclusivo. Controle em tempo real, gestão financeira centralizada e segurança absoluta em cada jornada.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                to="/portal/login" 
                className="bg-primary hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-600/20"
              >
                Começar Agora <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="https://wa.me/5521993306919" 
                className="border border-white/10 hover:border-white/30 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all"
              >
                Falar com Consultor
              </a>
            </div>
          </div>

          <div className="relative animate-fade-in">
             <div className="absolute -inset-4 bg-primary/20 blur-[60px] rounded-full animate-pulse"></div>
             <div className="relative bg-zinc-900 border border-white/10 rounded-[40px] p-4 overflow-hidden shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-700">
               <img 
                 src="/frota/1.jpg" 
                 alt="Dashboard Preview" 
                 className="w-full h-auto rounded-[32px] opacity-80 mix-blend-luminosity"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
               <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                 <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Status em Tempo Real</p>
                   <p className="text-2xl font-black uppercase">Frotas Cooperadas</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center animate-spin-slow">
                   <Layers className="w-5 h-5 text-primary" />
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="relative z-10 py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-4xl font-black italic text-primary">24h</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Disponibilidade</p>
          </div>
          <div>
            <p className="text-4xl font-black italic text-primary">100%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Rastreabilidade</p>
          </div>
          <div>
            <p className="text-4xl font-black italic text-primary">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Taxa de Atraso</p>
          </div>
          <div>
            <p className="text-4xl font-black italic text-primary">VIP</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Atendimento</p>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="beneficios" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 italic">Por que ser um <span className="text-primary">Parceiro Corporativo</span>?</h2>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Exclusividade e Eficiência para sua Operação</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard 
              icon={<Map className="w-10 h-10" />}
              title="Gestão de Trajetos"
              desc="Acompanhe cada veículo em tempo real. Saiba exatamente onde estão seus colaboradores e receba alertas de chegada."
            />
            <BenefitCard 
              icon={<BarChart3 className="w-10 h-10" />}
              title="Dashboard Financeiro"
              desc="Faturamento centralizado. Visualize gastos por departamento, projeto ou período com relatórios detalhados."
            />
            <BenefitCard 
              icon={<ShieldCheck className="w-10 h-10" />}
              title="Segurança Máxima"
              desc="Protocolos rigorosos e escolta se necessário. Nossa frota é monitorada 24/7 por central de inteligência."
            />
          </div>
        </div>
      </section>

      {/* INTERACTIVE CALL TO ACTION */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-red-900 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-tight">
              Sua frota premium está a um <span className="text-zinc-950">clique</span> de distância.
            </h2>
            <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto font-medium">
              Não perca mais tempo com processos manuais. Junte-se às maiores empresas que já utilizam nossa tecnologia.
            </p>
            <Link 
              to="/portal/login" 
              className="bg-white text-black px-12 py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-xs hover:bg-zinc-950 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl inline-block"
            >
              Solicitar Meu Acesso
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div>
            <img src="/logo.png" alt="Logo" className="h-10 mb-6 brightness-0 invert mx-auto md:mx-0" />
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">© 2026 Robert Marinho Logística</p>
          </div>
          <div className="flex gap-12 font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">
            <a href="#" className="hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-white">Termos</a>
            <a href="https://wa.me/5521993306919" className="text-primary hover:text-red-400">Suporte VIP</a>
          </div>
        </div>
      </footer>

      {/* STYLES */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1.5s ease-out forwards;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] group hover:border-primary/50 transition-all duration-500">
      <div className="text-zinc-500 group-hover:text-primary transition-colors mb-8 transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold uppercase tracking-widest mb-4 italic group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-zinc-500 leading-relaxed text-sm group-hover:text-zinc-300 transition-colors">
        {desc}
      </p>
    </div>
  );
}

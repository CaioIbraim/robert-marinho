import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  Clock, 
  Shield, 
  Award, 
  CheckCircle, 
  ChevronRight, 
  MessageCircle, 
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { services } from "../../data/services";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const message = `Olá! Gostaria de solicitar um orçamento.%0A%0A*Dados do Solicitante:*%0A- Nome: ${formData.nome}%0A- Empresa: ${formData.empresa}%0A- Telefone: ${formData.telefone}%0A- E-mail: ${formData.email}`;
    const whatsappUrl = `https://wa.me/5521993306919?text=${message}`;
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setLoading(false);
      setFormData({ nome: "", empresa: "", telefone: "", email: "" });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500 selection:text-white font-sans">
      
      {/* HEADER (Glassmorphic) */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-zinc-950/80 backdrop-blur-xl py-4 border-b border-white/10 shadow-2xl" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img 
              src="/logo.png" 
              alt="Robert Marinho" 
              className="h-8 md:h-11 brightness-0 invert transition-transform group-hover:scale-105" 
            />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-10 text-[10px] font-bold tracking-[0.2em] uppercase">
            <a href="#sobre" className="text-zinc-400 hover:text-white transition-colors">Sobre</a>
            <a href="#servicos" className="text-zinc-400 hover:text-white transition-colors">Serviços</a>
            <a href="#frota" className="text-zinc-400 hover:text-white transition-colors">Frota</a>
            <a href="#contato" className="text-zinc-400 hover:text-white transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-6">
            {/* Login Dropdown */}
            <div className="relative group/login">
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                Acessar <ChevronDown className="w-3 h-3 group-hover/login:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full right-0 mt-4 opacity-0 invisible group-hover/login:opacity-100 group-hover/login:visible transition-all duration-300 translate-y-2 group-hover/login:translate-y-0">
                <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 w-64 shadow-2xl">
                  <Link to="/portal/login" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">C</div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Clientes</p>
                      <p className="text-[10px] text-zinc-500">Acessar portal corporativo</p>
                    </div>
                  </Link>
                  <Link to="/motorista/login" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">M</div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Motoristas</p>
                      <p className="text-[10px] text-zinc-500">Painel operacional</p>
                    </div>
                  </Link>
                  <Link to="/admin/login" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group/item mt-1 pt-1 border-t border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">A</div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Administrativo</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <a 
              href="#contato" 
              className="bg-primary hover:bg-red-700 text-white px-7 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              Orçamento
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/frota/4.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-8 animate-fade-in-up">
              <Shield className="w-4 h-4" /> Excelência em Logística & Transporte
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8 animate-fade-in-up [animation-delay:200ms]">
              MOBILIDADE <span className="text-primary italic">PREMIUM</span> PARA QUEM EXIGE <span className="text-outline-white">O MELHOR</span>
            </h1>
            <p className="text-lg md:text-2xl text-zinc-300 font-light max-w-2xl mb-12 leading-relaxed animate-fade-in-up [animation-delay:400ms]">
              Atendimento executivo de alto padrão e inteligência logística para impulsionar a eficiência do seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 animate-fade-in-up [animation-delay:600ms]">
              <a 
                href="#servicos" 
                className="bg-white text-zinc-950 px-10 py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all group shadow-xl"
              >
                Conheça Nossos Serviços
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#contato" 
                className="border border-white/20 backdrop-blur-sm px-10 py-5 rounded-full font-bold hover:bg-white/10 transition-all text-white flex items-center justify-center gap-3"
              >
                Solicitar Cotação
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-10 animate-bounce hidden md:flex flex-col items-center">
          <div className="w-px h-16 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      {/* METRICS BAR */}
      <div className="bg-zinc-900 border-y border-white/5 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-1">Pontualidade</p>
              <h3 className="text-4xl font-bold font-mono tracking-tighter">99.8%</h3>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">Frota Ativa</p>
              <h3 className="text-4xl font-bold font-mono tracking-tighter">+150</h3>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">Clientes Satisfeitos</p>
              <h3 className="text-4xl font-bold font-mono tracking-tighter">+500</h3>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">Disponibilidade</p>
              <h3 className="text-4xl font-bold font-mono tracking-tighter">24/7</h3>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES SECTION */}
      <section id="servicos" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h4 className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-4">Nossas Soluções</h4>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">O que fazemos por você.</h2>
            </div>
            <p className="text-zinc-500 max-w-sm mb-2 font-medium">
              Desenvolvemos estratégias de transporte sob medida para cada necessidade corporativa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {Object.values(services).map((service) => (
              <Link 
                key={service.id} 
                to={`/servico/${service.id}`}
                className="group relative h-[500px] rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-700"
              >
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-zinc-950/60 group-hover:bg-zinc-950/30 transition-all duration-500"></div>
                <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {service.shortDesc}
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                    Explorar Serviço <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US SECTION */}
      <section id="sobre" className="py-32 px-6 bg-zinc-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="grid grid-cols-2 gap-6 relative order-2 lg:order-1">
             <div className="absolute -inset-20 bg-primary/10 blur-[100px] rounded-full z-0"></div>
             <img src="/frota/1.jpg" className="rounded-3xl translate-y-12 relative z-10 border border-white/10" alt="Frota 1" />
             <img src="/frota/2.jpg" className="rounded-3xl relative z-10 border border-white/10" alt="Frota 2" />
          </div>

          <div className="space-y-10 relative z-10 order-1 lg:order-2">
            <div>
              <h4 className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-4">Sobre Nós</h4>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 italic">ROBERT MARINHO LOGÍSTICA.</h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed">
                Com anos de experiência no mercado de transporte executivo, oferecemos mais do que apenas deslocamentos. Entregamos confiança, segurança e a tranquilidade que você e sua empresa merecem.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary shrink-0 border border-white/10"><Award /></div>
                <div>
                  <h4 className="font-bold mb-2 uppercase tracking-widest text-xs">Padrão VIP</h4>
                  <p className="text-xs text-zinc-500">Frota constantemente renovada com os melhores modelos.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary shrink-0 border border-white/10"><Clock /></div>
                <div>
                  <h4 className="font-bold mb-2 uppercase tracking-widest text-xs">Agilidade</h4>
                  <p className="text-xs text-zinc-500">Inteligência de rota para evitar atrasos e otimizar tempo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary shrink-0 border border-white/10"><Shield /></div>
                <div>
                  <h4 className="font-bold mb-2 uppercase tracking-widest text-xs">Total Segurança</h4>
                  <p className="text-xs text-zinc-500">Motoristas treinados e monitoramento 24h por dia.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary shrink-0 border border-white/10"><DollarSign /></div>
                <div>
                  <h4 className="font-bold mb-2 uppercase tracking-widest text-xs">Custo-Benefício</h4>
                  <p className="text-xs text-zinc-500">Soluções otimizadas para o budget do seu negócio.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION (ORÇAMENTO) */}
      <section id="contato" className="py-32 px-6 bg-zinc-900 overflow-hidden relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <div>
             <h2 className="text-4xl md:text-6xl font-bold mb-8">Dê o próximo passo.</h2>
             <p className="text-xl text-zinc-400 mb-12 font-light">Solicite agora uma cotação personalizada ou fale com um de nossos especialistas via WhatsApp.</p>
             
             <div className="flex flex-wrap gap-4 pt-4">
                <a 
                  href="https://wa.me/5521993306919" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105"
                >
                  <MessageCircle className="w-6 h-6" /> WhatsApp
                </a>
                <div className="p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">E-mail Comercial</p>
                   <p className="text-sm font-bold">logistica.robertmarinho@gmail.com</p>
                </div>
             </div>
          </div>

          <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
             <h3 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Orçamento Rápido</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                   <input 
                      type="text"
                      className="w-full h-14 px-6 rounded-xl bg-zinc-900/80 border border-border focus:border-primary outline-none transition-all placeholder:text-zinc-700" 
                      placeholder="Seu Nome" 
                      value={formData.nome}
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      required
                   />
                   <input 
                      type="text"
                      className="w-full h-14 px-6 rounded-xl bg-zinc-900/80 border border-border focus:border-primary outline-none transition-all placeholder:text-zinc-700" 
                      placeholder="Empresa" 
                      value={formData.empresa}
                      onChange={e => setFormData({...formData, empresa: e.target.value})}
                      required
                   />
                </div>
                <input 
                   type="tel"
                   className="w-full h-14 px-6 rounded-xl bg-zinc-900/80 border border-border focus:border-primary outline-none transition-all placeholder:text-zinc-700" 
                   placeholder="Telefone (WhatsApp)" 
                   value={formData.telefone}
                   onChange={e => {
                     let v = e.target.value.replace(/\D/g, "");
                     if (v.length > 11) v = v.substring(0, 11);
                     if (v.length > 10) {
                        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
                     } else if (v.length > 5) {
                        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
                     } else if (v.length > 2) {
                        v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
                     } else {
                        v = v.replace(/^(\d*)/, "($1");
                     }
                     setFormData({...formData, telefone: v})
                   }}
                   required
                />
                <input 
                   type="email"
                   className="w-full h-14 px-6 rounded-xl bg-zinc-900/80 border border-border focus:border-primary outline-none transition-all placeholder:text-zinc-700" 
                   placeholder="Seu melhor e-mail" 
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   required
                />
                <button 
                   disabled={loading}
                   className="w-full bg-primary hover:bg-red-700 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 mt-4 h-16 flex items-center justify-center"
                >
                  {loading ? "Processando..." : "Enviar Solicitação"}
                </button>
                <p className="text-[10px] text-zinc-600 text-center mt-6">Prometemos não enviar spam. Seus dados estão seguros conosco.</p>
             </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <img src="/logo.png" alt="Logo" className="h-10 brightness-0 invert mb-10" />
            <p className="text-zinc-500 max-w-sm mb-10 leading-relaxed italic">
              Robert Marinho Logística: Elevando os padrões do transporte corporativo com excelência e compromisso inabalável.
            </p>
            <div className="flex gap-6">
               <div className="text-zinc-500 hover:text-white transition-colors cursor-pointer"><Users /></div>
               <div className="text-zinc-500 hover:text-white transition-colors cursor-pointer"><CheckCircle /></div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-xs text-primary">Navegação</h4>
            <ul className="space-y-5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              <li><a href="#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Portfólio de Serviços</a></li>
              <li><a href="#frota" className="hover:text-white transition-colors">Nossa Frota</a></li>
              <li><a href="#contato" className="hover:text-white transition-colors">Orçamento</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-xs text-primary">Unidades</h4>
            <ul className="space-y-4 text-zinc-500 text-sm italic">
              <li>Rio de Janeiro - Matriz</li>
              <li>São Paulo - Operação Express</li>
              <li>Belo Horizonte - Executivo</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 text-zinc-600 text-[10px] flex flex-col md:flex-row justify-between gap-6 uppercase tracking-widest font-bold">
          <p>© 2026 Robert Marinho Logística. Powered by Premium Experience.</p>
          <div className="flex gap-10">
            <Link to="/admin/login" className="opacity-30 hover:opacity-100 transition-opacity">Acesso Restrito</Link>
          </div>
        </div>
      </footer>

      {/* CUSTOM STYLES */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s linear infinite alternate;
        }
        .text-outline-white {
          -webkit-text-stroke: 1px rgba(255,255,255,0.3);
          color: transparent;
        }
      `}</style>
    </div>
  );
}
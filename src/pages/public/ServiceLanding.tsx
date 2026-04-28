import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { services } from "../../data/services";
import { 
  CheckCircle, 
  ChevronRight,
  MessageCircle,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";

export function ServiceLanding() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? services[slug] : null;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!service) {
    return <Navigate to="/" replace />;
  }

  const shareUrl = window.location.href;
  const shareImage = `${window.location.origin}${service.image}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500 selection:text-white">
      <Helmet>
        <title>{`${service.title} | Robert Marinho`}</title>
        <meta name="description" content={service.shortDesc} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={service.title} />
        <meta property="og:description" content={service.shortDesc} />
        <meta property="og:image" content={shareImage} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={service.title} />
        <meta property="twitter:description" content={service.shortDesc} />
        <meta property="twitter:image" content={shareImage} />
      </Helmet>

      {/* HEADER (BYD Style) */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-zinc-950/80 backdrop-blur-xl py-4 border-b border-white/10" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src="/logo.png" alt="Robert Marinho" className="h-8 md:h-10 brightness-0 invert transition-transform group-hover:scale-105" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold tracking-[0.2em] uppercase">
            {Object.values(services).map((s) => (
              <Link 
                key={s.id} 
                to={`/servico/${s.id}`}
                className={`hover:text-primary transition-colors ${service.id === s.id ? 'text-primary' : 'text-zinc-600'}`}
              >
                {s.title.split(' ')[0]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors">
              LOGIN
            </Link>
            <a 
              href="#contato" 
              className="bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
            >
              RESERVAR
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={service.image} 
            alt={service.title} 
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/20 to-zinc-950"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8 animate-fade-in-up">
            <Award className="w-4 h-4" /> Robert Marinho Logistics
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 animate-fade-in-up [animation-delay:200ms]">
            {service.title.toUpperCase()}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 font-light max-w-2xl mx-auto mb-10 animate-fade-in-up [animation-delay:400ms]">
            {service.shortDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up [animation-delay:600ms]">
            <a 
              href="#detalhes" 
              className="bg-white text-zinc-950 px-10 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all group"
            >
              Explorar Detalhes
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#contato" 
              className="border border-white/20 backdrop-blur-sm px-10 py-4 rounded-full font-bold hover:bg-white/10 transition-all text-white"
            >
              Falar com Consultor
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">Scroll</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      {/* SPECS BAR (BYD Style) */}
      <div id="detalhes" className="bg-zinc-900 border-y border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {service.specs.map((spec, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{spec.label}</span>
                <span className="text-2xl font-bold">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DESCRIPTION & FEATURES */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Eficiência que impulsiona o seu negócio.
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                {service.description}
              </p>
              
              <div className="space-y-4">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-medium text-zinc-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full"></div>
              <img 
                src={service.image} 
                alt="Detalhe" 
                className="relative rounded-3xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section id="contato" className="py-32 px-6 bg-zinc-900 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Pronto para elevar o padrão da sua logística?</h2>
          <p className="text-xl text-zinc-400 mb-12">Entre em contato hoje e descubra como podemos otimizar sua operação de transporte.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="https://wa.me/5521993306919"
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp
            </a>
            <a
              href="mailto:logistica.robertmarinho@gmail.com"
              className="bg-primary hover:bg-red-700 text-white px-12 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all hover:scale-105"
            >
              Solicitar Cotação
            </a>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Link to="/">
              <img src="/logo.png" alt="Logo" className="h-10 brightness-0 invert mb-8" />
            </Link>
            <p className="text-zinc-500 max-w-sm">
              Líder em transporte executivo e soluções logísticas personalizadas para empresas de alto desempenho.
            </p>
            <p className="mt-4 text-zinc-400 text-sm">
              logistica.robertmarinho@gmail.com
            </p>
            <p className="text-zinc-400 text-sm">
              +55 21 99330-6919
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs">Serviços</h4>
            <ul className="space-y-4 text-zinc-400 text-sm">
              {Object.values(services).map(s => (
                <li key={s.id}><Link to={`/servico/${s.id}`} className="hover:text-primary transition-colors uppercase">{s.title}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs">Social</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all cursor-pointer">IG</div>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all cursor-pointer">LI</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-zinc-600 text-xs flex justify-between">
          <p>© 2026 Robert Marinho. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <span>Privacidade</span>
            <span>Termos</span>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
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
      `}</style>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useState } from "react";
import { Truck, Users, DollarSign, Clock, Shield, Award, CheckCircle } from "lucide-react";

export default function Landing() {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Lead recebido:", formData);
    alert("Obrigado! Nossa equipe entrará em contato em até 24h.");
    setLoading(false);
    setFormData({ nome: "", empresa: "", telefone: "", email: "" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8 md:h-10" />
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <a href="#sobre" className="hover:text-red-500 transition-colors">Sobre</a>
            <a href="#frota" className="hover:text-red-500 transition-colors">Frota</a>
            <a href="#servicos" className="hover:text-red-500 transition-colors">Serviços</a>
          </div>

          <div className="flex items-center gap-3 relative group">
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-red-500 transition-colors flex items-center gap-1">
              Acessar ▾
            </button>
            <div className="hidden group-hover:flex absolute top-full right-0 mt-2 min-w-[200px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex-col z-50">
              <Link to="/portal/login" className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-3 border-b border-zinc-800">
                <span className="w-5 h-5 bg-primary/20 rounded-lg flex items-center justify-center text-primary">C</span>
                Portal Cliente
              </Link>
              <Link to="/motorista/login" className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-3 border-b border-zinc-800">
                <span className="w-5 h-5 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">M</span>
                Portal Motorista
              </Link>
              <Link to="/admin/login" className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition flex items-center gap-3">
                <span className="w-5 h-5 bg-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-500">A</span>
                Área Administrativa
              </Link>
            </div>
            <a href="#orcamento" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
              Orçamento
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-16 md:pt-24 pb-16 px-4 md:px-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <div>
            {/* BADGE */}
            <div className="inline-flex flex-wrap gap-2 bg-zinc-900 border border-red-900 text-red-400 px-3 py-1 rounded-full text-xs md:text-sm mb-5">
              ✅ Transporte seguro • Gestão eficiente • Resultados reais
            </div>

            {/* TITULO */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
              Transporte executivo premium e{" "}
              <span className="text-red-500">logística especializada</span>
            </h1>

            {/* DESCRIÇÃO */}
            <p className="mt-4 text-base md:text-xl text-zinc-400">
              Atendemos executivos e empresas com frota moderna e motoristas experientes.
            </p>

            {/* BOTÕES */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="#orcamento" className="bg-red-600 text-center py-3 rounded-xl font-semibold">
                Solicitar cotação
              </a>
              <a href="#servicos" className="border border-zinc-700 py-3 text-center rounded-xl">
                Ver serviços
              </a>
            </div>

            {/* BENEFÍCIOS */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-red-500 w-4 h-4" /> Pontualidade 98%
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-red-500 w-4 h-4" /> Seguro total
              </div>
            </div>
          </div>

          {/* IMAGEM */}
          <div>
            <img
              src="/frota/4.jpg"
              className="w-full h-64 md:h-auto object-cover rounded-2xl border border-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-16 px-4 md:px-6 bg-zinc-900">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6">
            Por que escolher a Robert Marinho?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card icon={<Award />} title="Frota moderna" />
            <Card icon={<Users />} title="Equipe experiente" />
            <Card icon={<DollarSign />} title="Preço justo" />
          </div>
        </div>
      </section>

      {/* FROTA */}
      <section id="frota" className="py-16 px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <img key={i} src={`/frota/${i}.jpg`} className="rounded-2xl h-56 w-full object-cover" />
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-16 px-4 md:px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center uppercase tracking-widest">Nossos Serviços</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/servico/transporte-executivo">
              <Feature icon={<Truck />} title="Transporte Executivo" desc="Mobilidade premium para sua empresa" />
            </Link>
            <Link to="/servico/gestao-de-frotas">
              <Feature icon={<Shield />} title="Gestão de Frotas" desc="Controle e economia operacional" />
            </Link>
            <Link to="/servico/logistica-expressa">
              <Feature icon={<Clock />} title="Logística Expressa" desc="Agilidade em cada entrega" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="orcamento" className="py-16 px-4 md:px-6 bg-red-950">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
          <input className="w-full p-4 rounded-xl bg-zinc-900" placeholder="Nome" />
          <input className="w-full p-4 rounded-xl bg-zinc-900" placeholder="Empresa" />
          <input className="w-full p-4 rounded-xl bg-zinc-900" placeholder="Telefone" />
          <input className="w-full p-4 rounded-xl bg-zinc-900" placeholder="Email" />

          <button className="w-full bg-red-600 py-4 rounded-xl">
            {loading ? "Enviando..." : "Solicitar cotação"}
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <Link to="/">
              <img src="/logo.png" alt="Logo" className="h-10 mb-8" />
            </Link>
            <p className="text-zinc-500 max-w-sm">
              Líder em transporte executivo e soluções logísticas personalizadas para empresas de alto desempenho.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-zinc-400">Contato</h4>
            <ul className="space-y-4 text-zinc-400 text-sm">
              <li><a href="https://www.robertmarinho.com.br" className="hover:text-red-500 transition">www.robertmarinho.com.br</a></li>
              <li>logistica.robertmarinho@gmail.com</li>
              <li>+55 21 99330-6919</li>
              <li>Rio de Janeiro, Brasil</li>
            </ul>

          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-zinc-400">Links Rápidos</h4>
            <ul className="space-y-4 text-zinc-400 text-sm">
              <li><a href="#sobre" className="hover:text-red-500 transition">Sobre Nós</a></li>
              <li><a href="#servicos" className="hover:text-red-500 transition">Serviços</a></li>
              <li><a href="#frota" className="hover:text-red-500 transition">Nossa Frota</a></li>
              <li><Link to="/motorista/login" className="hover:text-red-500 transition">Portal do Motorista</Link></li>
              <li><Link to="/admin/login" className="hover:text-zinc-500 transition opacity-20 hover:opacity-100 text-[10px]">Acesso Administrativo</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-900 text-zinc-600 text-xs flex flex-col md:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} Robert Marinho Logística — <a href="https://www.robertmarinho.com.br" className="hover:text-red-500 transition">www.robertmarinho.com.br</a>. Todos os direitos reservados.</p>

          <div className="flex gap-8">
            <span>Privacidade</span>
            <span>Termos de Uso</span>
          </div>
        </div>
      </footer>

      {/* WHATS */}
      <a
        href="https://wa.me/5521993306919"
        className="fixed bottom-4 right-4 bg-green-500 w-14 h-14 flex items-center justify-center rounded-full text-2xl"
      >
        💬
      </a>
    </div>
  );
}

function Card({ icon, title }: any) {
  return (
    <div className="bg-zinc-950 p-6 rounded-2xl text-center border border-zinc-800">
      <div className="text-red-500 mb-3">{icon}</div>
      <h3>{title}</h3>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
      <div className="text-red-500 mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-400">{desc}</p>
    </div>
  );
}
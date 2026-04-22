import { Link } from "react-router-dom";
import { useState } from "react";
import { Truck, Users, DollarSign, Clock, Shield, BarChart3, Award, CheckCircle } from "lucide-react";

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
          <div className="hidden md:flex gap-6 text-sm">
            <a href="#sobre" className="hover:text-red-500">Sobre</a>
            <a href="#frota" className="hover:text-red-500">Frota</a>
            <a href="#servicos" className="hover:text-red-500">Serviços</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block text-sm hover:text-red-500">
              Acessar
            </Link>
            <a href="#orcamento" className="bg-red-600 px-4 py-2 rounded-lg text-sm">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature icon={<Truck />} title="Transporte" desc="Cargas seguras" />
          <Feature icon={<Shield />} title="Gestão" desc="Controle total" />
          <Feature icon={<Clock />} title="Express" desc="Entrega rápida" />
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

      {/* WHATS */}
      <a
        href="https://wa.me/5521994925465"
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
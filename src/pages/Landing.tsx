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
    // TODO: integrar com Supabase aqui
    console.log("Lead recebido:", formData);
    alert("Obrigado! Nossa equipe entrará em contato em até 24h.");
    setLoading(false);
    setFormData({ nome: "", empresa: "", telefone: "", email: "" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Robert Marinho Logística" className="w-12 h-8" />
            <div>
              <span className="font-tight uppercase text-2xl tracking-tight">
                <span className="text-red-500">Robert Marinho</span>
              </span>
              <p className="text-xs text-zinc-500 -mt-1">Soluções em Logística</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#sobre" className="hover:text-red-500 transition">Sobre nós</a>
            <a href="#frota" className="hover:text-red-500 transition">Nossa Frota</a>
            <a href="#servicos" className="hover:text-red-500 transition">Serviços</a>
            <a href="#depoimentos" className="hover:text-red-500 transition">Clientes</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm hover:text-red-500 transition">Acessar sistema</Link>
            <a href="#orcamento" className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-xl font-medium transition">
              Solicitar orçamento
            </a>
          </div>
        </div>
      </header>

      {/* HERO - Mais vendedor */}
      <section className="pt-24 pb-20 px-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-red-900 text-red-400 px-4 py-1.5 rounded-full text-sm mb-6">
              ✅ Transporte seguro • Gestão eficiente • Resultados reais
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Transporte executivo premium e <span className="text-red-500">logística especializada</span> com excelência
            </h1>

            <p className="mt-6 text-xl text-zinc-400 max-w-lg">
                Atendemos executivos, empresas e cargas especiais com frota moderna, motoristas experientes e total confidencialidade. 
                Segurança, pontualidade e serviço personalizado são nosso padrão.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#orcamento"
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl font-semibold text-lg transition flex items-center gap-3"
              >
                Solicitar cotação gratuita
              </a>
              <a
                href="#servicos"
                className="border border-zinc-700 hover:border-red-600 px-8 py-4 rounded-2xl font-medium transition"
              >
                Conhecer nossos serviços
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2"><CheckCircle className="text-red-500" /> Pontualidade acima de 98%</div>
              <div className="flex items-center gap-2"><CheckCircle className="text-red-500" /> Seguro total da carga</div>
              <div className="flex items-center gap-2"><CheckCircle className="text-red-500" /> Suporte 24h</div>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="/frota/4.jpg"
              alt="Caminhão da frota Robert Marinho Logística em operação"
              className="w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* POR QUE ESCOLHER A ROBERT MARINHO (nova seção - essencial para quem está decidindo) */}
      <section id="sobre" className="py-20 px-6 bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Por que novas empresas estão escolhendo a Robert Marinho?</h2>
            <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
              Somos uma transportadora jovem, mas nascemos com experiência. Já atendemos diversos clientes com excelência e agora queremos levar o mesmo padrão para você.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 text-center">
              <Award className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Frota moderna e rastreada</h3>
              <p className="text-zinc-400">Veículos novos, bem mantidos e com tecnologia de rastreamento em tempo real.</p>
            </div>
            <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 text-center">
              <Users className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Equipe experiente</h3>
              <p className="text-zinc-400">Motoristas treinados e uma operação que entende as reais necessidades do dia a dia.</p>
            </div>
            <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 text-center">
              <DollarSign className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Preço justo com qualidade</h3>
              <p className="text-zinc-400">Custo competitivo sem abrir mão da segurança e da pontualidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FROTA */}
      <section id="frota" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Nossa Frota</h2>
            <p className="text-zinc-400 mt-3">Veículos novos, limpos e preparados para entregar sua carga com excelência</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-zinc-800 group">
                <img
                  src={`/frota/${i}.jpg`}
                  alt={`Caminhão da frota Robert Marinho Logística`}
                  className="w-full h-80 object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Nossos Serviços</h2>
            <p className="text-zinc-400 mt-4">Do transporte simples à gestão completa da sua logística</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Feature icon={<Truck className="w-8 h-8 text-red-500" />} title="Transporte Rodoviário" desc="Cargas fracionadas e lotação em todo o Brasil com pontualidade e segurança." />
            <Feature icon={<Shield className="w-8 h-8 text-red-500" />} title="Gestão Completa de Frota" desc="Rastreamento, manutenção, combustível e motoristas em um único sistema." />
            <Feature icon={<Clock className="w-8 h-8 text-red-500" />} title="Entregas Express" desc="Prazo reduzido para cargas urgentes com acompanhamento em tempo real." />
            <Feature icon={<DollarSign className="w-8 h-8 text-red-500" />} title="Faturamento e Controle Financeiro" desc="Relatórios claros e integração com seu sistema contábil." />
            <Feature icon={<Users className="w-8 h-8 text-red-500" />} title="Gestão de Motoristas" desc="Seleção, treinamento, jornada e comunicação direta via WhatsApp." />
            <Feature icon={<BarChart3 className="w-8 h-8 text-red-500" />} title="Consultoria em Logística" desc="Otimização de rotas e redução de custos para sua operação." />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">O que nossos clientes dizem</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
              <p className="italic text-zinc-300">"Desde o primeiro frete a pontualidade foi excelente. Encontramos uma transportadora confiável para crescer com a gente."</p>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
                <div>
                  <div className="font-semibold">Carlos Mendes</div>
                  <div className="text-sm text-zinc-500">Distribuidora Mendes • RJ</div>
                </div>
              </div>
            </div>

            {/* Adicione mais 2 depoimentos reais aqui com nomes e empresas que você já atendeu */}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="orcamento" className="py-24 px-6 bg-red-950 border-t border-red-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Vamos levar sua carga com segurança e eficiência?</h2>
          <p className="text-xl text-red-100 mb-10">
            Preencha o formulário e receba uma cotação personalizada em até 24 horas. Sem compromisso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-10 rounded-3xl border border-zinc-800">
            {/* campos do formulário iguais ao seu código anterior */}
            <div className="grid md:grid-cols-2 gap-6">
              <input type="text" placeholder="Seu nome" className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              <input type="text" placeholder="Nome da empresa" className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" required value={formData.empresa} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <input type="tel" placeholder="Telefone / WhatsApp" className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" required value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
              <input type="email" placeholder="E-mail" className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-semibold text-lg transition">
              {loading ? "Enviando..." : "Quero receber minha cotação"}
            </button>
          </form>
        </div>
      </section>

     {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © {new Date().getFullYear()} Robert Marinho Logística • Todos os direitos reservados.<br />
          Transporte Executivo • Logística Especializada • Rio de Janeiro
        </div>
      </footer>

      {/* Botão WhatsApp Flutuante */}
      <a
        href="https://wa.me/5521994925465?text=Olá!%20Gostaria%20de%20uma%20cotação%20para%20transporte%20executivo%20ou%20logística%20especializada."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl text-4xl z-50 transition hover:scale-110"
      >
        💬
      </a>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 hover:border-red-600 p-8 rounded-3xl transition group">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-semibold mb-3 group-hover:text-red-400 transition">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useState } from "react";
import { Truck, Users, DollarSign, Clock, Shield, BarChart3 } from "lucide-react"; // Instale lucide-react se não tiver

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
    // Aqui você integra com Supabase (exemplo)
    // await supabase.from('leads').insert([formData]);
    alert("Obrigado! Em breve entraremos em contato."); // Substitua pela lógica real
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl">
              Robert<span className="text-red-500">Marinho</span>
            </span>
            <span className="text-xs text-zinc-500">Logística</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#sobre" className="hover:text-red-500 transition">Sobre</a>
            <a href="#frota" className="hover:text-red-500 transition">Frota</a>
            <a href="#servicos" className="hover:text-red-500 transition">Serviços</a>
            <a href="#depoimentos" className="hover:text-red-500 transition">Depoimentos</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm hover:text-red-500 transition">
              Acessar sistema
            </Link>
            <a
              href="#orcamento"
              className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-xl font-medium transition"
            >
              Solicitar orçamento
            </a>
          </div>
        </div>
      </header>

      {/* HERO - Mais impactante */}
      <section className="pt-24 pb-20 px-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-red-900 text-red-400 px-4 py-1.5 rounded-full text-sm mb-6">
              ✅ Sistema moderno para transportadoras e frotas
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Gestão de logística <span className="text-red-500">sem complicação</span>
            </h1>

            <p className="mt-6 text-xl text-zinc-400 max-w-lg">
              Controle total da sua frota, motoristas, ordens de serviço, manutenção e faturamento em um só lugar. 
              Reduza custos, aumente a produtividade e tome decisões baseadas em dados reais.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#orcamento"
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl font-semibold text-lg transition flex items-center gap-3"
              >
                Solicitar demonstração gratuita
              </a>
              <a
                href="#servicos"
                className="border border-zinc-700 hover:border-red-600 px-8 py-4 rounded-2xl font-medium transition"
              >
                Conhecer os recursos
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-zinc-500">
              <div>✓ 30 dias grátis</div>
              <div>✓ Suporte dedicado</div>
              <div>✓ Integração com WhatsApp</div>
            </div>
          </div>

          {/* Imagem do dashboard (substitua por uma screenshot real do seu sistema) */}
          <div className="flex justify-center">
            <img
              src="/dashboard-preview.png" // Coloque uma screenshot bonita aqui
              alt="Dashboard do sistema LogiAdmin - Gestão de frota e logística"
              className="w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-800 drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* SOBRE A EMPRESA */}
      <section id="sobre" className="py-20 px-6 bg-zinc-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Robert Marinho Logística</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Há mais de 10 anos ajudando transportadoras e empresas com frota própria a modernizarem sua operação. 
            Nosso sistema foi criado por quem entende do dia a dia da estrada.
          </p>
        </div>
      </section>

      {/* FROTA - Mostre fotos reais */}
      <section id="frota" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Nossa frota moderna</h2>
            <p className="text-zinc-400 mt-3">Veículos bem cuidados e rastreados em tempo real</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Substitua pelas fotos reais da sua frota */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-zinc-800">
                <img
                  src={`/frota-${i}.jpg`}
                  alt={`Caminhão da frota Robert Marinho Logística ${i}`}
                  className="w-full h-80 object-cover hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS / RECURSOS */}
      <section id="servicos" className="py-20 px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Tudo que sua operação precisa</h2>
            <p className="text-zinc-400 mt-4">Um sistema completo, intuitivo e feito para o Brasil</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Feature
              icon={<Truck className="w-8 h-8 text-red-500" />}
              title="Gestão de Frota"
              desc="Rastreamento em tempo real, manutenção preventiva, controle de combustível e pneus."
            />
            <Feature
              icon={<Users className="w-8 h-8 text-red-500" />}
              title="Motoristas"
              desc="Cadastro completo, controle de jornada, pontuação de segurança e comunicação via WhatsApp."
            />
            <Feature
              icon={<DollarSign className="w-8 h-8 text-red-500" />}
              title="Financeiro"
              desc="Faturamento automático, controle de contas a pagar/receber e relatórios de custo por km."
            />
            <Feature
              icon={<Clock className="w-8 h-8 text-red-500" />}
              title="Ordens de Serviço"
              desc="Criação, rastreamento e finalização de viagens com integração de documentos."
            />
            <Feature
              icon={<BarChart3 className="w-8 h-8 text-red-500" />}
              title="Relatórios Inteligentes"
              desc="Dashboards em tempo real com KPIs de desempenho da frota."
            />
            <Feature
              icon={<Shield className="w-8 h-8 text-red-500" />}
              title="Segurança e Compliance"
              desc="Gestão de documentos, tacógrafos e conformidade com leis de transporte."
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">O que nossos clientes dizem</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
              <p className="italic text-zinc-300">"Reduzimos em 28% o custo com combustível e ganhamos muito mais controle sobre a frota. O sistema é muito intuitivo."</p>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
                <div>
                  <div className="font-semibold">João Silva</div>
                  <div className="text-sm text-zinc-500">Transportes Silva • SP</div>
                </div>
              </div>
            </div>

            {/* Adicione mais 2 depoimentos reais */}
          </div>
        </div>
      </section>

      {/* CTA - SOLICITAR ORÇAMENTO */}
      <section id="orcamento" className="py-24 px-6 bg-red-950 border-t border-red-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para modernizar sua logística?</h2>
          <p className="text-xl text-red-100 mb-10">
            Preencha o formulário abaixo e receba uma proposta personalizada em até 24h.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-10 rounded-3xl border border-zinc-800">
            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Seu nome"
                className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Nome da empresa"
                className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="tel"
                placeholder="Telefone / WhatsApp"
                className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-semibold text-lg transition disabled:opacity-70"
            >
              {loading ? "Enviando..." : "Solicitar orçamento grátis"}
            </button>

            <p className="text-xs text-zinc-500 text-center">
              Seus dados estão seguros. Entraremos em contato rapidamente.
            </p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © {new Date().getFullYear()} Robert Marinho Logística • Todos os direitos reservados.
          <br />
          Sistema desenvolvido para transportadoras brasileiras.
        </div>
      </footer>

      {/* Botão flutuante WhatsApp */}
      <a
        href="https://wa.me/55SEUNUMERO?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20sistema%20de%20gestão%20de%20frota."
        target="_blank"
        className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition text-3xl z-50"
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
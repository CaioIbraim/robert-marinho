import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, 
  User, 
  Send, 
  Mail, 
  CheckCircle2, 
  ArrowLeft,
  Briefcase,
  Smartphone
} from "lucide-react";

type TipoCadastro = "empresa" | "pessoa_fisica";

export function PreCadastro() {
  const [tipo, setTipo] = useState<TipoCadastro>("empresa");
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    empresa: "",
    mensagem: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const getWhatsAppLink = () => {
    const text = `Olá Robert Marinho Logística! Gostaria de realizar meu pré-cadastro.\n\n*Tipo:* ${tipo === 'empresa' ? '🏢 Empresa' : '👤 Pessoa Física'}\n*Nome:* ${form.nome}\n*${tipo === 'empresa' ? 'CNPJ' : 'CPF'}:* ${form.documento}\n*E-mail:* ${form.email}\n*Telefone:* ${form.telefone}\n${tipo === 'empresa' ? `*Empresa:* ${form.empresa}\n` : ''}*Mensagem:* ${form.mensagem}`;
    return `https://wa.me/5521993306919?text=${encodeURIComponent(text)}`;
  };

  const getMailtoLink = () => {
    const subject = `Pré-cadastro: ${form.nome} (${tipo === 'empresa' ? 'Empresa' : 'PF'})`;
    const body = `Tipo: ${tipo === 'empresa' ? 'Empresa' : 'Pessoa Física'}\nNome: ${form.nome}\n${tipo === 'empresa' ? 'CNPJ' : 'CPF'}: ${form.documento}\nE-mail: ${form.email}\nTelefone: ${form.telefone}\n${tipo === 'empresa' ? `Empresa: ${form.empresa}\n` : ''}Mensagem: ${form.mensagem}`;
    return `mailto:logistica.robertmarinho@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary selection:text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDE: Visual Banner */}
      <div className="hidden md:flex md:w-1/3 relative bg-zinc-900 items-center justify-center overflow-hidden">
        <img 
          src="/frota/5.jpg" 
          alt="Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950/20"></div>
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Página Inicial</span>
          </Link>
          <img src="/logo.png" alt="Logo" className="h-10 mb-8 brightness-0 invert" />
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6 italic">
            SEJA UM<br/><span className="text-primary italic">PARCEIRO</span>.
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold leading-relaxed">
            Cadastre-se para receber condições exclusivas em transporte executivo e logística.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="flex-1 flex flex-col p-6 md:p-12 lg:p-24 justify-center items-center bg-zinc-950 overflow-y-auto">
        <div className="w-full max-w-xl animate-fade-in-up">
          
          {isSubmitted ? (
            <div className="text-center space-y-8 py-10 bg-zinc-900/40 rounded-[40px] p-12 border border-white/5">
              <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 animate-bounce-slow">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Dados Preparados!</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Agora, escolha como deseja enviar seu pré-cadastro para nossa equipe:
              </p>
              
              <div className="grid gap-4 pt-6">
                <a 
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl shadow-green-600/10"
                >
                  <Smartphone className="w-5 h-5" /> Enviar via WhatsApp
                </a>
                
                <a 
                  href={getMailtoLink()}
                  className="w-full h-16 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                >
                  <Mail className="w-5 h-5" /> Enviar via E-mail
                </a>
                
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-zinc-600 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.3em] pt-4"
                >
                  Refazer Cadastro
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">PRÉ-CADASTRO</h2>
                <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Escolha seu perfil corporativo ou individual</p>
              </div>

              {/* TOGGLE TIPO */}
              <div className="flex p-1.5 bg-zinc-900 rounded-2xl mb-10 w-full max-w-sm">
                <button
                  onClick={() => setTipo("empresa")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tipo === "empresa" ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <Building2 className="w-4 h-4" /> Empresa
                </button>
                <button
                  onClick={() => setTipo("pessoa_fisica")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tipo === "pessoa_fisica" ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <User className="w-4 h-4" /> Pessoa Física
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      placeholder="Ex: João da Silva"
                      value={form.nome}
                      onChange={e => setForm({...form, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">{tipo === 'empresa' ? 'CNPJ' : 'CPF'}</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      placeholder={tipo === 'empresa' ? '00.000.000/0000-00' : '000.000.000-00'}
                      value={form.documento}
                      onChange={e => setForm({...form, documento: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">E-mail</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      placeholder="seu@contato.com"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Telefone / WhatsApp</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-2xl text-white outline-none transition-all"
                      placeholder="(21) 99999-9999"
                      value={form.telefone}
                      onChange={e => setForm({...form, telefone: e.target.value})}
                    />
                  </div>
                </div>

                {tipo === 'empresa' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nome da Empresa (Razão Social)</label>
                    <div className="relative group">
                       <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                       <input 
                        required
                        type="text" 
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 pl-14 pr-6 rounded-2xl text-white outline-none transition-all"
                        placeholder="Ex: Robert Marinho Logística LTDA"
                        value={form.empresa}
                        onChange={e => setForm({...form, empresa: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Mensagem ou Necessidade Específica</label>
                  <textarea 
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary py-4 px-6 rounded-3xl text-white outline-none transition-all h-32 resize-none"
                    placeholder="Conte-nos como podemos ajudar sua jornada..."
                    value={form.mensagem}
                    onChange={e => setForm({...form, mensagem: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-red-700 py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl shadow-red-600/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Finalizar Pré-cadastro <Send className="w-4 h-4 text-white/50" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

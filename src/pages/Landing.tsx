import { Link } from "react-router-dom";

export function Landing() {
    return (
        <div className="min-h-screen bg-background text-text">
            {/* HEADER */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <Link to="/" className="flex items-center gap-2">

                    <span className="font-bold text-lg">
                        Robert<span className="text-primary">Marinho</span>
                    </span>
                </Link>

                <div className="space-x-4">
                    <Link to="/login" className="hover:text-primary">
                        Login
                    </Link>
                    <Link
                        to="/login"
                        className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg"
                    >
                        Começar
                    </Link>
                </div>
            </header>

            {/* HERO */}
            <section className="grid md:grid-cols-2 gap-10 items-center px-6 py-20 max-w-7xl mx-auto">
                {/* TEXTO */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                        Gestão de logística{" "}
                        <span className="text-primary">simples, rápida e eficiente</span>
                    </h1>

                    <p className="mt-6 text-gray-400 max-w-lg">
                        Controle motoristas, veículos, ordens de serviço e faturamento em
                        um único sistema moderno e intuitivo.
                    </p>

                    <div className="mt-8 flex gap-4">
                        <Link
                            to="/login"
                            className="bg-primary hover:bg-primary-hover px-6 py-3 rounded-lg"
                        >
                            Começar agora
                        </Link>

                        <a
                            href="#features"
                            className="border border-border px-6 py-3 rounded-lg hover:border-primary"
                        >
                            Ver recursos
                        </a>
                    </div>
                </div>

                {/* ILUSTRAÇÃO */}
                <div className="flex justify-center">
                    <img
                        src="/logo2.png"
                        alt="Dashboard preview"
                        className="w-full max-w-md drop-shadow-2xl"
                    />
                </div>
            </section>

            {/* FEATURES */}
            <section
                id="features"
                className="grid md:grid-cols-3 gap-6 px-6 py-16 max-w-6xl mx-auto"
            >
                <Feature
                    title="Gestão de Ordens"
                    desc="Controle total das operações de transporte e logística."
                />
                <Feature
                    title="Motoristas"
                    desc="Gerencie sua equipe com facilidade e eficiência."
                />
                <Feature
                    title="Financeiro"
                    desc="Acompanhe faturamento e recebimentos em tempo real."
                />
            </section>



            {/* FOOTER */}
            <footer className="border-t border-border py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} LogiAdmin. Todos os direitos reservados.
            </footer>
        </div>
    );
}

function Feature({ title, desc }: any) {
    return (
        <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary transition">
            <h4 className="text-lg font-semibold">{title}</h4>
            <p className="text-gray-400 mt-2">{desc}</p>
        </div>
    );
}
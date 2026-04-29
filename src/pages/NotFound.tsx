import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
      
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      
      <h2 className="text-2xl font-bold mb-2">
        Página não encontrada
      </h2>
      
      <p className="text-zinc-400 mb-6 max-w-md">
        A página que você está tentando acessar não existe ou foi removida.
      </p>

      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-red-700 rounded-xl font-bold uppercase tracking-wide transition-all"
      >
        Voltar para o início
      </Link>
    </div>
  );
};
import { useLoadingStore } from '../../stores/useLoadingStore';

export const LoadingOverlay = () => {
  const { isLoading } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface border border-border shadow-2xl">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-white font-bold tracking-wider">PROCESSANDO</p>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">Aguarde um momento</p>
        </div>
      </div>
    </div>
  );
};

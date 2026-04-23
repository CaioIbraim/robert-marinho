import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { classes: string, label: string }> = {
  // Service Order Status
  pendente: { classes: 'bg-yellow-500/20 text-yellow-500', label: 'Pendente' },
  em_andamento: { classes: 'bg-blue-500/20 text-blue-500', label: 'Em Andamento' },
  em_transito: { classes: 'bg-blue-500/20 text-blue-500', label: 'Em Trânsito' },
  concluido: { classes: 'bg-green-500/20 text-green-500', label: 'Concluída' },
  concluida: { classes: 'bg-green-500/20 text-green-500', label: 'Concluída' },
  cancelado: { classes: 'bg-red-500/20 text-red-500', label: 'Cancelada' },
  cancelada: { classes: 'bg-red-500/20 text-red-500', label: 'Cancelada' },

  // Financial Status
  pago: { classes: 'bg-green-500/20 text-green-500', label: 'Pago' },
  atrasado: { classes: 'bg-red-500/20 text-red-500', label: 'Atrasado' },
  
  // Vehicle / General Status
  ativo: { classes: 'bg-green-500/20 text-green-500', label: 'Ativo' },
  inativo: { classes: 'bg-red-500/20 text-red-500', label: 'Inativo' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status.toLowerCase()] || { 
    classes: 'bg-border/50 text-text-muted', 
    label: status 
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-colors',
      config.classes,
      className
    )}>
      {config.label}
    </span>
  );
};

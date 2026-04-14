
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card = ({ children, className, title, subtitle }: CardProps) => {
  return (
    <div className={cn('glass-panel overflow-hidden', className)}>
      {(title || subtitle) && (
        <div className="border-b border-border p-4">
          {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

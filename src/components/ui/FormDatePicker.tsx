import { Controller } from 'react-hook-form';
import type { Control, Path } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/datepicker-custom.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormDatePickerProps<TFieldValues extends Record<string, any>> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  error?: string;
  showTimeSelect?: boolean;
}

export const FormDatePicker = <TFieldValues extends Record<string, any>>({
  control,
  name,
  label,
  error,
  showTimeSelect
}: FormDatePickerProps<TFieldValues>) => {
  return (
    <div className="w-full space-y-1.5 flex flex-col">
      {label && (
        <label className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => {
          let selectedDate: Date | null = null;
          if (value) {
            if (typeof value === 'string') {
              if (value.length === 10) {
                selectedDate = parseISO(value + 'T00:00:00');
              } else {
                selectedDate = parseISO(value);
              }
            } else if ((value as any) instanceof Date) {
              selectedDate = value;
            }
          }

          return (
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (!date) {
                  onChange('');
                  return;
                }
                if (showTimeSelect) {
                  onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
                } else {
                  onChange(format(date, 'yyyy-MM-dd'));
                }
              }}
              showTimeSelect={showTimeSelect}
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat={showTimeSelect ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"}
              locale={ptBR}
              className={cn(
                'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/50 input-focus',
                error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              )}
            />
          );
        }}
      />
      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

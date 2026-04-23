import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDateTimeBR = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'string') {
    // Tratamento especial para "YYYY-MM-DD" (data pura do banco)
    if (dateInput.length === 10) {
      date = parseISO(dateInput + 'T00:00:00');   // ← chave: sem "Z"
    } else {
      date = parseISO(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (!isValid(date)) return '';

  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

export const formatDateBR = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'string') {
    if (dateInput.length === 10) {
      date = parseISO(dateInput + 'T00:00:00');
    } else {
      date = parseISO(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (!isValid(date)) return '';

  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};
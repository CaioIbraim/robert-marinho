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

export const getTimeFromDate = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string' && dateInput.length <= 8 && dateInput.includes(':')) {
    return dateInput.slice(0, 5);
  }

  let date: Date;
  if (typeof dateInput === 'string') {
    date = parseISO(dateInput);
  } else {
    date = dateInput;
  }

  if (!isValid(date)) {
    const match = String(dateInput).match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }

  return format(date, 'HH:mm');
};

export const getWaitTimeInMinutes = (scheduled: string | Date | null | undefined, actual: string | Date | null | undefined) => {
  if (!scheduled || !actual) return 0;
  
  // Normaliza o agendado para o dia e hora
  let dSched: Date;
  if (typeof scheduled === 'string') {
    dSched = parseISO(scheduled);
  } else {
    dSched = scheduled;
  }

  let dActual: Date;
  if (typeof actual === 'string') {
    dActual = parseISO(actual);
  } else {
    dActual = actual;
  }
  
  if (!isValid(dSched) || !isValid(dActual)) return 0;
  
  const diffMs = dActual.getTime() - dSched.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

export const getLocalISOString = (date: Date = new Date()) => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};
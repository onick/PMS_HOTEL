import { format, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

export const enumerateDates = (checkIn: string, checkOut: string): string[] => {
  try {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 1) });
    return days.map(day => format(day, "yyyy-MM-dd"));
  } catch {
    return [];
  }
};

export const nowPlusMinutes = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60_000);
};
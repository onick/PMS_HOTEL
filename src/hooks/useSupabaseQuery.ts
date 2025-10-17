import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { toast } from './use-toast';

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'PGRST116': 'No se encontraron datos',
  '23505': 'El registro ya existe',
  '23503': 'No se puede eliminar, hay registros relacionados',
  '42P01': 'Error en la base de datos',
  '42501': 'Permisos insuficientes',
};

function getErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido';

  const supabaseError = error as SupabaseError;

  if (supabaseError.code && ERROR_MESSAGES[supabaseError.code]) {
    return ERROR_MESSAGES[supabaseError.code];
  }

  if (supabaseError.message) {
    return supabaseError.message;
  }

  return 'Error al cargar datos';
}

export function useSupabaseQuery<TData = unknown, TError = unknown>(
  queryKey: string | string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> & {
    errorMessage?: string;
    showErrorToast?: boolean;
  }
): UseQueryResult<TData, TError> {
  const { errorMessage, showErrorToast = true, ...queryOptions } = options || {};

  return useQuery<TData, TError>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`[Query Error: ${Array.isArray(queryKey) ? queryKey.join('.') : queryKey}]`, error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      const supabaseError = error as SupabaseError;
      if (supabaseError.code === 'PGRST116') return false;
      if (supabaseError.code?.startsWith('23')) return false;
      return failureCount < 3;
    },
    onError: (error) => {
      if (showErrorToast) {
        const message = errorMessage || getErrorMessage(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      }
    },
    ...queryOptions,
  });
}

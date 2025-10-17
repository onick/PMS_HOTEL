import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { toast } from './use-toast';

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'PGRST116': 'No se encontró el registro',
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

  return 'Error al procesar la operación';
}

export function useSupabaseMutation<TData = unknown, TVariables = void, TError = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & {
    errorMessage?: string;
    successMessage?: string;
    showErrorToast?: boolean;
    showSuccessToast?: boolean;
  }
): UseMutationResult<TData, TError, TVariables> {
  const {
    errorMessage,
    successMessage,
    showErrorToast = true,
    showSuccessToast = false,
    ...mutationOptions
  } = options || {};

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        console.error('[Mutation Error]', error);
        throw error;
      }
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
    onSuccess: (data, variables, context) => {
      if (showSuccessToast && successMessage) {
        toast({
          title: 'Éxito',
          description: successMessage,
        });
      }
      mutationOptions.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

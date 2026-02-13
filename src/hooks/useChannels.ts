import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
    ChannelStatsData,
    ChannelConnectionData,
    RoomTypeMappingData,
    OutboxItemData,
    SyncResultData,
} from '@/lib/api';
import { toast } from 'sonner';

// ─── Queries ────────────────────────────────────────────────

export function useChannelStats() {
    return useQuery<ChannelStatsData>({
        queryKey: ['channel-stats'],
        queryFn: async () => {
            const res = await api.getChannelStats();
            return res.data;
        },
        refetchInterval: 30_000, // refresh every 30s
        staleTime: 15_000,
    });
}

export function useChannels() {
    return useQuery<ChannelConnectionData[]>({
        queryKey: ['channels'],
        queryFn: async () => {
            const res = await api.getChannels();
            return res.data;
        },
        staleTime: 30_000,
    });
}

export function useRoomTypeMappings(connectionId: number, enabled = true) {
    return useQuery<RoomTypeMappingData[]>({
        queryKey: ['channel-mappings', connectionId],
        queryFn: async () => {
            const res = await api.getRoomTypeMappings(connectionId);
            return res.data;
        },
        enabled: enabled && connectionId > 0,
    });
}

export function useChannelOutbox(connectionId: number, enabled = true) {
    return useQuery<{ items: OutboxItemData[]; stats: { pending: number; processing: number; failed: number } }>({
        queryKey: ['channel-outbox', connectionId],
        queryFn: async () => {
            const res = await api.getChannelOutbox(connectionId);
            return { items: res.data, stats: res.stats };
        },
        enabled: enabled && connectionId > 0,
        refetchInterval: 10_000,
    });
}

// ─── Mutations ──────────────────────────────────────────────

export function useConnectChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ channel, credentials }: { channel: string; credentials?: Record<string, string> }) => {
            return api.connectChannel(channel, credentials);
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
        },
        onError: (err: Error) => {
            toast.error('Error al conectar canal: ' + err.message);
        },
    });
}

export function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { status?: string; credentials?: Record<string, string>; sync_config?: Record<string, unknown> } }) => {
            return api.updateChannel(id, data);
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

export function useDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            return api.deleteChannel(id);
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

export function useSaveRoomTypeMapping() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ connectionId, data }: { connectionId: number; data: { room_type_id: number; ota_room_type_code: string; ota_room_type_name?: string } }) => {
            return api.saveRoomTypeMapping(connectionId, data);
        },
        onSuccess: (_res, variables) => {
            toast.success('Mapping guardado');
            queryClient.invalidateQueries({ queryKey: ['channel-mappings', variables.connectionId] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

export function useDeleteRoomTypeMapping() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ connectionId, mappingId }: { connectionId: number; mappingId: number }) => {
            return api.deleteRoomTypeMapping(connectionId, mappingId);
        },
        onSuccess: (_res, variables) => {
            toast.success('Mapping eliminado');
            queryClient.invalidateQueries({ queryKey: ['channel-mappings', variables.connectionId] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

// ─── Sync Mutations ─────────────────────────────────────────

export function useSyncChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dryRun = false, daysAhead }: { id: number; dryRun?: boolean; daysAhead?: number }) => {
            return api.syncChannel(id, { dry_run: dryRun, days_ahead: daysAhead });
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        },
        onError: (err: Error) => {
            toast.error('Error en sync: ' + err.message);
        },
    });
}

export function useSyncAllChannels() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            return api.syncAllChannels();
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

export function usePullReservations() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dryRun = false }: { id: number; dryRun?: boolean }) => {
            return api.pullReservations(id, { dry_run: dryRun });
        },
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
        },
        onError: (err: Error) => {
            toast.error('Error: ' + err.message);
        },
    });
}

export function useValidateChannel() {
    return useMutation({
        mutationFn: async (id: number) => {
            return api.validateChannel(id);
        },
        onSuccess: (res) => {
            if (res.data.valid) {
                toast.success('Conexión válida ✓');
            } else {
                toast.error('Conexión inválida: ' + res.data.message);
            }
        },
        onError: (err: Error) => {
            toast.error('Error validando: ' + err.message);
        },
    });
}

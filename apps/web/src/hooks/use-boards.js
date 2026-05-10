import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';

export const boardKeys = {
  all: ['boards'],
  list: (params) => ['boards', 'list', params],
  detail: (id) => ['boards', 'detail', id],
  pages: (boardId) => ['boards', boardId, 'pages'],
  page: (boardId, pageId) => ['boards', boardId, 'pages', pageId],
  folders: ['folders'],
  activity: ['activity'],
};

export function useBoardList(params = {}) {
  return useQuery({
    queryKey: boardKeys.list(params),
    queryFn: async () => (await api.get('/boards', { params })).data,
  });
}

export function useBoard(id) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: async () => (await api.get(`/boards/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function usePage(boardId, pageId) {
  return useQuery({
    queryKey: boardKeys.page(boardId, pageId),
    queryFn: async () =>
      (await api.get(`/boards/${boardId}/pages/${pageId}`)).data,
    enabled: Boolean(boardId && pageId),
  });
}

export function useFolders() {
  return useQuery({
    queryKey: boardKeys.folders,
    queryFn: async () => (await api.get('/folders')).data,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/boards', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.patch(`/boards/${id}`, payload)).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: boardKeys.all });
      qc.invalidateQueries({ queryKey: boardKeys.detail(vars.id) });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/boards/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/boards/${id}/favorite`)).data,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: boardKeys.all });
      // optimistic toggle on every cached list page
      const snapshots = qc.getQueriesData({ queryKey: ['boards', 'list'] });
      for (const [key, value] of snapshots) {
        if (!value?.items) continue;
        qc.setQueryData(key, {
          ...value,
          items: value.items.map((b) =>
            b.id === id ? { ...b, isFavorite: !b.isFavorite } : b,
          ),
        });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useDuplicateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/boards/${id}/duplicate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, pageId, ...payload }) =>
      (await api.patch(`/boards/${boardId}/pages/${pageId}`, payload)).data,
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: boardKeys.detail(vars.boardId) }),
  });
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, ...payload }) =>
      (await api.post(`/boards/${boardId}/pages`, payload)).data,
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: boardKeys.detail(vars.boardId) }),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, pageId }) =>
      (await api.delete(`/boards/${boardId}/pages/${pageId}`)).data,
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: boardKeys.detail(vars.boardId) }),
  });
}

export function useActivity() {
  return useQuery({
    queryKey: boardKeys.activity,
    queryFn: async () => (await api.get('/activity')).data,
  });
}

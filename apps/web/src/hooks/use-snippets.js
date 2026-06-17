import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';

const snippetKeys = { all: ['snippets'] };

export function useSnippets() {
  return useQuery({
    queryKey: snippetKeys.all,
    queryFn: () => api.get('/snippets').then((r) => r.data),
  });
}

export function useCreateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/snippets', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
}

export function useUpdateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/snippets/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/snippets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
}

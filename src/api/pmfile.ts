import { http } from '@/utils/request';
import type { PMFile, PMFileQuery } from '@/types/pmfile';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export function uploadPMFile(formData: FormData) {
  return http.post<void>('/pm-files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function listPMFiles(query: PMFileQuery) {
  return http.get<PagedResult<PMFile>>('/pm-files', { params: query });
}

export function getPMFile(id: number) {
  return http.get<PMFile>(`/pm-files/${id}`);
}

export function downloadPMFile(id: number) {
  const token = localStorage.getItem('token') || '';
  return `${import.meta.env.VITE_APP_BASE_API}/pm-files/${id}/download?token=${encodeURIComponent(token)}`;
}

export function deletePMFile(id: number) {
  return http.delete(`/pm-files/${id}`);
}

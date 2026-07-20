import { http } from '@/utils/request';
import type { NetworkCard, CaptureRequest, TcpdumpFile, TcpdumpBatchDeleteRequest } from '@/types/tcpdump';

export function listNetworkCards() {
  return http.get<NetworkCard[]>('/tcpdump/network-cards');
}

export function doCapture(data: CaptureRequest) {
  return http.post<void>('/tcpdump/capture', data);
}

export function listTcpdumpFiles() {
  return http.get<TcpdumpFile[]>('/tcpdump/files');
}

export function downloadTcpdumpFile(name: string) {
  const token = localStorage.getItem('token') || '';
  return `${import.meta.env.VITE_APP_BASE_API}/tcpdump/files/${encodeURIComponent(name)}/download?token=${encodeURIComponent(token)}`;
}

export function deleteTcpdumpFile(name: string) {
  return http.delete(`/tcpdump/files/${encodeURIComponent(name)}`);
}

export function batchDeleteTcpdumpFiles(data: TcpdumpBatchDeleteRequest) {
  return http.post<void>('/tcpdump/files/batch-delete', data);
}

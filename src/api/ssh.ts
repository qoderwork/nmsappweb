/**
 * SSH 管理 API
 * 对齐 nmsappsrv 后端 ssh/routes.go
 */

import { http } from '@/utils/request';
import type {
  SSHLabel,
  AddSSHLabelRequest,
  UpdateSSHLabelRequest,
  DeleteSSHLabelRequest,
  SSHAccessTimerRequest,
  ListSSHAccessTimerRequest,
  SSHAccessTimerVO,
} from '@/types/ssh';

/* ============ SSH 标签 ============ */

/** 获取 SSH 标签列表 */
export function listSSHLabels() {
  return http.get<SSHLabel[]>('/ssh-labels');
}

/** 添加 SSH 标签 */
export function addSSHLabel(data: AddSSHLabelRequest) {
  return http.post<SSHLabel>('/ssh-labels', data);
}

/** 更新 SSH 标签 */
export function updateSSHLabel(data: UpdateSSHLabelRequest) {
  return http.put<SSHLabel>('/ssh-labels', data);
}

/** 删除 SSH 标签 */
export function deleteSSHLabel(data: DeleteSSHLabelRequest) {
  return http.delete<void>('/ssh-labels', { data });
}

/* ============ SSH 访问定时器 ============ */

/** 获取 SSH 访问定时器列表 */
export function listSSHAccessTimers(params: ListSSHAccessTimerRequest) {
  return http.post<SSHAccessTimerVO[]>('/ssh-access-timer', params);
}

/** 设置 SSH 访问定时器 */
export function setSSHAccessTimer(data: SSHAccessTimerRequest) {
  return http.post<void>('/ssh-access-timer', data);
}

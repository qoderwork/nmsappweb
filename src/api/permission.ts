/**
 * 权限相关 API
 *
 * 对齐 nmsappsrv 后端：
 * - GET /api/v1/auth/permissions/user-ids  获取当前用户权限码列表（登录后调用）
 * - GET /api/v1/auth/permissions            获取全部权限注册表（管理员视角）
 *
 * 菜单为前端硬编码（mock/menus），不依赖后端返回。
 */

import { http } from '@/utils/request';
import type { PermissionIdsResult, PermissionItem, PermissionRole } from '@/types/permission';
import type { PageQuery } from '@/types';

/**
 * 获取当前登录用户的权限码列表
 * 对齐后端 GET /api/v1/auth/permissions/user-ids
 * 返回 { admin: boolean, permission_ids: string[] }
 */
export function getPermissionIdsForUser() {
  return http.get<PermissionIdsResult>('/auth/permissions/user-ids');
}

/** 获取全部权限注册表（管理员视角，用于角色权限分配矩阵） */
export function getPermissionRegistry() {
  return http.get<PermissionItem[]>('/auth/permissions');
}

/* ============ 角色管理 ============ */

export function getRoles(params: PageQuery) {
  return http.getPage<PermissionRole>('/auth/role/list', params);
}

export function getAllRoles() {
  return http.get<PermissionRole[]>('/auth/role/all');
}

export function createRole(data: Partial<PermissionRole>) {
  return http.post<PermissionRole, Partial<PermissionRole>>('/auth/role', data);
}

export function updateRole(id: number, data: Partial<PermissionRole>) {
  return http.put<PermissionRole, Partial<PermissionRole>>(`/auth/role/${id}`, data);
}

export function deleteRole(id: number) {
  return http.delete<void>(`/auth/role/${id}`);
}

/** 分配角色权限 */
export function assignRolePermissions(roleId: number, permissionIds: number[]) {
  return http.put<void, { permissionIds: number[] }>(`/auth/role/${roleId}/permissions`, {
    permissionIds,
  });
}

/* ============ 权限项管理 ============ */

export function getPermissionTree() {
  return http.get<PermissionItem[]>('/auth/permission/tree');
}

export function getAllPermissions() {
  return http.get<PermissionItem[]>('/auth/permission/all');
}

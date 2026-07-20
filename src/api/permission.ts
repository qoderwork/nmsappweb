/**
 * 权限相关 API
 *
 * 对齐 nmsappsrv 后端：
 * - GET /api/v2/getPermissionIdsForUser  获取当前用户权限码列表（登录后调用）
 * - GET /api/v2/getPermission             获取全部权限注册表（管理员视角）
 *
 * 菜单为前端硬编码（mock/menus），不依赖后端返回。
 */

import { httpV2 } from '@/utils/request';
import type { PermissionIdsResult, PermissionItem, Role } from '@/types';
import type { PageQuery } from '@/types';

/**
 * 获取当前登录用户的权限码列表
 * 对齐后端 GET /api/v2/getPermissionIdsForUser
 * 返回 { admin: boolean, permission_ids: string[] }
 */
export function getPermissionIdsForUser() {
  return httpV2.get<PermissionIdsResult>('/getPermissionIdsForUser');
}

/** 获取全部权限注册表（管理员视角，用于角色权限分配矩阵） */
export function getPermissionRegistry() {
  return httpV2.get<PermissionItem[]>('/getPermission');
}

/* ============ 角色管理 ============ */

export function getRoles(params: PageQuery) {
  return httpV2.getPage<Role>('/role/list', params);
}

export function getAllRoles() {
  return httpV2.get<Role[]>('/role/all');
}

export function createRole(data: Partial<Role>) {
  return httpV2.post<Role, Partial<Role>>('/role', data);
}

export function updateRole(id: number, data: Partial<Role>) {
  return httpV2.put<Role, Partial<Role>>(`/role/${id}`, data);
}

export function deleteRole(id: number) {
  return httpV2.delete<void>(`/role/${id}`);
}

/** 分配角色权限 */
export function assignRolePermissions(roleId: number, permissionIds: number[]) {
  return httpV2.put<void, { permissionIds: number[] }>(`/role/${roleId}/permissions`, {
    permissionIds,
  });
}

/* ============ 权限项管理 ============ */

export function getPermissionTree() {
  return httpV2.get<PermissionItem[]>('/permission/tree');
}

export function getAllPermissions() {
  return httpV2.get<PermissionItem[]>('/permission/all');
}

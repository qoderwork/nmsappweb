/**
 * 用户管理 API
 *
 * 对齐 nmsappsrv 后端 internal/user/routes.go
 * - GET    /api/v1/users           用户列表（分页）
 * - POST   /api/v1/users           新增用户
 * - PUT    /api/v1/users/:id       更新用户
 * - DELETE /api/v1/users/:id       删除用户
 * - POST   /api/v1/users/kick-out  踢出用户
 * - POST   /api/v1/users/unlock    解锁用户
 * - POST   /api/v1/users/enable    启用用户
 * - POST   /api/v1/users/disable   禁用用户
 * - POST   /api/v1/users/reset-password  重置密码（管理员）
 * - GET    /api/v1/roles           角色列表
 * - POST   /api/v1/roles           新增角色
 * - PUT    /api/v1/roles/:id       更新角色
 * - DELETE /api/v1/roles/:id       删除角色
 * - GET    /api/v1/roles/:id/permissions   获取角色权限
 * - PUT    /api/v1/roles/:id/permissions   更新角色权限
 */

import { http } from '@/utils/request';
import type {
  UserDTO,
  UserQueryParams,
  Role,
  RoleHasPermission,
  ModifyPasswordRequest,
  ResetPasswordRequest,
  SetTenancyRequest,
} from '@/types/user';

/* ============ 用户管理 ============ */

/** 获取用户列表（分页） */
export function getUsers(params: UserQueryParams = {}) {
  return http.getPage<UserDTO>('/users', params);
}

/** 获取用户详情 */
export function getUser(id: number | string) {
  return http.get<UserDTO>(`/users/${id}`);
}

/** 新增用户 */
export function createUser(data: Partial<UserDTO>) {
  return http.post<UserDTO, Partial<UserDTO>>('/users', data);
}

/** 更新用户 */
export function updateUser(id: number | string, data: Partial<UserDTO>) {
  return http.put<UserDTO, Partial<UserDTO>>(`/users/${id}`, data);
}

/** 删除用户 */
export function deleteUser(id: number | string) {
  return http.delete<void>(`/users/${id}`);
}

/** 踢出用户 */
export function kickOutUser(userId: number) {
  return http.post<void>('/users/kick-out', { userId });
}

/** 解锁用户 */
export function unlockUser(userId: number) {
  return http.post<void>('/users/unlock', { userId });
}

/** 启用用户 */
export function enableUser(userId: number) {
  return http.post<void>('/users/enable', { userId });
}

/** 禁用用户 */
export function disableUser(userId: number) {
  return http.post<void>('/users/disable', { userId });
}

/** 重置密码（管理员） */
export function resetPassword(userId: number) {
  return http.post<{ resetKey: string }>('/users/reset-password', { userId });
}

/** 修改密码 */
export function modifyPassword(data: ModifyPasswordRequest) {
  return http.post<void>('/users/modify-password', data);
}

/** 设置用户租户 */
export function setTenancyForUser(data: SetTenancyRequest) {
  return http.post<void>('/users/set-tenancy', data);
}

/** 获取登录失败次数 */
export function getLoginFailedTimes(userId: number) {
  return http.post<{ maxFailedTime: number; failedTime: number }>('/users/login-failed-times', { userId });
}

/** 检查是否需要修改密码 */
export function needChangePassword() {
  return http.get<{ needChange: boolean; reason: number }>('/users/need-change-password');
}

/* ============ 角色管理 ============ */

/** 获取角色列表 */
export function getRoles(licenseId?: number) {
  return http.get<Role[]>('/roles', { params: licenseId ? { licenseId } : undefined });
}

/** 获取角色详情 */
export function getRole(id: string) {
  return http.get<Role>(`/roles/${id}`);
}

/** 新增角色 */
export function createRole(data: Partial<Role>) {
  return http.post<Role, Partial<Role>>('/roles', data);
}

/** 更新角色 */
export function updateRole(id: string, data: Partial<Role>) {
  return http.put<Role, Partial<Role>>(`/roles/${id}`, data);
}

/** 删除角色 */
export function deleteRole(id: string) {
  return http.delete<void>(`/roles/${id}`);
}

/** 获取角色权限 */
export function getRolePermissions(roleId: string) {
  return http.get<RoleHasPermission[]>(`/roles/${roleId}/permissions`);
}

/** 更新角色权限 */
export function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return http.put<void, { permission_ids: string[] }>(`/roles/${roleId}/permissions`, { permission_ids: permissionIds });
}
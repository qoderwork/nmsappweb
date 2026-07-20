/**
 * API 模块统一导出
 *
 * 注意：请通过命名空间导入，避免模块间同名导出冲突
 *   import { userApi } from '@/api';
 *   userApi.getUsers(...)
 */
export * as authApi from './auth';
export * as permissionApi from './permission';
export * as deviceApi from './device';
export * as userApi from './user';
export * as alarmApi from './alarm';

// 旧权限模块的角色管理 API 已废弃，请使用 userApi
export { getPermissionIdsForUser, getPermissionRegistry, getPermissionTree, getAllPermissions } from './permission';

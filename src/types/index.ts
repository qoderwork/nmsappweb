/**
 * 类型统一导出
 *
 * 注意：permission 与 user/alarm 存在同名类型，请按需从具体模块导入
 *   import type { Role } from '@/types/user';
 */
export * from './api';
export * from './auth';
export * from './common';
export * from './device';
export type { MenuItem, MenuType, MenuVisible, PermissionIdsResult, PermissionItem, PermissionRole, PermissionMode } from './permission';
export * from './user';
export * from './alarm';

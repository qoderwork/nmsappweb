/**
 * 权限校验 Composable
 *
 * 统一从 permission store 读取权限数据
 * 供模板内 v-if / 函数调用使用
 */

import { computed } from 'vue';
import { usePermissionStore } from '@/stores/permission';

export function usePermission() {
  const store = usePermissionStore();

  const permissions = computed(() => store.permissions);
  const roles = computed(() => store.roles);
  const menus = computed(() => store.menus);
  const buttonPermissions = computed(() => store.buttonPermissions);

  /** 是否拥有指定权限 */
  function hasPermission(required?: string | string[]): boolean {
    return store.hasPermission(required);
  }

  /** 是否拥有指定角色 */
  function hasRole(required?: string | string[]): boolean {
    return store.hasRole(required);
  }

  /** 是否为管理员 */
  const isAdmin = computed(() => store.isAdminRole());

  /** 是否拥有所有权限 */
  function hasAllPermissions(required: string[]): boolean {
    return required.every((p) => hasPermission(p));
  }

  /** 拥有任一权限 */
  function hasAnyPermission(required: string[]): boolean {
    return required.some((p) => hasPermission(p));
  }

  return {
    permissions,
    roles,
    menus,
    buttonPermissions,
    isAdmin,
    hasPermission,
    hasRole,
    hasAllPermissions,
    hasAnyPermission,
  };
}

/**
 * 权限 Store
 *
 * 管理权限码列表、角色列表
 * 菜单为前端硬编码（与原 Java nms-web 一致），不依赖后端返回菜单数据。
 *
 * 对齐原 Java nms-web：
 *  - 登录后调用 getPermissionIdsForUser 获取权限码
 *  - 菜单/路由在前端 router/modules 中硬编码
 *  - 通过路由 meta.permissionsOr/permissionsAnd/isAdmin 控制可见性
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { getPermissionIdsForUser } from '@/api/permission';
import { staticMenus } from '@/router/menus';
import type { MenuItem } from '@/types';
import {
  isAdmin,
  hasPermission as hasPermissionUtil,
  hasRole as hasRoleUtil,
} from '@/utils/permission';
import { useAuthStore } from './auth';
import { isMockMode, mockPermissions, mockRoles } from '@/mock';

export const usePermissionStore = defineStore('permission', () => {
  // ============ State ============
  /** 当前用户权限码列表（点号分隔：Module.Sub.Action） */
  const permissions = ref<string[]>([]);
  /** 当前用户角色编码列表 */
  const roles = ref<string[]>([]);
  /** 是否为管理员（后端 getPermissionIdsForUser 返回 admin=true） */
  const isAdminFlag = ref(false);
  /** 是否已加载 */
  const loaded = ref(false);

  // ============ Getters ============
  const hasLoaded = computed(() => loaded.value);
  /** 按钮型权限码（用于 v-permission 指令） */
  const buttonPermissions = computed(() =>
    permissions.value.filter((p) => !p.endsWith('.view') && !p.endsWith('.list'))
  );

  /**
   * 根据当前用户权限过滤菜单树
   * 过滤规则（对齐原 Java nms-web meta 约定）：
   *  - permissionsOr：任一权限满足即显示
   *  - permissionsAnd：所有权限都满足才显示
   *  - isAdmin：仅管理员可见
   *  - 无权限配置的菜单所有人可见
   *  - 父菜单无可见子菜单时自动隐藏（仅对 directory 类型）
   */
  const menus = computed<MenuItem[]>(() => filterMenus(staticMenus));

  /** 过滤菜单树 */
  function filterMenus(items: MenuItem[]): MenuItem[] {
    return items
      .map((item) => ({ ...item }))
      .filter((item) => isMenuVisible(item))
      .map((item) => {
        if (item.children?.length) {
          const children = filterMenus(item.children);
          // directory 类型：若无可见子菜单，则隐藏父菜单
          if (item.type === 'directory' && children.length === 0) {
            return null;
          }
          item.children = children;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  /** 判断单个菜单是否对当前用户可见 */
  function isMenuVisible(item: MenuItem): boolean {
    // 隐藏的菜单不显示在侧边栏
    if (item.visible === 'hidden') return false;
    // 仅管理员可见
    if (item.isAdmin && !isAdminRole()) return false;
    // permissionsOr：任一权限满足即可
    if (item.permissionsOr?.length && !hasPermission(item.permissionsOr)) {
      return false;
    }
    // permissionsAnd：所有权限都满足才可
    if (item.permissionsAnd?.length) {
      const ok = item.permissionsAnd.every((p) => hasPermission(p));
      if (!ok) return false;
    }
    // 单个 permission 字段（兼容旧定义）
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  }

  // ============ Actions ============

  /**
   * 加载权限数据（调用后端 getPermissionIdsForUser）
   * 返回 { admin, permission_ids }
   */
  async function load(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      throw new Error('未登录，无法加载权限');
    }

    if (isMockMode()) {
      permissions.value = mockPermissions;
      roles.value = mockRoles;
      isAdminFlag.value = true;
      loaded.value = true;
      // 同步到 auth store
      authStore.updateUser({
        roles: mockRoles,
        permissions: mockPermissions,
        isAdmin: true,
      });
      return;
    }

    const result = await getPermissionIdsForUser();
    permissions.value = result.permission_ids ?? [];
    isAdminFlag.value = !!result.admin;
    // 角色列表从 auth store（JWT 解析）获取
    roles.value = authStore.roles;

    // 同步到 auth store
    authStore.updateUser({
      permissions: permissions.value,
      isAdmin: isAdminFlag.value,
    });

    loaded.value = true;
  }

  /** 判断是否拥有权限 */
  function hasPermission(required?: string | string[]): boolean {
    if (isAdminFlag.value) return true;
    return hasPermissionUtil(permissions.value, required);
  }

  /** 判断是否拥有角色 */
  function hasRole(required?: string | string[]): boolean {
    return hasRoleUtil(
      roles.value,
      Array.isArray(required) ? required : required ? [required] : []
    );
  }

  /** 是否为管理员 */
  function isAdminRole(): boolean {
    return isAdminFlag.value || isAdmin(roles.value);
  }

  /** 重置 */
  function reset() {
    permissions.value = [];
    roles.value = [];
    isAdminFlag.value = false;
    loaded.value = false;
  }

  return {
    // state
    permissions,
    roles,
    isAdminFlag,
    loaded,
    // getters
    hasLoaded,
    menus,
    buttonPermissions,
    // actions
    load,
    hasPermission,
    hasRole,
    isAdminRole,
    reset,
  };
});

/**
 * 路由守卫
 *
 * 对齐原 Java nms-web permission.js 流程：
 *  1. 已登录且未加载权限 → 调用 getPermissionIdsForUser 加载权限
 *  2. 权限校验：
 *     - meta.permissionsOr：任一权限满足即可访问
 *     - meta.permissionsAnd：所有权限都满足才可访问
 *     - meta.isAdmin：仅管理员可访问
 *  3. 未登录 → 跳转登录页
 *
 * 注：菜单/路由为前端硬编码（router/modules/static.ts），不动态注入。
 */

import type { Router } from 'vue-router';
import NProgress from 'nprogress';

import { useAuthStore } from '@/stores/auth';
import { usePermissionStore } from '@/stores/permission';
import { isAuthenticated } from '@/utils/auth';
import { setUnauthorizedHandler } from '@/utils/request';
import { i18n } from '@/locales';
import { isMockMode } from '@/mock';

/** 白名单路径（无需登录即可访问） */
const WHITE_LIST = ['/login', '/401', '/404'];

/** 默认首页 */
const HOME_PATH = '/dashboard';

export function setupRouterGuards(router: Router): void {
  // 注入 401 处理器（HTTP 拦截器遇到 401 时调用）
  setUnauthorizedHandler(() => {
    const current = router.currentRoute.value;
    if (current.path !== '/login') {
      router.replace({
        path: '/login',
        query: current.fullPath !== '/' ? { redirect: current.fullPath } : undefined,
      });
    }
  });

  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    // 设置页面标题（i18n 翻译）
    const titleKey = to.meta?.title as string | undefined;
    const title = titleKey && i18n.global.te(titleKey) ? i18n.global.t(titleKey) : titleKey;
    document.title = title ? `${title} - NMS` : 'NMS';

    // 白名单直接放行
    if (WHITE_LIST.includes(to.path)) {
      // 已登录用户访问登录页 → 重定向到首页
      if (to.path === '/login' && isAuthenticated()) {
        next(HOME_PATH);
        return;
      }
      next();
      return;
    }

    // 未登录 → 跳登录页（mock 模式自动登录）
    if (!isAuthenticated()) {
      if (isMockMode()) {
        const authStore = useAuthStore();
        authStore.mockLogin();
        next({ ...to, replace: true });
        return;
      }
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    const authStore = useAuthStore();
    const permissionStore = usePermissionStore();

    try {
      // 已登录但未加载用户信息 → 从 JWT 解析
      if (!authStore.loaded) {
        await authStore.loadUserInfo();
      }

      // 已登录但未加载权限 → 加载权限
      if (!permissionStore.loaded) {
        await permissionStore.load();
      }

      // 路由不存在 → 404
      if (to.matched.length === 0) {
        next('/404');
        return;
      }

      // 权限校验（对齐原 Java nms-web meta.permissionsOr/permissionsAnd/isAdmin）
      const findTo = to.matched.find((item) => item.path === to.path);
      if (findTo?.meta) {
        const meta = findTo.meta;
        if (meta.permissionsOr?.length && !permissionStore.hasPermission(meta.permissionsOr)) {
          next('/401');
          return;
        }
        if (findTo.meta.permissionsAnd?.length) {
          // 所有权限都满足
          const ok = findTo.meta.permissionsAnd.every((p) => permissionStore.hasPermission(p));
          if (!ok) {
            next('/401');
            return;
          }
        }
        if (meta.isAdmin && !permissionStore.isAdminRole()) {
          next('/401');
          return;
        }
      }

      // 兼容旧 meta.permissions / meta.roles
      if (to.meta.permissions?.length && !permissionStore.hasPermission(to.meta.permissions)) {
        next('/401');
        return;
      }
      if (to.meta.roles?.length && !permissionStore.hasRole(to.meta.roles)) {
        next('/401');
        return;
      }

      next();
    } catch (e) {
      console.error('[Router Guard] failed:', e);
      authStore.reset();
      permissionStore.reset();
      next({ path: '/login', query: { redirect: to.fullPath } });
    } finally {
      NProgress.done();
    }
  });

  router.afterEach(() => {
    NProgress.done();
  });

  router.onError((error) => {
    console.error('[Router Error]', error);
    NProgress.done();
  });
}

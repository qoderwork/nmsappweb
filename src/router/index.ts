/**
 * 路由入口
 *
 * 使用 Hash 模式（部署友好，无需 nginx try_files 配置）
 * 静态路由 + 动态路由（运行时注入）
 */

import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { staticRoutes, notFoundRoute } from './modules/static';
import { setupRouterGuards } from './guards';

const routes: RouteRecordRaw[] = [
  ...staticRoutes,
  // 动态路由由路由守卫运行时通过 router.addRoute() 注入
  notFoundRoute,
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

// 注册全局前置守卫
setupRouterGuards(router);

/** 重置路由（登出时调用，清空动态路由） */
export function resetRouter(): void {
  const allRoutes = router.getRoutes();
  const staticNames = new Set(
    staticRoutes.flatMap((r) => [r.name, ...(r.children?.map((c) => c.name) ?? [])])
  );
  allRoutes.forEach((r) => {
    if (r.name && !staticNames.has(r.name)) {
      router.removeRoute(r.name);
    }
  });
}

export default router;

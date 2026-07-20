/**
 * 静态路由
 *
 * 不需要权限校验的路由，包括：登录页、错误页、根路径、404 兜底
 */

import type { RouteRecordRaw } from 'vue-router';

const Layout = () => import('@/layouts/AppLayout.vue');

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'login.title', hidden: true },
  },
  {
    path: '/401',
    name: 'Unauthorized',
    component: () => import('@/views/error/401.vue'),
    meta: { title: 'error.page401.title', hidden: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: 'error.page404.title', hidden: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: 'menu.dashboard',
          icon: 'Odometer',
          requiresAuth: true,
          affix: true,
          keepAlive: true,
        },
      },
      {
        path: 'device/list',
        name: 'DeviceList',
        component: () => import('@/views/device/list/index.vue'),
        meta: {
          title: 'menu.deviceList',
          icon: 'List',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'monitor/alarm',
        name: 'AlarmList',
        component: () => import('@/views/monitor/alarm/index.vue'),
        meta: {
          title: 'menu.alarmList',
          icon: 'Warning',
          requiresAuth: true,
          keepAlive: true,
          permissionsOr: ['Alarm.ListAlarm'],
        },
      },
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: 'menu.userManagement',
          icon: 'User',
          requiresAuth: true,
          keepAlive: true,
          permissionsOr: ['System.Authority.User.ListUser'],
        },
      },
      {
        path: 'system/role',
        name: 'RoleManagement',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: 'menu.roleManagement',
          icon: 'UserFilled',
          requiresAuth: true,
          keepAlive: true,
          permissionsOr: ['System.Authority.Role.ListRole'],
        },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: {
          title: 'menu.profile',
          icon: 'User',
          requiresAuth: true,
          hidden: true,
        },
      },
    ],
  },
];

export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFoundCatch',
  redirect: '/404',
  meta: { hidden: true },
};

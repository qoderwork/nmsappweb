/**
 * 前端硬编码菜单配置
 *
 * 对齐原 Java nms-web router/index.js：菜单为前端硬编码，
 * 通过路由 meta.permissionsOr/permissionsAnd/isAdmin 控制可见性。
 *
 * 菜单项与 router/modules/static.ts 中的路由对应。
 */

import type { MenuItem } from '@/types';

/**
 * 静态菜单树（用于侧边栏渲染）
 *
 * 说明：
 *  - permissionsOr：任一权限满足即显示
 *  - permissionsAnd：所有权限都满足才显示
 *  - isAdmin：仅管理员可见
 *  - 无权限配置的菜单所有人可见
 */
export const staticMenus: MenuItem[] = [
  {
    id: 1,
    parentId: 0,
    name: '仪表盘',
    code: 'dashboard',
    type: 'menu',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'Odometer',
    sort: 1,
    visible: 'visible',
    keepAlive: true,
  },
  {
    id: 2,
    parentId: 0,
    name: '设备管理',
    code: 'device',
    type: 'directory',
    path: '/device',
    component: 'Layout',
    icon: 'Monitor',
    sort: 2,
    visible: 'visible',
    children: [
      {
        id: 21,
        parentId: 2,
        name: '设备列表',
        code: 'device-list',
        type: 'menu',
        path: '/device/list',
        component: 'device/list',
        icon: 'List',
        sort: 1,
        visible: 'visible',
        keepAlive: true,
      },
    ],
  },
  {
    id: 3,
    parentId: 0,
    name: '监控告警',
    code: 'monitor',
    type: 'directory',
    path: '/monitor',
    component: 'Layout',
    icon: 'Bell',
    sort: 3,
    visible: 'visible',
    permissionsOr: ['Alarm.ListAlarm'],
    children: [
      {
        id: 31,
        parentId: 3,
        name: '告警列表',
        code: 'alarm-list',
        type: 'menu',
        path: '/monitor/alarm',
        component: 'monitor/alarm',
        icon: 'Warning',
        sort: 1,
        visible: 'visible',
        permissionsOr: ['Alarm.ListAlarm'],
      },
    ],
  },
  {
    id: 4,
    parentId: 0,
    name: '系统设置',
    code: 'system',
    type: 'directory',
    path: '/system',
    component: 'Layout',
    icon: 'Setting',
    sort: 4,
    visible: 'visible',
    isAdmin: true,
    children: [
      {
        id: 41,
        parentId: 4,
        name: '用户管理',
        code: 'user-manage',
        type: 'menu',
        path: '/system/user',
        component: 'system/user',
        icon: 'User',
        sort: 1,
        visible: 'visible',
        permissionsOr: ['System.Authority.User.ListUser'],
      },
      {
        id: 42,
        parentId: 4,
        name: '角色管理',
        code: 'role-manage',
        type: 'menu',
        path: '/system/role',
        component: 'system/role',
        icon: 'UserFilled',
        sort: 2,
        visible: 'visible',
        permissionsOr: ['System.Authority.Role.ListRole'],
      },
    ],
  },
  {
    id: 5,
    parentId: 0,
    name: '个人中心',
    code: 'profile',
    type: 'menu',
    path: '/profile',
    component: 'profile/index',
    icon: 'User',
    sort: 99,
    visible: 'hidden',
  },
];

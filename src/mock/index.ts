/**
 * Mock 数据 - 免登录预览模式
 *
 * 启用方式：URL 加 ?mock=1 参数，或 localStorage 设 MOCK_ENABLED=true
 * 仅用于开发演示，生产环境不会启用
 */

import type { UserInfo, MenuItem } from '@/types';

/** Mock 模式开关 key */
export const MOCK_KEY = 'MOCK_ENABLED';

/**
 * 检查是否启用 mock 模式
 * 优先级：URL 参数 > localStorage
 */
export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mock') === '1') {
    localStorage.setItem(MOCK_KEY, 'true');
    return true;
  }
  return localStorage.getItem(MOCK_KEY) === 'true';
}

/** 关闭 mock 模式 */
export function disableMockMode(): void {
  localStorage.removeItem(MOCK_KEY);
}

/** Mock 用户信息 */
export const mockUser: UserInfo = {
  id: 1,
  username: 'admin',
  roles: ['admin'],
  permissions: ['*'],
  tenantId: '1',
  isAdmin: true,
};

/** Mock 菜单列表（扁平结构，用于 buildTree） */
export const mockMenus: MenuItem[] = [
  {
    id: 1,
    parentId: 0,
    name: '仪表盘',
    code: 'dashboard',
    type: 'menu',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'Odometer',
    permission: 'dashboard.view',
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
    permission: 'device.view',
    sort: 2,
    visible: 'visible',
  },
  {
    id: 21,
    parentId: 2,
    name: '设备列表',
    code: 'device-list',
    type: 'menu',
    path: '/device/list',
    component: 'device/list',
    icon: 'List',
    permission: 'device.list',
    sort: 1,
    visible: 'visible',
    keepAlive: true,
  },
  {
    id: 22,
    parentId: 2,
    name: '设备分组',
    code: 'device-group',
    type: 'menu',
    path: '/device/group',
    component: 'device/group',
    icon: 'Files',
    permission: 'device.group',
    sort: 2,
    visible: 'visible',
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
    permission: 'monitor.view',
    sort: 3,
    visible: 'visible',
  },
  {
    id: 31,
    parentId: 3,
    name: '告警列表',
    code: 'alarm-list',
    type: 'menu',
    path: '/monitor/alarm',
    component: 'monitor/alarm',
    icon: 'Warning',
    permission: 'monitor.alarm',
    sort: 1,
    visible: 'visible',
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
    permission: 'system.view',
    sort: 4,
    visible: 'visible',
  },
  {
    id: 41,
    parentId: 4,
    name: '用户管理',
    code: 'user-manage',
    type: 'menu',
    path: '/system/user',
    component: 'system/user',
    icon: 'User',
    permission: 'system.user',
    sort: 1,
    visible: 'visible',
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
    permission: 'system.role',
    sort: 2,
    visible: 'visible',
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
    permission: 'profile.view',
    sort: 99,
    visible: 'hidden',
  },
];

/** Mock 权限码（admin 通配 *） */
export const mockPermissions: string[] = ['*'];

/** Mock 角色 */
export const mockRoles: string[] = ['admin'];

/** Mock Dashboard 统计数据 */
export const mockDashboardStats = {
  deviceTotal: 128,
  deviceOnline: 115,
  deviceOffline: 13,
  deviceAlarm: 7,
  todayAlarm: 23,
  todayTask: 8,
};

/** Mock 最近事件 */
export interface MockEvent {
  id: number;
  time: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  device: string;
}

export const mockRecentEvents: MockEvent[] = [
  { id: 1, time: '10:32:15', level: 'error', message: 'CPE-001 设备离线', device: 'CPE-001' },
  { id: 2, time: '10:15:42', level: 'warning', message: '信号强度低于阈值', device: 'CPE-023' },
  { id: 3, time: '09:58:20', level: 'info', message: '固件升级完成', device: 'CPE-045' },
  { id: 4, time: '09:30:08', level: 'warning', message: 'CPU 使用率超过 80%', device: 'CPE-067' },
  { id: 5, time: '09:12:33', level: 'info', message: '设备注册成功', device: 'CPE-128' },
  { id: 6, time: '08:45:11', level: 'error', message: 'TR-069 连接失败', device: 'CPE-089' },
  { id: 7, time: '08:20:55', level: 'info', message: '配置下发成功', device: 'CPE-056' },
];

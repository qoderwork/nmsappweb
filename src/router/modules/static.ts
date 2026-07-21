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
        path: 'device/group',
        name: 'DeviceGroup',
        component: () => import('@/views/device/group/index.vue'),
        meta: {
          title: 'menu.deviceGroup',
          icon: 'Grid',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'device/ops',
        name: 'DeviceOps',
        component: () => import('@/views/device/ops/index.vue'),
        meta: {
          title: 'menu.deviceOps',
          icon: 'Operation',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'device/detail/:id',
        name: 'DeviceDetail',
        component: () => import('@/views/device/detail/index.vue'),
        meta: {
          title: 'menu.deviceDetail',
          icon: 'List',
          requiresAuth: true,
          hidden: true,
        },
      },
      {
        path: 'device/parameter',
        name: 'ParameterManagement',
        component: () => import('@/views/device/parameter/index.vue'),
        meta: {
          title: 'menu.parameterManagement',
          icon: 'Setting',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'device/param-monitor',
        name: 'ParamMonitor',
        component: () => import('@/views/device/param-monitor/index.vue'),
        meta: {
          title: 'menu.paramMonitor',
          icon: 'TrendCharts',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'device/param-compare',
        name: 'ParamCompare',
        component: () => import('@/views/device/param-compare/index.vue'),
        meta: {
          title: 'menu.paramCompare',
          icon: 'DocumentCopy',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'network/site',
        name: 'SiteManagement',
        component: () => import('@/views/network/site/index.vue'),
        meta: {
          title: 'menu.siteManage',
          icon: 'MapLocation',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'network/topology',
        name: 'TopologyManagement',
        component: () => import('@/views/network/topology/index.vue'),
        meta: {
          title: 'menu.topology',
          icon: 'Share',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'network/cbsd',
        name: 'CBSDManagement',
        component: () => import('@/views/network/cbsd/index.vue'),
        meta: {
          title: 'menu.cbsd',
          icon: 'Connection',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'network/core-network',
        name: 'CoreNetwork',
        component: () => import('@/views/network/core-network/index.vue'),
        meta: {
          title: 'menu.coreNetwork',
          icon: 'Monitor',
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
        path: 'monitor/event-log',
        name: 'EventLog',
        component: () => import('@/views/monitor/event-log/index.vue'),
        meta: {
          title: 'menu.eventLog',
          icon: 'Document',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'monitor/device-log',
        name: 'DeviceLog',
        component: () => import('@/views/monitor/device-log/index.vue'),
        meta: {
          title: 'menu.deviceLog',
          icon: 'Files',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'monitor/monitor-task',
        name: 'MonitorTask',
        component: () => import('@/views/monitor/monitor-task/index.vue'),
        meta: {
          title: 'menu.monitorTask',
          icon: 'DataLine',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: 'menu.userManage',
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
          title: 'menu.roleManage',
          icon: 'UserFilled',
          requiresAuth: true,
          keepAlive: true,
          permissionsOr: ['System.Authority.Role.ListRole'],
        },
      },
      {
        path: 'system/upgrade',
        name: 'UpgradeManagement',
        component: () => import('@/views/system/upgrade/index.vue'),
        meta: {
          title: 'menu.upgrade',
          icon: 'UploadFilled',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: () => import('@/views/system/settings/index.vue'),
        meta: {
          title: 'menu.systemSettings',
          icon: 'Setting',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/ssh',
        name: 'SSHManagement',
        component: () => import('@/views/system/ssh/index.vue'),
        meta: {
          title: 'menu.ssh',
          icon: 'Terminal',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/backup',
        name: 'BackupManagement',
        component: () => import('@/views/system/backup/index.vue'),
        meta: {
          title: 'menu.backup',
          icon: 'DataBackup',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/mml',
        name: 'MMLManagement',
        component: () => import('@/views/system/mml/index.vue'),
        meta: {
          title: 'menu.mml',
          icon: 'List',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/security',
        name: 'SecurityManagement',
        component: () => import('@/views/system/security/index.vue'),
        meta: {
          title: 'menu.security',
          icon: 'Lock',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/mail',
        name: 'MailConfig',
        component: () => import('@/views/system/mail/index.vue'),
        meta: {
          title: 'menu.mailConfig',
          icon: 'Message',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/ntp',
        name: 'NTPConfig',
        component: () => import('@/views/system/ntp/index.vue'),
        meta: {
          title: 'menu.ntpConfig',
          icon: 'Timer',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/resources',
        name: 'ResourcesMonitor',
        component: () => import('@/views/system/resources/index.vue'),
        meta: {
          title: 'menu.resources',
          icon: 'Cpu',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/platform',
        name: 'PlatformSettings',
        component: () => import('@/views/system/platform/index.vue'),
        meta: {
          title: 'menu.platform',
          icon: 'Platform',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/health',
        name: 'HealthCheck',
        component: () => import('@/views/system/health/index.vue'),
        meta: {
          title: 'menu.healthCheck',
          icon: 'Monitor',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/cacert',
        name: 'CACertManagement',
        component: () => import('@/views/system/cacert/index.vue'),
        meta: {
          title: 'menu.cacert',
          icon: 'Key',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/blacklist',
        name: 'BlackList',
        component: () => import('@/views/system/blacklist/index.vue'),
        meta: {
          title: 'menu.blacklist',
          icon: 'UserFilled',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/tcpdump',
        name: 'Tcpdump',
        component: () => import('@/views/system/tcpdump/index.vue'),
        meta: {
          title: 'menu.tcpdump',
          icon: 'Monitor',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/pmfile',
        name: 'PMFile',
        component: () => import('@/views/system/pmfile/index.vue'),
        meta: {
          title: 'menu.pmfile',
          icon: 'Document',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/heartbeat',
        name: 'Heartbeat',
        component: () => import('@/views/system/heartbeat/index.vue'),
        meta: {
          title: 'menu.heartbeat',
          icon: 'Connection',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/deviceauth',
        name: 'DeviceAuth',
        component: () => import('@/views/system/deviceauth/index.vue'),
        meta: {
          title: 'menu.deviceAuth',
          icon: 'Lock',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/northinterfacelog',
        name: 'NorthInterfaceLog',
        component: () => import('@/views/system/northinterfacelog/index.vue'),
        meta: {
          title: 'menu.northInterfaceLog',
          icon: 'Message',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/ztp',
        name: 'ZTPManagement',
        component: () => import('@/views/system/ztp/index.vue'),
        meta: {
          title: 'menu.ztpManagement',
          icon: 'MagicStick',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'report/mr',
        name: 'MRReport',
        component: () => import('@/views/report/mr/index.vue'),
        meta: {
          title: 'menu.mrReport',
          icon: 'TrendCharts',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'report/pm',
        name: 'PMManagement',
        component: () => import('@/views/report/pm/index.vue'),
        meta: {
          title: 'menu.pm',
          icon: 'DataAnalysis',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/diagnostics',
        name: 'Diagnostics',
        component: () => import('@/views/system/diagnostics/index.vue'),
        meta: {
          title: 'menu.diagnostics',
          icon: 'FirstAidKit',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/license',
        name: 'LicenseManagement',
        component: () => import('@/views/system/license/index.vue'),
        meta: {
          title: 'menu.licenseManagement',
          icon: 'Key',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/tenancy',
        name: 'TenancyManagement',
        component: () => import('@/views/system/tenancy/index.vue'),
        meta: {
          title: 'menu.tenancyManagement',
          icon: 'OfficeBuilding',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/bsbackup',
        name: 'BSBackupManagement',
        component: () => import('@/views/system/bsbackup/index.vue'),
        meta: {
          title: 'menu.bsbackupManagement',
          icon: 'FolderOpened',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'system/normalfile',
        name: 'NormalFileManager',
        component: () => import('@/views/system/normalfile/index.vue'),
        meta: {
          title: 'menu.normalFileManagement',
          icon: 'Folder',
          requiresAuth: true,
          keepAlive: true,
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

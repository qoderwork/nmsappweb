/**
 * 权限相关类型定义
 * 对齐 nmsappsrv 后端权限模型
 *
 * 后端接口：
 * - GET /api/v2/getPermissionIdsForUser 返回 { admin, permission_ids }
 * - GET /api/v2/getPermission 返回全部权限注册表（管理员视角）
 *
 * 菜单为前端硬编码，不依赖后端返回菜单数据。
 */

/** 菜单类型 */
export type MenuType = 'directory' | 'menu' | 'button' | 'link';

/** 菜单可见性 */
export type MenuVisible = 'visible' | 'hidden';

/** 菜单数据（前端硬编码，不依赖后端） */
export interface MenuItem {
  id: number;
  /** 父级 ID，0 表示顶级 */
  parentId: number;
  /** 菜单名称 */
  name: string;
  /** 菜单编码（用作 route name） */
  code: string;
  /** 菜单类型 */
  type: MenuType;
  /** 路由路径 */
  path: string;
  /** 组件路径（相对 src/views） */
  component?: string;
  /** 重定向地址 */
  redirect?: string;
  /** 图标名称 */
  icon?: string;
  /** 权限标识（点号分隔：Module.Sub.Action） */
  permission?: string;
  /** 所需权限（任一满足即可显示） */
  permissionsOr?: string[];
  /** 所需权限（全部满足才显示） */
  permissionsAnd?: string[];
  /** 是否仅管理员可见 */
  isAdmin?: boolean;
  /** 排序号 */
  sort: number;
  /** 是否可见 */
  visible: MenuVisible;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 是否外链 */
  isExternal?: boolean;
  /** 路由参数 */
  query?: Record<string, string>;
  /** 子菜单 */
  children?: MenuItem[];
}

/** getPermissionIdsForUser 响应（对齐后端 GetPermissionIdsForUserVO） */
export interface PermissionIdsResult {
  /** 是否为管理员（admin/operator 角色） */
  admin: boolean;
  /** 权限编码列表（点号分隔） */
  permission_ids: string[];
}

/** 权限项 */
export interface PermissionItem {
  id: number;
  /** 权限编码（点号分隔） */
  code: string;
  /** 权限名称 */
  name: string;
  /** 类型：menu | button | api */
  type: 'menu' | 'button' | 'api';
  /** 关联菜单 ID */
  menuId?: number;
  description?: string;
}

/** 角色信息（旧权限模块，nmsappsrv 请使用 types/user.ts 中的 Role） */
export interface PermissionRole {
  id: number;
  code: string;
  name: string;
  description?: string;
  /** 角色拥有的权限编码列表 */
  permissions: string[];
  /** 角色数据范围：1全部 2本租户 3本部门 4本人 */
  dataScope?: 1 | 2 | 3 | 4;
  /** 启用状态 */
  enabled: boolean;
  createTime: string;
}

/** 权限校验模式 */
export type PermissionMode = 'role' | 'code' | 'mixed';

/** 路由元信息扩展（对齐原 Java nms-web 路由 meta 约定） */
declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单标题 */
    title?: string;
    /** 菜单图标 */
    icon?: string;
    /** 是否需要登录 */
    requiresAuth?: boolean;
    /** 所需角色编码 */
    roles?: string[];
    /** 所需权限编码 */
    permissions?: string[];
    /** 任一权限满足即可访问（对齐 Java meta.permissionsOr） */
    permissionsOr?: string[];
    /** 所有权限都满足才可访问（对齐 Java meta.permissionsAnd） */
    permissionsAnd?: string[];
    /** 是否仅管理员可访问（对齐 Java meta.isAdmin） */
    isAdmin?: boolean;
    /** 是否缓存 */
    keepAlive?: boolean;
    /** 是否在侧边栏隐藏 */
    hidden?: boolean;
    /** 是否固定标签页 */
    affix?: boolean;
    /** 是否外链 */
    external?: boolean;
    /** 活跃菜单（用于详情页激活父菜单） */
    activeMenu?: string;
    /** 面包屑是否显示 */
    breadcrumb?: boolean;
  }
}

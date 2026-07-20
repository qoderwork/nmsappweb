/**
 * 权限校验工具
 * 支持角色编码和点号分隔的权限码校验
 *
 * 权限模型说明：
 * - 角色：admin（超级管理员，通配所有权限）、operator（运维，通配所有权限）、viewer（只读）
 * - 权限码：点号分隔 Module.Sub.Action，例如 device.list.view、device.create
 * - 通配：admin/operator 角色或权限码为 "*" 表示拥有所有权限
 */

/** 是否为超级管理员角色 */
export function isAdmin(roles: string[] = []): boolean {
  return roles.includes('admin');
}

/** 是否为运维角色 */
export function isOperator(roles: string[] = []): boolean {
  return roles.includes('operator') || isAdmin(roles);
}

/** 是否为只读角色 */
export function isViewer(roles: string[] = []): boolean {
  return roles.includes('viewer');
}

/**
 * 校验是否拥有任一指定角色
 * @param userRoles 用户拥有的角色编码列表
 * @param requiredRoles 需要的角色编码列表（满足其一即可）
 */
export function hasRole(userRoles: string[] = [], requiredRoles: string[] = []): boolean {
  if (requiredRoles.length === 0) return true;
  if (isAdmin(userRoles)) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * 校验是否拥有所有指定角色
 */
export function hasAllRoles(userRoles: string[] = [], requiredRoles: string[] = []): boolean {
  if (requiredRoles.length === 0) return true;
  if (isAdmin(userRoles)) return true;
  return requiredRoles.every((role) => userRoles.includes(role));
}

/**
 * 校验是否拥有指定权限
 * @param userPermissions 用户拥有的权限码列表
 * @param required 需要的权限码或权限码列表（满足其一即可）
 */
export function hasPermission(
  userPermissions: string[] = [],
  required?: string | string[]
): boolean {
  if (!required) return true;
  if (required.length === 0) return true;
  if (isAdminPermissions(userPermissions)) return true;

  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((perm) => matchPermission(userPermissions, perm));
}

/**
 * 校验是否拥有所有指定权限
 */
export function hasAllPermissions(
  userPermissions: string[] = [],
  required: string[] = []
): boolean {
  if (required.length === 0) return true;
  if (isAdminPermissions(userPermissions)) return true;
  return required.every((perm) => matchPermission(userPermissions, perm));
}

/**
 * 判断权限列表是否为超级权限（admin 或通配符 *）
 */
function isAdminPermissions(permissions: string[] = []): boolean {
  return permissions.includes('*');
}

/**
 * 单个权限匹配（支持通配符）
 * - 精确匹配：device.list.view == device.list.view
 * - 前缀通配：device.* 匹配 device.list.view、device.create 等
 * - 全通配：* 匹配任意
 */
function matchPermission(userPermissions: string[], required: string): boolean {
  if (required === '*') return true;
  return userPermissions.some((p) => {
    if (p === required) return true;
    if (p === '*') return true;
    // 前缀通配：device.* 匹配 device.xxx
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -2);
      return required === prefix || required.startsWith(`${prefix}.`);
    }
    return false;
  });
}

/**
 * 从权限列表中提取所有模块（点号第一段去重）
 */
export function extractPermissionModules(permissions: string[] = []): string[] {
  const modules = new Set<string>();
  permissions.forEach((p) => {
    if (p === '*') return;
    const seg = p.split('.')[0];
    if (seg) modules.add(seg);
  });
  return Array.from(modules).sort();
}

/**
 * 按模块分组权限
 */
export function groupPermissionsByModule(permissions: string[] = []): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  permissions.forEach((p) => {
    if (p === '*') return;
    const seg = p.split('.')[0];
    if (!seg) return;
    if (!groups[seg]) groups[seg] = [];
    groups[seg].push(p);
  });
  return groups;
}

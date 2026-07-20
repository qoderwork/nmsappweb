/**
 * 用户管理类型定义
 * 对齐 nmsappsrv 后端 internal/user/model.go
 */

/** 用户状态 */
export type UserStatus = 0 | 1;

/** 用户实体（对齐 SysUser） */
export interface User {
  id: number;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  realName?: string | null;
  status?: UserStatus | null;
  licenseId?: number | null;
  createTime?: string | null;
  lastLoginTime?: string | null;
  loginErrorTimes?: number | null;
  lastLockTime?: string | null;
  enable?: boolean | null;
  passwordModifyTime?: string | null;
  createUserId?: number | null;
  avatar?: string | null;
  loginErrorTime?: string | null;
  createUserName?: string | null;
  updateTime?: string | null;
  firstLogin?: boolean | null;
}

/** 用户列表响应 DTO（对齐 UserDTO） */
export interface UserDTO extends User {
  roles?: string[];
  loginState: boolean;
}

/** 角色实体（对齐 Role） */
export interface Role {
  id: string;
  roleName?: string | null;
  description?: string | null;
  licenseId?: number | null;
  useToSSO?: boolean | null;
  defaultRole?: boolean | null;
  user?: string | null;
  updateTime?: string | null;
}

/** 角色权限关联（对齐 RoleHasPermission） */
export interface RoleHasPermission {
  id: number;
  roleId?: string | null;
  permissionId?: string | null;
}

/** 用户角色关联（对齐 UserHasRole） */
export interface UserHasRole {
  id: number;
  userId: number;
  roleId: string;
}

/** 用户查询参数 */
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: UserStatus;
  [key: string]: unknown;
}

/** 修改密码请求 */
export interface ModifyPasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** 重置密码请求（管理员） */
export interface ResetPasswordRequest {
  userId: number;
}

/** 设置用户租户请求 */
export interface SetTenancyRequest {
  userId: number;
  licenseId: number;
}

/** 登录失败次数响应 */
export interface LoginFailedTimesResponse {
  maxFailedTime: number;
  failedTime: number;
}

/** 密码是否需要修改响应 */
export interface NeedChangePasswordResponse {
  needChange: boolean;
  reason: number;
}
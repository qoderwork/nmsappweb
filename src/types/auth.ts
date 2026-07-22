/**
 * 认证相关类型定义
 * 对齐 nmsappsrv 后端登录接口
 *
 * 登录流程对齐原 Java nms-web：
 *  1. POST /api/v1/login 返回 { token }
 *  2. 用户名由前端保存到 sessionStorage（不调用 /user/info）
 *  3. GET  /api/v2/getPermissionIdsForUser 返回 { admin, permission_ids }
 *  4. 菜单为前端硬编码（router/modules/static.ts），通过路由 meta 控制可见性
 */

/** 登录请求参数 */
export interface LoginParams {
  username: string;
  password: string;
  /** 验证码 Key（后端返回 required=true 时必填） */
  verificationKey?: string;
  /** 用户输入的验证码 */
  verificationCode?: string;
  /** 是否记住登录态 */
  remember?: boolean;
}

/** 登录响应数据（后端仅返回 token） */
export interface LoginResult {
  /** JWT Token */
  token: string;
}

/**
 * 用户信息（前端组装，非后端接口返回）
 * - username/roles 来自登录表单 + JWT claims
 * - permissions 来自 /api/v2/getPermissionIdsForUser
 */
export interface UserInfo {
  /** 用户 ID（从 JWT user_id 解析） */
  id: number;
  /** 用户名（登录表单填写） */
  username: string;
  /** 真实姓名（可选，从 JWT 解析） */
  realName?: string;
  /** 角色编码列表（从 JWT role_names 解析） */
  roles: string[];
  /** 权限编码列表（点号分隔：Module.Sub.Action） */
  permissions: string[];
  /** 租户 ID（从 JWT tenant_id 解析） */
  tenantId?: string | number;
  /** 是否为管理员（后端 getPermissionIdsForUser 返回 admin=true） */
  isAdmin?: boolean;
}

/** 用户偏好设置（前端本地存储） */
export interface UserPreferences {
  /** 主题：light | dark | auto */
  theme?: 'light' | 'dark' | 'auto';
  /** 语言：zh | en */
  locale?: 'zh' | 'en';
  /** 侧边栏是否折叠 */
  sidebarCollapsed?: boolean;
  /** 标签页是否固定 */
  tagsView?: boolean;
}

/** 验证码响应（对齐后端 GET /captchaImage） */
export interface CaptchaResult {
  /** 验证码 Key */
  key: string;
  /** 验证码图片 base64 */
  imageBase64: string;
}

/** 修改密码参数 */
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** 登录日志 */
export interface LoginLog {
  id: number;
  username: string;
  ip: string;
  location?: string;
  browser?: string;
  os?: string;
  status: 'success' | 'fail';
  message?: string;
  loginTime: string;
}

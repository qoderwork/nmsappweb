/**
 * 认证 Store
 *
 * 管理用户登录态、Token 管理
 *
 * 对齐原 Java nms-web 登录流程：
 *  1. 登录成功仅保存 token（后端只返回 token）
 *  2. 用户名保存到 sessionStorage（前端自己存，不调用 /user/info）
 *  3. 用户 ID、角色、licenseId 从 JWT claims 解析
 *  4. 权限码由 permission store 调用 getPermissionIdsForUser 获取
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import type { LoginParams, UserInfo } from '@/types';
import { login as loginApi, logout as logoutApi } from '@/api/auth';
import {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  parseTokenPayload,
} from '@/utils/auth';
import { localStorage, sessionStorage, StorageKeys } from '@/utils/storage';
import { isMockMode, mockUser, disableMockMode } from '@/mock';

/** JWT payload 结构（对齐 nmsappsrv middleware.Claims）
 *  注意：role_names 是字符串数组，不是逗号分隔的字符串
 */
interface JwtPayload {
  user_id: number;
  username: string;
  license_id: number;
  role_names: string[];
  sso_type?: string;
}

export const useAuthStore = defineStore('auth', () => {
  // ============ State ============
  const token = ref<string | null>(getToken());
  const user = ref<UserInfo | null>(
    localStorage.get<UserInfo>(StorageKeys.USER_INFO)
  );
  const loading = ref(false);
  /** 是否已加载过用户信息（用于路由守卫一次性加载） */
  const loaded = ref(false);

  // ============ Getters ============
  const isLoggedIn = computed(() => !!token.value && isAuthenticated());
  const roles = computed<string[]>(() => user.value?.roles ?? []);
  const permissions = computed<string[]>(() => user.value?.permissions ?? []);
  const licenseId = computed<string | number | undefined>(() => user.value?.licenseId);
  const username = computed(() => user.value?.username || '');
  const avatar = computed(() => '');
  const isAdminRole = computed(() => user.value?.isAdmin === true || roles.value.includes('admin'));

  // ============ Actions ============

  /**
   * 从 JWT 解析用户基本信息
   * JWT claims: user_id, username, license_id, role_names (string[])
   */
  function parseUserFromToken(): UserInfo | null {
    const payload = parseTokenPayload<JwtPayload>();
    if (!payload) return null;
    // role_names 是字符串数组（对齐后端 middleware.Claims）
    const roleNames = Array.isArray(payload.role_names) ? payload.role_names : [];
    return {
      id: payload.user_id,
      username: payload.username,
      roles: roleNames,
      permissions: [],
      licenseId: payload.license_id,
    };
  }

  /**
   * 登录
   * 后端仅返回 { token }，用户信息从 JWT 解析
   * @returns LoginResult
   */
  async function login(params: LoginParams) {
    loading.value = true;
    try {
      const result = await loginApi(params);
      if (result.token) {
        token.value = result.token;
        setToken(result.token, 3600);

        // 从 JWT 解析用户信息
        const info = parseUserFromToken();
        if (info) {
          // 用户名保存到 sessionStorage（对齐原 Java nms-web）
          sessionStorage.set(StorageKeys.USER_INFO, info);
          localStorage.set(StorageKeys.USER_INFO, info);
          user.value = info;
          loaded.value = true;
        }
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载用户信息（从 JWT 解析，不调用后端接口）
   * 对齐原 Java nms-web：没有 /user/info 接口
   */
  async function loadUserInfo() {
    if (isMockMode()) {
      user.value = mockUser;
      localStorage.set(StorageKeys.USER_INFO, mockUser);
      loaded.value = true;
      return mockUser;
    }
    if (!token.value) return null;
    const info = parseUserFromToken();
    if (info) {
      user.value = info;
      localStorage.set(StorageKeys.USER_INFO, info);
      loaded.value = true;
    }
    return info;
  }

  /** 登出 */
  async function logout() {
    try {
      if (token.value && !isMockMode()) await logoutApi();
    } catch {
      // 忽略登出接口失败
    } finally {
      reset();
    }
  }

  /**
   * Mock 登录（免登录预览模式）
   * 直接使用 mock 数据登录，无需后端
   */
  function mockLogin(): void {
    token.value = 'mock-token';
    setToken('mock-token', 86400);
    user.value = mockUser;
    localStorage.set(StorageKeys.USER_INFO, mockUser);
    loaded.value = true;
  }

  /** 重置（清除所有本地认证数据） */
  function reset() {
    token.value = null;
    user.value = null;
    loaded.value = false;
    clearToken();
    localStorage.remove(StorageKeys.USER_INFO);
    localStorage.remove(StorageKeys.PERMISSIONS);
    localStorage.remove(StorageKeys.ROLES);
    localStorage.remove(StorageKeys.LICENSE_ID);
    sessionStorage.remove(StorageKeys.USER_INFO);
    disableMockMode();
  }

  /** 更新用户信息（本地） */
  function updateUser(info: Partial<UserInfo>) {
    if (!user.value) {
      user.value = { id: 0, username: '', roles: [], permissions: [], ...info };
    } else {
      user.value = { ...user.value, ...info };
    }
    localStorage.set(StorageKeys.USER_INFO, user.value);
  }

  /** 刷新权限（重新加载用户信息） */
  async function refresh() {
    return loadUserInfo();
  }

  return {
    // state
    token,
    user,
    loading,
    loaded,
    // getters
    isLoggedIn,
    roles,
    permissions,
    licenseId,
    username,
    avatar,
    isAdminRole,
    // actions
    login,
    mockLogin,
    loadUserInfo,
    logout,
    reset,
    updateUser,
    refresh,
  };
});

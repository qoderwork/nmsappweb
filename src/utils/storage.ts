/**
 * 本地存储封装
 * 统一处理 JSON 序列化、命名空间、过期时间
 */

const NAMESPACE = 'NMS_';

interface StorageItem<T> {
  value: T;
  /** 过期时间戳（ms），0 表示永不过期 */
  expire: number;
}

class StorageHelper {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * 写入数据
   * @param key 键
   * @param value 值
   * @param ttl 存活时间（秒），默认 0 永不过期
   */
  set<T>(key: string, value: T, ttl = 0): void {
    const item: StorageItem<T> = {
      value,
      expire: ttl > 0 ? Date.now() + ttl * 1000 : 0,
    };
    try {
      this.storage.setItem(NAMESPACE + key, JSON.stringify(item));
    } catch (e) {
      console.error('[Storage] Failed to set item:', key, e);
    }
  }

  /**
   * 读取数据
   * @param key 键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const raw = this.storage.getItem(NAMESPACE + key);
      if (!raw) return defaultValue;
      const item = JSON.parse(raw) as StorageItem<T>;
      if (item.expire > 0 && Date.now() > item.expire) {
        this.storage.removeItem(NAMESPACE + key);
        return defaultValue;
      }
      return item.value;
    } catch (e) {
      console.error('[Storage] Failed to get item:', key, e);
      return defaultValue;
    }
  }

  /**
   * 移除指定键
   */
  remove(key: string): void {
    this.storage.removeItem(NAMESPACE + key);
  }

  /**
   * 清空所有 NMS_ 命名空间的数据
   */
  clear(): void {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(NAMESPACE)) keys.push(key);
    }
    keys.forEach((k) => this.storage.removeItem(k));
  }

  /**
   * 判断键是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * 命名空间化的本地存储封装实例
 * 注意：导出名加 `Nms` 前缀，避免与浏览器全局 `localStorage` / `sessionStorage` 冲突
 */
export const nmsLocalStorage = new StorageHelper(window.localStorage);
export const nmsSessionStorage = new StorageHelper(window.sessionStorage);

/**
 * 兼容性别名（保持向后兼容）
 * 使用时建议直接使用 nmsLocalStorage / nmsSessionStorage
 */
export { nmsLocalStorage as localStorage, nmsSessionStorage as sessionStorage };

/** 存储键名枚举 */
export const StorageKeys = {
  TOKEN: 'token',
  TOKEN_EXPIRE: 'token_expire',
  USER_INFO: 'user_info',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  THEME: 'theme',
  LOCALE: 'locale',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TAGS_VIEW: 'tags_view',
  LICENSE_ID: 'license_id',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

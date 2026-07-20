/**
 * 设置 Store
 *
 * 管理主题、语言、布局偏好等用户级设置
 * 与 Element Plus locale 联动
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

import { localStorage, StorageKeys } from '@/utils/storage';

export type Theme = 'light' | 'dark' | 'auto';
export type Locale = 'zh' | 'en';

export const useSettingsStore = defineStore('settings', () => {
  // ============ State ============
  const theme = ref<Theme>(localStorage.get<Theme>(StorageKeys.THEME) ?? 'light');
  const locale = ref<Locale>(localStorage.get<Locale>(StorageKeys.LOCALE) ?? 'zh');
  /** 实际生效主题（auto 时根据系统解析） */
  const effectiveTheme = ref<'light' | 'dark'>('light');
  /** 是否显示标签页 */
  const showTagsView = ref<boolean>(
    localStorage.get<boolean>(StorageKeys.TAGS_VIEW + '_enabled') ?? true
  );
  /** 是否启用水印 */
  const enableWatermark = ref(false);
  /** 是否启用 Breadcrumb */
  const showBreadcrumb = ref(true);

  // ============ Getters ============
  const isDark = computed(() => effectiveTheme.value === 'dark');
  const themeIcon = computed(() =>
    effectiveTheme.value === 'dark' ? 'moon' : 'sunny'
  );

  // ============ Actions ============
  function setTheme(t: Theme) {
    theme.value = t;
  }

  function toggleTheme() {
    const next: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    };
    setTheme(next[theme.value]);
  }

  function setLocale(l: Locale) {
    locale.value = l;
  }

  /**
   * 应用主题到 document.documentElement
   * 由 useTheme composable 调用
   */
  function applyTheme() {
    let resolved: 'light' | 'dark';
    if (theme.value === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme.value;
    }
    effectiveTheme.value = resolved;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  }

  /** 监听系统主题变化（auto 模式生效） */
  function watchSystemTheme() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (theme.value === 'auto') applyTheme();
    });
  }

  // ============ 持久化 ============
  watch(theme, (val) => {
    localStorage.set(StorageKeys.THEME, val);
    applyTheme();
  });

  watch(locale, (val) => {
    localStorage.set(StorageKeys.LOCALE, val);
  });

  return {
    // state
    theme,
    locale,
    effectiveTheme,
    showTagsView,
    enableWatermark,
    showBreadcrumb,
    // getters
    isDark,
    themeIcon,
    // actions
    setTheme,
    toggleTheme,
    setLocale,
    applyTheme,
    watchSystemTheme,
  };
});

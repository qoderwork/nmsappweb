/**
 * 主题管理 Composable
 *
 * 与 settings store 联动，应用主题到 documentElement
 * 支持浅色 / 深色 / 跟随系统三种模式
 */

import { computed, onMounted, watch } from 'vue';
import { useSettingsStore, type Theme } from '@/stores/settings';

export function useTheme() {
  const settings = useSettingsStore();

  const theme = computed<Theme>({
    get: () => settings.theme,
    set: (val) => settings.setTheme(val),
  });

  const isDark = computed(() => settings.isDark);

  function toggleTheme() {
    settings.toggleTheme();
  }

  function setTheme(t: Theme) {
    settings.setTheme(t);
  }

  // 初始化应用主题 + 监听系统主题变化
  onMounted(() => {
    settings.applyTheme();
    settings.watchSystemTheme();
  });

  // 主题变化时重新应用
  watch(
    () => settings.theme,
    () => settings.applyTheme()
  );

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };
}

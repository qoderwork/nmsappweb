/**
 * 应用 Store
 *
 * 管理应用全局状态：侧边栏折叠、标签页、移动端响应
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';

import { localStorage, StorageKeys } from '@/utils/storage';

export interface TagView {
  path: string;
  fullPath: string;
  name: string;
  title: string;
  query?: Record<string, string>;
  affix?: boolean;
  keepAlive?: boolean;
}

export const useAppStore = defineStore('app', () => {
  // ============ State ============
  /** 侧边栏是否折叠 */
  const sidebarCollapsed = ref<boolean>(
    localStorage.get<boolean>(StorageKeys.SIDEBAR_COLLAPSED) ?? false
  );
  /** 是否为移动端 */
  const isMobile = ref(useMediaQuery('(max-width: 768px)').value);
  /** 移动端侧边栏是否展开 */
  const mobileSidebarOpened = ref(false);
  /** 标签页列表 */
  const tagsView = ref<TagView[]>(localStorage.get<TagView[]>(StorageKeys.TAGS_VIEW) ?? []);
  /** 缓存的路由名称 */
  const cachedViews = ref<string[]>([]);

  // ============ Getters ============
  const sidebarWidth = computed(() => {
    if (isMobile.value) return 0;
    return sidebarCollapsed.value ? 64 : 220;
  });
  const affixedTags = computed(() => tagsView.value.filter((t) => t.affix));

  // ============ Actions ============
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebar(collapsed: boolean) {
    sidebarCollapsed.value = collapsed;
  }

  function toggleMobileSidebar() {
    mobileSidebarOpened.value = !mobileSidebarOpened.value;
  }

  function closeMobileSidebar() {
    mobileSidebarOpened.value = false;
  }

  /** 添加标签页 */
  function addTagView(view: TagView) {
    const exists = tagsView.value.find((t) => t.path === view.path);
    if (exists) {
      // 更新已存在的标签页（query 可能变化）
      Object.assign(exists, view);
      return;
    }
    tagsView.value.push(view);
    if (view.keepAlive && !cachedViews.value.includes(view.name)) {
      cachedViews.value.push(view.name);
    }
  }

  /** 移除标签页 */
  function removeTagView(path: string) {
    const idx = tagsView.value.findIndex((t) => t.path === path);
    if (idx === -1) return;
    const tag = tagsView.value[idx];
    if (tag.affix) return; // 固定标签不可移除
    tagsView.value.splice(idx, 1);
    if (tag.keepAlive) {
      cachedViews.value = cachedViews.value.filter((n) => n !== tag.name);
    }
  }

  /** 关闭其他标签页 */
  function closeOtherViews(path: string) {
    tagsView.value = tagsView.value.filter((t) => t.path === path || t.affix);
    const remainNames = tagsView.value.map((t) => t.name);
    cachedViews.value = cachedViews.value.filter((n) => remainNames.includes(n));
  }

  /** 关闭所有非固定标签 */
  function closeAllViews() {
    tagsView.value = tagsView.value.filter((t) => t.affix);
    cachedViews.value = [];
  }

  /** 关闭左侧标签 */
  function closeLeftViews(path: string) {
    const idx = tagsView.value.findIndex((t) => t.path === path);
    if (idx <= 0) return;
    const removed = tagsView.value.slice(0, idx);
    tagsView.value = tagsView.value.slice(idx);
    const removedNames = removed.filter((t) => !t.affix).map((t) => t.name);
    cachedViews.value = cachedViews.value.filter((n) => !removedNames.includes(n));
  }

  /** 关闭右侧标签 */
  function closeRightViews(path: string) {
    const idx = tagsView.value.findIndex((t) => t.path === path);
    if (idx === -1) return;
    const removed = tagsView.value.slice(idx + 1);
    tagsView.value = tagsView.value.slice(0, idx + 1);
    const removedNames = removed.filter((t) => !t.affix).map((t) => t.name);
    cachedViews.value = cachedViews.value.filter((n) => !removedNames.includes(n));
  }

  /** 重置 */
  function reset() {
    tagsView.value = [];
    cachedViews.value = [];
    mobileSidebarOpened.value = false;
  }

  // ============ 自动持久化 ============
  watch(sidebarCollapsed, (val) => {
    localStorage.set(StorageKeys.SIDEBAR_COLLAPSED, val);
  });

  watch(
    tagsView,
    (val) => {
      localStorage.set(StorageKeys.TAGS_VIEW, val);
    },
    { deep: true }
  );

  return {
    // state
    sidebarCollapsed,
    isMobile,
    mobileSidebarOpened,
    tagsView,
    cachedViews,
    // getters
    sidebarWidth,
    affixedTags,
    // actions
    toggleSidebar,
    setSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    addTagView,
    removeTagView,
    closeOtherViews,
    closeAllViews,
    closeLeftViews,
    closeRightViews,
    reset,
  };
});

<script setup lang="ts">
/**
 * 主布局容器
 *
 * 三段式布局：左侧 Sidebar + 顶部 Navbar + 主内容区
 * 桌面端：侧边栏固定，宽度 220px ↔ 64px（折叠切换）
 * 移动端：侧边栏使用 el-drawer 抽屉模式
 *
 * 主内容区使用 router-view + transition + keep-alive
 * TagsView 作为可选组件（受 settings.showTagsView 控制）
 */
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import { useTheme } from '@/composables/useTheme';

import Sidebar from './components/Sidebar.vue';
import Navbar from './components/Navbar.vue';
import TagsView from './components/TagsView.vue';

const appStore = useAppStore();
const settingsStore = useSettingsStore();

// 初始化主题（应用持久化的主题设置 + 监听系统主题变化）
useTheme();

/** 移动端抽屉可见状态（双向绑定到 store） */
const mobileDrawerVisible = computed<boolean>({
  get: () => appStore.mobileSidebarOpened,
  set: (val) => {
    appStore.mobileSidebarOpened = val;
  },
});
</script>

<template>
  <div class="app-layout" :class="{ 'is-mobile': appStore.isMobile }">
    <!-- 桌面端：固定侧边栏 -->
    <Sidebar v-if="!appStore.isMobile" class="app-layout__sidebar" />

    <!-- 移动端：抽屉式侧边栏 -->
    <el-drawer
      v-else
      v-model="mobileDrawerVisible"
      direction="ltr"
      :size="220"
      :with-header="false"
      :z-index="2000"
      class="app-layout__drawer"
    >
      <Sidebar />
    </el-drawer>

    <div class="app-layout__main">
      <Navbar class="app-layout__navbar" />

      <TagsView v-if="settingsStore.showTagsView" class="app-layout__tagsview" />

      <main class="app-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="appStore.cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-page);
  overflow: hidden;

  &__sidebar {
    flex-shrink: 0;
    height: 100vh;
  }

  &__main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    height: 100vh;
    overflow: hidden;
  }

  &__navbar {
    flex-shrink: 0;
  }

  &__tagsview {
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    padding: var(--layout-content-padding);
    overflow-y: auto;
    overflow-x: hidden;
    background-color: var(--bg-page);
  }
}

/* 移动端抽屉样式覆盖 */
:deep(.app-layout__drawer) {
  .el-drawer__body {
    padding: 0;
    background-color: var(--sidebar-bg);
  }
}
</style>

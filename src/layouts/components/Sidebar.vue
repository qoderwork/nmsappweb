<script setup lang="ts">
/**
 * 侧边栏
 *
 * 使用 el-menu 递归渲染菜单树
 * 折叠状态由 appStore.sidebarCollapsed 控制
 * 移动端抽屉模式下使用 Logo + 完整菜单
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { usePermissionStore } from '@/stores/permission';

import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';

const appStore = useAppStore();
const permissionStore = usePermissionStore();
const route = useRoute();

/** 菜单树（按 sort 排序） */
const menus = computed(() =>
  [...permissionStore.menus].sort((a, b) => a.sort - b.sort)
);

/** 当前激活菜单的路径 */
const activeMenu = computed(() => {
  // 详情页可通过 meta.activeMenu 指定激活的父菜单
  const active = route.meta?.activeMenu;
  if (active && typeof active === 'string') return active;
  return route.path;
});

/** 折叠状态 */
const collapsed = computed(() => appStore.sidebarCollapsed);

/** 菜单点击跳转（仅非外链） */
function handleSelect(index: string) {
  // 外链已在 SidebarItem 中处理 window.open，这里只处理路由跳转
  if (/^(https?:|mailto:|tel:)/i.test(index)) return;
  // 移动端点击后关闭抽屉
  if (appStore.isMobile) {
    appStore.closeMobileSidebar();
  }
}
</script>

<template>
  <div class="nms-sidebar" :class="{ 'is-collapsed': collapsed }">
    <Logo />
    <el-scrollbar class="nms-sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        :collapse-transition="true"
        background-color="transparent"
        text-color="var(--sidebar-text)"
        active-text-color="var(--sidebar-text-active)"
        class="nms-sidebar__menu"
        @select="handleSelect"
      >
        <SidebarItem
          v-for="menu in menus"
          :key="menu.id"
          :item="menu"
          :base-path="menu.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.nms-sidebar {
  display: flex;
  flex-direction: column;
  width: var(--layout-sidebar-width);
  height: 100vh;
  background-color: var(--sidebar-bg);
  transition: width var(--transition-base) var(--transition-ease);
  overflow: hidden;

  &.is-collapsed {
    width: var(--layout-sidebar-collapsed-width);
  }

  &__scroll {
    flex: 1;
    overflow: hidden;

    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
    }
  }

  &__menu {
    border-right: none;
    background-color: var(--sidebar-bg) !important;

    /* 覆盖 EP Menu 内部 CSS 变量以使用项目主题色 */
    :deep(.el-menu) {
      --el-menu-bg-color: var(--sidebar-bg);
      --el-menu-text-color: var(--sidebar-text);
      --el-menu-hover-bg-color: var(--sidebar-item-hover);
      --el-menu-active-color: var(--sidebar-text-active);
      background-color: var(--sidebar-bg);
      border-right: none;
    }

    /* 菜单项基础样式 */
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      color: var(--sidebar-text);
      background-color: var(--sidebar-bg) !important;
      transition: background-color var(--transition-fast) var(--transition-ease),
        color var(--transition-fast) var(--transition-ease);

      &:hover {
        background-color: var(--sidebar-item-hover) !important;
        color: var(--sidebar-text-active);
      }

      i,
      .el-icon {
        color: inherit;
      }
    }

    /* 激活态 */
    :deep(.el-menu-item.is-active) {
      color: var(--sidebar-text-active) !important;
      background-color: var(--sidebar-item-active) !important;
    }

    /* 展开图标颜色 */
    :deep(.el-sub-menu__icon-arrow) {
      color: var(--sidebar-text);
    }

    /* 折叠状态下子菜单浮层背景 */
    :deep(.el-menu--popup-container) {
      background-color: var(--sidebar-bg);

      .el-menu-item,
      .el-sub-menu__title {
        background-color: var(--sidebar-bg) !important;
      }
    }
  }
}
</style>

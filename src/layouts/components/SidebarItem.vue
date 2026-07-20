<script setup lang="ts">
/**
 * 单个菜单项（递归组件）
 *
 * 处理三种情况：
 *  1. 外链：isExternal=true，点击在新窗口打开
 *  2. 单菜单：无可见子节点或仅一个可见子节点，渲染为 el-menu-item
 *  3. 目录：多个可见子节点，渲染为 el-sub-menu 并递归
 */
import { computed, type Component } from 'vue';
import * as ElIcons from '@element-plus/icons-vue';
import { Link } from '@element-plus/icons-vue';

import type { MenuItem } from '@/types';

const props = defineProps<{
  /** 当前菜单项 */
  item: MenuItem;
  /** 父级路径，用于拼接子菜单完整路径 */
  basePath: string;
}>();

/** 图标映射表（运行时根据字符串解析 EP 图标组件） */
const iconMap = ElIcons as unknown as Record<string, Component>;

/** 解析图标组件 */
function resolveIcon(name?: string): Component | undefined {
  if (!name) return undefined;
  return iconMap[name];
}

/** 拼接完整路径（支持外链 URL） */
function resolvePath(routePath: string): string {
  if (!routePath) return '';
  if (/^(https?:|mailto:|tel:)/i.test(routePath)) return routePath;
  if (routePath.startsWith('/')) return routePath;
  const base = props.basePath.endsWith('/')
    ? props.basePath.slice(0, -1)
    : props.basePath;
  return `${base}/${routePath}`;
}

/** 当前项完整路径 */
const fullPath = computed(() => resolvePath(props.item.path));

/** 可见且非按钮的子菜单，按 sort 升序 */
const visibleChildren = computed(() =>
  (props.item.children ?? [])
    .filter((c) => c.visible === 'visible' && c.type !== 'button')
    .sort((a, b) => a.sort - b.sort)
);

/** 是否为目录（多子菜单） */
const isDirectory = computed(() => visibleChildren.value.length > 1);

/** 是否为单菜单（无子或仅一子） */
const isSingleMenu = computed(() => !isExternal.value && !isDirectory.value);

/** 是否为外链 */
const isExternal = computed(() => !!props.item.isExternal);

/** 单菜单情况下实际显示的标题 */
const singleTitle = computed(() => {
  if (visibleChildren.value.length === 1) {
    return visibleChildren.value[0].name;
  }
  return props.item.name;
});

/** 单菜单情况下实际跳转的路径 */
const singlePath = computed(() => {
  if (visibleChildren.value.length === 1) {
    return resolvePath(visibleChildren.value[0].path);
  }
  return fullPath.value;
});

/** 单菜单情况下显示的图标（子项优先，无则用父级） */
const singleIcon = computed(() => {
  if (visibleChildren.value.length === 1) {
    const child = visibleChildren.value[0];
    return resolveIcon(child.icon) ?? resolveIcon(props.item.icon);
  }
  return resolveIcon(props.item.icon);
});

/** 父级图标（目录场景） */
const directoryIcon = computed(() => resolveIcon(props.item.icon));

/** 外链图标 */
const externalIcon = computed(() => resolveIcon(props.item.icon));

/** 在新窗口打开外链 */
function openExternal(url: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <!-- 外链 -->
  <el-menu-item
    v-if="isExternal"
    :index="fullPath"
    @click="openExternal(fullPath)"
  >
    <el-icon v-if="externalIcon"><component :is="externalIcon" /></el-icon>
    <template #title>
      <span class="nms-menu-title">{{ item.name }}</span>
      <el-icon class="nms-menu-external-icon"><Link /></el-icon>
    </template>
  </el-menu-item>

  <!-- 单菜单 -->
  <el-menu-item v-else-if="isSingleMenu" :index="singlePath">
    <el-icon v-if="singleIcon"><component :is="singleIcon" /></el-icon>
    <template #title>{{ singleTitle }}</template>
  </el-menu-item>

  <!-- 目录：递归渲染 -->
  <el-sub-menu v-else :index="fullPath">
    <template #title>
      <el-icon v-if="directoryIcon"><component :is="directoryIcon" /></el-icon>
      <span>{{ item.name }}</span>
    </template>
    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.id"
      :item="child"
      :base-path="fullPath"
    />
  </el-sub-menu>
</template>

<style lang="scss" scoped>
.nms-menu-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nms-menu-external-icon {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
  opacity: 0.6;
}
</style>

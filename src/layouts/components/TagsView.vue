<script setup lang="ts">
/**
 * 标签页 TagsView
 *
 * 功能：
 *  - 监听路由变化，自动添加标签
 *  - 横向滚动（el-scrollbar）
 *  - 当前激活标签高亮
 *  - 标签可关闭（非 affix）
 *  - 右键菜单：关闭/关闭其他/关闭全部/关闭左侧/关闭右侧
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Close, RefreshRight } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

import { useAppStore, type TagView } from '@/stores/app';

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** 标签列表 */
const tags = computed(() => appStore.tagsView);

/** 右键菜单状态 */
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  tag: TagView | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  tag: null,
});

/** 当前路由是否对应指定标签 */
function isActive(tag: TagView): boolean {
  return tag.path === route.path;
}

/** 路由 → TagView */
function routeToTagView(): TagView | null {
  if (!route.name || typeof route.name !== 'string') return null;
  const title = route.meta?.title;
  if (!title) return null;
  if (route.meta?.hidden) return null;

  const query: Record<string, string> = {};
  Object.entries(route.query).forEach(([k, v]) => {
    if (typeof v === 'string') query[k] = v;
  });

  return {
    path: route.path,
    fullPath: route.fullPath,
    name: route.name,
    title: t(title),
    titleKey: title,
    query: Object.keys(query).length ? query : undefined,
    affix: route.meta?.affix,
    keepAlive: route.meta?.keepAlive,
  };
}

/** 添加当前路由到标签 */
function addCurrentTag() {
  const tag = routeToTagView();
  if (tag) appStore.addTagView(tag);
}

/** 初始化固定标签（遍历路由表 meta.affix=true 的记录） */
function initAffixTags() {
  const affixRoutes = router
    .getRoutes()
    .filter((r) => r.meta?.affix && typeof r.name === 'string' && r.meta?.title);

  affixRoutes.forEach((r) => {
    const title = r.meta!.title!;
    const name = r.name as string;
    appStore.addTagView({
      path: r.path,
      fullPath: r.path,
      name,
      title: t(title),
      titleKey: title,
      affix: true,
      keepAlive: r.meta?.keepAlive,
    });
  });
}

/** 跳转到最后一个标签或首页 */
function navigateToLast() {
  const last = appStore.tagsView[appStore.tagsView.length - 1];
  if (last) {
    router.push(last.fullPath);
  } else {
    router.push('/dashboard');
  }
}

/** 点击标签 */
function handleClick(tag: TagView) {
  if (route.fullPath !== tag.fullPath) {
    router.push(tag.fullPath);
  }
}

/** 关闭单个标签 */
function closeTag(tag: TagView) {
  if (tag.affix) return;
  appStore.removeTagView(tag.path);
  if (route.path === tag.path) {
    navigateToLast();
  }
}

/** 关闭其他 */
function closeOthers(tag: TagView) {
  appStore.closeOtherViews(tag.path);
  if (route.path !== tag.path) {
    router.push(tag.fullPath);
  }
}

/** 关闭全部 */
function closeAll() {
  appStore.closeAllViews();
  const stillExists = appStore.tagsView.find((v) => v.path === route.path);
  if (!stillExists) {
    navigateToLast();
  }
}

/** 关闭左侧 */
function closeLeft(tag: TagView) {
  appStore.closeLeftViews(tag.path);
  const stillExists = appStore.tagsView.find((v) => v.path === route.path);
  if (!stillExists) {
    router.push(tag.fullPath);
  }
}

/** 关闭右侧 */
function closeRight(tag: TagView) {
  appStore.closeRightViews(tag.path);
  const stillExists = appStore.tagsView.find((v) => v.path === route.path);
  if (!stillExists) {
    router.push(tag.fullPath);
  }
}

/** 右键菜单 */
function onContextMenu(e: MouseEvent, tag: TagView) {
  e.preventDefault();
  const maxX = window.innerWidth - 160;
  const maxY = window.innerHeight - 220;
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, maxX),
    y: Math.min(e.clientY, maxY),
    tag,
  };
}

/** 隐藏右键菜单 */
function hideContextMenu() {
  contextMenu.value.visible = false;
}

/** 菜单项点击代理 */
function onMenuClose() {
  const tag = contextMenu.value.tag;
  hideContextMenu();
  if (tag) closeTag(tag);
}

function onMenuCloseOthers() {
  const tag = contextMenu.value.tag;
  hideContextMenu();
  if (tag) closeOthers(tag);
}

function onMenuCloseAll() {
  hideContextMenu();
  closeAll();
}

function onMenuCloseLeft() {
  const tag = contextMenu.value.tag;
  hideContextMenu();
  if (tag) closeLeft(tag);
}

function onMenuCloseRight() {
  const tag = contextMenu.value.tag;
  hideContextMenu();
  if (tag) closeRight(tag);
}

/** 滚动到当前激活标签 */
function scrollToActiveTag() {
  const activeEl = document.querySelector(
    '.nms-tagsview__item.is-active'
  ) as HTMLElement | null;
  if (!activeEl) return;
  // 找到 el-scrollbar 内部可滚动容器
  const scrollContainer = activeEl.closest(
    '.el-scrollbar__wrap'
  ) as HTMLElement | null;
  if (scrollContainer) {
    scrollContainer.scrollLeft = Math.max(0, activeEl.offsetLeft - 20);
  }
}

// 监听路由变化
watch(
  () => route.fullPath,
  () => {
    addCurrentTag();
  },
  { immediate: true }
);

// 标签变化时滚动到激活项
watch(
  () => appStore.tagsView.length,
  () => {
    requestAnimationFrame(scrollToActiveTag);
  }
);

onMounted(() => {
  initAffixTags();
  addCurrentTag();
  window.addEventListener('click', hideContextMenu);
  window.addEventListener('resize', hideContextMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', hideContextMenu);
  window.removeEventListener('resize', hideContextMenu);
});
</script>

<template>
  <div class="nms-tagsview">
    <el-scrollbar class="nms-tagsview__scroll">
      <div class="nms-tagsview__list">
        <div
          v-for="tag in tags"
          :key="tag.path"
          class="nms-tagsview__item"
          :class="{ 'is-active': isActive(tag) }"
          @click="handleClick(tag)"
          @contextmenu="onContextMenu($event, tag)"
        >
          <span class="nms-tagsview__dot" />
          <span class="nms-tagsview__label">{{
            tag.titleKey ? t(tag.titleKey) : tag.title
          }}</span>
          <el-icon
            v-if="!tag.affix"
            class="nms-tagsview__close"
            @click.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>

    <transition name="fade">
      <ul
        v-show="contextMenu.visible"
        class="nms-tagsview__context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <li class="is-disabled">
          <el-icon><RefreshRight /></el-icon>
          <span>{{ t('layout.refresh') }}</span>
        </li>
        <li
          :class="{ 'is-disabled': contextMenu.tag?.affix }"
          @click="onMenuClose"
        >
          <span>{{ t('layout.closeTag') }}</span>
        </li>
        <li @click="onMenuCloseOthers">
          <span>{{ t('layout.closeOthers') }}</span>
        </li>
        <li @click="onMenuCloseAll">
          <span>{{ t('layout.closeAll') }}</span>
        </li>
        <li @click="onMenuCloseLeft">
          <span>{{ t('layout.closeLeft') }}</span>
        </li>
        <li @click="onMenuCloseRight">
          <span>{{ t('layout.closeRight') }}</span>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.nms-tagsview {
  position: relative;
  height: var(--layout-tagsview-height);
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-lighter);
  box-shadow: var(--shadow-sm);
  user-select: none;

  &__scroll {
    height: 100%;

    :deep(.el-scrollbar__wrap) {
      overflow-y: hidden;
    }

    :deep(.el-scrollbar__bar.is-vertical) {
      display: none;
    }
  }

  &__list {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--spacing-sm);
    white-space: nowrap;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 var(--spacing-sm);
    margin-right: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--text-regular);
    background-color: var(--bg-page);
    border: 1px solid var(--border-lighter);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-ease);

    &:hover {
      color: var(--brand-primary);
      border-color: var(--brand-primary);
    }

    &.is-active {
      color: var(--text-inverse);
      background-color: var(--brand-primary);
      border-color: var(--brand-primary);

      .nms-tagsview__dot {
        background-color: #ffffff;
      }

      .nms-tagsview__close:hover {
        background-color: rgba(255, 255, 255, 0.25);
        color: #ffffff;
      }
    }
  }

  &__dot {
    width: 6px;
    height: 6px;
    margin-right: var(--spacing-xs);
    background-color: var(--text-secondary);
    border-radius: var(--radius-full);
    transition: background-color var(--transition-fast) var(--transition-ease);
  }

  &__label {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__close {
    margin-left: var(--spacing-xs);
    padding: 2px;
    font-size: var(--font-size-xs);
    border-radius: var(--radius-full);
    transition: background-color var(--transition-fast) var(--transition-ease);

    &:hover {
      background-color: var(--bg-hover);
      color: var(--color-danger);
    }
  }

  &__context-menu {
    position: fixed;
    z-index: var(--z-popover);
    min-width: 140px;
    margin: 0;
    padding: var(--spacing-xs) 0;
    list-style: none;
    background-color: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);

    li {
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-base);
      height: 32px;
      font-size: var(--font-size-sm);
      color: var(--text-regular);
      cursor: pointer;
      transition: background-color var(--transition-fast) var(--transition-ease);

      .el-icon {
        margin-right: var(--spacing-sm);
        font-size: var(--font-size-base);
      }

      &:hover {
        background-color: var(--bg-hover);
        color: var(--brand-primary);
      }

      &.is-disabled {
        color: var(--text-disabled);
        cursor: not-allowed;

        &:hover {
          background-color: transparent;
          color: var(--text-disabled);
        }
      }
    }
  }
}
</style>

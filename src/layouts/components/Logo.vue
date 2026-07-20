<script setup lang="ts">
/**
 * Logo 区
 *
 * 显示品牌 Logo（内嵌 SVG）+ 标题
 * 折叠时仅显示图标
 * 点击跳转到 /dashboard
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const router = useRouter();
const appStore = useAppStore();
const settings = useSettingsStore();

/** 是否折叠（移动端抽屉模式下始终展开） */
const collapsed = computed(() => appStore.sidebarCollapsed && !appStore.isMobile);

/** 副标题文案随语言切换 */
const subtitle = computed(() =>
  settings.locale === 'zh' ? '网管系统' : 'Console'
);

function goHome() {
  router.push('/dashboard');
}
</script>

<template>
  <div class="nms-logo" :class="{ 'is-collapsed': collapsed }" @click="goHome">
    <span class="nms-logo__icon" aria-hidden="true">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="32" height="32" rx="6" fill="var(--brand-primary)" />
        <circle cx="16" cy="16" r="2.6" fill="#ffffff" />
        <path
          d="M9.5 16 Q9.5 9.5 16 9.5"
          stroke="#ffffff"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M6.5 16 Q6.5 6.5 16 6.5"
          stroke="#ffffff"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
          opacity="0.55"
        />
        <path
          d="M22.5 16 Q22.5 22.5 16 22.5"
          stroke="#ffffff"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M25.5 16 Q25.5 25.5 16 25.5"
          stroke="#ffffff"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
          opacity="0.55"
        />
      </svg>
    </span>
    <transition name="fade">
      <span v-if="!collapsed" class="nms-logo__text">
        <span class="nms-logo__title">NMS</span>
        <span class="nms-logo__subtitle">{{ subtitle }}</span>
      </span>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.nms-logo {
  display: flex;
  align-items: center;
  height: var(--layout-navbar-height);
  padding: 0 var(--spacing-base);
  background-color: var(--sidebar-logo-bg);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  transition: all var(--transition-base) var(--transition-ease);

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    margin-left: var(--spacing-sm);
    line-height: 1.2;
    white-space: nowrap;
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--sidebar-text-active);
    letter-spacing: 1px;
  }

  &__subtitle {
    font-size: var(--font-size-xs);
    color: var(--sidebar-text);
    opacity: 0.8;
  }

  &.is-collapsed {
    justify-content: center;
    padding: 0;
  }
}
</style>

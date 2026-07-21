<script setup lang="ts">
/**
 * 顶部导航栏
 *
 * 左侧：折叠按钮 + Breadcrumb
 * 右侧：主题切换、语言切换、全屏、自动刷新开关、用户菜单
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Expand,
  Fold,
  Sunny,
  Moon,
  FullScreen,
  ArrowDown,
  User,
  SwitchButton,
  Refresh,
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';

import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore, type Locale } from '@/stores/settings';
import { changeLocale } from '@/locales';

import Breadcrumb from './Breadcrumb.vue';

const appStore = useAppStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { t } = useI18n();

const collapsed = computed(() => appStore.sidebarCollapsed);

const isDark = computed(() => settingsStore.isDark);

const userInitial = computed(() => {
  const name = authStore.username || 'U';
  return name.charAt(0).toUpperCase();
});

const currentLocale = computed(() => settingsStore.locale);

const isFullscreen = ref(false);

const autoRefreshEnabled = computed(() => settingsStore.autoRefreshEnabled);

function updateFullscreen() {
  isFullscreen.value = !!document.fullscreenElement;
}

function toggleSidebar() {
  if (appStore.isMobile) {
    appStore.toggleMobileSidebar();
  } else {
    appStore.toggleSidebar();
  }
}

function toggleTheme() {
  settingsStore.toggleTheme();
}

function handleLanguageChange(cmd: string) {
  const next = cmd as Locale;
  if (next === settingsStore.locale) return;
  settingsStore.setLocale(next);
  changeLocale(next);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}

function toggleAutoRefresh() {
  settingsStore.toggleAutoRefresh();
}

async function handleUserCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'logout') {
    await handleLogout();
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm(t('login.logoutConfirm'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    });
    await authStore.logout();
    router.push('/login');
  } catch {
    // 用户取消，无需处理
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', updateFullscreen);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', updateFullscreen);
});
</script>

<template>
  <header class="nms-navbar">
    <div class="nms-navbar__left">
      <!-- 折叠按钮 -->
      <button
        class="nms-navbar__collapse"
        :title="collapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')"
        @click="toggleSidebar"
      >
        <el-icon><Expand v-if="collapsed" /><Fold v-else /></el-icon>
      </button>

      <!-- 面包屑 -->
      <Breadcrumb v-if="settingsStore.showBreadcrumb" class="nms-navbar__breadcrumb" />
    </div>

    <div class="nms-navbar__right">
      <!-- 主题切换 -->
      <button
        class="nms-navbar__action"
        :title="t('layout.theme')"
        @click="toggleTheme"
      >
        <el-icon><Moon v-if="isDark" /><Sunny v-else /></el-icon>
      </button>

      <!-- 语言切换 -->
      <el-dropdown trigger="click" @command="handleLanguageChange">
        <button class="nms-navbar__action" :title="t('layout.language')">
          <span class="nms-navbar__locale-text">
            {{ currentLocale === 'zh' ? '中' : 'En' }}
          </span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh" :disabled="currentLocale === 'zh'">
              {{ t('layout.chinese') }}
            </el-dropdown-item>
            <el-dropdown-item command="en" :disabled="currentLocale === 'en'">
              {{ t('layout.english') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 全屏切换 -->
      <button
        class="nms-navbar__action"
        :title="isFullscreen ? t('layout.exitFullscreen') : t('layout.fullscreen')"
        @click="toggleFullscreen"
      >
        <el-icon><FullScreen /></el-icon>
      </button>

      <!-- 自动刷新开关 -->
      <div class="nms-navbar__refresh">
        <el-switch
          v-model="autoRefreshEnabled"
          :active-text="t('layout.autoRefresh')"
          :inactive-text="t('layout.autoRefresh')"
          :active-value="true"
          :inactive-value="false"
          @change="toggleAutoRefresh"
          class="nms-navbar__refresh-switch"
        />
        <el-icon class="nms-navbar__refresh-icon"><Refresh /></el-icon>
      </div>

      <!-- 用户菜单 -->
      <el-dropdown trigger="click" @command="handleUserCommand">
        <div class="nms-navbar__user">
          <el-avatar :size="28" :src="authStore.avatar || undefined" class="nms-navbar__avatar">
            <el-icon v-if="!authStore.avatar"><User /></el-icon>
            <template v-else>{{ userInitial }}</template>
          </el-avatar>
          <span class="nms-navbar__username">{{ authStore.username || t('login.username') }}</span>
          <el-icon class="nms-navbar__dropdown-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              {{ t('layout.profile') }}
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              {{ t('login.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.nms-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--layout-navbar-height);
  padding: 0 var(--spacing-base);
  background-color: var(--bg-card);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-lighter);
  flex-shrink: 0;
  z-index: var(--z-sticky);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    min-width: 0;
    flex: 1;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  &__collapse {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    font-size: var(--font-size-md);
    color: var(--text-regular);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-ease);

    &:hover {
      background-color: var(--bg-hover);
      color: var(--brand-primary);
    }
  }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    padding: 0 var(--spacing-sm);
    font-size: var(--font-size-md);
    color: var(--text-regular);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-ease);

    &:hover {
      background-color: var(--bg-hover);
      color: var(--brand-primary);
    }
  }

  &__locale-text {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  &__breadcrumb {
    min-width: 0;
    overflow: hidden;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast) var(--transition-ease);

    &:hover {
      background-color: var(--bg-hover);
    }
  }

  &__avatar {
    background-color: var(--brand-primary);
    color: var(--text-inverse);
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  &__username {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dropdown-arrow {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  &__refresh {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
  }

  &__refresh-switch {
    --el-switch-on-color: var(--brand-primary);
    --el-switch-off-color: var(--border-lighter);
    font-size: var(--font-size-xs);
  }

  &__refresh-icon {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}
</style>

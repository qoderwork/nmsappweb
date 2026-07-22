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
 *
 * WebSocket 连接：登录后自动连接，登出时断开，实现实时告警推送
 *
 * 会话管理（对齐原 nms-web）：
 *  - Token 滑动续期：到期前 10 分钟自动调用 /renewToken
 *  - 空闲检测：10 分钟无操作 → 弹窗 5 分钟倒计时 → 强制登出
 */

import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useWebSocketStore } from '@/stores/websocket';
import { useTheme } from '@/composables/useTheme';
import { useGlobalWebSocketHandler } from '@/composables/useWebSocketMessage';
import { useIdle } from '@/composables/useIdle';
import { getTokenRefreshDelay } from '@/utils/auth';
import { useI18n } from 'vue-i18n';

import Sidebar from './components/Sidebar.vue';
import Navbar from './components/Navbar.vue';
import TagsView from './components/TagsView.vue';

const appStore = useAppStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const wsStore = useWebSocketStore();
const router = useRouter();
const { t } = useI18n();

useTheme();

// 全局 WebSocket 消息处理器（处理文件下载、告警推送、设备状态变更等）
useGlobalWebSocketHandler();

const mobileDrawerVisible = computed<boolean>({
  get: () => appStore.mobileSidebarOpened,
  set: (val) => {
    appStore.mobileSidebarOpened = val;
  },
});

// ============ 会话管理常量 ============

/** 空闲检测阈值（秒）—— 10 分钟无操作触发 */
const IDLE_THRESHOLD = 10 * 60;

/** 空闲倒计时宽限时间（毫秒）—— 5 分钟 */
const IDLE_GRACE_PERIOD = 5 * 60 * 1000;

// ============ Token 自动续期 ============

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function startRefreshTimer() {
  stopRefreshTimer();
  const delay = getTokenRefreshDelay();
  if (!delay) return;

  refreshTimer = setTimeout(async () => {
    if (!authStore.isLoggedIn) return;
    const nextDelay = await authStore.refreshToken();
    if (nextDelay) {
      startRefreshTimer();
    }
  }, delay);
}

function stopRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// ============ 空闲检测 + 倒计时强制登出 ============

const { start: startIdle, stop: stopIdle, activate: resetIdle } = useIdle({
  timeout: IDLE_THRESHOLD,
  enabled: false, // 手动控制启动
  onIdle: handleIdle,
  onActive: handleActiveResume,
});

let graceTimer: ReturnType<typeof setTimeout> | null = null;

function handleIdle() {
  if (!authStore.isLoggedIn) return;

  // 显示倒计时弹窗
  showIdleWarning();
}

function showIdleWarning() {
  ElMessageBox({
    title: t('common.tip'),
    message: t('layout.idleWarning', { minutes: Math.ceil(IDLE_GRACE_PERIOD / 60000) }),
    type: 'warning',
    showCancelButton: true,
    confirmButtonText: t('layout.stayLoggedIn'),
    cancelButtonText: t('login.logout'),
    closeOnClickModal: false,
    closeOnPressEscape: false,
  })
    .then(() => {
      // 用户点击"继续操作" → 重置空闲状态，重新开始
      clearGraceTimer();
      resetIdle();
      startRefreshTimer();
    })
    .catch(() => {
      // 用户点击"退出" → 直接登出
      clearGraceTimer();
      forceLogout();
    });

  // 兜底：倒计时结束后强制登出
  graceTimer = setTimeout(() => {
    forceLogout();
  }, IDLE_GRACE_PERIOD);
}

function handleActiveResume() {
  clearGraceTimer();
  ElMessageBox.close();
}

function clearGraceTimer() {
  if (graceTimer) {
    clearTimeout(graceTimer);
    graceTimer = null;
  }
}

async function forceLogout() {
  clearGraceTimer();
  ElMessageBox.close();
  stopIdle();
  stopRefreshTimer();
  wsStore.disconnect();

  await authStore.logout();
  router.push('/login');

  setTimeout(() => {
    ElMessageBox.alert(t('layout.idleTimeout'), t('common.tip'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
    });
  }, 200);
}

// ============ 生命周期 ============

onMounted(() => {
  if (authStore.isLoggedIn) {
    void wsStore.connect();
    // 启动 Token 自动续期
    startRefreshTimer();
    // 启动空闲检测（开发模式跳过，对齐原 nms-web）
    if (!import.meta.env.DEV) {
      startIdle();
    }
  }
});

onUnmounted(() => {
  wsStore.disconnect();
  stopRefreshTimer();
  stopIdle();
  clearGraceTimer();
});

// 登录状态变化时启动/停止会话管理
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      startRefreshTimer();
      if (!import.meta.env.DEV) {
        startIdle();
      }
    } else {
      stopRefreshTimer();
      stopIdle();
      clearGraceTimer();
    }
  }
);
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
          <keep-alive :include="appStore.cachedViews">
            <component :is="Component" />
          </keep-alive>
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

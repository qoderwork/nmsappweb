/**
 * 空闲检测 Composable
 *
 * 监听用户操作（鼠标、键盘），超过指定时长无操作触发回调
 * 用于自动锁屏、自动登出等场景
 */

import { onMounted, onUnmounted, ref } from 'vue';

export interface UseIdleOptions {
  /** 空闲时长阈值（秒），默认 30 分钟 */
  timeout?: number;
  /** 触发回调 */
  onIdle?: () => void;
  /** 重新激活回调 */
  onActive?: () => void;
  /** 是否启用 */
  enabled?: boolean;
}

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

export function useIdle(options: UseIdleOptions = {}) {
  const {
    timeout = 30 * 60,
    onIdle,
    onActive,
    enabled = true,
  } = options;

  const isIdle = ref(false);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let lastActivity = Date.now();

  function resetTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (isIdle.value) {
      isIdle.value = false;
      onActive?.();
    }
    lastActivity = Date.now();
    idleTimer = setTimeout(() => {
      isIdle.value = true;
      onIdle?.();
    }, timeout * 1000);
  }

  function handleActivity() {
    resetTimer();
  }

  /** 启动监听 */
  function start() {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer();
  }

  /** 停止监听 */
  function stop() {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  /** 重置计时器（手动激活） */
  function activate() {
    resetTimer();
  }

  /** 距离上次活动的秒数 */
  function getIdleSeconds(): number {
    return Math.floor((Date.now() - lastActivity) / 1000);
  }

  onMounted(() => {
    if (enabled) start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    isIdle,
    start,
    stop,
    activate,
    getIdleSeconds,
  };
}

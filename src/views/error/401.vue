<script setup lang="ts">
/**
 * 401 无权限页
 *
 * 居中展示 401 + 提示文字，提供「返回首页」「重新登录」两个动作
 * 重新登录：清除本地认证数据后跳转登录页
 */
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

/** 返回首页 */
function goHome() {
  router.replace('/dashboard');
}

/** 重新登录：清除本地认证数据后跳转登录页 */
async function reLogin() {
  authStore.reset();
  await router.replace('/login');
}
</script>

<template>
  <div class="error-page error-page--401">
    <div class="error-page__deco" aria-hidden="true">
      <span class="error-page__shape error-page__shape--1" />
      <span class="error-page__shape error-page__shape--2" />
      <span class="error-page__shape error-page__shape--3" />
    </div>

    <div class="error-page__content">
      <div class="error-page__code">401</div>
      <h1 class="error-page__title">{{ t('error.page401.title') }}</h1>
      <p class="error-page__message">{{ t('error.page401.message') }}</p>

      <div class="error-page__actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          <span>{{ t('error.page401.backHome') }}</span>
        </el-button>
        <el-button size="large" @click="reLogin">
          <el-icon><SwitchButton /></el-icon>
          <span>{{ t('error.page401.loginAgain') }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  padding: var(--spacing-base);
  background-color: var(--bg-page);
  overflow: hidden;

  &__deco {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__shape {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      var(--brand-primary) 0%,
      var(--brand-primary-active) 100%
    );
    opacity: 0.06;

    &--1 {
      width: 480px;
      height: 480px;
      top: -160px;
      right: -120px;
    }

    &--2 {
      width: 320px;
      height: 320px;
      bottom: -100px;
      left: -80px;
      opacity: 0.04;
    }

    &--3 {
      width: 120px;
      height: 120px;
      top: 18%;
      left: 8%;
      opacity: 0.05;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 520px;
  }

  &__code {
    font-size: 120px;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(
      135deg,
      var(--brand-primary) 0%,
      var(--brand-primary-active) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 4px;
    user-select: none;
  }

  &__title {
    margin: var(--spacing-base) 0 var(--spacing-sm);
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__message {
    margin: 0 0 var(--spacing-2xl);
    font-size: var(--font-size-md);
    color: var(--text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-base);
    flex-wrap: wrap;

    .el-button {
      min-width: 140px;
    }

    .el-icon {
      margin-right: var(--spacing-xs);
    }
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .error-page__code {
    font-size: 80px;
  }

  .error-page__actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>

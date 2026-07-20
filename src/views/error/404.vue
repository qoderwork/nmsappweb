<script setup lang="ts">
/**
 * 404 页面不存在
 *
 * 居中展示 404 + 提示文字，提供「返回首页」一个动作
 */
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

/** 返回首页 */
function goHome() {
  router.replace('/dashboard');
}
</script>

<template>
  <div class="error-page error-page--404">
    <div class="error-page__deco" aria-hidden="true">
      <span class="error-page__shape error-page__shape--1" />
      <span class="error-page__shape error-page__shape--2" />
      <span class="error-page__shape error-page__shape--3" />
      <!-- 问号装饰 -->
      <span class="error-page__mark error-page__mark--1">?</span>
      <span class="error-page__mark error-page__mark--2">?</span>
      <span class="error-page__mark error-page__mark--3">?</span>
    </div>

    <div class="error-page__content">
      <div class="error-page__code">
        <span class="error-page__code-digit">4</span>
        <span class="error-page__code-digit error-page__code-digit--hole">0</span>
        <span class="error-page__code-digit">4</span>
      </div>
      <h1 class="error-page__title">{{ t('error.page404.title') }}</h1>
      <p class="error-page__message">{{ t('error.page404.message') }}</p>

      <div class="error-page__actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          <span>{{ t('error.page404.backHome') }}</span>
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
      width: 520px;
      height: 520px;
      top: -180px;
      left: -140px;
    }

    &--2 {
      width: 340px;
      height: 340px;
      bottom: -120px;
      right: -100px;
      opacity: 0.04;
    }

    &--3 {
      width: 140px;
      height: 140px;
      bottom: 20%;
      left: 10%;
      opacity: 0.05;
    }
  }

  &__mark {
    position: absolute;
    font-size: 64px;
    font-weight: 800;
    color: var(--brand-primary);
    opacity: 0.08;
    user-select: none;

    &--1 {
      top: 18%;
      right: 12%;
    }

    &--2 {
      bottom: 24%;
      left: 14%;
      font-size: 48px;
    }

    &--3 {
      top: 30%;
      left: 6%;
      font-size: 36px;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 520px;
  }

  &__code {
    display: inline-flex;
    align-items: baseline;
    font-size: 140px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 4px;
    background: linear-gradient(
      135deg,
      var(--brand-primary) 0%,
      var(--brand-primary-active) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    user-select: none;

    &-digit {
      display: inline-block;

      &--hole {
        position: relative;
        color: transparent;
        -webkit-text-fill-color: var(--brand-primary);
        margin: 0 8px;

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: var(--bg-page);
          box-shadow: inset 0 0 0 4px var(--brand-primary);
        }
      }
    }
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

    .el-button {
      min-width: 160px;
    }

    .el-icon {
      margin-right: var(--spacing-xs);
    }
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .error-page__code {
    font-size: 90px;
  }

  .error-page__actions .el-button {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
/**
 * 通用占位页面 - 用于演示菜单结构
 * 后续接入实际 API 后替换为真实页面
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitle = computed(() => {
  return (route.meta?.title as string) || route.name?.toString() || '页面';
});
</script>

<template>
  <div class="placeholder-page">
    <el-card shadow="never" :body-style="{ padding: '48px' }">
      <div class="placeholder-inner">
        <el-icon class="placeholder-icon"><Construction /></el-icon>
        <h2 class="placeholder-title">{{ pageTitle }}</h2>
        <p class="placeholder-desc">
          此页面为演示占位，后续接入实际 API 后将呈现完整业务功能
        </p>
        <el-tag type="info" size="large">开发中</el-tag>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.placeholder-page {
  width: 100%;
}

.placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  text-align: center;
}

.placeholder-icon {
  font-size: 64px;
  color: var(--brand-primary);
  opacity: 0.6;
  margin-bottom: var(--spacing-lg);
}

.placeholder-title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.placeholder-desc {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  max-width: 400px;
}
</style>

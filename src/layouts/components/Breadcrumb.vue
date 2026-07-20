<script setup lang="ts">
/**
 * 面包屑
 *
 * 基于 route.matched 生成
 * 第一项固定为"首页"，使用 Odometer 图标
 * 跳过没有 title 的路由记录
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Odometer } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

interface BreadcrumbItem {
  /** 显示文案（已 i18n 翻译） */
  title: string;
  /** 跳转路径 */
  path: string;
  /** 是否可点击跳转 */
  redirect: boolean;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const items = computed<BreadcrumbItem[]>(() => {
  // 第一项固定为首页
  const list: BreadcrumbItem[] = [
    {
      title: t('layout.dashboard'),
      path: '/dashboard',
      redirect: true,
    },
  ];

  // 遍历 route.matched，跳过无 title 或 hidden 的记录
  route.matched.forEach((record) => {
    const title = record.meta?.title;
    if (!title) return;
    if (record.meta?.hidden) return;
    // 跳过首页项，避免与固定的"首页"重复
    if (record.path === '/dashboard') return;
    list.push({
      title: t(title) ?? title,
      path: record.path,
      redirect: record.redirect !== undefined,
    });
  });

  return list;
});

function handleClick(item: BreadcrumbItem) {
  if (!item.redirect) return;
  if (route.path === item.path) return;
  router.push(item.path);
}
</script>

<template>
  <el-breadcrumb class="nms-breadcrumb" separator="/">
    <el-breadcrumb-item
      v-for="(item, idx) in items"
      :key="item.path + idx"
    >
      <span
        class="nms-breadcrumb__item"
        :class="{ 'is-link': item.redirect }"
        @click="handleClick(item)"
      >
        <el-icon v-if="idx === 0" class="nms-breadcrumb__icon">
          <Odometer />
        </el-icon>
        {{ item.title }}
      </span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style lang="scss" scoped>
.nms-breadcrumb {
  display: inline-flex;
  align-items: center;
  font-size: var(--font-size-base);
  line-height: var(--layout-navbar-height);

  :deep(.el-breadcrumb__item) {
    display: inline-flex;
    align-items: center;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    color: var(--text-regular);

    &.is-link {
      cursor: pointer;
      color: var(--text-regular);
      transition: color var(--transition-fast) var(--transition-ease);

      &:hover {
        color: var(--brand-primary);
      }
    }
  }

  &__icon {
    margin-right: var(--spacing-xs);
    font-size: var(--font-size-md);
    color: var(--brand-primary);
  }
}
</style>

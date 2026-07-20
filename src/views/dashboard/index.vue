<script setup lang="ts">
/**
 * Dashboard 仪表盘
 *
 * 顶部欢迎横幅 + 4 个统计卡片 + 最近事件列表
 * Mock 模式下使用预置数据展示效果
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '@/stores/auth';
import { isMockMode, mockDashboardStats, mockRecentEvents, type MockEvent } from '@/mock';

const { t } = useI18n();
const authStore = useAuthStore();

/** 欢迎语中的用户名 */
const displayName = computed(() => authStore.username || t('login.username'));

/** 当前日期 */
const today = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
});

/** 统计卡片配置 */
interface StatCard {
  key: string;
  label: string;
  value: number;
  iconColor: string;
  iconBg: string;
}

const stats = computed<StatCard[]>(() => {
  const s = isMockMode() ? mockDashboardStats : {
    deviceTotal: 0,
    deviceOnline: 0,
    deviceOffline: 0,
    deviceAlarm: 0,
  };
  return [
    {
      key: 'total',
      label: t('dashboard.deviceTotal'),
      value: s.deviceTotal,
      iconColor: 'var(--brand-primary)',
      iconBg: 'var(--brand-primary-light)',
    },
    {
      key: 'online',
      label: t('dashboard.deviceOnline'),
      value: s.deviceOnline,
      iconColor: 'var(--status-online)',
      iconBg: 'rgba(22, 163, 74, 0.1)',
    },
    {
      key: 'offline',
      label: t('dashboard.deviceOffline'),
      value: s.deviceOffline,
      iconColor: 'var(--status-offline)',
      iconBg: 'rgba(156, 163, 175, 0.15)',
    },
    {
      key: 'alarm',
      label: t('dashboard.deviceAlarm'),
      value: s.deviceAlarm,
      iconColor: 'var(--status-error)',
      iconBg: 'rgba(220, 38, 38, 0.1)',
    },
  ];
});

/** 最近事件（mock 模式下显示） */
const recentEvents = computed<MockEvent[]>(() => isMockMode() ? mockRecentEvents : []);

/** 事件级别对应标签类型 */
function eventLevelType(level: MockEvent['level']): 'success' | 'warning' | 'danger' | 'info' {
  const map = { info: 'info', warning: 'warning', error: 'danger' } as const;
  return map[level];
}

/** 事件级别对应中文 */
function eventLevelText(level: MockEvent['level']): string {
  const map = { info: '信息', warning: '告警', error: '故障' } as const;
  return map[level];
}
</script>

<template>
  <div class="dashboard-page">
    <!-- 欢迎横幅 -->
    <section class="dashboard-banner">
      <div class="dashboard-banner__bg" aria-hidden="true">
        <span class="dashboard-banner__circle dashboard-banner__circle--1" />
        <span class="dashboard-banner__circle dashboard-banner__circle--2" />
      </div>

      <div class="dashboard-banner__content">
        <div class="dashboard-banner__text">
          <h1 class="dashboard-banner__title">
            {{ t('login.welcome', { name: displayName }) }}
          </h1>
          <p class="dashboard-banner__subtitle">{{ today }}</p>
        </div>

        <div class="dashboard-banner__logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="rgba(255,255,255,0.2)" />
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
        </div>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="dashboard-stats">
      <el-card
        v-for="card in stats"
        :key="card.key"
        class="dashboard-stat-card"
        shadow="hover"
        :body-style="{ padding: '20px' }"
      >
        <div class="dashboard-stat-card__inner">
          <div
            class="dashboard-stat-card__icon"
            :style="{ backgroundColor: card.iconBg, color: card.iconColor }"
          >
            <el-icon v-if="card.key === 'total'"><Cpu /></el-icon>
            <el-icon v-else-if="card.key === 'online'"><CircleCheck /></el-icon>
            <el-icon v-else-if="card.key === 'offline'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>

          <div class="dashboard-stat-card__body">
            <div class="dashboard-stat-card__value">{{ card.value }}</div>
            <div class="dashboard-stat-card__label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 最近事件（mock 模式下展示） -->
    <section v-if="recentEvents.length > 0" class="dashboard-events">
      <el-card shadow="never" :body-style="{ padding: '20px' }">
        <template #header>
          <div class="dashboard-events__header">
            <span class="dashboard-events__title">{{ t('dashboard.recentEvents') }}</span>
            <el-tag size="small" type="info">{{ recentEvents.length }} 条</el-tag>
          </div>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="event in recentEvents"
            :key="event.id"
            :timestamp="event.time"
            placement="top"
            :type="eventLevelType(event.level)"
          >
            <div class="dashboard-events__item">
              <div class="dashboard-events__item-top">
                <el-tag :type="eventLevelType(event.level)" size="small">
                  {{ eventLevelText(event.level) }}
                </el-tag>
                <span class="dashboard-events__device">{{ event.device }}</span>
              </div>
              <div class="dashboard-events__message">{{ event.message }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </section>

    <!-- 占位提示 -->
    <section class="dashboard-placeholder">
      <el-card shadow="never" :body-style="{ padding: '32px' }">
        <el-empty description="更多图表与数据，将在接入实际 API 后呈现">
          <template #image>
            <el-icon class="dashboard-placeholder__icon"><DataAnalysis /></el-icon>
          </template>
        </el-empty>
      </el-card>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

/* ============ 欢迎横幅 ============ */
.dashboard-banner {
  position: relative;
  overflow: hidden;
  padding: var(--spacing-xl) var(--spacing-2xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(
    135deg,
    var(--brand-primary) 0%,
    var(--brand-primary-active) 100%
  );
  color: #ffffff;
  box-shadow: var(--shadow-md);

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);

    &--1 {
      width: 320px;
      height: 320px;
      top: -140px;
      right: -80px;
    }

    &--2 {
      width: 180px;
      height: 180px;
      bottom: -80px;
      left: 20%;
      background: rgba(255, 255, 255, 0.04);
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
  }

  &__subtitle {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.85);
  }

  &__logo {
    flex-shrink: 0;
    opacity: 0.9;
  }
}

/* ============ 统计卡片网格 ============ */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-base);
}

.dashboard-stat-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);
  transition: transform var(--transition-base) var(--transition-ease),
    box-shadow var(--transition-base) var(--transition-ease);

  &:hover {
    transform: translateY(-2px);
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    font-size: 24px;
    flex-shrink: 0;
  }

  &__body {
    min-width: 0;
  }

  &__value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  &__label {
    margin-top: 2px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

/* ============ 最近事件 ============ */
.dashboard-events {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }

  &__item {
    padding: 4px 0;
  }

  &__item-top {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: 4px;
  }

  &__device {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  &__message {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }
}

/* ============ 占位区 ============ */
.dashboard-placeholder {
  &__icon {
    font-size: 72px;
    color: var(--brand-primary);
    opacity: 0.6;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 1024px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .dashboard-banner {
    padding: var(--spacing-lg);

    &__title {
      font-size: var(--font-size-xl);
    }
  }
}
</style>


<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '@/stores/auth';
import { isMockMode, mockDashboardStats, mockRecentEvents, type MockEvent } from '@/mock';

const { t } = useI18n();
const authStore = useAuthStore();

const displayName = computed(() => authStore.username || t('login.username'));

const today = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
});

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  trend?: { value: number; up: boolean };
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
      icon: 'Cpu',
      iconColor: 'var(--brand-primary)',
      iconBg: 'var(--brand-primary-light)',
      trend: { value: 12, up: true },
    },
    {
      key: 'online',
      label: t('dashboard.deviceOnline'),
      value: s.deviceOnline,
      icon: 'CircleCheck',
      iconColor: 'var(--status-online)',
      iconBg: 'rgba(22, 163, 74, 0.1)',
      trend: { value: 8, up: true },
    },
    {
      key: 'offline',
      label: t('dashboard.deviceOffline'),
      value: s.deviceOffline,
      icon: 'CircleClose',
      iconColor: 'var(--status-offline)',
      iconBg: 'rgba(156, 163, 175, 0.15)',
      trend: { value: 3, up: false },
    },
    {
      key: 'alarm',
      label: t('dashboard.deviceAlarm'),
      value: s.deviceAlarm,
      icon: 'Warning',
      iconColor: 'var(--status-error)',
      iconBg: 'rgba(220, 38, 38, 0.1)',
      trend: { value: 5, up: false },
    },
  ];
});

const recentEvents = computed<MockEvent[]>(() => isMockMode() ? mockRecentEvents : []);

function eventLevelType(level: MockEvent['level']): 'success' | 'warning' | 'danger' | 'info' {
  const map = { info: 'info', warning: 'warning', error: 'danger' } as const;
  return map[level];
}

function eventLevelText(level: MockEvent['level']): string {
  const map = { info: '信息', warning: '告警', error: '故障' } as const;
  return map[level];
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

const quickActions = computed<QuickAction[]>(() => [
  {
    label: t('dashboard.quickViewDevices'),
    icon: 'Monitor',
    route: '/device/list',
  },
  {
    label: t('dashboard.quickViewAlarms'),
    icon: 'Warning',
    route: '/alarm/list',
    badge: isMockMode() ? mockDashboardStats.deviceAlarm : 0,
  },
  {
    label: t('dashboard.quickViewLogs'),
    icon: 'Document',
    route: '/system/log',
  },
  {
    label: t('dashboard.quickAddDevice'),
    icon: 'Plus',
    route: '/device/add',
  },
]);
</script>

<template>
  <div class="dashboard-page">
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

    <section class="dashboard-stats">
      <el-card
        v-for="card in stats"
        :key="card.key"
        class="dashboard-stat-card"
        shadow="hover"
        :body-style="{ padding: '0' }"
      >
        <div class="dashboard-stat-card__inner">
          <div
            class="dashboard-stat-card__icon"
            :style="{ backgroundColor: card.iconBg, color: card.iconColor }"
          >
            <el-icon v-if="card.icon === 'Cpu'"><Cpu /></el-icon>
            <el-icon v-else-if="card.icon === 'CircleCheck'"><CircleCheck /></el-icon>
            <el-icon v-else-if="card.icon === 'CircleClose'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>

          <div class="dashboard-stat-card__body">
            <div class="dashboard-stat-card__value-row">
              <span class="dashboard-stat-card__value">{{ card.value }}</span>
              <span
                v-if="card.trend"
                class="dashboard-stat-card__trend"
                :class="{ 'dashboard-stat-card__trend--up': card.trend.up }"
              >
                <el-icon><TrendCharts /></el-icon>
                {{ card.trend.up ? '+' : '' }}{{ card.trend.value }}%
              </span>
            </div>
            <div class="dashboard-stat-card__label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </section>

    <section class="dashboard-grid">
      <el-card class="dashboard-panel dashboard-panel--events" shadow="never" :body-style="{ padding: '20px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.recentEvents') }}</span>
            <el-tag size="small" type="info">{{ recentEvents.length }} 条</el-tag>
          </div>
        </template>

        <el-timeline v-if="recentEvents.length > 0">
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

        <el-empty v-else description="暂无事件记录">
          <template #image>
            <el-icon class="dashboard-placeholder__icon"><Bell /></el-icon>
          </template>
        </el-empty>
      </el-card>

      <el-card class="dashboard-panel dashboard-panel--actions" shadow="never" :body-style="{ padding: '20px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.quickActions') }}</span>
          </div>
        </template>

        <div class="dashboard-actions">
          <router-link
            v-for="action in quickActions"
            :key="action.label"
            :to="action.route"
            class="dashboard-action-item"
          >
            <div class="dashboard-action-item__icon">
              <el-icon v-if="action.icon === 'Monitor'"><Monitor /></el-icon>
              <el-icon v-else-if="action.icon === 'Warning'"><Warning /></el-icon>
              <el-icon v-else-if="action.icon === 'Document'"><Document /></el-icon>
              <el-icon v-else><Plus /></el-icon>
            </div>
            <span class="dashboard-action-item__label">{{ action.label }}</span>
            <el-badge
              v-if="action.badge && action.badge > 0"
              :value="action.badge"
              type="danger"
              class="dashboard-action-item__badge"
            />
          </router-link>
        </div>
      </el-card>
    </section>

    <section class="dashboard-footer">
      <el-card shadow="never" :body-style="{ padding: '24px' }">
        <div class="dashboard-footer__content">
          <div class="dashboard-footer__item">
            <el-icon class="dashboard-footer__item-icon"><Shield /></el-icon>
            <div class="dashboard-footer__item-text">
              <strong>安全防护</strong>
              <span>系统运行正常，已启用所有安全模块</span>
            </div>
          </div>
          <div class="dashboard-footer__divider" />
          <div class="dashboard-footer__item">
            <el-icon class="dashboard-footer__item-icon"><Server /></el-icon>
            <div class="dashboard-footer__item-text">
              <strong>服务状态</strong>
              <span>所有核心服务在线，数据库连接正常</span>
            </div>
          </div>
          <div class="dashboard-footer__divider" />
          <div class="dashboard-footer__item">
            <el-icon class="dashboard-footer__item-icon"><Clock /></el-icon>
            <div class="dashboard-footer__item-text">
              <strong>系统时间</strong>
              <span>{{ new Date().toLocaleString('zh-CN') }}</span>
            </div>
          </div>
        </div>
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

.dashboard-banner {
  position: relative;
  overflow: hidden;
  padding: var(--spacing-xl) var(--spacing-2xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-active) 100%);
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
    box-shadow: var(--shadow-md);
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-lg);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: var(--radius-lg);
    font-size: 26px;
    flex-shrink: 0;
  }

  &__body {
    min-width: 0;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
  }

  &__value {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background-color: rgba(156, 163, 175, 0.1);

    &--up {
      color: var(--status-online);
      background-color: rgba(22, 163, 74, 0.1);
    }

    .el-icon {
      font-size: 12px;
    }
  }

  &__label {
    margin-top: 4px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-base);
}

.dashboard-panel {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);

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

  &--actions {
    min-height: 180px;
  }
}

.dashboard-events {
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

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.dashboard-action-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
  transition: all var(--transition-fast) var(--transition-ease);
  text-decoration: none;
  color: var(--text-primary);
  position: relative;

  &:hover {
    background-color: var(--brand-primary-light);
    color: var(--brand-primary);
    transform: translateY(-2px);
  }

  &__icon {
    font-size: 20px;
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  &__badge {
    position: absolute;
    top: 4px;
    right: 4px;
  }
}

.dashboard-footer {
  margin-top: auto;
}

.dashboard-footer__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
}

.dashboard-footer__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  &-icon {
    font-size: 20px;
    color: var(--status-online);
  }

  &-text {
    display: flex;
    flex-direction: column;

    strong {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    span {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }
  }
}

.dashboard-footer__divider {
  width: 1px;
  height: 40px;
  background-color: var(--border-base);
}

.dashboard-placeholder {
  &__icon {
    font-size: 72px;
    color: var(--brand-primary);
    opacity: 0.6;
  }
}

@media (max-width: 1024px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-footer__content {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .dashboard-footer__divider {
    width: 100%;
    height: 1px;
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

  .dashboard-actions {
    grid-template-columns: 1fr;
  }
}
</style>

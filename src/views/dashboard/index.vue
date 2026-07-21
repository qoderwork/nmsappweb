<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';

import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import {
  getDeviceOnlineInfo,
  getProductTypeAndDeviceCount,
  getCpuMemUsage,
  getSeverityCount,
  getAlarmStatisticTopN,
  getBaseStationStatistics,
  getPDCPTrafficStatistic,
} from '@/api/dashboard';
import type {
  DeviceOnlineInfo,
  ProductTypeAndCount,
  CpuMemUsage,
} from '@/api/dashboard';
import type { SeverityCount } from '@/types';

const { t } = useI18n();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const displayName = computed(() => authStore.username || t('login.username'));
const today = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
);

// ============ Data ============
const onlineInfo = ref<DeviceOnlineInfo | null>(null);
const productCounts = ref<ProductTypeAndCount[]>([]);
const severityCounts = ref<SeverityCount[]>([]);
const cpuMem = ref<CpuMemUsage | null>(null);
const alarmTopN = ref<{ name: string; count: number }[]>([]);
const loading = ref(false);
const refreshCountdown = ref(60);

// ============ Computed Stats ============
const deviceTotal = computed(() => {
  if (!onlineInfo.value) return 0;
  const i = onlineInfo.value;
  return i.gnbOnlineCount + i.gnbOfflineCount + i.enbOnlineCount + i.enbOfflineCount + i.cpeOnlineCount + i.cpeOfflineCount;
});
const deviceOnline = computed(() => {
  if (!onlineInfo.value) return 0;
  const i = onlineInfo.value;
  return i.gnbOnlineCount + i.enbOnlineCount + i.cpeOnlineCount;
});
const deviceOffline = computed(() => {
  if (!onlineInfo.value) return 0;
  const i = onlineInfo.value;
  return i.gnbOfflineCount + i.enbOfflineCount + i.cpeOfflineCount;
});
const alarmTotal = computed(() => severityCounts.value.reduce((sum, s) => sum + (s.alarmCount || 0), 0));
const cpuPercent = computed(() => (cpuMem.value ? Math.round(cpuMem.value.cpu) : 0));
const memPercent = computed(() => (cpuMem.value ? Math.round(cpuMem.value.mem) : 0));

// ============ ECharts instances ============
const alarmBarRef = ref<HTMLElement>();
const alarmPieRef = ref<HTMLElement>();
const cellRateRef = ref<HTMLElement>();
const pdcpRef = ref<HTMLElement>();
const cpuGaugeRef = ref<HTMLElement>();
const memGaugeRef = ref<HTMLElement>();

let alarmBarChart: echarts.ECharts | null = null;
let alarmPieChart: echarts.ECharts | null = null;
let cellRateChart: echarts.ECharts | null = null;
let pdcpChart: echarts.ECharts | null = null;
let cpuGaugeChart: echarts.ECharts | null = null;
let memGaugeChart: echarts.ECharts | null = null;

// ============ Time range (last 24h) ============
function getTimeRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

// ============ Chart options ============
function buildAlarmBarOption(data: { name: string; count: number }[]): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name),
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: data.map(d => d.count),
      itemStyle: {
        color: (params: any) => {
          const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280', '#10b981', '#ec4899'];
          return colors[params.dataIndex % colors.length];
        },
        borderRadius: [4, 4, 0, 0],
      },
      barMaxWidth: 36,
    }],
  };
}

function buildAlarmPieOption(data: { name: string; count: number }[]): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 10 } },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      data: data.map(d => ({ name: d.name, value: d.count })),
    }],
  };
}

function buildCellRateOption(data: Record<string, { time: string; data: unknown }[]>): echarts.EChartsOption {
  const legends = Object.keys(data);
  const series = legends.map(name => {
    const points = data[name] || [];
    return {
      name,
      type: 'line' as const,
      smooth: true,
      data: points.map(p => {
        const val = typeof p.data === 'number' ? p.data : parseFloat(String(p.data)) || 0;
        return [p.time, (val * 100).toFixed(1)];
      }),
    };
  });
  return {
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 10 } },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'time', axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%', fontSize: 10 }, min: 0, max: 100 },
    series,
  };
}

function buildPDCPOption(data: { plmn: string; down: number; up: number }[]): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: [t('dashboard.downlink'), t('dashboard.uplink')], bottom: 0, textStyle: { fontSize: 10 } },
    grid: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.plmn),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (v: number) => (v >= 1000 ? (v / 1000).toFixed(1) + 'G' : v + 'M') } },
    series: [
      {
        name: t('dashboard.downlink'),
        type: 'bar',
        stack: 'traffic',
        data: data.map(d => d.down),
        itemStyle: { color: '#3b82f6', borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: t('dashboard.uplink'),
        type: 'bar',
        stack: 'traffic',
        data: data.map(d => d.up),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
    ],
  };
}

function buildGaugeOption(title: string, value: number, color: string): echarts.EChartsOption {
  return {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 5,
      pointer: { show: false },
      progress: {
        show: true,
        roundCap: true,
        width: 14,
        itemStyle: { color },
      },
      axisLine: { lineStyle: { width: 14, color: [[1, '#e5e7eb']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: {
        offsetCenter: [0, '60%'],
        fontSize: 13,
        color: '#6b7280',
      },
      detail: {
        offsetCenter: [0, '20%'],
        fontSize: 28,
        fontWeight: 700,
        formatter: '{value}%',
        color: '#1f2937',
      },
      data: [{ value, name: title }],
    }],
  };
}

// ============ Data loading ============
async function loadDashboardData() {
  loading.value = true;
  const { startTime, endTime } = getTimeRange();

  const results = await Promise.allSettled([
    getDeviceOnlineInfo(),
    getProductTypeAndDeviceCount('CPE'),
    getProductTypeAndDeviceCount('eNB'),
    getProductTypeAndDeviceCount('gNB'),
    getSeverityCount(),
    getCpuMemUsage(),
    getAlarmStatisticTopN(8),
    getBaseStationStatistics({ startTime, endTime }),
    getPDCPTrafficStatistic({ startTime, endTime }),
  ]);

  // 0: device online info
  if (results[0].status === 'fulfilled') onlineInfo.value = results[0].value;

  // 1-3: product counts (merge all 3 modes: CPE, eNB, gNB)
  const mergedCounts: ProductTypeAndCount[] = [];
  if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) mergedCounts.push(...results[1].value);
  if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) mergedCounts.push(...results[2].value);
  if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) mergedCounts.push(...results[3].value);
  productCounts.value = mergedCounts;

  // 4: severity counts (alarm total)
  if (results[4].status === 'fulfilled') {
    const data = results[4].value;
    severityCounts.value = Array.isArray(data) ? data : [];
  }

  // 5: CPU / memory
  if (results[5].status === 'fulfilled') cpuMem.value = results[5].value;

  // 6: alarm top N
  if (results[6].status === 'fulfilled') {
    const topn = results[6].value;
    alarmTopN.value = Array.isArray(topn) ? topn.map((item: any) => ({
      name: item.name || item.probableCause || item.alarmName || 'Unknown',
      count: item.count || item.total || 0,
    })) : [];
  }

  // 7: base station cell rate
  if (results[7].status === 'fulfilled') {
    const bsData = results[7].value;
    if (bsData?.cellAvailableRate) {
      if (cellRateRef.value && !cellRateChart) {
        cellRateChart = echarts.init(cellRateRef.value);
      }
      if (cellRateChart) {
        cellRateChart.setOption(buildCellRateOption(bsData.cellAvailableRate), true);
      }
    }
  }

  // 8: PDCP traffic
  if (results[8].status === 'fulfilled') {
    const pdcpData = results[8].value;
    if (Array.isArray(pdcpData) && pdcpData.length > 0) {
      if (pdcpRef.value && !pdcpChart) {
        pdcpChart = echarts.init(pdcpRef.value);
      }
      if (pdcpChart) {
        pdcpChart.setOption(buildPDCPOption(pdcpData), true);
      }
    }
  }

  // Update charts
  await nextTick();
  updateCharts();
  loading.value = false;
}

function updateCharts() {
  // Alarm bar chart
  if (alarmBarRef.value && !alarmBarChart) {
    alarmBarChart = echarts.init(alarmBarRef.value);
  }
  if (alarmBarChart && alarmTopN.value.length > 0) {
    alarmBarChart.setOption(buildAlarmBarOption(alarmTopN.value), true);
  }

  // Alarm pie chart
  if (alarmPieRef.value && !alarmPieChart) {
    alarmPieChart = echarts.init(alarmPieRef.value);
  }
  if (alarmPieChart && alarmTopN.value.length > 0) {
    alarmPieChart.setOption(buildAlarmPieOption(alarmTopN.value), true);
  }

  // CPU gauge
  if (cpuGaugeRef.value && !cpuGaugeChart) {
    cpuGaugeChart = echarts.init(cpuGaugeRef.value);
  }
  if (cpuGaugeChart) {
    cpuGaugeChart.setOption(buildGaugeOption('CPU', cpuPercent.value, cpuPercent.value > 80 ? '#ef4444' : '#3b82f6'), true);
  }

  // Memory gauge
  if (memGaugeRef.value && !memGaugeChart) {
    memGaugeChart = echarts.init(memGaugeRef.value);
  }
  if (memGaugeChart) {
    memGaugeChart.setOption(buildGaugeOption(t('dashboard.memory'), memPercent.value, memPercent.value > 80 ? '#ef4444' : '#10b981'), true);
  }
}

// ============ Auto-refresh (controlled by global setting) ============
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function startAutoRefresh() {
  stopAutoRefresh();
  refreshCountdown.value = settingsStore.autoRefreshInterval;

  countdownTimer = setInterval(() => {
    refreshCountdown.value--;
    if (refreshCountdown.value <= 0) {
      refreshCountdown.value = settingsStore.autoRefreshInterval;
      if (settingsStore.autoRefreshEnabled) {
        loadDashboardData();
      }
    }
  }, 1000);
}

function stopAutoRefresh() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

// ============ Resize handling ============
function handleResize() {
  alarmBarChart?.resize();
  alarmPieChart?.resize();
  cellRateChart?.resize();
  pdcpChart?.resize();
  cpuGaugeChart?.resize();
  memGaugeChart?.resize();
}

// ============ Lifecycle ============
onMounted(() => {
  loadDashboardData();
  startAutoRefresh();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopAutoRefresh();
  window.removeEventListener('resize', handleResize);
  alarmBarChart?.dispose();
  alarmPieChart?.dispose();
  cellRateChart?.dispose();
  pdcpChart?.dispose();
  cpuGaugeChart?.dispose();
  memGaugeChart?.dispose();
});

// ============ Quick actions ============
interface QuickAction { label: string; icon: string; route: string; }
const quickActions = computed<QuickAction[]>(() => [
  { label: t('dashboard.quickViewDevices'), icon: 'Monitor', route: '/device/list' },
  { label: t('dashboard.quickViewAlarms'), icon: 'Warning', route: '/monitor/alarm' },
  { label: t('dashboard.quickViewLogs'), icon: 'Document', route: '/monitor/event-log' },
  { label: t('dashboard.quickAddDevice'), icon: 'Plus', route: '/device/list' },
]);
</script>

<template>
  <div class="dashboard-page">
    <!-- Banner -->
    <section class="dashboard-banner">
      <div class="dashboard-banner__bg" aria-hidden="true">
        <span class="dashboard-banner__circle dashboard-banner__circle--1" />
        <span class="dashboard-banner__circle dashboard-banner__circle--2" />
      </div>
      <div class="dashboard-banner__content">
        <div class="dashboard-banner__text">
          <h1 class="dashboard-banner__title">{{ t('login.welcome', { name: displayName }) }}</h1>
          <p class="dashboard-banner__subtitle">{{ today }}</p>
        </div>
        <div class="dashboard-banner__meta">
          <el-tag type="info" effect="plain" size="small">
            <el-icon><Refresh /></el-icon>
            {{ refreshCountdown }}s
          </el-tag>
        </div>
      </div>
    </section>

    <!-- Stat cards -->
    <section class="dashboard-stats">
      <el-card v-for="card in [
        { key:'total', label:t('dashboard.deviceTotal'), value:deviceTotal, icon:'Cpu', color:'var(--brand-primary)', bg:'rgba(59,130,246,.1)' },
        { key:'online', label:t('dashboard.deviceOnline'), value:deviceOnline, icon:'CircleCheck', color:'#16a34a', bg:'rgba(22,163,74,.1)' },
        { key:'offline', label:t('dashboard.deviceOffline'), value:deviceOffline, icon:'CircleClose', color:'#9ca3af', bg:'rgba(156,163,175,.15)' },
        { key:'alarm', label:t('dashboard.deviceAlarm'), value:alarmTotal, icon:'Warning', color:'#ef4444', bg:'rgba(239,68,68,.1)' },
      ]" :key="card.key" class="dashboard-stat-card" shadow="hover" :body-style="{ padding: '0' }">
        <div class="dashboard-stat-card__inner">
          <div class="dashboard-stat-card__icon" :style="{ backgroundColor: card.bg, color: card.color }">
            <el-icon v-if="card.icon==='Cpu'"><Cpu /></el-icon>
            <el-icon v-else-if="card.icon==='CircleCheck'"><CircleCheck /></el-icon>
            <el-icon v-else-if="card.icon==='CircleClose'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>
          <div class="dashboard-stat-card__body">
            <span class="dashboard-stat-card__value">{{ card.value }}</span>
            <div class="dashboard-stat-card__label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </section>

    <!-- Row 1: Alarm charts -->
    <section class="dashboard-row">
      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.alarmStatsTop8') }}</span>
            <el-tag size="small" type="info">{{ t('dashboard.last24Hours') }}</el-tag>
          </div>
        </template>
        <div ref="alarmBarRef" class="chart-container chart-container--medium" />
        <el-empty v-if="alarmTopN.length === 0 && !loading" :description="t('dashboard.noAlarmData')" :image-size="60" />
      </el-card>

      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.alarmTypeDistribution') }}</span>
          </div>
        </template>
        <div ref="alarmPieRef" class="chart-container chart-container--medium" />
        <el-empty v-if="alarmTopN.length === 0 && !loading" :description="t('dashboard.noAlarmData')" :image-size="60" />
      </el-card>
    </section>

    <!-- Row 2: Base station & PDCP -->
    <section class="dashboard-row">
      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.cellAvailabilityRate') }}</span>
            <el-tag size="small" type="info">{{ t('dashboard.last24Hours') }}</el-tag>
          </div>
        </template>
        <div ref="cellRateRef" class="chart-container chart-container--medium" />
      </el-card>

      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.pdcpTrafficStats') }}</span>
          </div>
        </template>
        <div ref="pdcpRef" class="chart-container chart-container--medium" />
      </el-card>
    </section>

    <!-- Row 3: System health + Device distribution + Quick actions -->
    <section class="dashboard-row dashboard-row--three">
      <!-- CPU / Memory gauges -->
      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.systemResources') }}</span>
          </div>
        </template>
        <div class="gauge-row">
          <div ref="cpuGaugeRef" class="chart-container chart-container--gauge" />
          <div ref="memGaugeRef" class="chart-container chart-container--gauge" />
        </div>
      </el-card>

      <!-- Device distribution table -->
      <el-card class="dashboard-panel" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.deviceDistribution') }}</span>
            <el-tag size="small" type="info">{{ productCounts.length }} {{ t('dashboard.productType') }}</el-tag>
          </div>
        </template>
        <el-table v-if="productCounts.length > 0" :data="productCounts" stripe size="small" style="width: 100%">
          <el-table-column prop="productType" :label="t('dashboard.productType')" min-width="100" />
          <el-table-column prop="count" :label="t('common.all')" width="60" align="center" />
          <el-table-column prop="onlineCount" :label="t('device.online')" width="60" align="center">
            <template #default="{ row }">
              <el-tag type="success" size="small">{{ row.onlineCount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="offlineCount" :label="t('device.offline')" width="60" align="center">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.offlineCount }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else :description="t('dashboard.noDevice')" :image-size="50" />
      </el-card>

      <!-- Quick actions -->
      <el-card class="dashboard-panel dashboard-panel--actions" shadow="never" :body-style="{ padding: '16px' }">
        <template #header>
          <div class="dashboard-panel__header">
            <span class="dashboard-panel__title">{{ t('dashboard.quickActions') }}</span>
          </div>
        </template>
        <div class="dashboard-actions">
          <router-link v-for="action in quickActions" :key="action.label" :to="action.route" class="dashboard-action-item">
            <el-icon class="dashboard-action-item__icon">
              <Monitor v-if="action.icon==='Monitor'" />
              <Warning v-else-if="action.icon==='Warning'" />
              <Document v-else-if="action.icon==='Document'" />
              <Plus v-else />
            </el-icon>
            <span class="dashboard-action-item__label">{{ action.label }}</span>
          </router-link>
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
  color: #fff;
  box-shadow: var(--shadow-md);

  &__bg { position: absolute; inset: 0; pointer-events: none; }
  &__circle {
    position: absolute; border-radius: 50%; background: rgba(255,255,255,.06);
    &--1 { width: 320px; height: 320px; top: -140px; right: -80px; }
    &--2 { width: 180px; height: 180px; bottom: -80px; left: 20%; background: rgba(255,255,255,.04); }
  }
  &__content {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
  }
  &__title { margin: 0; font-size: var(--font-size-2xl); font-weight: 700; color: #fff; }
  &__subtitle { margin: var(--spacing-xs) 0 0; font-size: var(--font-size-sm); color: rgba(255,255,255,.85); }
  &__meta { display: flex; align-items: center; gap: var(--spacing-sm); }
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-base);
}

.dashboard-stat-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);
  transition: transform var(--transition-base) var(--transition-ease), box-shadow var(--transition-base) var(--transition-ease);
  &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  &__inner { display: flex; align-items: center; gap: var(--spacing-base); padding: var(--spacing-lg); }
  &__icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: var(--radius-lg); font-size: 26px; flex-shrink: 0; }
  &__body { min-width: 0; }
  &__value { font-size: var(--font-size-3xl); font-weight: 700; color: var(--text-primary); line-height: 1.2; }
  &__label { margin-top: 4px; font-size: var(--font-size-sm); color: var(--text-secondary); }
}

.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);

  &--three { grid-template-columns: 1fr 1fr 1fr; }
}

.dashboard-panel {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);
  &__header { display: flex; align-items: center; justify-content: space-between; }
  &__title { font-weight: 600; font-size: var(--font-size-base); color: var(--text-primary); }
}

.chart-container {
  width: 100%;
  &--medium { height: 260px; }
  &--gauge { height: 180px; flex: 1; }
}

.gauge-row {
  display: flex;
  gap: var(--spacing-sm);
}

.dashboard-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.dashboard-action-item {
  display: flex; align-items: center; gap: var(--spacing-sm);
  padding: var(--spacing-base); border-radius: var(--radius-md);
  background-color: var(--bg-hover); transition: all var(--transition-fast) var(--transition-ease);
  text-decoration: none; color: var(--text-primary);
  &:hover { background-color: var(--brand-primary-light); color: var(--brand-primary); transform: translateY(-1px); }
  &__icon { font-size: 20px; color: var(--brand-primary); flex-shrink: 0; }
  &__label { font-size: var(--font-size-sm); font-weight: 500; }
}

@media (max-width: 1200px) {
  .dashboard-row--three { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 1024px) {
  .dashboard-stats { grid-template-columns: repeat(2, 1fr); }
  .dashboard-row { grid-template-columns: 1fr; }
  .dashboard-row--three { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .dashboard-stats { grid-template-columns: 1fr; }
  .dashboard-banner { padding: var(--spacing-lg); &__title { font-size: var(--font-size-xl); } }
}
</style>

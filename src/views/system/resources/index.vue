<template>
  <div class="resources-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- CPU/内存 -->
      <el-tab-pane :label="t('resources.cpuMem')" name="cpuMem">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadCpuMem">{{ t('common.refresh') }}</el-button>
        </div>
        <div class="metrics-row" v-loading="cpuMemLoading">
          <div class="metric-card-wrap">
            <el-card shadow="hover">
              <template #header>
                <span>{{ t('resources.cpuUsage') }}</span>
              </template>
              <div class="metric-card-content">
                <el-progress
                  type="dashboard"
                  :percentage="cpuPercent"
                  :color="getCpuColor(cpuPercent)"
                  :width="160"
                />
                <div class="metric-value">{{ cpuPercent.toFixed(1) }}%</div>
              </div>
            </el-card>
          </div>
          <div class="metric-card-wrap">
            <el-card shadow="hover">
              <template #header>
                <span>{{ t('resources.memUsage') }}</span>
              </template>
              <div class="metric-card-content">
                <el-progress
                  type="dashboard"
                  :percentage="memPercent"
                  :color="getCpuColor(memPercent)"
                  :width="160"
                />
                <div class="metric-value">{{ memPercent.toFixed(1) }}%</div>
              </div>
            </el-card>
          </div>
        </div>
        <el-card v-if="cpuMem?.timestamp" shadow="never" class="metric-card">
          <span>{{ t('resources.timestamp') }}: {{ formatTime(cpuMem.timestamp) }}</span>
        </el-card>
      </el-tab-pane>

      <!-- 磁盘 -->
      <el-tab-pane :label="t('resources.diskUsage')" name="disk">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadDiskUsage">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="diskList" v-loading="diskLoading" border stripe>
          <el-table-column prop="filesystem" :label="t('resources.filesystem')" min-width="180" />
          <el-table-column prop="size" :label="t('resources.size')" width="120" />
          <el-table-column prop="used" :label="t('resources.used')" width="120" />
          <el-table-column prop="avail" :label="t('resources.avail')" width="120" />
          <el-table-column prop="usePercent" :label="t('resources.usePercent')" width="140">
            <template #default="{ row }">
              <el-tag :type="getDiskTagType(row.usePercent)">{{ row.usePercent }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mountPoint" :label="t('resources.mountPoint')" min-width="160" />
        </el-table>
      </el-tab-pane>

      <!-- 表状态 -->
      <el-tab-pane :label="t('resources.tableStatus')" name="table">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadTableStatus">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="tableList" v-loading="tableLoading" border stripe>
          <el-table-column prop="tableName" :label="t('resources.tableName')" min-width="220" />
          <el-table-column prop="tableRows" :label="t('resources.tableRows')" width="160">
            <template #default="{ row }">
              <span>{{ formatNumber(row.tableRows) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sizeGB" :label="t('resources.sizeGB')" width="160">
            <template #default="{ row }">
              <span>{{ row.sizeGB?.toFixed(4) ?? '-' }} GB</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 阈值 -->
      <el-tab-pane :label="t('resources.threshold')" name="threshold">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadThreshold">{{ t('common.refresh') }}</el-button>
          <el-button type="primary" :icon="Check" @click="handleSaveThreshold">{{ t('common.save') }}</el-button>
        </div>
        <el-form
          ref="thresholdFormRef"
          :model="thresholdForm"
          label-width="180px"
          style="max-width: 560px"
          v-loading="thresholdLoading"
        >
          <el-form-item :label="t('resources.cpuThreshold')">
            <el-input-number v-model="thresholdForm.cpu" :min="0" :max="100" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item :label="t('resources.memThreshold')">
            <el-input-number v-model="thresholdForm.mem" :min="0" :max="100" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item :label="t('resources.diskThreshold')">
            <el-input-number v-model="thresholdForm.disk" :min="0" :max="100" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item :label="t('resources.diskClearThreshold')">
            <el-input-number v-model="thresholdForm.diskClear" :min="0" :max="100" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item :label="t('resources.tableThreshold')">
            <el-input-number v-model="thresholdForm.table" :min="0" :max="100000000" />
            <span class="unit">{{ t('resources.rows') }}</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { Refresh, Check } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  getCpuAndMemUsage,
  getTableStatus,
  getDiskUsage,
  setCPUAndMemThreshold,
  listCPUAndMemThreshold,
} from '@/api/resources';
import type {
  ResourcesVO,
  TableStatusVO,
  DiskUsageVO,
  ThresholdConfig,
} from '@/types/resources';

const { t } = useI18n();

const activeTab = ref<'cpuMem' | 'disk' | 'table' | 'threshold'>('cpuMem');

// CPU/Mem
const cpuMemLoading = ref(false);
const cpuMem = ref<ResourcesVO | null>(null);
const cpuPercent = ref(0);
const memPercent = ref(0);

// Disk
const diskLoading = ref(false);
const diskList = ref<DiskUsageVO[]>([]);

// Table
const tableLoading = ref(false);
const tableList = ref<TableStatusVO[]>([]);

// Threshold
const thresholdLoading = ref(false);
const thresholdFormRef = ref<FormInstance>();
const thresholdForm = reactive<ThresholdConfig>({
  cpu: 0,
  mem: 0,
  disk: 0,
  diskClear: 0,
  table: 0,
});

function getCpuColor(value: number): string {
  if (value >= 90) return '#f56c6c';
  if (value >= 70) return '#e6a23c';
  return '#67c23a';
}

function getDiskTagType(percent: string): 'info' | 'danger' | 'warning' | 'primary' | 'success' | undefined {
  const num = parseFloat(percent);
  if (Number.isNaN(num)) return 'info';
  if (num >= 90) return 'danger';
  if (num >= 70) return 'warning';
  return 'success';
}

function formatTime(value?: string): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString();
}

async function loadCpuMem() {
  cpuMemLoading.value = true;
  try {
    const data = await getCpuAndMemUsage();
    cpuMem.value = (data as ResourcesVO) || null;
    if (cpuMem.value) {
      cpuPercent.value = cpuMem.value.cpu ?? 0;
      memPercent.value = cpuMem.value.mem ?? 0;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    cpuMemLoading.value = false;
  }
}

async function loadDiskUsage() {
  diskLoading.value = true;
  try {
    const data = await getDiskUsage();
    diskList.value = (data as DiskUsageVO[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    diskLoading.value = false;
  }
}

async function loadTableStatus() {
  tableLoading.value = true;
  try {
    const data = await getTableStatus();
    tableList.value = (data as TableStatusVO[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    tableLoading.value = false;
  }
}

async function loadThreshold() {
  thresholdLoading.value = true;
  try {
    const data = await listCPUAndMemThreshold();
    const cfg = data as ThresholdConfig;
    if (cfg) {
      thresholdForm.cpu = cfg.cpu ?? 0;
      thresholdForm.mem = cfg.mem ?? 0;
      thresholdForm.disk = cfg.disk ?? 0;
      thresholdForm.diskClear = cfg.diskClear ?? 0;
      thresholdForm.table = cfg.table ?? 0;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    thresholdLoading.value = false;
  }
}

async function handleSaveThreshold() {
  try {
    await setCPUAndMemThreshold({ ...thresholdForm });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

onMounted(() => {
  loadCpuMem();
  loadDiskUsage();
  loadTableStatus();
  loadThreshold();
});
</script>

<style lang="scss" scoped>
.resources-page {
  padding: 12px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.metrics-row {
  display: flex;
  gap: 16px;
  width: 100%;
}
.metric-card-wrap {
  flex: 1;
  min-width: 0;
}
.metric-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}
.metric-value {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  margin-top: -20px;
  position: relative;
  z-index: 1;
  color: #303133;
}
.dark .metric-value {
  color: #e5e7eb;
}
.metric-card {
  margin-top: 12px;
}
.unit {
  margin-left: 8px;
  color: #909399;
}
</style>

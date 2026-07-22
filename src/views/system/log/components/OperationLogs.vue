<script setup lang="ts">
/**
 * 操作日志（Operation Log）
 *
 * 对齐老版 nms-web Logs/OperationLogs：表格 + 搜索 + 导出。
 * 数据来源：api/system-log.ts listOperationLogs（POST /operation-logs，端点待后端确认）。
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';

import { listOperationLogs } from '@/api/system-log';
import type { OperationLog } from '@/types/system-log';

const { t } = useI18n();

const loading = ref(false);
const tableData = ref<OperationLog[]>([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  username: '',
  ipAddress: '',
  logName: '',
  results: '',
});

async function loadData() {
  loading.value = true;
  try {
    const result = await listOperationLogs({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      username: queryParams.username || undefined,
      ipAddress: queryParams.ipAddress || undefined,
      logName: queryParams.logName || undefined,
      results: queryParams.results || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[OperationLogs] load failed:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.page = 1;
  loadData();
}

function handleReset() {
  queryParams.username = '';
  queryParams.ipAddress = '';
  queryParams.logName = '';
  queryParams.results = '';
  queryParams.page = 1;
  loadData();
}

function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 导出（前端生成 CSV） */
function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning(t('common.noData'));
    return;
  }
  const header = [
    t('log.operationLog.tenancyName'),
    t('log.operationLog.username'),
    t('log.operationLog.ipAddress'),
    t('log.operationLog.logName'),
    t('log.operationLog.recordDetail'),
    t('log.operationLog.results'),
    t('log.operationLog.failureReason'),
  ];
  const rows = tableData.value.map((r) => [
    r.tenancyName ?? '',
    r.username ?? '',
    r.ipAddress ?? '',
    r.logName ?? '',
    r.recordDetail ?? '',
    r.results ?? '',
    r.failureReason ?? '',
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `operation-log-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="operation-logs">
    <el-form :inline="true" @submit.prevent="handleSearch">
      <el-form-item :label="t('log.operationLog.username')">
        <el-input
          v-model="queryParams.username"
          :placeholder="t('common.inputPlaceholder')"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item :label="t('log.operationLog.ipAddress')">
        <el-input
          v-model="queryParams.ipAddress"
          :placeholder="t('common.inputPlaceholder')"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item :label="t('log.operationLog.logName')">
        <el-input
          v-model="queryParams.logName"
          :placeholder="t('common.inputPlaceholder')"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
        <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">{{ t('common.export') }}</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%">
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="tenancyName" :label="t('log.operationLog.tenancyName')" min-width="120" />
      <el-table-column prop="username" :label="t('log.operationLog.username')" min-width="120" />
      <el-table-column prop="ipAddress" :label="t('log.operationLog.ipAddress')" min-width="140" />
      <el-table-column prop="logName" :label="t('log.operationLog.logName')" min-width="140" show-overflow-tooltip />
      <el-table-column prop="recordDetail" :label="t('log.operationLog.recordDetail')" min-width="200" show-overflow-tooltip />
      <el-table-column prop="results" :label="t('log.operationLog.results')" width="90" align="center" />
      <el-table-column prop="failureReason" :label="t('log.operationLog.failureReason')" min-width="160" show-overflow-tooltip />
      <el-table-column prop="operationTime" :label="t('log.loginLog.operationTime')" min-width="160">
        <template #default="{ row }">{{ formatTime(row.operationTime) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.operation-logs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>

<script setup lang="ts">
/**
 * 登录日志（Login Log）
 *
 * 对齐老版 nms-web Logs/LoginLogs：表格 + 搜索 + 导出。
 * 数据来源：api/auth.ts getLoginLogs（GET /users/loginlog）。
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';

import { getLoginLogs } from '@/api/auth';
import type { LoginLog } from '@/types';

const { t } = useI18n();

const loading = ref(false);
const tableData = ref<LoginLog[]>([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getLoginLogs({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[LoginLogs] load failed:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.page = 1;
  loadData();
}

function handleReset() {
  queryParams.keyword = '';
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

function getStatusType(status: string): 'success' | 'danger' {
  return status === 'success' ? 'success' : 'danger';
}

function getStatusText(status: string): string {
  return status === 'success' ? t('log.loginLog.success') : t('log.loginLog.fail');
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
    t('log.loginLog.operationTime'),
    t('log.loginLog.username'),
    t('log.loginLog.ip'),
    t('log.loginLog.status'),
    t('log.loginLog.message'),
  ];
  const rows = tableData.value.map((r) => [
    formatTime(r.loginTime),
    r.username ?? '',
    r.ip ?? '',
    getStatusText(r.status),
    r.message ?? '',
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `login-log-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="login-logs">
    <el-form :inline="true" @submit.prevent="handleSearch">
      <el-form-item :label="t('log.loginLog.username')">
        <el-input
          v-model="queryParams.keyword"
          :placeholder="t('common.inputPlaceholder')"
          clearable
          style="width: 200px"
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
      <el-table-column prop="loginTime" :label="t('log.loginLog.operationTime')" min-width="160">
        <template #default="{ row }">{{ formatTime(row.loginTime) }}</template>
      </el-table-column>
      <el-table-column prop="username" :label="t('log.loginLog.username')" min-width="120" />
      <el-table-column prop="ip" :label="t('log.loginLog.ip')" min-width="140" />
      <el-table-column prop="status" :label="t('log.loginLog.status')" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" :label="t('log.loginLog.message')" min-width="180" show-overflow-tooltip />
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
.login-logs {
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

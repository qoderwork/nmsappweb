<script setup lang="ts">
/**
 * 事件日志页面
 *
 * 功能：
 * - 事件日志列表展示（分页）
 * - 按设备ID/事件类型筛选
 * - 查看详情
 */
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

import { getEventLogs } from '@/api/event-log';
import type { EventLog } from '@/types/event-log';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<EventLog[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  elementId: string;
  eventType: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
  eventType: '',
});

// 详情弹窗
const detailDialogVisible = ref(false);
const detailData = ref<EventLog | null>(null);

// ============ 方法 ============

async function loadData() {
  loading.value = true;
  try {
    const result = await getEventLogs({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      element_id: queryParams.elementId ? Number(queryParams.elementId) : undefined,
      event_type: queryParams.eventType || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[EventLog] load failed:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.page = 1;
  loadData();
}

function handleReset() {
  queryParams.elementId = '';
  queryParams.eventType = '';
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

function handleViewDetail(row: EventLog) {
  detailData.value = row;
  detailDialogVisible.value = true;
}

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function getStatusText(status?: number | null): string {
  if (status === 0) return t('eventLog.pending');
  if (status === 1) return t('eventLog.executing');
  if (status === 2) return t('eventLog.completed');
  if (status === 3) return t('eventLog.failed');
  return t('eventLog.unknown');
}

function getStatusType(status?: number | null): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 2) return 'success';
  if (status === 1) return 'warning';
  if (status === 3) return 'danger';
  return 'info';
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="event-log-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item :label="t('eventLog.deviceId')">
          <el-input v-model="queryParams.elementId" :placeholder="t('eventLog.deviceId')" clearable style="width: 120px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item :label="t('eventLog.eventType')">
          <el-input v-model="queryParams.eventType" :placeholder="t('eventLog.eventType')" clearable style="width: 150px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="event_type" :label="t('eventLog.eventType')" min-width="140" />
        <el-table-column prop="element_id" :label="t('eventLog.deviceId')" width="100" />
        <el-table-column prop="user" :label="t('eventLog.operationUser')" width="120" />
        <el-table-column prop="status" :label="t('eventLog.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation_time" :label="t('eventLog.operationTime')" min-width="160">
          <template #default="{ row }">{{ formatTime(row.operation_time) }}</template>
        </el-table-column>
        <el-table-column prop="command_issue_time" :label="t('eventLog.commandIssueTime')" min-width="160">
          <template #default="{ row }">{{ formatTime(row.command_issue_time) }}</template>
        </el-table-column>
        <el-table-column prop="fault_info" :label="t('eventLog.faultInfo')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="t('common.actions')" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row as EventLog)">
              <View /> {{ t('eventLog.detail') }}
            </el-button>
          </template>
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
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="t('eventLog.eventLogDetail')" width="700px">
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item :label="t('eventLog.id')">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.eventType')">{{ detailData.event_type || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.deviceId')">{{ detailData.element_id || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.operationUser')">{{ detailData.user || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.status')">
          <el-tag :type="getStatusType(detailData.status)" size="small">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.operationTime')">{{ formatTime(detailData.operation_time) }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.commandIssueTime')">{{ formatTime(detailData.command_issue_time) }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.commandResponseTime')">{{ formatTime(detailData.command_response_time) }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.faultInfo')" :span="2">{{ detailData.fault_info || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('eventLog.commandTrackData')" :span="2">
          <pre class="track-data-pre">{{ detailData.command_track_data || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.event-log-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.track-data-pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}
</style>

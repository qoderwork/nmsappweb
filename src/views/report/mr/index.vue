<script setup lang="ts">
/**
 * MR 管理页面
 *
 * 功能：
 * - MR 日志列表展示（分页）
 * - MR 统计数据查询
 * - 下载 MR 报告和原始文件
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';

import { getMRLogs, downloadMRReportExcel, downloadMRFile } from '@/api/mr';
import type { MRFileLog } from '@/types/mr';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('log');
const loading = ref(false);
const tableData = ref<MRFileLog[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  elementId: string;
  startTime: string;
  endTime: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
  startTime: '',
  endTime: '',
});

// ============ 方法 ============

/** 加载 MR 日志列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getMRLogs({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      elementId: queryParams.elementId ? Number(queryParams.elementId) : undefined,
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[MRManagement] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  loadData();
}

/** 重置搜索 */
function handleReset() {
  queryParams.elementId = '';
  queryParams.startTime = '';
  queryParams.endTime = '';
  queryParams.page = 1;
  loadData();
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

/** 每页条数变化 */
function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

/** 下载 MR 报告 */
async function handleDownloadReport() {
  try {
    await downloadMRReportExcel({
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined,
    });
    ElMessage.success(t('mr.downloadSuccess'));
  } catch (e) {
    console.error('[MRManagement] download report failed:', e);
  }
}

/** 下载原始文件 */
async function handleDownloadFile(row: MRFileLog) {
  try {
    await downloadMRFile({
      fileName: row.fileName,
      elementId: row.elementId,
    });
    ElMessage.success(t('mr.fileDownloadSuccess'));
  } catch (e) {
    console.error('[MRManagement] download file failed:', e);
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="mr-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- MR 日志 -->
      <el-tab-pane :label="t('mr.mrLogs')" name="log">
        <!-- 搜索栏 -->
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSearch">
            <el-form-item :label="t('mr.deviceId')">
              <el-input
                v-model="queryParams.elementId"
                :placeholder="t('mr.deviceIdPlaceholder')"
                clearable
                style="width: 120px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item :label="t('mr.startTime')">
              <el-date-picker
                v-model="queryParams.startTime"
                type="datetime"
                :placeholder="t('mr.startTime')"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item :label="t('mr.endTime')">
              <el-date-picker
                v-model="queryParams.endTime"
                type="datetime"
                :placeholder="t('mr.endTime')"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
              <el-button type="success" :icon="Download" @click="handleDownloadReport">
                {{ t('mr.downloadReport') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据表格 -->
        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table
            v-loading="loading"
            :data="tableData"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" :label="t('mr.deviceId')" width="100" />
            <el-table-column prop="fileName" :label="t('mr.fileName')" min-width="280" />
            <el-table-column prop="uploadTime" :label="t('mr.uploadTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.uploadTime) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleDownloadFile(row as MRFileLog)">
                  <Download />
                  {{ t('mr.downloadFile') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
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
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.mr-management-page {
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
</style>

<script setup lang="ts">
/**
 * 设备日志管理页面
 *
 * 功能：
 * - 日志采集结果列表
 * - 按设备查看日志文件
 * - 下载/删除日志文件
 * - 添加日志采集任务
 * - 周期性上传开关
 */
import { reactive, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Download, Delete, Collection, Timer } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

import {
  listLogCollectionResults,
  listLogFiles,
  downloadLogFile,
  deleteLogFile,
  deleteAllLogFile,
  addLogCollectionTask,
  enablePeriodicUpload,
  disablePeriodicUpload,
} from '@/api/device-log';
import type { LogCollectionResultVo, LogFileVo } from '@/types/device-log';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('collection');
const loading = ref(false);
const fileLoading = ref(false);

// 采集结果
const collectionResults = ref<LogCollectionResultVo[]>([]);
const collectionTotal = ref(0);
const collectionQuery = reactive({
  page: 1,
  pageSize: 20,
  elementId: '',
  deviceType: '',
  status: undefined as number | undefined,
});

// 设备日志文件
const logFiles = ref<LogFileVo[]>([]);
const logFilesTotal = ref(0);
const logFileQuery = reactive({
  page: 1,
  pageSize: 20,
  elementId: '',
});

// 采集任务弹窗
const collectionDialogVisible = ref(false);
const collectionForm = reactive({
  elementIds: '',
  logType: 'all',
});

// 周期性上传弹窗
const periodicDialogVisible = ref(false);
const periodicForm = reactive({
  elementId: '',
  interval: 3600,
  enable: true,
});

// ============ 方法 ============

/** 加载日志采集结果 */
async function loadCollectionResults() {
  loading.value = true;
  try {
    const result = await listLogCollectionResults({
      page: collectionQuery.page,
      pageSize: collectionQuery.pageSize,
      elementId: collectionQuery.elementId ? Number(collectionQuery.elementId) : undefined,
      deviceType: collectionQuery.deviceType || undefined,
      status: collectionQuery.status,
    });
    collectionResults.value = result;
    collectionTotal.value = result.length;
  } catch (e) {
    console.error('[DeviceLog] load collection results failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 加载设备日志文件 */
async function loadLogFiles() {
  if (!logFileQuery.elementId) {
    ElMessage.warning(t('deviceLog.enterDeviceIdFirst'));
    return;
  }
  fileLoading.value = true;
  try {
    const result = await listLogFiles({
      elementId: Number(logFileQuery.elementId),
      page: logFileQuery.page,
      pageSize: logFileQuery.pageSize,
    });
    logFiles.value = result;
    logFilesTotal.value = result.length;
  } catch (e) {
    console.error('[DeviceLog] load log files failed:', e);
  } finally {
    fileLoading.value = false;
  }
}

/** 搜索采集结果 */
function handleSearchCollection() {
  collectionQuery.page = 1;
  loadCollectionResults();
}

/** 重置采集结果搜索 */
function handleResetCollection() {
  collectionQuery.elementId = '';
  collectionQuery.deviceType = '';
  collectionQuery.status = undefined;
  collectionQuery.page = 1;
  loadCollectionResults();
}

/** 分页变化 */
function handleCollectionPageChange(page: number) {
  collectionQuery.page = page;
  loadCollectionResults();
}

function handleCollectionSizeChange(size: number) {
  collectionQuery.pageSize = size;
  collectionQuery.page = 1;
  loadCollectionResults();
}

/** 下载日志文件 */
async function handleDownloadFile(row: LogFileVo | LogCollectionResultVo) {
  try {
    await downloadLogFile({ logId: row.id });
    ElMessage.success(t('deviceLog.startDownload'));
  } catch (e) {
    console.error('[DeviceLog] download failed:', e);
  }
}

/** 删除日志文件 */
async function handleDeleteFile(row: LogFileVo) {
  try {
    await ElMessageBox.confirm(t('deviceLog.deleteFileConfirm', { name: row.fileName }), t('deviceLog.deleteConfirmTitle'), { type: 'warning' });
    await deleteLogFile({ logId: row.id });
    ElMessage.success(t('deviceLog.deleteSuccess'));
    loadLogFiles();
  } catch (e) {
    if (e !== 'cancel') console.error('[DeviceLog] delete failed:', e);
  }
}

/** 删除全部日志 */
async function handleDeleteAll() {
  if (!logFileQuery.elementId) {
    ElMessage.warning(t('deviceLog.enterDeviceIdFirst'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('deviceLog.deleteAllConfirm'), t('deviceLog.deleteConfirmTitle'), { type: 'warning' });
    await deleteAllLogFile({ elementId: Number(logFileQuery.elementId) });
    ElMessage.success(t('deviceLog.deleteSuccess'));
    loadLogFiles();
  } catch (e) {
    if (e !== 'cancel') console.error('[DeviceLog] delete all failed:', e);
  }
}

/** 打开采集任务弹窗 */
function openCollectionDialog() {
  collectionForm.elementIds = '';
  collectionForm.logType = 'all';
  collectionDialogVisible.value = true;
}

/** 提交采集任务 */
async function submitCollection() {
  if (!collectionForm.elementIds.trim()) {
    ElMessage.warning(t('deviceLog.enterDeviceIdRequired'));
    return;
  }
  try {
    const ids = collectionForm.elementIds.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
    if (ids.length === 0) {
      ElMessage.warning(t('deviceLog.deviceIdFormatError'));
      return;
    }
    await addLogCollectionTask({ elementIds: ids, logType: collectionForm.logType });
    ElMessage.success(t('deviceLog.taskDispatched'));
    collectionDialogVisible.value = false;
    loadCollectionResults();
  } catch (e) {
    console.error('[DeviceLog] add collection task failed:', e);
  }
}

/** 打开周期性上传弹窗 */
function openPeriodicDialog() {
  periodicForm.elementId = '';
  periodicForm.interval = 3600;
  periodicForm.enable = true;
  periodicDialogVisible.value = true;
}

/** 提交周期性上传配置 */
async function submitPeriodic() {
  if (!periodicForm.elementId) {
    ElMessage.warning(t('deviceLog.enterDeviceIdRequired'));
    return;
  }
  try {
    const elementId = Number(periodicForm.elementId);
    if (periodicForm.enable) {
      await enablePeriodicUpload({ elementId, interval: periodicForm.interval });
      ElMessage.success(t('deviceLog.periodicEnabled'));
    } else {
      await disablePeriodicUpload({ elementId });
      ElMessage.success(t('deviceLog.periodicDisabled'));
    }
    periodicDialogVisible.value = false;
  } catch (e) {
    console.error('[DeviceLog] periodic upload config failed:', e);
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 格式化文件大小 */
function formatFileSize(size?: number | null): string {
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

/** 获取状态文本 */
function getStatusText(status?: number): string {
  if (status === 0) return t('deviceLog.pending');
  if (status === 1) return t('deviceLog.success');
  if (status === 3) return t('deviceLog.failed');
  return t('deviceLog.unknown');
}

function getStatusType(status?: number): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 1) return 'success';
  if (status === 3) return 'danger';
  if (status === 0) return 'warning';
  return 'info';
}

onMounted(() => {
  loadCollectionResults();
});
</script>

<template>
  <div class="device-log-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 日志采集结果 -->
      <el-tab-pane :label="t('deviceLog.collectionResult')" name="collection">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSearchCollection">
            <el-form-item :label="t('deviceLog.deviceId')">
              <el-input v-model="collectionQuery.elementId" :placeholder="t('deviceLog.deviceId')" clearable style="width: 120px" @keyup.enter="handleSearchCollection" />
            </el-form-item>
            <el-form-item :label="t('deviceLog.deviceType')">
              <el-input v-model="collectionQuery.deviceType" :placeholder="t('deviceLog.deviceType')" clearable style="width: 120px" @keyup.enter="handleSearchCollection" />
            </el-form-item>
            <el-form-item :label="t('deviceLog.status')">
              <el-select v-model="collectionQuery.status" :placeholder="t('common.all')" clearable style="width: 100px">
                <el-option :label="t('deviceLog.pending')" :value="0" />
                <el-option :label="t('deviceLog.success')" :value="1" />
                <el-option :label="t('deviceLog.failed')" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearchCollection">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleResetCollection">{{ t('common.reset') }}</el-button>
              <el-button type="success" :icon="Collection" @click="openCollectionDialog">{{ t('deviceLog.collectionTask') }}</el-button>
              <el-button type="warning" :icon="Timer" @click="openPeriodicDialog">{{ t('deviceLog.periodicUpload') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="loading" :data="collectionResults" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" :label="t('deviceLog.deviceId')" width="100" />
            <el-table-column prop="deviceName" :label="t('device.name')" min-width="140" />
            <el-table-column prop="serialNumber" :label="t('device.serialNumber')" min-width="140" />
            <el-table-column prop="fileName" :label="t('deviceLog.fileName')" min-width="200" show-overflow-tooltip />
            <el-table-column prop="fileSize" :label="t('deviceLog.fileSize')" width="100">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="collectionTime" :label="t('deviceLog.collectionTime')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.collectionTime) }}</template>
            </el-table-column>
            <el-table-column prop="status" :label="t('deviceLog.status')" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failureReason" :label="t('deviceLog.failureReason')" min-width="160" show-overflow-tooltip />
            <el-table-column :label="t('common.actions')" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleDownloadFile(row as LogCollectionResultVo)">
                  <Download /> {{ t('deviceLog.download') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="collectionQuery.page"
              v-model:page-size="collectionQuery.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="collectionTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleCollectionSizeChange"
              @current-change="handleCollectionPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 设备日志文件 -->
      <el-tab-pane :label="t('deviceLog.logFiles')" name="files">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="loadLogFiles">
            <el-form-item :label="t('deviceLog.deviceId')">
              <el-input v-model="logFileQuery.elementId" :placeholder="t('deviceLog.deviceId')" clearable style="width: 150px" @keyup.enter="loadLogFiles" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadLogFiles">{{ t('deviceLog.query') }}</el-button>
              <el-button type="danger" :icon="Delete" @click="handleDeleteAll">{{ t('deviceLog.deleteAll') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="fileLoading" :data="logFiles" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="fileName" :label="t('deviceLog.fileName')" min-width="280" show-overflow-tooltip />
            <el-table-column prop="fileSize" :label="t('deviceLog.fileSize')" width="100">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="collectionTime" :label="t('deviceLog.collectionTime')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.collectionTime) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleDownloadFile(row as LogFileVo)">
                  <Download /> {{ t('deviceLog.download') }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteFile(row as LogFileVo)">
                  <Delete /> {{ t('deviceLog.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="logFileQuery.page"
              v-model:page-size="logFileQuery.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="logFilesTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="logFileQuery.pageSize = $event; logFileQuery.page = 1; loadLogFiles()"
              @current-change="logFileQuery.page = $event; loadLogFiles()"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 采集任务弹窗 -->
    <el-dialog v-model="collectionDialogVisible" :title="t('deviceLog.addCollectionTask')" width="400px">
      <el-form label-width="100px">
        <el-form-item :label="t('deviceLog.deviceId')" prop="elementIds">
          <el-input v-model="collectionForm.elementIds" :placeholder="t('deviceLog.multipleIdsHint')" />
        </el-form-item>
        <el-form-item :label="t('deviceLog.logType')">
          <el-select v-model="collectionForm.logType" style="width: 100%">
            <el-option :label="t('common.all')" value="all" />
            <el-option :label="t('deviceLog.syslog')" value="syslog" />
            <el-option :label="t('deviceLog.crashLog')" value="crash" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectionDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitCollection">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 周期性上传弹窗 -->
    <el-dialog v-model="periodicDialogVisible" :title="t('deviceLog.periodicUploadConfig')" width="400px">
      <el-form label-width="100px">
        <el-form-item :label="t('deviceLog.deviceId')">
          <el-input v-model="periodicForm.elementId" :placeholder="t('deviceLog.deviceId')" />
        </el-form-item>
        <el-form-item :label="t('common.enabled')">
          <el-switch v-model="periodicForm.enable" />
        </el-form-item>
        <el-form-item :label="t('deviceLog.intervalSeconds')" v-if="periodicForm.enable">
          <el-input-number v-model="periodicForm.interval" :min="60" :step="60" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="periodicDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitPeriodic">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.device-log-page {
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

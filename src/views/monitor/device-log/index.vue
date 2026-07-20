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
    ElMessage.warning('请先输入设备 ID');
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
    ElMessage.success('开始下载');
  } catch (e) {
    console.error('[DeviceLog] download failed:', e);
  }
}

/** 删除日志文件 */
async function handleDeleteFile(row: LogFileVo) {
  try {
    await ElMessageBox.confirm(`确定要删除日志文件 "${row.fileName}" 吗？`, '删除确认', { type: 'warning' });
    await deleteLogFile({ logId: row.id });
    ElMessage.success('删除成功');
    loadLogFiles();
  } catch (e) {
    if (e !== 'cancel') console.error('[DeviceLog] delete failed:', e);
  }
}

/** 删除全部日志 */
async function handleDeleteAll() {
  if (!logFileQuery.elementId) {
    ElMessage.warning('请先输入设备 ID');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要删除该设备的全部日志文件吗？', '删除确认', { type: 'warning' });
    await deleteAllLogFile({ elementId: Number(logFileQuery.elementId) });
    ElMessage.success('删除成功');
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
    ElMessage.warning('请输入设备 ID');
    return;
  }
  try {
    const ids = collectionForm.elementIds.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
    if (ids.length === 0) {
      ElMessage.warning('设备 ID 格式错误');
      return;
    }
    await addLogCollectionTask({ elementIds: ids, logType: collectionForm.logType });
    ElMessage.success('采集任务已下发');
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
    ElMessage.warning('请输入设备 ID');
    return;
  }
  try {
    const elementId = Number(periodicForm.elementId);
    if (periodicForm.enable) {
      await enablePeriodicUpload({ elementId, interval: periodicForm.interval });
      ElMessage.success('已启用周期性上传');
    } else {
      await disablePeriodicUpload({ elementId });
      ElMessage.success('已禁用周期性上传');
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
  if (status === 0) return '待处理';
  if (status === 1) return '成功';
  if (status === 3) return '失败';
  return '未知';
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
      <el-tab-pane label="采集结果" name="collection">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSearchCollection">
            <el-form-item label="设备 ID">
              <el-input v-model="collectionQuery.elementId" placeholder="设备 ID" clearable style="width: 120px" @keyup.enter="handleSearchCollection" />
            </el-form-item>
            <el-form-item label="设备类型">
              <el-input v-model="collectionQuery.deviceType" placeholder="设备类型" clearable style="width: 120px" @keyup.enter="handleSearchCollection" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="collectionQuery.status" placeholder="全部" clearable style="width: 100px">
                <el-option label="待处理" :value="0" />
                <el-option label="成功" :value="1" />
                <el-option label="失败" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearchCollection">搜索</el-button>
              <el-button :icon="Refresh" @click="handleResetCollection">重置</el-button>
              <el-button type="success" :icon="Collection" @click="openCollectionDialog">采集任务</el-button>
              <el-button type="warning" :icon="Timer" @click="openPeriodicDialog">周期性上传</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="loading" :data="collectionResults" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" label="设备 ID" width="100" />
            <el-table-column prop="deviceName" label="设备名称" min-width="140" />
            <el-table-column prop="serialNumber" label="序列号" min-width="140" />
            <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
            <el-table-column prop="fileSize" label="大小" width="100">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="collectionTime" label="采集时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.collectionTime) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failureReason" label="失败原因" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleDownloadFile(row as LogCollectionResultVo)">
                  <Download /> 下载
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
      <el-tab-pane label="日志文件" name="files">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="loadLogFiles">
            <el-form-item label="设备 ID">
              <el-input v-model="logFileQuery.elementId" placeholder="设备 ID" clearable style="width: 150px" @keyup.enter="loadLogFiles" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadLogFiles">查询</el-button>
              <el-button type="danger" :icon="Delete" @click="handleDeleteAll">删除全部</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="fileLoading" :data="logFiles" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="fileName" label="文件名" min-width="280" show-overflow-tooltip />
            <el-table-column prop="fileSize" label="大小" width="100">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="collectionTime" label="采集时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.collectionTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleDownloadFile(row as LogFileVo)">
                  <Download /> 下载
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteFile(row as LogFileVo)">
                  <Delete /> 删除
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
    <el-dialog v-model="collectionDialogVisible" title="添加日志采集任务" width="400px">
      <el-form label-width="100px">
        <el-form-item label="设备 ID" prop="elementIds">
          <el-input v-model="collectionForm.elementIds" placeholder="多个 ID 用逗号分隔" />
        </el-form-item>
        <el-form-item label="日志类型">
          <el-select v-model="collectionForm.logType" style="width: 100%">
            <el-option label="全部" value="all" />
            <el-option label="系统日志" value="syslog" />
            <el-option label="崩溃日志" value="crash" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCollection">确定</el-button>
      </template>
    </el-dialog>

    <!-- 周期性上传弹窗 -->
    <el-dialog v-model="periodicDialogVisible" title="周期性上传配置" width="400px">
      <el-form label-width="100px">
        <el-form-item label="设备 ID">
          <el-input v-model="periodicForm.elementId" placeholder="设备 ID" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="periodicForm.enable" />
        </el-form-item>
        <el-form-item label="间隔（秒）" v-if="periodicForm.enable">
          <el-input-number v-model="periodicForm.interval" :min="60" :step="60" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="periodicDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPeriodic">确定</el-button>
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

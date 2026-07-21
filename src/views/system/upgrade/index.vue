<script setup lang="ts">
/**
 * 升级管理页面
 *
 * 功能：
 * - 升级任务列表展示（分页）
 * - 升级文件列表展示
 * - 启动/取消升级任务
 * - 查看升级结果
 */
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Upload, VideoPlay, CircleClose, View, Delete } from '@element-plus/icons-vue';

import {
  getUpgradeTasks,
  createUpgradeTask,
  startUpgradeTask,
  cancelUpgradeTask,
  getUpgradeFiles,
  uploadUpgradeFile,
  deleteUpgradeFile,
  getUpgradeResults,
} from '@/api/upgrade';
import type { UpgradeTaskVo, UpgradeFile, UpgradeResultVo, UpgradeTask } from '@/types/upgrade';
import DeviceSelector from '@/components/DeviceSelector.vue';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('task');
const loading = ref(false);
const tableData = ref<UpgradeTaskVo[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  searchText: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  searchText: '',
});

// 升级文件
const fileLoading = ref(false);
const fileList = ref<UpgradeFile[]>([]);

// 结果弹窗
const resultDialogVisible = ref(false);
const resultLoading = ref(false);
const resultList = ref<UpgradeResultVo[]>([]);
const currentTaskName = ref('');

// 新建任务弹窗
const taskDialogVisible = ref(false);
const taskDialogLoading = ref(false);
const selectedDeviceIds = ref<number[]>([]);
const taskForm = reactive<Partial<UpgradeTask>>({
  name: '',
  device_type: 'gnb',
  upgrade_type: 'firmware',
  scope: 'element',
  element_ids: '',
  device_group_ids: '',
  upgrade_file_id: undefined,
  execute_mode: 0,
  concurrent_number: 1,
  max_retry_times: 0,
  manual_upgrade: false,
});

// 升级进度自动刷新
let progressTimer: ReturnType<typeof setInterval> | null = null;

// 上传文件弹窗
const uploadDialogVisible = ref(false);
const uploadDialogLoading = ref(false);
const uploadForm = reactive({
  file: null as File | null,
  version: '',
  device_type: 'gnb',
  product_type: '',
});
const uploadRef = ref();

// ============ 方法 ============

/** 加载升级任务列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getUpgradeTasks({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      searchText: queryParams.searchText || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[UpgradeManagement] load failed:', e);
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
  queryParams.searchText = '';
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

/** 启动任务 */
async function handleStart(row: UpgradeTaskVo) {
  try {
    await ElMessageBox.confirm(
      t('upgrade.startConfirm', { name: row.name }),
      t('upgrade.confirmTitle'),
      { type: 'warning' }
    );
    await startUpgradeTask(row.id);
    ElMessage.success(t('upgrade.startSuccess'));
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UpgradeManagement] start failed:', e);
    }
  }
}

/** 取消任务 */
async function handleCancel(row: UpgradeTaskVo) {
  try {
    await ElMessageBox.confirm(
      t('upgrade.cancelConfirm', { name: row.name }),
      t('upgrade.confirmTitle'),
      { type: 'warning' }
    );
    await cancelUpgradeTask(row.id);
    ElMessage.success(t('upgrade.cancelSuccess'));
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UpgradeManagement] cancel failed:', e);
    }
  }
}

/** 查看结果 */
async function handleViewResults(row: UpgradeTaskVo) {
  currentTaskName.value = row.name;
  resultDialogVisible.value = true;
  resultLoading.value = true;
  try {
    const result = await getUpgradeResults(row.id);
    resultList.value = result;
  } catch (e) {
    console.error('[UpgradeManagement] view results failed:', e);
  } finally {
    resultLoading.value = false;
  }
}

/** 加载升级文件列表 */
async function loadFiles() {
  fileLoading.value = true;
  try {
    const result = await getUpgradeFiles();
    fileList.value = result;
  } catch (e) {
    console.error('[UpgradeManagement] load files failed:', e);
  } finally {
    fileLoading.value = false;
  }
}

/** 删除升级文件 */
async function handleDeleteFile(row: UpgradeFile) {
  try {
    await ElMessageBox.confirm(
      t('upgrade.deleteFileConfirm', { name: row.original_file_name || row.file_name }),
      t('upgrade.deleteConfirmTitle'),
      { type: 'warning' }
    );
    await deleteUpgradeFile(row.id);
    ElMessage.success(t('upgrade.deleteSuccess'));
    loadFiles();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UpgradeManagement] delete file failed:', e);
    }
  }
}

// ============ 新建升级任务 ============

function openTaskDialog() {
  Object.assign(taskForm, {
    name: '',
    device_type: 'gnb',
    upgrade_type: 'firmware',
    scope: 'element',
    element_ids: '',
    device_group_ids: '',
    upgrade_file_id: undefined,
    execute_mode: 0,
    concurrent_number: 1,
    max_retry_times: 0,
    manual_upgrade: false,
  });
  selectedDeviceIds.value = [];
  taskDialogVisible.value = true;
}

async function handleCreateTask() {
  if (!taskForm.name?.trim()) {
    ElMessage.warning(t('upgrade.taskNameRequired'));
    return;
  }
  if (!taskForm.upgrade_file_id) {
    ElMessage.warning(t('upgrade.selectUpgradeFileRequired'));
    return;
  }
  // 将选择的设备 ID 转为逗号分隔字符串
  if (taskForm.scope === 'element' && selectedDeviceIds.value.length > 0) {
    taskForm.element_ids = selectedDeviceIds.value.join(',');
  }
  taskDialogLoading.value = true;
  try {
    await createUpgradeTask(taskForm);
    ElMessage.success(t('upgrade.createSuccess'));
    taskDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[UpgradeManagement] create task failed:', e);
  } finally {
    taskDialogLoading.value = false;
  }
}

// ============ 上传升级文件 ============

function openUploadDialog() {
  uploadForm.file = null;
  uploadForm.version = '';
  uploadForm.device_type = 'gnb';
  uploadForm.product_type = '';
  uploadDialogVisible.value = true;
}

function handleFileChange(uploadFile: any) {
  uploadForm.file = uploadFile?.raw || uploadFile?.file || null;
}

async function handleUploadFile() {
  if (!uploadForm.file) {
    ElMessage.warning(t('upgrade.selectFileRequired'));
    return;
  }
  if (!uploadForm.version.trim()) {
    ElMessage.warning(t('upgrade.versionRequired'));
    return;
  }
  uploadDialogLoading.value = true;
  try {
    await uploadUpgradeFile(uploadForm.file, {
      version: uploadForm.version,
      device_type: uploadForm.device_type,
      product_type: uploadForm.product_type,
    });
    ElMessage.success(t('upgrade.uploadSuccess'));
    uploadDialogVisible.value = false;
    loadFiles();
  } catch (e) {
    console.error('[UpgradeManagement] upload file failed:', e);
  } finally {
    uploadDialogLoading.value = false;
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

/** 获取状态标签类型 */
function getStatusType(status?: number | null): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 1) return 'success';
  if (status === 2) return 'warning';
  if (status === 3) return 'danger';
  return 'info';
}

/** 获取状态文本 */
function getStatusText(status?: number | null): string {
  if (status === 0) return t('upgrade.statusPending');
  if (status === 1) return t('upgrade.statusExecuting');
  if (status === 2) return t('upgrade.statusCompleted');
  if (status === 3) return t('upgrade.statusFailed');
  if (status === 4) return t('upgrade.statusCancelled');
  if (status === 5) return t('upgrade.statusPartialSuccess');
  if (status === 6) return t('upgrade.statusTimeout');
  return t('upgrade.statusUnknown');
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
  loadFiles();
  // 每 10 秒自动刷新升级任务进度
  progressTimer = setInterval(() => {
    // 仅当有执行中的任务时刷新
    const hasRunning = tableData.value.some((t) => t.status === 1);
    if (hasRunning) {
      loadData();
    }
  }, 10000);
});

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
});
</script>

<template>
  <div class="upgrade-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 升级任务 -->
      <el-tab-pane :label="t('upgrade.upgradeTasks')" name="task">
        <!-- 搜索栏 -->
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSearch">
            <el-form-item :label="t('upgrade.keyword')">
              <el-input
                v-model="queryParams.searchText"
                :placeholder="t('upgrade.taskNameVersionPlaceholder')"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
              <el-button v-permission="'upgrade.create'" type="success" :icon="Plus" @click="openTaskDialog">{{ t('upgrade.createTask') }}</el-button>
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
            <el-table-column prop="name" :label="t('upgrade.taskName')" min-width="160" />
            <el-table-column prop="version" :label="t('upgrade.version')" min-width="120" />
            <el-table-column prop="deviceType" :label="t('upgrade.deviceType')" width="100" />
            <el-table-column prop="upgradeType" :label="t('upgrade.upgradeType')" width="100" />
            <el-table-column prop="deviceCount" :label="t('upgrade.deviceCount')" width="80" align="center" />
            <el-table-column prop="progress" :label="t('upgrade.progress')" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.progress || 0" :stroke-width="14" :text-inside="true" />
              </template>
            </el-table-column>
            <el-table-column prop="successCount" :label="t('upgrade.success')" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.successCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failCount" :label="t('upgrade.failed')" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.failCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('common.status')" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operationTime" :label="t('upgrade.operationTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.operationTime) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="220" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'upgrade.start'" link type="success" size="small" @click="handleStart(row as UpgradeTaskVo)">
                  <VideoPlay />
                  {{ t('upgrade.start') }}
                </el-button>
                <el-button v-permission="'upgrade.cancel'" link type="warning" size="small" @click="handleCancel(row as UpgradeTaskVo)">
                  <CircleClose />
                  {{ t('common.cancel') }}
                </el-button>
                <el-button link type="primary" size="small" @click="handleViewResults(row as UpgradeTaskVo)">
                  <View />
                  {{ t('upgrade.results') }}
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

      <!-- 升级文件 -->
      <el-tab-pane :label="t('upgrade.upgradeFiles')" name="file">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-button v-permission="'upgrade.upload'" type="success" :icon="Upload" @click="openUploadDialog">{{ t('upgrade.uploadFile') }}</el-button>
          <el-button :icon="Refresh" @click="loadFiles">{{ t('common.refresh') }}</el-button>
        </el-card>
        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table
            v-loading="fileLoading"
            :data="fileList"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="original_file_name" :label="t('upgrade.originalFileName')" min-width="200">
              <template #default="{ row }">
                {{ row.original_file_name || row.file_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="version" :label="t('upgrade.version')" min-width="120" />
            <el-table-column prop="device_type" :label="t('upgrade.deviceType')" width="100" />
            <el-table-column prop="product_type" :label="t('upgrade.productType')" width="120" />
            <el-table-column prop="file_size" :label="t('upgrade.fileSize')" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.file_size) }}
              </template>
            </el-table-column>
            <el-table-column prop="user" :label="t('upgrade.uploadUser')" width="100" />
            <el-table-column prop="upload_time" :label="t('upgrade.uploadTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="120" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'upgrade.deleteFile'" link type="danger" size="small" @click="handleDeleteFile(row as UpgradeFile)">
                  <Delete />
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 结果弹窗 -->
    <el-dialog v-model="resultDialogVisible" :title="t('upgrade.upgradeResultTitle', { name: currentTaskName })" width="800px">
      <el-table v-loading="resultLoading" :data="resultList" stripe border style="width: 100%">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="device_name" :label="t('upgrade.deviceName')" min-width="140" />
        <el-table-column prop="serial_number" :label="t('upgrade.serialNumber')" min-width="140" />
        <el-table-column prop="old_version" :label="t('upgrade.oldVersion')" width="120" />
        <el-table-column prop="new_version" :label="t('upgrade.newVersion')" width="120" />
        <el-table-column prop="status" :label="t('common.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? t('upgrade.success') : t('upgrade.failed') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" :label="t('upgrade.message')" min-width="160" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="resultDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="taskDialogVisible" :title="t('upgrade.createTaskTitle')" width="600px" :close-on-click-modal="false">
      <el-form :model="taskForm" label-width="120px" v-loading="taskDialogLoading">
        <el-form-item :label="t('upgrade.taskName')" required>
          <el-input v-model="taskForm.name" :placeholder="t('upgrade.taskNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('upgrade.deviceType')">
          <el-select v-model="taskForm.device_type" style="width: 100%">
            <el-option label="GNB" value="gnb" />
            <el-option label="CPE" value="cpe" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('upgrade.upgradeType')">
          <el-select v-model="taskForm.upgrade_type" style="width: 100%">
            <el-option :label="t('upgrade.firmwareUpgrade')" value="firmware" />
            <el-option :label="t('upgrade.softwareUpgrade')" value="software" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('upgrade.upgradeFile')" required>
          <el-select v-model="taskForm.upgrade_file_id" :placeholder="t('upgrade.selectUpgradeFilePlaceholder')" style="width: 100%">
            <el-option
              v-for="file in fileList"
              :key="file.id"
              :label="`${file.original_file_name || file.file_name} (v${file.version})`"
              :value="file.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('upgrade.scopeType')">
          <el-select v-model="taskForm.scope" style="width: 100%">
            <el-option :label="t('upgrade.specifiedDevice')" value="element" />
            <el-option :label="t('upgrade.deviceGroup')" value="deviceGroup" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="taskForm.scope === 'element'" :label="t('upgrade.selectDevice')">
          <DeviceSelector v-model="selectedDeviceIds" :multiple="true" :device-type="taskForm.device_type as any" :placeholder="t('upgrade.selectDevicePlaceholder')" />
        </el-form-item>
        <el-form-item v-else :label="t('upgrade.deviceGroupIds')">
          <el-input
            v-model="taskForm.device_group_ids"
            type="textarea"
            :rows="3"
            :placeholder="t('upgrade.deviceGroupIdsPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('upgrade.executeMode')">
          <el-select v-model="taskForm.execute_mode" style="width: 100%">
            <el-option :label="t('upgrade.immediateExecute')" :value="0" />
            <el-option :label="t('upgrade.scheduledExecute')" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('upgrade.concurrentNumber')">
          <el-input-number v-model="taskForm.concurrent_number" :min="1" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('upgrade.maxRetryTimes')">
          <el-input-number v-model="taskForm.max_retry_times" :min="0" :max="10" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('upgrade.manualConfirm')">
          <el-switch
            :model-value="taskForm.manual_upgrade ?? false"
            @change="(val: string | number | boolean) => taskForm.manual_upgrade = Boolean(val)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="taskDialogLoading" @click="handleCreateTask">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 上传文件弹窗 -->
    <el-dialog v-model="uploadDialogVisible" :title="t('upgrade.uploadUpgradeFileTitle')" width="500px" :close-on-click-modal="false">
      <el-form :model="uploadForm" label-width="100px" v-loading="uploadDialogLoading">
        <el-form-item :label="t('upgrade.file')" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".bin,.pkg,.zip,.tar,.gz"
            :on-change="handleFileChange"
            :on-remove="() => (uploadForm.file = null)"
          >
            <el-button :icon="Upload">{{ t('upgrade.selectFile') }}</el-button>
            <template #tip>
              <div class="el-upload__tip">
                {{ t('upgrade.uploadTip') }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('upgrade.version')" required>
          <el-input v-model="uploadForm.version" :placeholder="t('upgrade.versionPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('upgrade.deviceType')">
          <el-select v-model="uploadForm.device_type" style="width: 100%">
            <el-option label="GNB" value="gnb" />
            <el-option label="CPE" value="cpe" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('upgrade.productType')">
          <el-input v-model="uploadForm.product_type" :placeholder="t('upgrade.productTypePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="uploadDialogLoading" @click="handleUploadFile">{{ t('common.upload') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.upgrade-management-page {
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

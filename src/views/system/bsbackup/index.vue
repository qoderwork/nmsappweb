<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
  ElTag,
  ElUpload,
  ElCheckbox,
  ElRadioGroup,
  ElRadio,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';
import {
  Search,
  Refresh,
  Plus,
  Upload,
  Download,
  VideoPlay,
  Close,
  View,
} from '@element-plus/icons-vue';

import {
  getBSBackupInfoList,
  importBSConfigFile,
  exportBSConfigFile,
  addBSBackupTask,
  cancelBSBackupTask,
  addBSRestoreTask,
  cancelBSRestoreTask,
  startBSBackupTask,
  listBSBackupTasks,
  listBSBackupTaskResults,
  downloadBSConfigFile,
} from '@/api/bs-backup';
import type {
  BaseStationBackupInfoVo,
  BSBackupTaskVo,
  DeviceBackupResultVo,
  AddBSBackupTaskRequest,
} from '@/api/bs-backup';

import { getDevices } from '@/api/device';
import type { Device } from '@/types/device';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/* ============ Tab State ============ */
const activeTab = ref('deviceConfig');

/* ============ Device Config Tab ============ */
const deviceLoading = ref(false);
const deviceList = ref<BaseStationBackupInfoVo[]>([]);
const deviceTotal = ref(0);
const deviceQuery = reactive({
  searchText: '',
  page: 1,
  pageSize: 20,
});
const selectedDevices = ref<BaseStationBackupInfoVo[]>([]);

async function loadDeviceConfigList() {
  deviceLoading.value = true;
  try {
    const result = await getBSBackupInfoList({
      searchText: deviceQuery.searchText || undefined,
      page: deviceQuery.page,
      pageSize: deviceQuery.pageSize,
    });
    deviceList.value = result?.list || [];
    deviceTotal.value = result?.total || 0;
  } catch (e) {
    console.error('[BSBackup] load device config list failed:', e);
  } finally {
    deviceLoading.value = false;
  }
}

function handleDeviceSelectionChange(rows: BaseStationBackupInfoVo[]) {
  selectedDevices.value = rows;
}

function handleDevicePageChange(page: number) {
  deviceQuery.page = page;
  loadDeviceConfigList();
}

function handleDeviceSizeChange(size: number) {
  deviceQuery.pageSize = size;
  deviceQuery.page = 1;
  loadDeviceConfigList();
}

function handleSearchDevice() {
  deviceQuery.page = 1;
  loadDeviceConfigList();
}

// --- Import Config ---
const importDialogVisible = ref(false);
const importTargetDevice = ref<BaseStationBackupInfoVo | null>(null);
const importFileRef = ref<File | null>(null);
const importLoading = ref(false);

function openImportDialog(row: BaseStationBackupInfoVo) {
  importTargetDevice.value = row;
  importFileRef.value = null;
  importDialogVisible.value = true;
}

function handleImportFileChange(uploadFile: { raw?: File }) {
  if (uploadFile.raw) {
    importFileRef.value = uploadFile.raw;
  }
}

async function handleImportConfig() {
  if (!importFileRef.value || !importTargetDevice.value) {
    ElMessage.warning(t('bsbackup.selectConfigFile'));
    return;
  }
  importLoading.value = true;
  try {
    const result = await importBSConfigFile(importFileRef.value, importTargetDevice.value.elementId);
    if (result.success) {
      ElMessage.success(t('bsbackup.importSuccess'));
    } else {
      ElMessage.error(result.message || t('bsbackup.importFailed'));
    }
    importDialogVisible.value = false;
    loadDeviceConfigList();
  } catch (e) {
    console.error('[BSBackup] import config failed:', e);
  } finally {
    importLoading.value = false;
  }
}

// --- Export Config ---
async function handleExportConfig() {
  if (selectedDevices.value.length === 0) {
    ElMessage.warning(t('bsbackup.selectDevices'));
    return;
  }
  try {
    const elementIds = selectedDevices.value.map((d) => d.elementId);
    await exportBSConfigFile(elementIds);
    ElMessage.success(t('bsbackup.exportSuccess'));
  } catch (e) {
    console.error('[BSBackup] export config failed:', e);
  }
}

// --- Create Backup / Restore Task Dialog ---
const taskCreateDialogVisible = ref(false);
const taskCreateType = ref<'backup' | 'restore'>('backup');
const taskCreateLoading = ref(false);
const taskForm = reactive<AddBSBackupTaskRequest>({
  name: '',
  executeMode: 1,
  triggerTime: '',
  elementIds: [],
  executeOnAllDevice: false,
  scope: '',
  deviceGroupIds: [],
});

// All devices for selection
const allDevices = ref<Device[]>([]);

async function loadAllDevices() {
  try {
    const result = await getDevices({ page: 1, pageSize: 1000 });
    allDevices.value = result?.list || [];
  } catch (e) {
    console.error('[BSBackup] load all devices failed:', e);
  }
}

function openCreateTaskDialog(type: 'backup' | 'restore') {
  taskCreateType.value = type;
  taskForm.name = '';
  taskForm.executeMode = 1;
  taskForm.triggerTime = '';
  taskForm.elementIds = selectedDevices.value.length > 0
    ? selectedDevices.value.map((d) => d.elementId)
    : [];
  taskForm.executeOnAllDevice = selectedDevices.value.length === 0;
  taskForm.scope = '';
  taskForm.deviceGroupIds = [];
  taskCreateDialogVisible.value = true;
}

async function handleCreateTask() {
  if (!taskForm.name) {
    ElMessage.warning(t('bsbackup.enterTaskName'));
    return;
  }
  if (!taskForm.executeOnAllDevice && (!taskForm.elementIds || taskForm.elementIds.length === 0)) {
    ElMessage.warning(t('bsbackup.selectTargetDevices'));
    return;
  }
  if (taskForm.executeMode === 3 && !taskForm.triggerTime) {
    ElMessage.warning(t('bsbackup.selectScheduleTime'));
    return;
  }
  taskCreateLoading.value = true;
  try {
    const fn = taskCreateType.value === 'backup' ? addBSBackupTask : addBSRestoreTask;
    await fn(taskForm);
    const typeText = taskCreateType.value === 'backup' ? t('bsbackup.taskTypeBackup') : t('bsbackup.taskTypeRestore');
    ElMessage.success(t('bsbackup.taskCreatedSuccess').replace('{type}', typeText));
    taskCreateDialogVisible.value = false;
    activeTab.value = 'tasks';
    loadTaskList();
  } catch (e) {
    console.error('[BSBackup] create task failed:', e);
  } finally {
    taskCreateLoading.value = false;
  }
}

/* ============ Tasks Tab ============ */
const taskLoading = ref(false);
const taskList = ref<BSBackupTaskVo[]>([]);
const taskTotal = ref(0);
const taskQuery = reactive({
  page: 1,
  pageSize: 20,
});

async function loadTaskList() {
  taskLoading.value = true;
  try {
    const result = await listBSBackupTasks(taskQuery);
    taskList.value = result?.list || [];
    taskTotal.value = result?.total || 0;
  } catch (e) {
    console.error('[BSBackup] load task list failed:', e);
  } finally {
    taskLoading.value = false;
  }
}

function handleTaskPageChange(page: number) {
  taskQuery.page = page;
  loadTaskList();
}

function handleTaskSizeChange(size: number) {
  taskQuery.pageSize = size;
  taskQuery.page = 1;
  loadTaskList();
}

function getTaskStatusText(status: number): string {
  const map: Record<number, string> = {
    0: t('bsbackup.statusWaiting'),
    1: t('bsbackup.statusRunning'),
    2: t('bsbackup.statusCompleted'),
    3: t('bsbackup.statusCancelled'),
    4: t('bsbackup.statusFailed'),
  };
  return map[status] || t('bsbackup.statusUnknown');
}

function getTaskStatusType(status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'info',
    4: 'danger',
  };
  return map[status];
}

function getTaskTypeText(type: string): string {
  return type === 'backup' ? t('bsbackup.taskTypeBackup') : type === 'restore' ? t('bsbackup.taskTypeRestore') : type;
}

function getExecuteModeText(mode: number): string {
  const map: Record<number, string> = { 1: t('bsbackup.executeModeImmediate'), 2: t('bsbackup.executeModeWait'), 3: t('bsbackup.executeModeScheduled') };
  return map[mode] || t('bsbackup.statusUnknown');
}

async function handleStartTask(row: BSBackupTaskVo) {
  try {
    await ElMessageBox.confirm(t('bsbackup.startConfirm').replace('{name}', row.name), t('bsbackup.startConfirmTitle'), { type: 'warning' });
    await startBSBackupTask(row.id);
    ElMessage.success(t('bsbackup.taskStarted'));
    loadTaskList();
  } catch (e) {
    if (e !== 'cancel') console.error('[BSBackup] start task failed:', e);
  }
}

async function handleCancelTask(row: BSBackupTaskVo) {
  try {
    await ElMessageBox.confirm(t('bsbackup.cancelConfirm').replace('{name}', row.name), t('bsbackup.cancelConfirmTitle'), { type: 'warning' });
    const fn = row.type === 'backup' ? cancelBSBackupTask : cancelBSRestoreTask;
    await fn(row.id);
    ElMessage.success(t('bsbackup.taskCancelled'));
    loadTaskList();
  } catch (e) {
    if (e !== 'cancel') console.error('[BSBackup] cancel task failed:', e);
  }
}

function handleViewResults(row: BSBackupTaskVo) {
  selectedTaskId.value = row.id;
  selectedTaskName.value = row.name;
  resultQuery.page = 1;
  activeTab.value = 'results';
  loadResultList();
}

/* ============ Results Tab ============ */
const selectedTaskId = ref<number | null>(null);
const selectedTaskName = ref('');
const resultLoading = ref(false);
const resultList = ref<DeviceBackupResultVo[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({
  page: 1,
  pageSize: 20,
});

async function loadResultList() {
  if (!selectedTaskId.value) return;
  resultLoading.value = true;
  try {
    const result = await listBSBackupTaskResults({
      taskId: selectedTaskId.value,
      page: resultQuery.page,
      pageSize: resultQuery.pageSize,
    });
    resultList.value = result?.list || [];
    resultTotal.value = result?.total || 0;
  } catch (e) {
    console.error('[BSBackup] load results failed:', e);
  } finally {
    resultLoading.value = false;
  }
}

function handleResultPageChange(page: number) {
  resultQuery.page = page;
  loadResultList();
}

function handleResultSizeChange(size: number) {
  resultQuery.pageSize = size;
  resultQuery.page = 1;
  loadResultList();
}

function getResultText(result: number): string {
  return result === 0 ? t('bsbackup.success') : t('bsbackup.failed');
}

function getResultType(result: number): 'success' | 'danger' {
  return result === 0 ? 'success' : 'danger';
}

async function handleDownloadConfig(row: DeviceBackupResultVo) {
  if (!row.configurationFile) {
    ElMessage.warning(t('bsbackup.noConfigFile'));
    return;
  }
  try {
    await downloadBSConfigFile(row.elementId);
    ElMessage.success(t('bsbackup.downloadSuccess'));
  } catch (e) {
    console.error('[BSBackup] download config failed:', e);
  }
}

/* ============ Helpers ============ */
function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============ Lifecycle ============ */
onMounted(() => {
  loadDeviceConfigList();
  loadTaskList();
  loadAllDevices();
});
</script>

<template>
  <div class="bsbackup-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ========== 设备配置 Tab ========== -->
      <el-tab-pane :label="t('bsbackup.deviceConfig')" name="deviceConfig">
        <div class="page-header">
          <el-input
            v-model="deviceQuery.searchText"
            :placeholder="t('bsbackup.selectDevicesPlaceholder')"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearchDevice"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearchDevice" />
            </template>
          </el-input>
          <el-button :icon="Refresh" @click="loadDeviceConfigList">{{ t('bsbackup.refresh') }}</el-button>
          <el-button
            type="success"
            :icon="Download"
            :disabled="selectedDevices.length === 0"
            @click="handleExportConfig"
          >
            {{ t('bsbackup.exportConfig') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog('backup')">
            {{ t('bsbackup.createBackupTask') }}
          </el-button>
          <el-button type="warning" :icon="Refresh" @click="openCreateTaskDialog('restore')">
            {{ t('bsbackup.createRestoreTask') }}
          </el-button>
        </div>

        <el-table
          :data="deviceList"
          :loading="deviceLoading"
          border
          stripe
          @selection-change="handleDeviceSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="elementId" label="Element ID" width="110" />
          <el-table-column prop="deviceName" :label="t('bsbackup.deviceName')" min-width="140" />
          <el-table-column prop="serialNumber" :label="t('bsbackup.serialNumber')" min-width="140" />
          <el-table-column prop="configFile" :label="t('bsbackup.configFile')" min-width="160">
            <template #default="{ row }">
              {{ row.configFile || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="configFileTime" :label="t('bsbackup.configFileTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.configFileTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="hasBackup" :label="t('bsbackup.hasBackup')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.hasBackup ? 'success' : 'info'" size="small">
                {{ row.hasBackup ? t('bsbackup.yes') : t('bsbackup.no') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latestBackupTime" :label="t('bsbackup.latestBackupTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.latestBackupTime) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('bsbackup.operation')" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Upload" @click="openImportDialog(row as BaseStationBackupInfoVo)">
                {{ t('bsbackup.import') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="deviceQuery.page"
            v-model:page-size="deviceQuery.pageSize"
            :total="deviceTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleDeviceSizeChange"
            @current-change="handleDevicePageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== 备份任务 Tab ========== -->
      <el-tab-pane :label="t('bsbackup.backupTasks')" name="tasks">
        <div class="page-header">
          <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog('backup')">
            {{ t('bsbackup.createBackupTask') }}
          </el-button>
          <el-button type="warning" :icon="Refresh" @click="openCreateTaskDialog('restore')">
            {{ t('bsbackup.createRestoreTask') }}
          </el-button>
          <el-button :icon="Refresh" @click="loadTaskList">{{ t('bsbackup.refresh') }}</el-button>
        </div>

        <el-table :data="taskList" :loading="taskLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" :label="t('bsbackup.taskName')" min-width="160" />
          <el-table-column prop="type" :label="t('bsbackup.taskType')" width="100">
            <template #default="{ row }">
              {{ getTaskTypeText(row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="executeMode" :label="t('bsbackup.executeMode')" width="120">
            <template #default="{ row }">
              {{ getExecuteModeText(row.executeMode) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" :label="t('bsbackup.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusType(row.status)" size="small">
                {{ getTaskStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('bsbackup.progress')" width="160">
            <template #default="{ row }">
              <span v-if="row.totalDevices">
                {{ row.successDevices || 0 }}/{{ row.totalDevices }} {{ t('bsbackup.success') }}
                <span v-if="row.failedDevices" style="color: var(--el-color-danger); margin-left: 4px;">
                  ({{ row.failedDevices }} {{ t('bsbackup.failed') }})
                </span>
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('bsbackup.createTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('bsbackup.operation')" width="240" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 0 || row.status === 2"
                size="small"
                type="primary"
                :icon="VideoPlay"
                @click="handleStartTask(row as BSBackupTaskVo)"
              >
                {{ t('bsbackup.start') }}
              </el-button>
              <el-button
                v-if="row.status === 0 || row.status === 1"
                size="small"
                type="danger"
                :icon="Close"
                @click="handleCancelTask(row as BSBackupTaskVo)"
              >
                {{ t('bsbackup.cancel') }}
              </el-button>
              <el-button
                size="small"
                :icon="View"
                @click="handleViewResults(row as BSBackupTaskVo)"
              >
                {{ t('bsbackup.results') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="taskQuery.page"
            v-model:page-size="taskQuery.pageSize"
            :total="taskTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleTaskSizeChange"
            @current-change="handleTaskPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== 任务结果 Tab ========== -->
      <el-tab-pane :label="t('bsbackup.taskResults')" name="results">
        <div class="page-header">
          <span v-if="selectedTaskName" class="result-task-label">
            {{ t('bsbackup.currentTask') }}：<strong>{{ selectedTaskName }}</strong>
          </span>
          <span v-else class="result-task-label" style="color: var(--el-text-color-secondary);">
            {{ t('bsbackup.selectTaskToView') }}
          </span>
          <el-button :icon="Refresh" :disabled="!selectedTaskId" @click="loadResultList">{{ t('bsbackup.refresh') }}</el-button>
        </div>

        <el-table :data="resultList" :loading="resultLoading" border stripe>
          <el-table-column prop="elementId" label="Element ID" width="110" />
          <el-table-column prop="deviceName" :label="t('bsbackup.deviceName')" min-width="140" />
          <el-table-column prop="serialNumber" :label="t('bsbackup.serialNumber')" min-width="130" />
          <el-table-column prop="result" :label="t('bsbackup.result')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getResultType(row.result)" size="small">
                {{ getResultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="failureReason" :label="t('bsbackup.failureReason')" min-width="180">
            <template #default="{ row }">
              {{ row.failureReason || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="startTime" :label="t('bsbackup.startTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" :label="t('bsbackup.endTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('bsbackup.operation')" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                :icon="Download"
                :disabled="!row.configurationFile"
                @click="handleDownloadConfig(row as DeviceBackupResultVo)"
              >
                {{ t('bsbackup.download') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="resultQuery.page"
            v-model:page-size="resultQuery.pageSize"
            :total="resultTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleResultSizeChange"
            @current-change="handleResultPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ========== 导入配置文件对话框 ========== -->
    <el-dialog :title="t('bsbackup.importConfigFile')" v-model="importDialogVisible" width="480px">
      <div v-if="importTargetDevice" style="margin-bottom: 16px;">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item :label="t('bsbackup.deviceName')">{{ importTargetDevice.deviceName }}</el-descriptions-item>
          <el-descriptions-item :label="t('bsbackup.serialNumber')">{{ importTargetDevice.serialNumber }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-upload
        :auto-upload="false"
        :limit="1"
        accept=".cfg,.conf,.xml,.tar.gz,.zip"
        :on-change="handleImportFileChange"
        drag
      >
        <div style="padding: 20px 0;">
          <el-icon style="font-size: 40px; color: var(--el-text-color-placeholder);"><Upload /></el-icon>
          <div style="margin-top: 8px; color: var(--el-text-color-secondary);">
            {{ t('bsbackup.dragDropFile') }}
          </div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ t('bsbackup.cancel') }}</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportConfig">{{ t('bsbackup.import') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== 创建备份/恢复任务对话框 ========== -->
    <el-dialog
      :title="taskCreateType === 'backup' ? t('bsbackup.createBackupTask') : t('bsbackup.createRestoreTask')"
      v-model="taskCreateDialogVisible"
      width="600px"
    >
      <el-form :model="taskForm" label-width="120px">
        <el-form-item :label="t('bsbackup.taskName')" required>
          <el-input v-model="taskForm.name" :placeholder="t('bsbackup.enterTaskName')" />
        </el-form-item>
        <el-form-item :label="t('bsbackup.executeMode')">
          <el-radio-group v-model="taskForm.executeMode">
            <el-radio :value="1">{{ t('bsbackup.executeModeImmediate') }}</el-radio>
            <el-radio :value="2">{{ t('bsbackup.executeModeWait') }}</el-radio>
            <el-radio :value="3">{{ t('bsbackup.executeModeScheduled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="taskForm.executeMode === 3" :label="t('bsbackup.executionTime')">
          <el-date-picker
            v-model="taskForm.triggerTime"
            type="datetime"
            :placeholder="t('bsbackup.selectScheduleTime')"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item :label="t('bsbackup.allDevices')">
          <el-checkbox v-model="taskForm.executeOnAllDevice">{{ t('bsbackup.executeOnAllDevice') }}</el-checkbox>
        </el-form-item>
        <el-form-item v-if="!taskForm.executeOnAllDevice" :label="t('bsbackup.selectDevices')">
          <el-select
            v-model="taskForm.elementIds"
            multiple
            filterable
            :placeholder="t('bsbackup.selectDevicesPlaceholder')"
            style="width: 100%;"
          >
            <el-option
              v-for="device in allDevices"
              :key="device.ne_neid"
              :label="`${device.device_name || '-'} (${device.serial_number || device.ne_neid})`"
              :value="device.ne_neid"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskCreateDialogVisible = false">{{ t('bsbackup.cancel') }}</el-button>
        <el-button type="primary" :loading="taskCreateLoading" @click="handleCreateTask">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.bsbackup-management-page {
  padding: 16px;
}

.page-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.result-task-label {
  font-size: 14px;
  line-height: 32px;
}
</style>

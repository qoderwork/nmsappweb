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
    ElMessage.warning('请选择配置文件');
    return;
  }
  importLoading.value = true;
  try {
    const result = await importBSConfigFile(importFileRef.value, importTargetDevice.value.elementId);
    if (result.success) {
      ElMessage.success('配置文件导入成功');
    } else {
      ElMessage.error(result.message || '配置文件导入失败');
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
    ElMessage.warning('请先选择要导出的设备');
    return;
  }
  try {
    const elementIds = selectedDevices.value.map((d) => d.elementId);
    await exportBSConfigFile(elementIds);
    ElMessage.success('配置文件导出成功');
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
    ElMessage.warning('请输入任务名称');
    return;
  }
  if (!taskForm.executeOnAllDevice && (!taskForm.elementIds || taskForm.elementIds.length === 0)) {
    ElMessage.warning('请选择目标设备或勾选全部设备');
    return;
  }
  if (taskForm.executeMode === 3 && !taskForm.triggerTime) {
    ElMessage.warning('请选择定时执行时间');
    return;
  }
  taskCreateLoading.value = true;
  try {
    const fn = taskCreateType.value === 'backup' ? addBSBackupTask : addBSRestoreTask;
    await fn(taskForm);
    ElMessage.success(`${taskCreateType.value === 'backup' ? '备份' : '恢复'}任务创建成功`);
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
    0: '等待中',
    1: '运行中',
    2: '已完成',
    3: '已取消',
    4: '失败',
  };
  return map[status] || '未知';
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
  return type === 'backup' ? '备份' : type === 'restore' ? '恢复' : type;
}

function getExecuteModeText(mode: number): string {
  const map: Record<number, string> = { 1: '立即执行', 2: '等待执行', 3: '定时执行' };
  return map[mode] || '未知';
}

async function handleStartTask(row: BSBackupTaskVo) {
  try {
    await ElMessageBox.confirm(`确定要启动任务 "${row.name}" 吗？`, '启动确认', { type: 'warning' });
    await startBSBackupTask(row.id);
    ElMessage.success('任务已启动');
    loadTaskList();
  } catch (e) {
    if (e !== 'cancel') console.error('[BSBackup] start task failed:', e);
  }
}

async function handleCancelTask(row: BSBackupTaskVo) {
  try {
    await ElMessageBox.confirm(`确定要取消任务 "${row.name}" 吗？`, '取消确认', { type: 'warning' });
    const fn = row.type === 'backup' ? cancelBSBackupTask : cancelBSRestoreTask;
    await fn(row.id);
    ElMessage.success('任务已取消');
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
  return result === 0 ? '成功' : '失败';
}

function getResultType(result: number): 'success' | 'danger' {
  return result === 0 ? 'success' : 'danger';
}

async function handleDownloadConfig(row: DeviceBackupResultVo) {
  if (!row.configurationFile) {
    ElMessage.warning('无配置文件可下载');
    return;
  }
  try {
    await downloadBSConfigFile(row.elementId);
    ElMessage.success('配置文件下载成功');
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
      <el-tab-pane label="设备配置" name="deviceConfig">
        <div class="page-header">
          <el-input
            v-model="deviceQuery.searchText"
            placeholder="搜索设备名称/序列号"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearchDevice"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearchDevice" />
            </template>
          </el-input>
          <el-button :icon="Refresh" @click="loadDeviceConfigList">刷新</el-button>
          <el-button
            type="success"
            :icon="Download"
            :disabled="selectedDevices.length === 0"
            @click="handleExportConfig"
          >
            导出配置
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog('backup')">
            创建备份任务
          </el-button>
          <el-button type="warning" :icon="Refresh" @click="openCreateTaskDialog('restore')">
            创建恢复任务
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
          <el-table-column prop="deviceName" label="设备名称" min-width="140" />
          <el-table-column prop="serialNumber" label="序列号" min-width="140" />
          <el-table-column prop="configFile" label="配置文件" min-width="160">
            <template #default="{ row }">
              {{ row.configFile || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="configFileTime" label="配置文件时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.configFileTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="hasBackup" label="已备份" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.hasBackup ? 'success' : 'info'" size="small">
                {{ row.hasBackup ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latestBackupTime" label="最新备份时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.latestBackupTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Upload" @click="openImportDialog(row as BaseStationBackupInfoVo)">
                导入
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
      <el-tab-pane label="备份任务" name="tasks">
        <div class="page-header">
          <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog('backup')">
            创建备份任务
          </el-button>
          <el-button type="warning" :icon="Refresh" @click="openCreateTaskDialog('restore')">
            创建恢复任务
          </el-button>
          <el-button :icon="Refresh" @click="loadTaskList">刷新</el-button>
        </div>

        <el-table :data="taskList" :loading="taskLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="任务名称" min-width="160" />
          <el-table-column prop="type" label="任务类型" width="100">
            <template #default="{ row }">
              {{ getTaskTypeText(row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="executeMode" label="执行方式" width="120">
            <template #default="{ row }">
              {{ getExecuteModeText(row.executeMode) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusType(row.status)" size="small">
                {{ getTaskStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="160">
            <template #default="{ row }">
              <span v-if="row.totalDevices">
                {{ row.successDevices || 0 }}/{{ row.totalDevices }} 成功
                <span v-if="row.failedDevices" style="color: var(--el-color-danger); margin-left: 4px;">
                  ({{ row.failedDevices }} 失败)
                </span>
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 0 || row.status === 2"
                size="small"
                type="primary"
                :icon="VideoPlay"
                @click="handleStartTask(row as BSBackupTaskVo)"
              >
                启动
              </el-button>
              <el-button
                v-if="row.status === 0 || row.status === 1"
                size="small"
                type="danger"
                :icon="Close"
                @click="handleCancelTask(row as BSBackupTaskVo)"
              >
                取消
              </el-button>
              <el-button
                size="small"
                :icon="View"
                @click="handleViewResults(row as BSBackupTaskVo)"
              >
                结果
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
      <el-tab-pane label="任务结果" name="results">
        <div class="page-header">
          <span v-if="selectedTaskName" class="result-task-label">
            当前任务：<strong>{{ selectedTaskName }}</strong>
          </span>
          <span v-else class="result-task-label" style="color: var(--el-text-color-secondary);">
            请从"备份任务"页选择一个任务查看结果
          </span>
          <el-button :icon="Refresh" :disabled="!selectedTaskId" @click="loadResultList">刷新</el-button>
        </div>

        <el-table :data="resultList" :loading="resultLoading" border stripe>
          <el-table-column prop="elementId" label="Element ID" width="110" />
          <el-table-column prop="deviceName" label="设备名称" min-width="140" />
          <el-table-column prop="serialNumber" label="序列号" min-width="130" />
          <el-table-column prop="result" label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getResultType(row.result)" size="small">
                {{ getResultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="failureReason" label="失败原因" min-width="180">
            <template #default="{ row }">
              {{ row.failureReason || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                :icon="Download"
                :disabled="!row.configurationFile"
                @click="handleDownloadConfig(row as DeviceBackupResultVo)"
              >
                下载
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
    <el-dialog title="导入配置文件" v-model="importDialogVisible" width="480px">
      <div v-if="importTargetDevice" style="margin-bottom: 16px;">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="设备名称">{{ importTargetDevice.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="序列号">{{ importTargetDevice.serialNumber }}</el-descriptions-item>
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
            拖拽文件到此处，或点击选择配置文件
          </div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportConfig">导入</el-button>
      </template>
    </el-dialog>

    <!-- ========== 创建备份/恢复任务对话框 ========== -->
    <el-dialog
      :title="taskCreateType === 'backup' ? '创建备份任务' : '创建恢复任务'"
      v-model="taskCreateDialogVisible"
      width="600px"
    >
      <el-form :model="taskForm" label-width="120px">
        <el-form-item label="任务名称" required>
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="执行方式">
          <el-radio-group v-model="taskForm.executeMode">
            <el-radio :value="1">立即执行</el-radio>
            <el-radio :value="2">等待执行</el-radio>
            <el-radio :value="3">定时执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="taskForm.executeMode === 3" label="执行时间">
          <el-date-picker
            v-model="taskForm.triggerTime"
            type="datetime"
            placeholder="选择执行时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="全部设备">
          <el-checkbox v-model="taskForm.executeOnAllDevice">对所有设备执行</el-checkbox>
        </el-form-item>
        <el-form-item v-if="!taskForm.executeOnAllDevice" label="选择设备">
          <el-select
            v-model="taskForm.elementIds"
            multiple
            filterable
            placeholder="请选择目标设备"
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
        <el-button @click="taskCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="taskCreateLoading" @click="handleCreateTask">确定</el-button>
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

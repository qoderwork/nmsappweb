<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElDatePicker, ElButton, ElTable, ElTableColumn, ElTabs, ElTabPane } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, VideoPlay, RefreshRight, Setting } from '@element-plus/icons-vue';

import {
  listNMSBackupTask,
  addNMSBackupTask,
  modifyNMSBackupTask,
  runNMSBackupTask,
  deleteNMSBackupTask,
  revertNMSBackupTask,
  getBackupAndRestoreConfig,
  updateBackupAndRestoreConfig,
  listNMSBackupLogs,
  getNMSBackupLogDetail,
} from '@/api/backup';
import type {
  NMSBackupTask,
  NMSBackupLog,
  AddNMSBackupTaskRequest,
  ModifyNMSBackupTaskRequest,
} from '@/types/backup';

const { t } = useI18n();
const activeTab = ref('task');

// --- 备份任务管理 ---
const taskLoading = ref(false);
const taskList = ref<NMSBackupTask[]>([]);
const taskTotal = ref(0);
const taskQuery = reactive({
  page: 1,
  pageSize: 20,
});
const taskDialogVisible = ref(false);
const isEditTask = ref(false);
const taskForm = reactive<AddNMSBackupTaskRequest & { id?: number }>({
  id: undefined,
  backupName: '',
  backupType: 0,
  backupInterval: 0,
  backupBeginTime: '',
  pmInterval: 0,
  mrInterval: 0,
  xlogInterval: 0,
});

// --- 备份配置 ---
const configLoading = ref(false);
const configForm = reactive({
  backupFileSavedDays: 30,
});

// --- 备份日志 ---
const logLoading = ref(false);
const logList = ref<NMSBackupLog[]>([]);
const logTotal = ref(0);
const logQuery = reactive({
  page: 1,
  pageSize: 20,
});
const logDetailDialogVisible = ref(false);
const logDetail = ref<NMSBackupLog | null>(null);

function getStatusText(status: number): string {
  const map: Record<number, string> = {
    0: t('backup.statusReady'),
    1: t('backup.statusRunning'),
    2: t('backup.statusCompleted'),
    3: t('backup.statusFailed'),
  };
  return map[status] || t('backup.statusUnknown');
}

function getStatusClass(status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
  };
  return map[status];
}

function getBackupTypeText(type: number): string {
  return type === 0 ? t('backup.backupTypeOnce') : t('backup.backupTypeScheduled');
}

function getResultText(result: number): string {
  return result === 0 ? t('backup.resultSuccess') : t('backup.resultFailed');
}

// --- 任务管理方法 ---
async function loadTasks() {
  taskLoading.value = true;
  try {
    const result = await listNMSBackupTask(taskQuery);
    taskList.value = result.list || [];
    taskTotal.value = result.total || 0;
  } catch (e) {
    console.error('[Backup] load tasks failed:', e);
  } finally {
    taskLoading.value = false;
  }
}

function handleTaskPageChange(page: number) {
  taskQuery.page = page;
  loadTasks();
}

function handleTaskSizeChange(size: number) {
  taskQuery.pageSize = size;
  taskQuery.page = 1;
  loadTasks();
}

function openAddTask() {
  isEditTask.value = false;
  taskForm.id = undefined;
  taskForm.backupName = '';
  taskForm.backupType = 0;
  taskForm.backupInterval = 0;
  taskForm.backupBeginTime = '';
  taskForm.pmInterval = 0;
  taskForm.mrInterval = 0;
  taskForm.xlogInterval = 0;
  taskDialogVisible.value = true;
}

function openEditTask(row: NMSBackupTask) {
  isEditTask.value = true;
  taskForm.id = row.id;
  taskForm.backupName = row.backupName;
  taskForm.backupType = row.backupType;
  taskForm.backupInterval = row.backupInterval;
  taskForm.backupBeginTime = row.backupBeginTime;
  taskForm.pmInterval = row.pmInterval;
  taskForm.mrInterval = row.mrInterval;
  taskForm.xlogInterval = row.xlogInterval;
  taskDialogVisible.value = true;
}

async function saveTask() {
  if (!taskForm.backupName) {
    ElMessage.warning(t('backup.enterBackupName'));
    return;
  }
  try {
    if (isEditTask.value && taskForm.id !== undefined) {
      const req: ModifyNMSBackupTaskRequest = {
        id: taskForm.id,
        backupName: taskForm.backupName,
        backupType: taskForm.backupType,
        backupInterval: taskForm.backupInterval,
        backupBeginTime: taskForm.backupBeginTime || undefined,
        pmInterval: taskForm.pmInterval,
        mrInterval: taskForm.mrInterval,
        xlogInterval: taskForm.xlogInterval,
      };
      await modifyNMSBackupTask(req);
      ElMessage.success(t('backup.editSuccess'));
    } else {
      await addNMSBackupTask(taskForm);
      ElMessage.success(t('backup.addSuccess'));
    }
    taskDialogVisible.value = false;
    loadTasks();
  } catch (e) {
    console.error('[Backup] save task failed:', e);
  }
}

async function handleDeleteTask(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(t('backup.deleteConfirm').replace('{name}', row.backupName), t('backup.deleteConfirmTitle'), { type: 'warning' });
    await deleteNMSBackupTask({ id: row.id });
    ElMessage.success(t('backup.deleteSuccess'));
    loadTasks();
  } catch (e) {
    if (e !== 'cancel') console.error('[Backup] delete task failed:', e);
  }
}

async function handleRunBackup(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(t('backup.runConfirm').replace('{name}', row.backupName), t('backup.runConfirmTitle'), { type: 'warning' });
    await runNMSBackupTask({ id: row.id });
    ElMessage.success(t('backup.backupTriggered'));
    loadTasks();
  } catch (e) {
    if (e !== 'cancel') console.error('[Backup] run backup failed:', e);
  }
}

async function handleRevertBackup(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(t('backup.revertConfirm').replace('{name}', row.backupName), t('backup.revertConfirmTitle'), { type: 'warning' });
    await revertNMSBackupTask({ id: row.id });
    ElMessage.success(t('backup.restoreTriggered'));
    loadTasks();
  } catch (e) {
    if (e !== 'cancel') console.error('[Backup] revert backup failed:', e);
  }
}

// --- 配置管理方法 ---
async function loadConfig() {
  configLoading.value = true;
  try {
    const result = await getBackupAndRestoreConfig();
    configForm.backupFileSavedDays = result.backupFileSavedDays || 30;
  } catch (e) {
    console.error('[Backup] load config failed:', e);
  } finally {
    configLoading.value = false;
  }
}

async function saveConfig() {
  try {
    await updateBackupAndRestoreConfig({ backupFileSavedDays: configForm.backupFileSavedDays });
    ElMessage.success(t('backup.configSaved'));
  } catch (e) {
    console.error('[Backup] save config failed:', e);
  }
}

// --- 日志管理方法 ---
async function loadLogs() {
  logLoading.value = true;
  try {
    const result = await listNMSBackupLogs(logQuery);
    logList.value = result.list || [];
    logTotal.value = result.total || 0;
  } catch (e) {
    console.error('[Backup] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogPageChange(page: number) {
  logQuery.page = page;
  loadLogs();
}

function handleLogSizeChange(size: number) {
  logQuery.pageSize = size;
  logQuery.page = 1;
  loadLogs();
}

async function viewLogDetail(row: NMSBackupLog) {
  try {
    const result = await getNMSBackupLogDetail({ logId: row.id });
    logDetail.value = result;
    logDetailDialogVisible.value = true;
  } catch (e) {
    console.error('[Backup] get log detail failed:', e);
  }
}

function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

onMounted(() => {
  loadTasks();
  loadConfig();
  loadLogs();
});
</script>

<template>
  <div class="backup-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 备份任务管理 -->
      <el-tab-pane :label="t('backup.backupTask')" name="task">
        <div class="page-header">
          <el-button type="primary" :icon="Plus" @click="openAddTask">{{ t('backup.addBackupTask') }}</el-button>
          <el-button :icon="Refresh" @click="loadTasks">{{ t('backup.refresh') }}</el-button>
        </div>

        <el-table :data="taskList" :loading="taskLoading" border stripe>
          <el-table-column prop="id" :label="t('common.id')" width="80" />
          <el-table-column prop="backupName" :label="t('backup.backupName')" />
          <el-table-column prop="backupType" :label="t('backup.backupType')" width="100">
            <template #default="{ row }">
              <span>{{ getBackupTypeText(row.backupType) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="backupInterval" :label="t('backup.backupInterval')" width="120" />
          <el-table-column prop="backupBeginTime" :label="t('backup.backupBeginTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.backupBeginTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="backupStatus" :label="t('backup.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusClass(row.backupStatus)">
                {{ getStatusText(row.backupStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('backup.createTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('backup.operation')" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="openEditTask(row as NMSBackupTask)">{{ t('backup.edit') }}</el-button>
              <el-button size="small" type="primary" :icon="VideoPlay" @click="handleRunBackup(row as NMSBackupTask)">{{ t('backup.runBackup') }}</el-button>
              <el-button size="small" type="success" :icon="RefreshRight" @click="handleRevertBackup(row as NMSBackupTask)">{{ t('backup.revert') }}</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteTask(row as NMSBackupTask)">{{ t('backup.delete') }}</el-button>
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

      <!-- 备份配置 -->
      <el-tab-pane :label="t('backup.backupConfig')" name="config">
        <el-card shadow="never">
          <el-form :model="configForm" label-width="200px">
            <el-form-item :label="t('backup.backupFileSavedDays')">
              <el-input-number v-model="configForm.backupFileSavedDays" :min="1" :max="365" />
              <span style="margin-left: 8px;">{{ t('backup.days') }}</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Setting" @click="saveConfig">{{ t('backup.saveConfig') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 备份日志 -->
      <el-tab-pane :label="t('backup.backupLogs')" name="log">
        <div class="page-header">
          <el-button :icon="Refresh" @click="loadLogs">{{ t('backup.refresh') }}</el-button>
        </div>

        <el-table :data="logList" :loading="logLoading" border stripe>
          <el-table-column prop="id" :label="t('common.id')" width="80" />
          <el-table-column prop="fileName" :label="t('backup.fileName')" />
          <el-table-column prop="time" :label="t('backup.operationTime')" width="180">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="operationUser" :label="t('backup.operationUser')" width="120" />
          <el-table-column prop="result" :label="t('backup.result')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 0 ? 'success' : 'danger'">
                {{ getResultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('backup.operation')" width="100">
            <template #default="{ row }">
              <el-button size="small" :icon="Search" @click="viewLogDetail(row as NMSBackupLog)">{{ t('backup.detail') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="logQuery.page"
            v-model:page-size="logQuery.pageSize"
            :total="logTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleLogSizeChange"
            @current-change="handleLogPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 任务编辑对话框 -->
    <el-dialog :title="isEditTask ? t('backup.edit') + ' ' + t('backup.backupTask') : t('backup.addBackupTask')" v-model="taskDialogVisible" width="500px">
      <el-form :model="taskForm" label-width="120px">
        <el-form-item :label="t('backup.backupName')" required>
          <el-input v-model="taskForm.backupName" :placeholder="t('backup.enterBackupName')" />
        </el-form-item>
        <el-form-item :label="t('backup.backupType')">
          <el-select v-model="taskForm.backupType">
            <el-option :label="t('backup.backupTypeOnce')" :value="0" />
            <el-option :label="t('backup.backupTypeScheduled')" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('backup.backupInterval')" v-if="taskForm.backupType === 1">
          <el-input-number v-model="taskForm.backupInterval" :min="1" :max="365" />
        </el-form-item>
        <el-form-item :label="t('backup.backupBeginTime')">
          <el-date-picker
            v-model="taskForm.backupBeginTime"
            type="datetime"
            :placeholder="t('backup.selectBeginTime')"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item :label="t('backup.pmFileRetention')">
          <el-input-number v-model="taskForm.pmInterval" :min="0" />
        </el-form-item>
        <el-form-item :label="t('backup.mrFileRetention')">
          <el-input-number v-model="taskForm.mrInterval" :min="0" />
        </el-form-item>
        <el-form-item :label="t('backup.xlogFileRetention')">
          <el-input-number v-model="taskForm.xlogInterval" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">{{ t('backup.cancel') }}</el-button>
        <el-button type="primary" @click="saveTask">{{ t('backup.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情对话框 -->
    <el-dialog :title="t('backup.logDetail')" v-model="logDetailDialogVisible" width="500px">
      <div v-if="logDetail">
        <el-descriptions :column="1">
          <el-descriptions-item :label="t('backup.logId')">{{ logDetail.id }}</el-descriptions-item>
          <el-descriptions-item :label="t('backup.fileName')">{{ logDetail.fileName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('backup.operationTime')">{{ formatTime(logDetail.time) }}</el-descriptions-item>
          <el-descriptions-item :label="t('backup.operationUser')">{{ logDetail.operationUser || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('backup.result')">
            <el-tag :type="logDetail.result === 0 ? 'success' : 'danger'">
              {{ getResultText(logDetail.result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('backup.reason')">
            <pre style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;">{{ logDetail.reason || '-' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.backup-management-page {
  padding: 16px;
}

.page-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
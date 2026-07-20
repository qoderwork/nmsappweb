<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
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
    0: '就绪',
    1: '运行中',
    2: '已完成',
    3: '失败',
  };
  return map[status] || '未知';
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
  return type === 0 ? '单次' : '定时';
}

function getResultText(result: number): string {
  return result === 0 ? '成功' : '失败';
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
    ElMessage.warning('请输入备份名称');
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
      ElMessage.success('修改成功');
    } else {
      await addNMSBackupTask(taskForm);
      ElMessage.success('添加成功');
    }
    taskDialogVisible.value = false;
    loadTasks();
  } catch (e) {
    console.error('[Backup] save task failed:', e);
  }
}

async function handleDeleteTask(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(`确定要删除备份任务 "${row.backupName}" 吗？`, '删除确认', { type: 'warning' });
    await deleteNMSBackupTask({ id: row.id });
    ElMessage.success('删除成功');
    loadTasks();
  } catch (e) {
    if (e !== 'cancel') console.error('[Backup] delete task failed:', e);
  }
}

async function handleRunBackup(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(`确定要立即执行备份任务 "${row.backupName}" 吗？`, '执行确认', { type: 'warning' });
    await runNMSBackupTask({ id: row.id });
    ElMessage.success('备份任务已触发');
    loadTasks();
  } catch (e) {
    if (e !== 'cancel') console.error('[Backup] run backup failed:', e);
  }
}

async function handleRevertBackup(row: NMSBackupTask) {
  try {
    await ElMessageBox.confirm(`确定要从备份 "${row.backupName}" 恢复吗？此操作将覆盖当前配置！`, '恢复确认', { type: 'warning' });
    await revertNMSBackupTask({ id: row.id });
    ElMessage.success('恢复任务已触发');
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
    ElMessage.success('配置保存成功');
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
      <el-tab-pane label="备份任务" name="task">
        <div class="page-header">
          <el-button type="primary" :icon="Plus" @click="openAddTask">新增备份任务</el-button>
          <el-button :icon="Refresh" @click="loadTasks">刷新</el-button>
        </div>

        <el-table :data="taskList" :loading="taskLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="backupName" label="备份名称" />
          <el-table-column prop="backupType" label="备份类型" width="100">
            <template #default="{ row }">
              <span>{{ getBackupTypeText(row.backupType) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="backupInterval" label="备份间隔(天)" width="120" />
          <el-table-column prop="backupBeginTime" label="开始时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.backupBeginTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="backupStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusClass(row.backupStatus)">
                {{ getStatusText(row.backupStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="openEditTask(row as NMSBackupTask)">编辑</el-button>
              <el-button size="small" type="primary" :icon="VideoPlay" @click="handleRunBackup(row as NMSBackupTask)">立即备份</el-button>
              <el-button size="small" type="success" :icon="RefreshRight" @click="handleRevertBackup(row as NMSBackupTask)">恢复</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteTask(row as NMSBackupTask)">删除</el-button>
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
      <el-tab-pane label="备份配置" name="config">
        <el-card shadow="never">
          <el-form :model="configForm" label-width="200px">
            <el-form-item label="备份文件保留天数">
              <el-input-number v-model="configForm.backupFileSavedDays" :min="1" :max="365" />
              <span style="margin-left: 8px;">天</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Setting" @click="saveConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 备份日志 -->
      <el-tab-pane label="备份日志" name="log">
        <div class="page-header">
          <el-button :icon="Refresh" @click="loadLogs">刷新</el-button>
        </div>

        <el-table :data="logList" :loading="logLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="fileName" label="备份文件" />
          <el-table-column prop="time" label="操作时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="operationUser" label="操作人" width="120" />
          <el-table-column prop="result" label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 0 ? 'success' : 'danger'">
                {{ getResultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" :icon="Search" @click="viewLogDetail(row as NMSBackupLog)">详情</el-button>
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
    <el-dialog :title="isEditTask ? '编辑备份任务' : '新增备份任务'" v-model="taskDialogVisible" width="500px">
      <el-form :model="taskForm" label-width="120px">
        <el-form-item label="备份名称" required>
          <el-input v-model="taskForm.backupName" placeholder="请输入备份名称" />
        </el-form-item>
        <el-form-item label="备份类型">
          <el-select v-model="taskForm.backupType">
            <el-option label="单次" :value="0" />
            <el-option label="定时" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="备份间隔(天)" v-if="taskForm.backupType === 1">
          <el-input-number v-model="taskForm.backupInterval" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="taskForm.backupBeginTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="PM文件保留(天)">
          <el-input-number v-model="taskForm.pmInterval" :min="0" />
        </el-form-item>
        <el-form-item label="MR文件保留(天)">
          <el-input-number v-model="taskForm.mrInterval" :min="0" />
        </el-form-item>
        <el-form-item label="Xlog文件保留(天)">
          <el-input-number v-model="taskForm.xlogInterval" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情对话框 -->
    <el-dialog title="日志详情" v-model="logDetailDialogVisible" width="500px">
      <div v-if="logDetail">
        <el-descriptions :column="1">
          <el-descriptions-item label="日志ID">{{ logDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="备份文件">{{ logDetail.fileName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatTime(logDetail.time) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ logDetail.operationUser || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag :type="logDetail.result === 0 ? 'success' : 'danger'">
              {{ getResultText(logDetail.result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="原因">
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
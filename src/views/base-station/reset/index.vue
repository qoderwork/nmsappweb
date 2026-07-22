<script setup lang="ts">
/**
 * BS 重置任务管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  listResetTasks,
  addResetTask,
  deleteResetTask,
  startResetTask,
  listResetTaskResults,
} from '@/api/device-ops';
import type { ResetTaskVO, ResetTaskResultVO } from '@/types/device-ops';

const { t } = useI18n();
const DEVICE_TYPE = 'gnb';

const queryParams = reactive({ taskName: '', page: 1, pageSize: 20 });
const loading = ref(false);
const taskList = ref<ResetTaskVO[]>([]);
const total = ref(0);

const addDialogVisible = ref(false);
const addForm = reactive({ name: '', executeMode: 1, elementIds: [] as number[] });

const resultDialogVisible = ref(false);
const resultLoading = ref(false);
const resultList = ref<ResetTaskResultVO[]>([]);
const resultTotal = ref(0);
const resultPage = ref(1);
const resultTaskId = ref<number | null>(null);

async function loadTasks() {
  loading.value = true;
  try {
    const res = await listResetTasks({ deviceType: DEVICE_TYPE, taskName: queryParams.taskName || undefined, page: queryParams.page, pageSize: queryParams.pageSize });
    taskList.value = res.list;
    total.value = res.total;
  } catch (e) { console.error('[BsReset] load failed:', e); }
  finally { loading.value = false; }
}

function handleSearch() { queryParams.page = 1; loadTasks(); }
function handlePageChange(page: number) { queryParams.page = page; loadTasks(); }
function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.page = 1; loadTasks(); }

function openAddDialog() {
  addForm.name = '';
  addForm.executeMode = 1;
  addForm.elementIds = [];
  addDialogVisible.value = true;
}

async function handleAdd() {
  if (!addForm.name.trim()) { ElMessage.warning(t('common.required')); return; }
  try {
    await addResetTask({ name: addForm.name, executeMode: addForm.executeMode, deviceType: DEVICE_TYPE, scope: 'element', elementIds: addForm.elementIds });
    ElMessage.success(t('common.addSuccess'));
    addDialogVisible.value = false;
    loadTasks();
  } catch (e) { console.error('[BsReset] add failed:', e); }
}

async function handleStart(task: ResetTaskVO) {
  try { await startResetTask(task.id); ElMessage.success(t('common.operateSuccess')); loadTasks(); }
  catch (e) { console.error('[BsReset] start failed:', e); }
}

async function handleDelete(task: ResetTaskVO) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), { type: 'warning' });
    await deleteResetTask(task.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadTasks();
  } catch (e) { if (e !== 'cancel') console.error('[BsReset] delete failed:', e); }
}

async function openResultDialog(task: ResetTaskVO) {
  resultTaskId.value = task.id;
  resultPage.value = 1;
  resultDialogVisible.value = true;
  await loadResults();
}

async function loadResults() {
  if (!resultTaskId.value) return;
  resultLoading.value = true;
  try {
    const res = await listResetTaskResults(resultTaskId.value, { page: resultPage.value, pageSize: 20 });
    resultList.value = res.list;
    resultTotal.value = res.total;
  } catch (e) { console.error('[BsReset] results failed:', e); }
  finally { resultLoading.value = false; }
}

function handleResultPageChange(page: number) { resultPage.value = page; loadResults(); }

function getStatusText(status: number) { const m: Record<number, string> = { 1: '等待中', 2: '执行中', 3: '已完成', 4: '已取消' }; return m[status] || String(status); }
function getStatusType(status: number): 'info' | 'warning' | 'success' | 'danger' { if (status === 3) return 'success'; if (status === 4) return 'danger'; if (status === 2) return 'warning'; return 'info'; }
function getResultText(r?: number) { if (r === 1) return '成功'; if (r === 2) return '失败'; return '-'; }
function getResultType(r?: number): 'success' | 'danger' | 'info' { if (r === 1) return 'success'; if (r === 2) return 'danger'; return 'info'; }

onMounted(() => loadTasks());
</script>

<template>
  <div class="bs-reset-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item>
          <el-input v-model="queryParams.taskName" :placeholder="t('common.search')" clearable style="width: 240px" @keyup.enter="handleSearch" @clear="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="queryParams.taskName = ''; handleSearch()">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新建任务</el-button>
      </div>
      <el-table v-loading.lazy="loading" :data="taskList" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="任务名" min-width="160" />
        <el-table-column prop="user" label="创建人" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="100" />
        <el-table-column label="结果" width="80">
          <template #default="{ row }"><el-tag :type="getResultType(row.results)" size="small">{{ getResultText(row.results) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column prop="endTime" label="结束时间" width="170" />
        <el-table-column :label="t('common.actions')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openResultDialog(row as any)">查看结果</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="handleStart(row as any)">启动</el-button>
            <el-button link type="danger" @click="handleDelete(row as any)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新建重置任务" width="500px" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="addForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="执行模式">
          <el-select v-model="addForm.executeMode" style="width: 100%">
            <el-option :value="1" label="立即执行" />
            <el-option :value="2" label="手动启动" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAdd">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resultDialogVisible" title="执行结果" width="700px">
      <el-table v-loading="resultLoading" :data="resultList" stripe border row-key="elementId">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="serialNumber" label="序列号" width="160" />
        <el-table-column prop="deviceName" label="设备名" min-width="140" />
        <el-table-column label="结果" width="80">
          <template #default="{ row: r }"><el-tag :type="getResultType(r.results)" size="small">{{ getResultText(r.results) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="failureReason" label="失败原因" min-width="160" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="resultPage" :page-size="20" :total="resultTotal" layout="total, prev, pager, next" background small @current-change="handleResultPageChange" />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.bs-reset-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base, 12px);
  width: 100%;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>

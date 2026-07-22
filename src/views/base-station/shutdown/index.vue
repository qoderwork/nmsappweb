<script setup lang="ts">
/**
 * BS 关机任务管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { addShutdownTask, listShutdownTasks, deleteShutdownTask, listShutdownResults } from '@/api/device-ops';
import type { ShutdownTaskVo, ShutdownResultVo } from '@/types/device-ops';

const { t } = useI18n();

const queryParams = reactive({ page: 1, pageSize: 20 });
const loading = ref(false);
const taskList = ref<ShutdownTaskVo[]>([]);
const total = ref(0);

const addDialogVisible = ref(false);
const addForm = reactive({ name: '', executeMode: 1, elementIds: [] as number[] });

const resultDialogVisible = ref(false);
const resultLoading = ref(false);
const resultList = ref<ShutdownResultVo[]>([]);
const resultTotal = ref(0);
const resultPage = ref(1);
const resultTaskId = ref<number>(0);

async function loadTasks() {
  loading.value = true;
  try {
    const res = await listShutdownTasks({ page: queryParams.page, pageSize: queryParams.pageSize });
    taskList.value = res.list;
    total.value = res.total;
  } catch (e) { console.error('[BsShutdown] load failed:', e); }
  finally { loading.value = false; }
}

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
    await addShutdownTask({ name: addForm.name, executeMode: addForm.executeMode, elementIds: addForm.elementIds });
    ElMessage.success(t('common.addSuccess'));
    addDialogVisible.value = false;
    loadTasks();
  } catch (e) { console.error('[BsShutdown] add failed:', e); }
}

async function handleDelete(task: ShutdownTaskVo) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), { type: 'warning' });
    await deleteShutdownTask(task.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadTasks();
  } catch (e) { if (e !== 'cancel') console.error('[BsShutdown] delete failed:', e); }
}

async function openResultDialog(task: ShutdownTaskVo) {
  resultTaskId.value = task.id;
  resultPage.value = 1;
  resultDialogVisible.value = true;
  await loadResults();
}

async function loadResults() {
  resultLoading.value = true;
  try {
    const res = await listShutdownResults(resultTaskId.value, { page: resultPage.value, pageSize: 20 });
    resultList.value = res.list;
    resultTotal.value = res.total;
  } catch (e) { console.error('[BsShutdown] results failed:', e); }
  finally { resultLoading.value = false; }
}

function getStatusText(status: number) { const m: Record<number, string> = { 1: '等待中', 2: '执行中', 3: '已完成' }; return m[status] || String(status); }
function getStatusType(status: number): 'info' | 'warning' | 'success' { if (status === 3) return 'success'; if (status === 2) return 'warning'; return 'info'; }

onMounted(() => loadTasks());
</script>

<template>
  <div class="bs-shutdown-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新建任务</el-button>
      </div>
      <el-table v-loading.lazy="loading" :data="taskList" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="任务名" min-width="160" />
        <el-table-column prop="operationUser" label="操作人" width="120" />
        <el-table-column prop="operationTime" label="操作时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="deviceCount" label="设备数" width="80" />
        <el-table-column prop="progress" label="进度" width="100" />
        <el-table-column :label="t('common.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openResultDialog(row as any)">查看结果</el-button>
            <el-button link type="danger" @click="handleDelete(row as any)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新建关机任务" width="500px" :close-on-click-modal="false">
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
        <el-table-column label="状态" width="80">
          <template #default="{ row: r }">
            <el-tag :type="r.status === 1 ? 'success' : 'danger'" size="small">{{ r.status === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="170" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="resultPage" :page-size="20" :total="resultTotal" layout="total, prev, pager, next" background small @current-change="(p: number) => { resultPage = p; loadResults() }" />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.bs-shutdown-page {
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

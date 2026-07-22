<template>
  <div class="shutdown-tab">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('common.add') }}</el-button>
      <el-button :icon="Refresh" @click="loadTasks">{{ t('common.refresh') }}</el-button>
    </div>
    <el-table :data="taskList" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" :label="t('deviceOps.taskName')" min-width="160" />
      <el-table-column prop="operationUser" :label="t('deviceOps.operator')" width="120" />
      <el-table-column :label="t('common.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('deviceOps.executeMode')" width="120">
        <template #default="{ row }">
          <span>{{ getExecuteModeText(row.executeMode) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="deviceCount" :label="t('deviceOps.deviceCount')" width="100" />
      <el-table-column prop="progress" :label="t('deviceOps.progress')" width="140" />
      <el-table-column prop="operationTime" :label="t('deviceOps.operationTime')" width="180">
        <template #default="{ row }">
          <span>{{ formatTime(row.operationTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="View" @click="handleView(row as ShutdownTaskVo)">{{ t('common.view') }}</el-button>
          <el-button size="small" :icon="View" @click="handleViewResults(row as ShutdownTaskVo)">{{ t('deviceOps.results') }}</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row as ShutdownTaskVo)">{{ t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pagination"
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadTasks"
      @current-change="loadTasks"
    />

    <!-- Add dialog -->
    <el-dialog v-model="dialogVisible" :title="t('deviceOps.addShutdownTask')" width="640px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="140px">
        <el-form-item :label="t('deviceOps.taskName')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="t('deviceOps.executeMode')" prop="executeMode">
          <el-select v-model="form.executeMode" style="width: 100%">
            <el-option :value="1" :label="t('deviceOps.modeImmediate')" />
            <el-option :value="2" :label="t('deviceOps.modeAwaiting')" />
            <el-option :value="3" :label="t('deviceOps.modeScheduled')" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.executeMode === 3" :label="t('deviceOps.triggerTime')" prop="triggerTime">
          <el-date-picker v-model="form.triggerTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('deviceOps.elementIds')" prop="elementIdsText">
          <el-input v-model="elementIdsText" type="textarea" :rows="3" placeholder="1,2,3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- View dialog -->
    <el-dialog v-model="viewDialogVisible" :title="t('deviceOps.viewShutdownTask')" width="800px">
      <el-descriptions v-if="viewData" :column="2" border>
        <el-descriptions-item :label="t('deviceOps.taskName')">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item :label="'ID'">{{ viewData.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('deviceOps.operator')">{{ viewData.operationUser }}</el-descriptions-item>
        <el-descriptions-item :label="t('deviceOps.operationTime')">{{ formatTime(viewData.operationTime) }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">{{ getStatusText(viewData.status) }}</el-descriptions-item>
        <el-descriptions-item :label="t('deviceOps.executeMode')">{{ getExecuteModeText(viewData.executeMode) }}</el-descriptions-item>
        <el-descriptions-item :label="t('deviceOps.triggerTime')">{{ formatTime(viewData.triggerTime) }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="viewData?.devices || []" border stripe style="margin-top: 12px">
        <el-table-column prop="elementId" :label="t('deviceOps.elementId')" width="120" />
        <el-table-column prop="deviceName" :label="t('deviceOps.deviceName')" min-width="160" />
        <el-table-column prop="serialNumber" :label="t('deviceOps.serialNumber')" min-width="180" />
      </el-table>
    </el-dialog>

    <!-- Results dialog -->
    <el-dialog v-model="resultsDialogVisible" :title="t('deviceOps.resultsTitle')" width="900px">
      <el-table :data="resultList" v-loading="resultLoading" border stripe max-height="520">
        <el-table-column prop="serialNumber" :label="t('deviceOps.serialNumber')" min-width="180" />
        <el-table-column prop="deviceName" :label="t('deviceOps.deviceName')" min-width="160" />
        <el-table-column :label="t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" :label="t('deviceOps.executionTime')" width="180">
          <template #default="{ row }">
            <span>{{ formatTime(row.time) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        v-model:current-page="resultQuery.page"
        v-model:page-size="resultQuery.pageSize"
        :total="resultTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadResults"
        @current-change="loadResults"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh, Delete, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  listShutdownTasks,
  addShutdownTask,
  deleteShutdownTask,
  viewShutdownTask,
  listShutdownResults,
} from '@/api/device-ops';
import type { ShutdownTaskVo, ShutdownResultVo, ViewShutdownTaskVo, AddShutdownTaskRequest } from '@/types/device-ops';

const { t } = useI18n();

const loading = ref(false);
const submitting = ref(false);
const taskList = ref<ShutdownTaskVo[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 20,
});

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const elementIdsText = ref('');
const form = reactive<AddShutdownTaskRequest>({
  name: '',
  executeMode: 1,
  triggerTime: '',
  elementIds: [],
});
const formRules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  executeMode: [{ required: true, message: t('common.required'), trigger: 'change' }],
}));

// View
const viewDialogVisible = ref(false);
const viewData = ref<ViewShutdownTaskVo | null>(null);

// Results
const resultsDialogVisible = ref(false);
const resultLoading = ref(false);
const resultList = ref<ShutdownResultVo[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({ page: 1, pageSize: 20 });
const currentTaskId = ref<number | undefined>(undefined);

function getStatusTagType(status: number): 'info' | 'danger' | 'warning' | 'primary' | 'success' | undefined {
  switch (status) {
    case 1:
      return 'info';
    case 2:
      return 'warning';
    case 3:
      return 'success';
    case 4:
      return 'danger';
    default:
      return 'info';
  }
}

function getStatusText(status: number): string {
  switch (status) {
    case 1:
      return t('deviceOps.statusWaiting');
    case 2:
      return t('deviceOps.statusExecuting');
    case 3:
      return t('deviceOps.statusExecuted');
    case 4:
      return t('deviceOps.statusCancelled');
    default:
      return '-';
  }
}

function getExecuteModeText(mode: number): string {
  switch (mode) {
    case 1:
      return t('deviceOps.modeImmediate');
    case 2:
      return t('deviceOps.modeAwaiting');
    case 3:
      return t('deviceOps.modeScheduled');
    default:
      return '-';
  }
}

function formatTime(value?: string): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function loadTasks() {
  loading.value = true;
  try {
    const page = await listShutdownTasks({ ...query });
    taskList.value = page.list || [];
    total.value = page.total || 0;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  resetForm();
  dialogVisible.value = true;
}

function resetForm() {
  form.name = '';
  form.executeMode = 1;
  form.triggerTime = '';
  form.elementIds = [];
  elementIdsText.value = '';
  formRef.value?.clearValidate();
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload: AddShutdownTaskRequest = {
        name: form.name,
        executeMode: form.executeMode,
        triggerTime: form.triggerTime || '',
        elementIds: elementIdsText.value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => Number(s))
          .filter((n) => !Number.isNaN(n)),
      };
      await addShutdownTask(payload);
      ElMessage.success(t('common.addSuccess'));
      dialogVisible.value = false;
      await loadTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      ElMessage.error(msg);
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: ShutdownTaskVo) {
  try {
    await ElMessageBox.confirm(t('deviceOps.deleteConfirm'), t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await deleteShutdownTask(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    await loadTasks();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function handleView(row: ShutdownTaskVo) {
  try {
    viewData.value = await viewShutdownTask(row.id);
    viewDialogVisible.value = true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function handleViewResults(row: ShutdownTaskVo) {
  currentTaskId.value = row.id;
  resultsDialogVisible.value = true;
  resultQuery.page = 1;
  await loadResults();
}

async function loadResults() {
  if (!currentTaskId.value) return;
  resultLoading.value = true;
  try {
    const page = await listShutdownResults(currentTaskId.value, {
      page: resultQuery.page,
      pageSize: resultQuery.pageSize,
    });
    resultList.value = page.list || [];
    resultTotal.value = page.total || 0;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    resultLoading.value = false;
  }
}

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>

<template>
  <div class="monitor-task-page">
    <el-tabs v-model="activeTab" class="page-tabs">
      <el-tab-pane :label="t('monitor.taskManagement')" name="tasks">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('common.add') }}</el-button>
          <el-button :icon="Refresh" @click="loadTasks">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="taskList" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="task_name" :label="t('monitor.taskName')" min-width="160" />
          <el-table-column prop="execution_scope" :label="t('monitor.executionScope')" width="120">
            <template #default="{ row }">
              <span>{{ getScopeText(row.execution_scope) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="scope_data" :label="t('monitor.scopeData')" min-width="200" show-overflow-tooltip />
          <el-table-column :label="t('monitor.enable')" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enable" @change="handleToggleEnable(row as MonitorTask)" />
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="handleEdit(row as MonitorTask)">{{ t('common.edit') }}</el-button>
              <el-button size="small" type="primary" :icon="Setting" @click="handleConfigElements(row as MonitorTask)">{{ t('monitor.elements') }}</el-button>
              <el-button size="small" type="warning" :icon="Operation" @click="handleConfigParameters(row as MonitorTask)">{{ t('monitor.parameters') }}</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row as MonitorTask)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane :label="t('monitor.dataQuery')" name="data">
        <el-form :inline="true" :model="dataForm" class="query-form">
          <el-form-item :label="t('monitor.elementId')">
            <DeviceSelector v-model="dataForm.elementId" placeholder="请选择设备" />
          </el-form-item>
          <el-form-item :label="t('monitor.parameterId')">
            <el-input v-model="dataForm.parameterId" placeholder="e.g. InternetGatewayDevice.DeviceInfo.X_..." clearable style="width: 360px" />
          </el-form-item>
          <el-form-item :label="t('monitor.startTime')">
            <el-date-picker v-model="dataForm.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" />
          </el-form-item>
          <el-form-item :label="t('monitor.endTime')">
            <el-date-picker v-model="dataForm.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="loadMonitorData">{{ t('common.query') }}</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="dataList" v-loading="dataLoading" border stripe max-height="520">
          <el-table-column prop="id" label="ID" width="100" />
          <el-table-column prop="element_id" :label="t('monitor.elementId')" width="120" />
          <el-table-column prop="parameter_id" :label="t('monitor.parameterId')" min-width="280" show-overflow-tooltip />
          <el-table-column prop="sample_time" :label="t('monitor.sampleTime')" width="200">
            <template #default="{ row }">
              <span>{{ formatTime(row.sample_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="value" :label="t('monitor.value')" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane :label="t('monitor.statistics')" name="statistics">
        <el-form :inline="true" :model="statForm" class="query-form">
          <el-form-item :label="t('monitor.parameterId')">
            <el-input v-model="statForm.parameterId" placeholder="parameter id" clearable style="width: 360px" />
          </el-form-item>
          <el-form-item :label="t('monitor.elementIds')">
            <el-input v-model="statForm.elementIds" placeholder="1,2,3" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item :label="t('monitor.startTime')">
            <el-date-picker v-model="statForm.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" />
          </el-form-item>
          <el-form-item :label="t('monitor.endTime')">
            <el-date-picker v-model="statForm.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="loadStatistics">{{ t('common.query') }}</el-button>
          </el-form-item>
        </el-form>
        <el-descriptions v-if="statistics" :column="4" border class="stat-desc">
          <el-descriptions-item :label="t('monitor.parameterId')">{{ statistics.parameter_id }}</el-descriptions-item>
          <el-descriptions-item :label="t('monitor.count')">{{ statistics.count }}</el-descriptions-item>
          <el-descriptions-item :label="t('monitor.avg')">{{ statistics.avg.toFixed(4) }}</el-descriptions-item>
          <el-descriptions-item :label="t('monitor.min')">{{ statistics.min.toFixed(4) }}</el-descriptions-item>
          <el-descriptions-item :label="t('monitor.max')">{{ statistics.max.toFixed(4) }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="statistics?.points || []" v-loading="statLoading" border stripe max-height="520">
          <el-table-column prop="element_id" :label="t('monitor.elementId')" width="120" />
          <el-table-column prop="sample_time" :label="t('monitor.sampleTime')" width="220">
            <template #default="{ row }">
              <span>{{ formatTime(row.sample_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="value" :label="t('monitor.value')" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Task dialog -->
    <el-dialog v-model="taskDialogVisible" :title="dialogTitle" width="560px" @closed="resetTaskForm">
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="120px">
        <el-form-item :label="t('monitor.taskName')" prop="task_name">
          <el-input v-model="taskForm.task_name" />
        </el-form-item>
        <el-form-item :label="t('monitor.executionScope')" prop="execution_scope">
          <el-select v-model="taskForm.execution_scope" placeholder="" style="width: 100%">
            <el-option :value="1" :label="t('monitor.scopeDevice')" />
            <el-option :value="2" :label="t('monitor.scopeGroup')" />
            <el-option :value="3" :label="t('monitor.scopeAll')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('monitor.scopeData')" prop="scope_data">
          <el-input v-model="taskForm.scope_data" type="textarea" :rows="3" :placeholder="t('monitor.scopeDataPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('monitor.enable')">
          <el-switch v-model="taskForm.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTaskForm">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Elements dialog -->
    <el-dialog v-model="elementsDialogVisible" :title="t('monitor.elementsConfig')" width="560px">
      <el-form label-width="120px">
        <el-form-item :label="t('monitor.elementIds')">
          <el-input v-model="elementsText" type="textarea" :rows="5" placeholder="1,2,3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="elementsDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitElements">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Parameters dialog -->
    <el-dialog v-model="parametersDialogVisible" :title="t('monitor.parametersConfig')" width="640px">
      <el-form label-width="120px">
        <el-form-item :label="t('monitor.parameterIds')">
          <el-input v-model="parametersText" type="textarea" :rows="8" placeholder="InternetGatewayDevice.X_...,InternetGatewayDevice.Y_..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parametersDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitParameters">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh, Edit, Delete, Search, Setting, Operation } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  listMonitorTasks,
  createMonitorTask,
  updateMonitorTask,
  deleteMonitorTask,
  getMonitorData,
  getMonitorStatistics,
  getMonitorElements,
  saveMonitorElements,
  getMonitorParameters,
  saveMonitorParameters,
} from '@/api/monitor';
import type { MonitorTask, MonitorData, MonitorStatistics } from '@/types/monitor';
import DeviceSelector from '@/components/DeviceSelector.vue';

const { t } = useI18n();

const activeTab = ref('tasks');
const loading = ref(false);
const submitting = ref(false);
const taskList = ref<MonitorTask[]>([]);

const taskDialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const taskFormRef = ref<FormInstance>();
const taskForm = reactive<MonitorTask>({
  task_name: '',
  execution_scope: 3,
  scope_data: '',
  enable: true,
});
const taskRules = computed<FormRules>(() => ({
  task_name: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  execution_scope: [{ required: true, message: t('common.required'), trigger: 'change' }],
}));
const dialogTitle = computed(() => (dialogMode.value === 'add' ? t('monitor.addTask') : t('monitor.editTask')));

// Data query
const dataLoading = ref(false);
const dataList = ref<MonitorData[]>([]);
const dataForm = reactive({
  elementId: 0,
  parameterId: '',
  startTime: '',
  endTime: '',
});

// Statistics
const statLoading = ref(false);
const statistics = ref<MonitorStatistics | null>(null);
const statForm = reactive({
  parameterId: '',
  elementIds: '',
  startTime: '',
  endTime: '',
});

// Elements / parameters dialog
const elementsDialogVisible = ref(false);
const parametersDialogVisible = ref(false);
const elementsText = ref('');
const parametersText = ref('');
const currentTaskId = ref<number | undefined>(undefined);

function getScopeText(scope?: number): string {
  switch (scope) {
    case 1:
      return t('monitor.scopeDevice');
    case 2:
      return t('monitor.scopeGroup');
    case 3:
      return t('monitor.scopeAll');
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
    const list = await listMonitorTasks();
    taskList.value = (list as MonitorTask[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  dialogMode.value = 'add';
  resetTaskForm();
  taskDialogVisible.value = true;
}

function handleEdit(row: MonitorTask) {
  dialogMode.value = 'edit';
  Object.assign(taskForm, row);
  taskDialogVisible.value = true;
}

function resetTaskForm() {
  taskForm.id = undefined;
  taskForm.task_name = '';
  taskForm.execution_scope = 3;
  taskForm.scope_data = '';
  taskForm.enable = true;
  taskForm.license_id = undefined;
  taskFormRef.value?.clearValidate();
}

async function submitTaskForm() {
  if (!taskFormRef.value) return;
  await taskFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (dialogMode.value === 'add') {
        await createMonitorTask({ ...taskForm });
        ElMessage.success(t('common.addSuccess'));
      } else {
        await updateMonitorTask(taskForm.id as number, { ...taskForm });
        ElMessage.success(t('common.editSuccess'));
      }
      taskDialogVisible.value = false;
      await loadTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      ElMessage.error(msg);
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: MonitorTask) {
  try {
    await ElMessageBox.confirm(t('monitor.deleteConfirm'), t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await deleteMonitorTask(row.id as number);
    ElMessage.success(t('common.deleteSuccess'));
    await loadTasks();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function handleToggleEnable(row: MonitorTask) {
  try {
    await updateMonitorTask(row.id as number, { ...row });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
    await loadTasks();
  }
}

async function handleConfigElements(row: MonitorTask) {
  currentTaskId.value = row.id;
  elementsDialogVisible.value = true;
  try {
    const list = await getMonitorElements(row.id as number);
    const arr = (list as { element_id?: number }[]) || [];
    elementsText.value = arr.map((x) => x.element_id).filter((x): x is number => typeof x === 'number').join(',');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function submitElements() {
  if (!currentTaskId.value) return;
  const ids = elementsText.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  submitting.value = true;
  try {
    await saveMonitorElements(currentTaskId.value, { element_ids: ids });
    ElMessage.success(t('common.editSuccess'));
    elementsDialogVisible.value = false;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function handleConfigParameters(row: MonitorTask) {
  currentTaskId.value = row.id;
  parametersDialogVisible.value = true;
  try {
    const list = await getMonitorParameters(row.id as number);
    const arr = (list as { parameter_id?: string }[]) || [];
    parametersText.value = arr.map((x) => x.parameter_id).filter((x): x is string => !!x).join(',');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function submitParameters() {
  if (!currentTaskId.value) return;
  const ids = parametersText.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  submitting.value = true;
  try {
    await saveMonitorParameters(currentTaskId.value, { parameter_ids: ids });
    ElMessage.success(t('common.editSuccess'));
    parametersDialogVisible.value = false;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function loadMonitorData() {
  if (!dataForm.parameterId || !dataForm.startTime || !dataForm.endTime) {
    ElMessage.warning(t('monitor.queryRequired'));
    return;
  }
  dataLoading.value = true;
  try {
    const list = await getMonitorData(dataForm.elementId, dataForm.parameterId, dataForm.startTime, dataForm.endTime);
    dataList.value = (list as MonitorData[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    dataLoading.value = false;
  }
}

async function loadStatistics() {
  if (!statForm.parameterId || !statForm.startTime || !statForm.endTime) {
    ElMessage.warning(t('monitor.queryRequired'));
    return;
  }
  const ids = statForm.elementIds
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  statLoading.value = true;
  try {
    const data = await getMonitorStatistics(statForm.parameterId, ids, statForm.startTime, statForm.endTime);
    statistics.value = (data as MonitorStatistics) || null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    statLoading.value = false;
  }
}

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.monitor-task-page {
  padding: 16px;
}
.page-tabs {
  margin-bottom: 16px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.query-form {
  margin-bottom: 12px;
}
.stat-desc {
  margin-bottom: 16px;
}
</style>

<template>
  <div class="cacert-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- CA 文件 -->
      <el-tab-pane :label="t('cacert.caFiles')" name="files">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleUpload">{{ t('common.upload') }}</el-button>
          <el-button :icon="Refresh" @click="loadCaFiles">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="caFileList" v-loading="fileLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="file_name" :label="t('cacert.fileName')" min-width="200" />
          <el-table-column prop="description" :label="t('cacert.description')" min-width="200" />
          <el-table-column prop="create_by" :label="t('cacert.createBy')" width="120" />
          <el-table-column prop="create_time" :label="t('cacert.createTime')" width="180">
            <template #default="{ row }">
              <span>{{ formatTime(row.create_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteFile(row as CaFile)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          v-model:current-page="fileQuery.page"
          v-model:page-size="fileQuery.pageSize"
          :total="fileTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCaFiles"
          @current-change="loadCaFiles"
        />
      </el-tab-pane>

      <!-- CA 任务 -->
      <el-tab-pane :label="t('cacert.caTasks')" name="tasks">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAddTask">{{ t('common.add') }}</el-button>
          <el-button :icon="Refresh" @click="loadCaTasks">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="taskList" v-loading="taskLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="task_name" :label="t('cacert.taskName')" min-width="180" />
          <el-table-column prop="ca_file_id" :label="t('cacert.caFileId')" width="120" />
          <el-table-column prop="status" :label="t('common.status')" width="140" />
          <el-table-column prop="create_by" :label="t('cacert.createBy')" width="120" />
          <el-table-column prop="create_time" :label="t('cacert.createTime')" width="180">
            <template #default="{ row }">
              <span>{{ formatTime(row.create_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="View" @click="handleViewTask(row as CaTask)">{{ t('common.detail') }}</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteTask(row as CaTask)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          v-model:current-page="taskQuery.page"
          v-model:page-size="taskQuery.pageSize"
          :total="taskTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCaTasks"
          @current-change="loadCaTasks"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" :title="t('cacert.uploadCaFile')" width="560px">
      <el-form label-width="120px">
        <el-form-item :label="t('cacert.description')">
          <el-input v-model="uploadDescription" />
        </el-form-item>
        <el-form-item :label="t('common.upload')">
          <el-upload
            v-model:file-list="uploadFileList"
            :auto-upload="false"
            :multiple="true"
            :limit="5"
          >
            <el-button type="primary">{{ t('cacert.selectFiles') }}</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增任务对话框 -->
    <el-dialog v-model="taskDialogVisible" :title="t('cacert.addCaTask')" width="640px" @closed="resetTaskForm">
      <el-form ref="taskFormRef" :model="taskForm" label-width="120px">
        <el-form-item :label="t('cacert.taskName')" required>
          <el-input v-model="taskForm.taskName" />
        </el-form-item>
        <el-form-item :label="t('cacert.caFile')" required>
          <el-select v-model="taskForm.caFileId" style="width: 100%">
            <el-option
              v-for="f in allCaFiles"
              :key="f.id"
              :value="f.id"
              :label="f.file_name || `#${f.id}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('cacert.scope')">
          <el-select v-model="taskForm.scope" style="width: 100%">
            <el-option value="device" :label="t('cacert.scopeDevice')" />
            <el-option value="device_group" :label="t('cacert.scopeGroup')" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="taskForm.scope === 'device'" :label="t('cacert.deviceIds')">
          <el-input v-model="deviceIdsText" type="textarea" :rows="3" placeholder="1,2,3" />
        </el-form-item>
        <el-form-item v-else :label="t('cacert.groupIds')">
          <el-input v-model="groupIdsText" type="textarea" :rows="3" placeholder="g1,g2,g3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="taskSubmitting" @click="submitTask">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="t('cacert.taskDetail')" width="900px">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('cacert.taskName')">{{ detailData?.task_name || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">{{ detailData?.status || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('cacert.createBy')">{{ detailData?.create_by || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('cacert.createTime')">{{ formatTime(detailData?.create_time) }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="deviceLogList" v-loading="deviceLogLoading" border stripe style="margin-top: 12px">
        <el-table-column prop="device_id" :label="t('cacert.deviceId')" width="140" />
        <el-table-column :label="t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getLogTagType(row.result)">{{ getLogResultText(row.result) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="info" :label="t('cacert.info')" min-width="240" show-overflow-tooltip />
      </el-table>
      <el-pagination
        class="pagination"
        v-model:current-page="deviceLogQuery.page"
        v-model:page-size="deviceLogQuery.pageSize"
        :total="deviceLogTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadDeviceLogs"
        @current-change="loadDeviceLogs"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type UploadUserFile, type FormInstance } from 'element-plus';
import { Plus, Refresh, Delete, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  listCaFiles,
  deleteCaFile,
  queryCaList,
  uploadCaFile,
  saveCaTask,
  listCaTasks,
  getCaTaskDetail,
  deleteCaTask,
  queryDeviceSendCaLog,
} from '@/api/cacert';
import type {
  CaFile,
  CaTask,
  DeviceSendCaLog,
  CaTaskSaveRequest,
} from '@/types/cacert';

const { t } = useI18n();
const activeTab = ref<'files' | 'tasks'>('files');

// Files
const fileLoading = ref(false);
const caFileList = ref<CaFile[]>([]);
const fileTotal = ref(0);
const fileQuery = reactive({ page: 1, pageSize: 10 });

// Tasks
const taskLoading = ref(false);
const taskList = ref<CaTask[]>([]);
const taskTotal = ref(0);
const taskQuery = reactive({ page: 1, pageSize: 10 });

// All CA files (for select)
const allCaFiles = ref<CaFile[]>([]);

// Upload
const uploadDialogVisible = ref(false);
const uploading = ref(false);
const uploadDescription = ref('');
const uploadFileList = ref<UploadUserFile[]>([]);

// Task form
const taskDialogVisible = ref(false);
const taskFormRef = ref<FormInstance>();
const taskSubmitting = ref(false);
const deviceIdsText = ref('');
const groupIdsText = ref('');
const taskForm = reactive<CaTaskSaveRequest>({
  taskName: '',
  caFileId: 0,
  scope: 'device',
  deviceIds: [],
  groupIds: [],
});

// Detail
const detailDialogVisible = ref(false);
const detailData = ref<CaTask | null>(null);
const deviceLogLoading = ref(false);
const deviceLogList = ref<DeviceSendCaLog[]>([]);
const deviceLogTotal = ref(0);
const deviceLogQuery = reactive({ taskId: 0, page: 1, pageSize: 20 });
const currentTaskId = ref<number | undefined>(undefined);

function formatTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getLogTagType(result?: number | null): 'info' | 'danger' | 'warning' | 'primary' | 'success' | undefined {
  if (result === 1) return 'success';
  if (result === 2) return 'danger';
  return 'info';
}

function getLogResultText(result?: number | null): string {
  if (result === 1) return t('cacert.resultSuccess');
  if (result === 2) return t('cacert.resultFailed');
  return '-';
}

async function loadCaFiles() {
  fileLoading.value = true;
  try {
    const data = await listCaFiles({ ...fileQuery });
    const p = data as { list: CaFile[]; total: number };
    caFileList.value = p.list || [];
    fileTotal.value = p.total || 0;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    fileLoading.value = false;
  }
}

async function loadCaTasks() {
  taskLoading.value = true;
  try {
    const data = await listCaTasks({ ...taskQuery });
    const p = data as { list: CaTask[]; total: number };
    taskList.value = p.list || [];
    taskTotal.value = p.total || 0;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    taskLoading.value = false;
  }
}

async function loadAllCaFiles() {
  try {
    const data = await queryCaList();
    allCaFiles.value = (data as CaFile[]) || [];
  } catch (e: unknown) {
    // silent
  }
}

async function handleDeleteFile(row: CaFile) {
  try {
    await ElMessageBox.confirm(t('cacert.deleteFileConfirm'), t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await deleteCaFile({ id: row.id });
    ElMessage.success(t('common.deleteSuccess'));
    await loadCaFiles();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

function handleUpload() {
  uploadDescription.value = '';
  uploadFileList.value = [];
  uploadDialogVisible.value = true;
}

async function submitUpload() {
  const files: File[] = [];
  for (const f of uploadFileList.value) {
    if (f.raw && 'name' in f.raw) {
      files.push(f.raw);
    }
  }
  if (files.length === 0) {
    ElMessage.warning(t('cacert.selectFiles'));
    return;
  }
  uploading.value = true;
  try {
    await uploadCaFile(files, uploadDescription.value);
    ElMessage.success(t('common.operateSuccess'));
    uploadDialogVisible.value = false;
    await loadCaFiles();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    uploading.value = false;
  }
}

function handleAddTask() {
  resetTaskForm();
  loadAllCaFiles();
  taskDialogVisible.value = true;
}

function resetTaskForm() {
  taskForm.taskName = '';
  taskForm.caFileId = 0;
  taskForm.scope = 'device';
  taskForm.deviceIds = [];
  taskForm.groupIds = [];
  deviceIdsText.value = '';
  groupIdsText.value = '';
  taskFormRef.value?.clearValidate();
}

async function submitTask() {
  if (!taskForm.taskName || !taskForm.caFileId) {
    ElMessage.warning(t('common.required'));
    return;
  }
  taskSubmitting.value = true;
  try {
    const payload: CaTaskSaveRequest = {
      taskName: taskForm.taskName,
      caFileId: taskForm.caFileId,
      scope: taskForm.scope,
      deviceIds: [],
      groupIds: [],
    };
    if (taskForm.scope === 'device') {
      payload.deviceIds = deviceIdsText.value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => Number(s))
        .filter((n) => !Number.isNaN(n));
    } else {
      payload.groupIds = groupIdsText.value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    await saveCaTask(payload);
    ElMessage.success(t('common.addSuccess'));
    taskDialogVisible.value = false;
    await loadCaTasks();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    taskSubmitting.value = false;
  }
}

async function handleViewTask(row: CaTask) {
  currentTaskId.value = row.id;
  detailData.value = row;
  detailDialogVisible.value = true;
  deviceLogQuery.taskId = row.id;
  deviceLogQuery.page = 1;
  await loadDeviceLogs();
}

async function loadDeviceLogs() {
  if (!currentTaskId.value) return;
  deviceLogLoading.value = true;
  try {
    const data = await queryDeviceSendCaLog({ ...deviceLogQuery });
    const p = data as { list: DeviceSendCaLog[]; total: number };
    deviceLogList.value = p.list || [];
    deviceLogTotal.value = p.total || 0;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    deviceLogLoading.value = false;
  }
}

async function handleDeleteTask(row: CaTask) {
  try {
    await ElMessageBox.confirm(t('cacert.deleteTaskConfirm'), t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await deleteCaTask({ id: row.id });
    ElMessage.success(t('common.deleteSuccess'));
    await loadCaTasks();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

onMounted(() => {
  loadCaFiles();
  loadCaTasks();
  loadAllCaFiles();
});
</script>

<style scoped>
.cacert-page {
  padding: 12px;
}
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

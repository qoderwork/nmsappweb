<script setup lang="ts">
/**
 * 诊断工具页面
 *
 * 功能：
 * - 诊断操作表单（选设备、选类型、输入参数）
 * - 诊断任务历史列表
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Promotion } from '@element-plus/icons-vue';

import {
  pingDiagnose,
  tracerouteDiagnose,
  downloadDeviceFile,
  uploadDeviceFile,
  getDiagnosticsTasks,
} from '@/api/diagnostics';
import type {
  DiagnosticsTask,
  DiagnosticsTaskType,
  DiagnosticsTaskStatus,
} from '@/types/diagnostics';

const { t } = useI18n();

// ============ 诊断操作表单 ============
const diagForm = reactive({
  elementId: '',
  taskType: 'ping' as DiagnosticsTaskType,
  target: '',
  count: 4,
  timeout: 5,
  maxHops: 30,
  filePath: '',
  remotePath: '',
});
const diagSubmitting = ref(false);

/** 诊断类型选项 */
const taskTypeOptions: { label: string; value: DiagnosticsTaskType }[] = [
  { label: 'Ping', value: 'ping' },
  { label: 'TraceRoute', value: 'traceroute' },
  { label: '设备文件下载', value: 'download' },
  { label: '设备文件上传', value: 'upload' },
];

/** 提交诊断任务 */
async function handleDiagnose() {
  if (!diagForm.elementId) {
    ElMessage.warning('请输入设备 ID');
    return;
  }
  diagSubmitting.value = true;
  try {
    const elementId = Number(diagForm.elementId);
    switch (diagForm.taskType) {
      case 'ping':
        if (!diagForm.target) {
          ElMessage.warning('请输入目标地址');
          return;
        }
        await pingDiagnose({
          elementId,
          target: diagForm.target,
          count: diagForm.count,
          timeout: diagForm.timeout,
        });
        ElMessage.success('Ping 诊断任务已提交');
        break;
      case 'traceroute':
        if (!diagForm.target) {
          ElMessage.warning('请输入目标地址');
          return;
        }
        await tracerouteDiagnose({
          elementId,
          target: diagForm.target,
          maxHops: diagForm.maxHops,
          timeout: diagForm.timeout,
        });
        ElMessage.success('TraceRoute 诊断任务已提交');
        break;
      case 'download':
        if (!diagForm.filePath) {
          ElMessage.warning('请输入设备文件路径');
          return;
        }
        await downloadDeviceFile({ elementId, filePath: diagForm.filePath });
        ElMessage.success('文件下载任务已提交');
        break;
      case 'upload':
        if (!diagForm.remotePath) {
          ElMessage.warning('请输入上传目标路径');
          return;
        }
        await uploadDeviceFile({ elementId, remotePath: diagForm.remotePath });
        ElMessage.success('文件上传任务已提交');
        break;
    }
    loadTaskList();
  } catch (e) {
    console.error('[Diagnostics] submit failed:', e);
  } finally {
    diagSubmitting.value = false;
  }
}

// ============ 诊断任务历史列表 ============
const taskLoading = ref(false);
const taskData = ref<DiagnosticsTask[]>([]);
const taskTotal = ref(0);

interface TaskQueryParams {
  page: number;
  pageSize: number;
  elementId: string;
  taskType: string;
  status: string;
}
const taskQueryParams = reactive<TaskQueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
  taskType: '',
  status: '',
});

async function loadTaskList() {
  taskLoading.value = true;
  try {
    const result = await getDiagnosticsTasks({
      page: taskQueryParams.page,
      pageSize: taskQueryParams.pageSize,
      elementId: taskQueryParams.elementId ? Number(taskQueryParams.elementId) : undefined,
      taskType: (taskQueryParams.taskType || undefined) as DiagnosticsTaskType | undefined,
      status: (taskQueryParams.status || undefined) as DiagnosticsTaskStatus | undefined,
    });
    taskData.value = result.list;
    taskTotal.value = result.total;
  } catch (e) {
    console.error('[Diagnostics] load tasks failed:', e);
  } finally {
    taskLoading.value = false;
  }
}

function handleTaskSearch() {
  taskQueryParams.page = 1;
  loadTaskList();
}

function handleTaskReset() {
  taskQueryParams.elementId = '';
  taskQueryParams.taskType = '';
  taskQueryParams.status = '';
  taskQueryParams.page = 1;
  loadTaskList();
}

function handleTaskPageChange(page: number) {
  taskQueryParams.page = page;
  loadTaskList();
}

function handleTaskSizeChange(size: number) {
  taskQueryParams.pageSize = size;
  taskQueryParams.page = 1;
  loadTaskList();
}

/** 任务状态标签类型 */
function getStatusTagType(status?: DiagnosticsTaskStatus | null): 'success' | 'danger' | 'warning' | 'info' {
  switch (status) {
    case 'success': return 'success';
    case 'failed': return 'danger';
    case 'running': return 'warning';
    case 'pending': return 'info';
    case 'timeout': return 'danger';
    default: return 'info';
  }
}

/** 任务状态文本 */
function getStatusText(status?: DiagnosticsTaskStatus | null): string {
  switch (status) {
    case 'success': return '成功';
    case 'failed': return '失败';
    case 'running': return '运行中';
    case 'pending': return '等待中';
    case 'timeout': return '超时';
    default: return '-';
  }
}

/** 任务类型文本 */
function getTaskTypeText(type?: DiagnosticsTaskType | null): string {
  switch (type) {
    case 'ping': return 'Ping';
    case 'traceroute': return 'TraceRoute';
    case 'download': return '文件下载';
    case 'upload': return '文件上传';
    default: return '-';
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ 生命周期 ============
onMounted(() => {
  loadTaskList();
});
</script>

<template>
  <div class="diagnostics-page">
    <!-- 诊断操作表单 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <template #header>
        <span>诊断操作</span>
      </template>
      <el-form :model="diagForm" label-width="100px" style="max-width: 600px">
        <el-form-item label="设备 ID" prop="elementId">
          <el-input v-model="diagForm.elementId" placeholder="请输入设备 ID" />
        </el-form-item>
        <el-form-item label="诊断类型" prop="taskType">
          <el-select v-model="diagForm.taskType" placeholder="请选择诊断类型" style="width: 100%">
            <el-option
              v-for="opt in taskTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <!-- Ping / TraceRoute 参数 -->
        <template v-if="diagForm.taskType === 'ping' || diagForm.taskType === 'traceroute'">
          <el-form-item label="目标地址">
            <el-input v-model="diagForm.target" placeholder="请输入目标 IP 或域名" />
          </el-form-item>
          <el-form-item v-if="diagForm.taskType === 'ping'" label="次数">
            <el-input-number v-model="diagForm.count" :min="1" :max="100" />
          </el-form-item>
          <el-form-item v-if="diagForm.taskType === 'traceroute'" label="最大跳数">
            <el-input-number v-model="diagForm.maxHops" :min="1" :max="64" />
          </el-form-item>
          <el-form-item label="超时(秒)">
            <el-input-number v-model="diagForm.timeout" :min="1" :max="60" />
          </el-form-item>
        </template>
        <!-- 文件下载参数 -->
        <template v-if="diagForm.taskType === 'download'">
          <el-form-item label="设备文件路径">
            <el-input v-model="diagForm.filePath" placeholder="请输入设备上的文件路径" />
          </el-form-item>
        </template>
        <!-- 文件上传参数 -->
        <template v-if="diagForm.taskType === 'upload'">
          <el-form-item label="上传目标路径">
            <el-input v-model="diagForm.remotePath" placeholder="请输入设备上的目标路径" />
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" :icon="Promotion" :loading="diagSubmitting" @click="handleDiagnose">
            执行诊断
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 诊断任务历史列表 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <template #header>
        <span>诊断任务历史</span>
      </template>
      <!-- 搜索栏 -->
      <el-form :inline="true" @submit.prevent="handleTaskSearch">
        <el-form-item label="设备 ID">
          <el-input
            v-model="taskQueryParams.elementId"
            placeholder="设备 ID"
            clearable
            style="width: 120px"
            @keyup.enter="handleTaskSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="taskQueryParams.taskType" placeholder="全部" clearable style="width: 130px">
            <el-option label="Ping" value="ping" />
            <el-option label="TraceRoute" value="traceroute" />
            <el-option label="文件下载" value="download" />
            <el-option label="文件上传" value="upload" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="taskQueryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="运行中" value="running" />
            <el-option label="等待中" value="pending" />
            <el-option label="超时" value="timeout" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleTaskSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleTaskReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="taskLoading" :data="taskData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="elementId" label="设备 ID" width="100" />
        <el-table-column prop="taskType" label="类型" width="110">
          <template #default="{ row }">
            {{ getTaskTypeText(row.taskType) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="command" label="命令" min-width="200" />
        <el-table-column prop="result" label="结果" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="taskQueryParams.page"
          v-model:page-size="taskQueryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="taskTotal"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleTaskSizeChange"
          @current-change="handleTaskPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.diagnostics-page {
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

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
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
  ElButton,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
  ElTag,
  ElUpload,
  ElProgress,
  ElRadioGroup,
  ElRadio,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';
import {
  Search,
  Refresh,
  Upload,
  Download,
  Delete,
  View,
  Plus,
} from '@element-plus/icons-vue';

import {
  initFileUpload,
  uploadFileChunk,
  checkFileChunk,
  assembleFile,
  uploadNormalFile,
  deleteNormalFile,
  listNormalFiles,
  getNormalFileDetail,
  downloadFileToDevice,
  listDownloadResults,
} from '@/api/normal-file';
import type {
  MNormalFile,
  MNormalFileDownloadLog,
} from '@/api/normal-file';

import { getDevices } from '@/api/device';
import type { Device } from '@/types/device';

/* ============ Tab State ============ */
const activeTab = ref('files');

/* ============ File List ============ */
const fileLoading = ref(false);
const fileList = ref<MNormalFile[]>([]);
const fileTotal = ref(0);
const fileQuery = reactive({
  fileName: '',
  page: 1,
  pageSize: 20,
});

async function loadFileList() {
  fileLoading.value = true;
  try {
    const result = await listNormalFiles({
      fileName: fileQuery.fileName || undefined,
      page: fileQuery.page,
      pageSize: fileQuery.pageSize,
    });
    fileList.value = result?.list || [];
    fileTotal.value = result?.total || 0;
  } catch (e) {
    console.error('[NormalFile] load file list failed:', e);
  } finally {
    fileLoading.value = false;
  }
}

function handleFilePageChange(page: number) {
  fileQuery.page = page;
  loadFileList();
}

function handleFileSizeChange(size: number) {
  fileQuery.pageSize = size;
  fileQuery.page = 1;
  loadFileList();
}

function handleSearchFile() {
  fileQuery.page = 1;
  loadFileList();
}

function getFileStatusText(status: number): string {
  const map: Record<number, string> = { 0: '上传中', 1: '已完成', 2: '失败' };
  return map[status] || '未知';
}

function getFileStatusType(status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'warning',
    1: 'success',
    2: 'danger',
  };
  return map[status];
}

async function handleDeleteFile(row: MNormalFile) {
  try {
    await ElMessageBox.confirm(`确定要删除文件 "${row.originalName || row.fileName}" 吗？`, '删除确认', { type: 'warning' });
    await deleteNormalFile({ fileId: row.fileId });
    ElMessage.success('文件已删除');
    loadFileList();
  } catch (e) {
    if (e !== 'cancel') console.error('[NormalFile] delete file failed:', e);
  }
}

/* ============ Upload Dialog ============ */
const uploadDialogVisible = ref(false);
const uploadMode = ref<'simple' | 'chunked'>('simple');
const uploadLoading = ref(false);
const uploadProgress = ref(0);
const uploadFileName = ref('');

// Simple upload
const simpleUploadFile = ref<File | null>(null);

// Chunked upload
const chunkedUploadFile = ref<File | null>(null);
const chunkSize = 5 * 1024 * 1024; // 5 MB per chunk
const chunkProgressList = ref<{ index: number; progress: number }[]>([]);
const chunkTotalProgress = ref(0);

function openUploadDialog() {
  uploadMode.value = 'simple';
  simpleUploadFile.value = null;
  chunkedUploadFile.value = null;
  uploadProgress.value = 0;
  chunkTotalProgress.value = 0;
  chunkProgressList.value = [];
  uploadFileName.value = '';
  uploadDialogVisible.value = true;
}

function handleSimpleFileChange(uploadFile: { raw?: File }) {
  if (uploadFile.raw) {
    simpleUploadFile.value = uploadFile.raw;
    uploadFileName.value = uploadFile.raw.name;
  }
}

function handleChunkedFileChange(uploadFile: { raw?: File }) {
  if (uploadFile.raw) {
    chunkedUploadFile.value = uploadFile.raw;
    uploadFileName.value = uploadFile.raw.name;
    chunkProgressList.value = [];
    chunkTotalProgress.value = 0;
  }
}

async function handleSimpleUpload() {
  if (!simpleUploadFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  uploadLoading.value = true;
  uploadProgress.value = 0;
  try {
    await uploadNormalFile(simpleUploadFile.value);
    uploadProgress.value = 100;
    ElMessage.success('文件上传成功');
    uploadDialogVisible.value = false;
    loadFileList();
  } catch (e) {
    console.error('[NormalFile] simple upload failed:', e);
  } finally {
    uploadLoading.value = false;
  }
}

async function handleChunkedUpload() {
  const file = chunkedUploadFile.value;
  if (!file) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  uploadLoading.value = true;
  chunkTotalProgress.value = 0;

  try {
    const chunkCount = Math.ceil(file.size / chunkSize);

    // 1. Init upload
    const initResult = await initFileUpload({
      fileName: file.name,
      fileSize: file.size,
      chunkCount,
    });
    const fileId = initResult.fileId;

    // 2. Upload chunks
    chunkProgressList.value = Array.from({ length: chunkCount }, (_, i) => ({
      index: i,
      progress: 0,
    }));

    for (let i = 0; i < chunkCount; i++) {
      // Check if chunk already uploaded
      try {
        const checkResult = await checkFileChunk({ fileId, chunkIndex: i });
        if (checkResult.uploaded) {
          chunkProgressList.value[i].progress = 100;
          updateChunkTotalProgress(chunkCount);
          continue;
        }
      } catch {
        // Ignore check failure, proceed with upload
      }

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await uploadFileChunk(chunk, fileId, i);
      chunkProgressList.value[i].progress = 100;
      updateChunkTotalProgress(chunkCount);
    }

    // 3. Assemble
    await assembleFile({ fileId });
    chunkTotalProgress.value = 100;
    ElMessage.success('分片上传完成');
    uploadDialogVisible.value = false;
    loadFileList();
  } catch (e) {
    console.error('[NormalFile] chunked upload failed:', e);
  } finally {
    uploadLoading.value = false;
  }
}

function updateChunkTotalProgress(chunkCount: number) {
  const completed = chunkProgressList.value.filter((c) => c.progress >= 100).length;
  chunkTotalProgress.value = Math.round((completed / chunkCount) * 100);
}

function handleUpload() {
  if (uploadMode.value === 'simple') {
    handleSimpleUpload();
  } else {
    handleChunkedUpload();
  }
}

/* ============ Download to Device Dialog ============ */
const downloadDialogVisible = ref(false);
const downloadTargetFile = ref<MNormalFile | null>(null);
const downloadSelectedDevices = ref<number[]>([]);
const downloadLoading = ref(false);
const allDevices = ref<Device[]>([]);

async function loadAllDevices() {
  try {
    const result = await getDevices({ page: 1, pageSize: 1000 });
    allDevices.value = result?.list || [];
  } catch (e) {
    console.error('[NormalFile] load all devices failed:', e);
  }
}

function openDownloadDialog(row: MNormalFile) {
  downloadTargetFile.value = row;
  downloadSelectedDevices.value = [];
  downloadDialogVisible.value = true;
}

async function handleDownloadToDevice() {
  if (!downloadTargetFile.value) return;
  if (downloadSelectedDevices.value.length === 0) {
    ElMessage.warning('请选择目标设备');
    return;
  }
  downloadLoading.value = true;
  try {
    await downloadFileToDevice({
      fileId: downloadTargetFile.value.fileId,
      elementIds: downloadSelectedDevices.value,
    });
    ElMessage.success('文件下发任务已创建');
    downloadDialogVisible.value = false;
  } catch (e) {
    console.error('[NormalFile] download to device failed:', e);
  } finally {
    downloadLoading.value = false;
  }
}

/* ============ Download Results ============ */
const resultLoading = ref(false);
const resultList = ref<MNormalFileDownloadLog[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({
  fileId: '',
  page: 1,
  pageSize: 20,
});

async function loadDownloadResults() {
  resultLoading.value = true;
  try {
    const result = await listDownloadResults({
      fileId: resultQuery.fileId || undefined,
      page: resultQuery.page,
      pageSize: resultQuery.pageSize,
    });
    resultList.value = result?.list || [];
    resultTotal.value = result?.total || 0;
  } catch (e) {
    console.error('[NormalFile] load download results failed:', e);
  } finally {
    resultLoading.value = false;
  }
}

function handleResultPageChange(page: number) {
  resultQuery.page = page;
  loadDownloadResults();
}

function handleResultSizeChange(size: number) {
  resultQuery.pageSize = size;
  resultQuery.page = 1;
  loadDownloadResults();
}

function handleViewDownloadResults(row: MNormalFile) {
  resultQuery.fileId = row.fileId;
  resultQuery.page = 1;
  activeTab.value = 'results';
  loadDownloadResults();
}

function clearResultFilter() {
  resultQuery.fileId = '';
  resultQuery.page = 1;
  loadDownloadResults();
}

function getDownloadStatusText(status: number): string {
  const map: Record<number, string> = { 0: '等待中', 1: '下发中', 2: '成功', 3: '失败' };
  return map[status] || '未知';
}

function getDownloadStatusType(status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
  };
  return map[status];
}

/* ============ Helpers ============ */
function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return '-';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ============ Lifecycle ============ */
onMounted(() => {
  loadFileList();
  loadDownloadResults();
  loadAllDevices();
});
</script>

<template>
  <div class="normalfile-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ========== 文件列表 Tab ========== -->
      <el-tab-pane label="文件列表" name="files">
        <div class="page-header">
          <el-input
            v-model="fileQuery.fileName"
            placeholder="搜索文件名"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearchFile"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearchFile" />
            </template>
          </el-input>
          <el-button :icon="Refresh" @click="loadFileList">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openUploadDialog">上传文件</el-button>
        </div>

        <el-table :data="fileList" :loading="fileLoading" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">
              {{ row.originalName || row.fileName }}
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getFileStatusType(row.status)" size="small">
                {{ getFileStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="chunkCount" label="分片数" width="90" align="center">
            <template #default="{ row }">
              {{ row.chunkCount || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="上传者" width="120" />
          <el-table-column prop="createTime" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                :icon="Download"
                @click="openDownloadDialog(row as MNormalFile)"
              >
                下发
              </el-button>
              <el-button
                size="small"
                :icon="View"
                @click="handleViewDownloadResults(row as MNormalFile)"
              >
                结果
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDeleteFile(row as MNormalFile)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="fileQuery.page"
            v-model:page-size="fileQuery.pageSize"
            :total="fileTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleFileSizeChange"
            @current-change="handleFilePageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== 下发结果 Tab ========== -->
      <el-tab-pane label="下发结果" name="results">
        <div class="page-header">
          <span v-if="resultQuery.fileId" class="result-file-label">
            文件ID：<strong>{{ resultQuery.fileId }}</strong>
          </span>
          <el-button v-if="resultQuery.fileId" size="small" @click="clearResultFilter">
            显示全部
          </el-button>
          <el-button :icon="Refresh" @click="loadDownloadResults">刷新</el-button>
        </div>

        <el-table :data="resultList" :loading="resultLoading" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="fileId" label="文件ID" width="200" show-overflow-tooltip />
          <el-table-column prop="elementId" label="Element ID" width="110" />
          <el-table-column prop="serialNumber" label="序列号" min-width="140" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDownloadStatusType(row.status)" size="small">
                {{ getDownloadStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="faultInfo" label="错误信息" min-width="200">
            <template #default="{ row }">
              {{ row.faultInfo || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="commandTrackId" label="命令跟踪ID" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.commandTrackId || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.updateTime) }}
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

    <!-- ========== 上传文件对话框 ========== -->
    <el-dialog title="上传文件" v-model="uploadDialogVisible" width="560px">
      <el-form label-width="100px">
        <el-form-item label="上传方式">
          <el-radio-group v-model="uploadMode">
            <el-radio value="simple">普通上传</el-radio>
            <el-radio value="chunked">分片上传</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Simple Upload -->
        <el-form-item v-if="uploadMode === 'simple'" label="选择文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleSimpleFileChange"
            drag
          >
            <div style="padding: 16px 0;">
              <el-icon style="font-size: 36px; color: var(--el-text-color-placeholder);"><Upload /></el-icon>
              <div style="margin-top: 8px; color: var(--el-text-color-secondary);">
                拖拽文件到此处，或点击选择文件
              </div>
            </div>
          </el-upload>
          <el-progress
            v-if="uploadProgress > 0 && uploadProgress < 100"
            :percentage="uploadProgress"
            style="margin-top: 12px;"
          />
        </el-form-item>

        <!-- Chunked Upload -->
        <el-form-item v-if="uploadMode === 'chunked'" label="选择文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleChunkedFileChange"
            drag
          >
            <div style="padding: 16px 0;">
              <el-icon style="font-size: 36px; color: var(--el-text-color-placeholder);"><Upload /></el-icon>
              <div style="margin-top: 8px; color: var(--el-text-color-secondary);">
                拖拽文件到此处，或点击选择文件（分片大小: 5MB）
              </div>
            </div>
          </el-upload>
          <el-progress
            v-if="chunkTotalProgress > 0"
            :percentage="chunkTotalProgress"
            :status="chunkTotalProgress >= 100 ? 'success' : undefined"
            style="margin-top: 12px;"
          />
          <div v-if="chunkProgressList.length > 0" style="margin-top: 8px;">
            <div
              v-for="chunk in chunkProgressList"
              :key="chunk.index"
              style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; font-size: 12px;"
            >
              <span style="min-width: 60px;">分片 {{ chunk.index + 1 }}</span>
              <el-progress
                :percentage="chunk.progress"
                :stroke-width="6"
                :show-text="false"
                style="flex: 1;"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <!-- ========== 下发到设备对话框 ========== -->
    <el-dialog title="下发文件到设备" v-model="downloadDialogVisible" width="560px">
      <div v-if="downloadTargetFile" style="margin-bottom: 16px;">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="文件名">{{ downloadTargetFile.originalName || downloadTargetFile.fileName }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ formatFileSize(downloadTargetFile.fileSize) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form label-width="100px">
        <el-form-item label="目标设备" required>
          <el-select
            v-model="downloadSelectedDevices"
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
        <el-button @click="downloadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="downloadLoading" @click="handleDownloadToDevice">下发</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.normalfile-management-page {
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

.result-file-label {
  font-size: 14px;
  line-height: 32px;
}
</style>

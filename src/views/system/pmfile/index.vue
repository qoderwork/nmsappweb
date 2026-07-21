<template>
  <div class="pmfile-container">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="searchSN"
          :placeholder="t('pmfile.searchDeviceSn')"
          style="width: 200px"
          clearable
          @keyup.enter="loadPMFiles"
        />
        <el-upload
          class="upload-demo"
          :action="uploadUrl"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :file-list="uploadFileList"
          :auto-upload="false"
          ref="uploadRef"
        >
          <el-button type="primary">{{ t('pmfile.uploadPMFile') }}</el-button>
        </el-upload>
      </div>
      <el-table :data="pmFiles" v-loading="loading" @selection-change="handleSelectionChange" border style="margin-top: 20px">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" :label="t('pmfile.id')" width="80" />
        <el-table-column prop="name" :label="t('pmfile.fileName')" min-width="200" />
        <el-table-column prop="size" :label="t('pmfile.sizeKB')" width="100">
          <template #default="{ row }">{{ ((row as PMFile).size / 1024).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" :label="t('pmfile.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="(row as PMFile).status === 'SUCCESS' ? 'success' : 'warning'">
              {{ (row as PMFile).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceSn" :label="t('pmfile.deviceSn')" width="150" />
        <el-table-column prop="createTime" :label="t('pmfile.createTime')" width="180" />
        <el-table-column :label="t('common.actions')" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDownload((row as PMFile).id)">
              {{ t('common.download') }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete((row as PMFile).id)">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        layout="total, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElUpload, type UploadUserFile } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { PMFile } from '@/types/pmfile';
import { listPMFiles, downloadPMFile, deletePMFile, uploadPMFile } from '@/api/pmfile';

const { t } = useI18n();

const loading = ref(false);
const pmFiles = ref<PMFile[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const searchSN = ref('');
const uploadFileList = ref<UploadUserFile[]>([]);
const uploadRef = ref<InstanceType<typeof ElUpload> | null>(null);
const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/pm-files/upload`;

async function loadPMFiles() {
  loading.value = true;
  try {
    const res = await listPMFiles({
      deviceSn: searchSN.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    pmFiles.value = res.list || [];
    total.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange() {}

function handleUploadSuccess() {
  ElMessage.success(t('pmfile.uploadSuccess'));
  uploadFileList.value = [];
  loadPMFiles();
}

function handleUploadError() {
  ElMessage.error(t('pmfile.uploadFailed'));
}

function handleDownload(id: number) {
  const url = downloadPMFile(id);
  window.open(url, '_blank');
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm(t('pmfile.deleteConfirm'), t('common.tip'), { type: 'warning' });
    await deletePMFile(id);
    ElMessage.success(t('pmfile.deleteSuccess'));
    await loadPMFiles();
  } catch (e: unknown) {
    // cancelled
  }
}

function handlePageChange(p: number) {
  page.value = p;
  loadPMFiles();
}

function handleSizeChange(s: number) {
  pageSize.value = s;
  loadPMFiles();
}

onMounted(() => {
  loadPMFiles();
});
</script>
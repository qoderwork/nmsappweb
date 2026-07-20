<template>
  <div class="pmfile-container">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="searchSN"
          placeholder="搜索设备SN"
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
          <el-button type="primary">上传PM文件</el-button>
        </el-upload>
      </div>
      <el-table :data="pmFiles" v-loading="loading" @selection-change="handleSelectionChange" border style="margin-top: 20px">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="文件名" min-width="200" />
        <el-table-column prop="size" label="大小(KB)" width="100">
          <template #default="{ row }">{{ ((row as PMFile).size / 1024).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(row as PMFile).status === 'SUCCESS' ? 'success' : 'warning'">
              {{ (row as PMFile).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceSn" label="设备SN" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDownload((row as PMFile).id)">
              下载
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete((row as PMFile).id)">
              删除
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
import type { PMFile } from '@/types/pmfile';
import { listPMFiles, downloadPMFile, deletePMFile, uploadPMFile } from '@/api/pmfile';

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
  ElMessage.success('上传成功');
  uploadFileList.value = [];
  loadPMFiles();
}

function handleUploadError() {
  ElMessage.error('上传失败');
}

function handleDownload(id: number) {
  const url = downloadPMFile(id);
  window.open(url, '_blank');
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    await deletePMFile(id);
    ElMessage.success('删除成功');
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

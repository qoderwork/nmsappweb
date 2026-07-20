<template>
  <div class="tcpdump-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="抓包管理" name="capture">
        <el-card>
          <h3>开始抓包</h3>
          <el-form :model="captureForm" label-width="120px" style="margin-top: 20px">
            <el-form-item label="网卡" required>
              <el-select v-model="captureForm.networkCard" placeholder="选择网卡">
                <el-option
                  v-for="card in networkCards"
                  :key="card.name"
                  :label="`${card.name} (${card.ipAddress})`"
                  :value="card.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="抓包时长(秒)" required>
              <el-input-number v-model="captureForm.duration" :min="10" :max="3600" />
            </el-form-item>
            <el-form-item label="文件大小(MB)" required>
              <el-input-number v-model="captureForm.fileSize" :min="1" :max="1000" />
            </el-form-item>
            <el-form-item label="过滤条件">
              <el-input v-model="captureForm.filter" placeholder="例如: tcp port 80" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCapture" :loading="capturing">开始抓包</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top: 20px">
          <h3>可用网卡</h3>
          <el-table :data="networkCards" border style="margin-top: 10px">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="ipAddress" label="IP地址" />
            <el-table-column prop="macAddress" label="MAC地址" />
          </el-table>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="文件列表" name="files">
        <div class="toolbar">
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedNames.length === 0">
            批量删除
          </el-button>
        </div>
        <el-table :data="tcpdumpFiles" v-loading="loading" @selection-change="handleSelectionChange" border>
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="文件名" min-width="200" />
          <el-table-column prop="size" label="大小(KB)" width="100">
            <template #default="{ row }">{{ ((row as TcpdumpFile).size / 1024).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDownload((row as TcpdumpFile).name)">
                下载
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete((row as TcpdumpFile).name)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { NetworkCard, CaptureRequest, TcpdumpFile } from '@/types/tcpdump';
import {
  listNetworkCards,
  doCapture,
  listTcpdumpFiles,
  downloadTcpdumpFile,
  deleteTcpdumpFile,
  batchDeleteTcpdumpFiles,
} from '@/api/tcpdump';

const activeTab = ref('capture');
const loading = ref(false);
const capturing = ref(false);
const networkCards = ref<NetworkCard[]>([]);
const tcpdumpFiles = ref<TcpdumpFile[]>([]);
const selectedNames = ref<string[]>([]);

const captureForm = reactive<CaptureRequest>({
  networkCard: '',
  duration: 60,
  fileSize: 100,
  filter: '',
});

async function loadNetworkCards() {
  try {
    networkCards.value = await listNetworkCards();
  } catch (e: unknown) {
    console.error(e);
  }
}

async function loadTcpdumpFiles() {
  loading.value = true;
  try {
    tcpdumpFiles.value = await listTcpdumpFiles();
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(rows: unknown[]) {
  selectedNames.value = rows.map((r) => (r as TcpdumpFile).name);
}

async function handleCapture() {
  if (!captureForm.networkCard) {
    ElMessage.warning('请选择网卡');
    return;
  }
  capturing.value = true;
  try {
    await doCapture(captureForm);
    ElMessage.success('抓包任务已提交');
  } catch (e: unknown) {
    ElMessage.error('抓包失败');
  } finally {
    capturing.value = false;
  }
}

function handleDownload(name: string) {
  const url = downloadTcpdumpFile(name);
  window.open(url, '_blank');
}

async function handleDelete(name: string) {
  try {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    await deleteTcpdumpFile(name);
    ElMessage.success('删除成功');
    await loadTcpdumpFiles();
  } catch (e: unknown) {
    // cancelled
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm('确定要批量删除吗？', '提示', { type: 'warning' });
    await batchDeleteTcpdumpFiles({ names: selectedNames.value });
    ElMessage.success('批量删除成功');
    selectedNames.value = [];
    await loadTcpdumpFiles();
  } catch (e: unknown) {
    // cancelled
  }
}

onMounted(() => {
  loadNetworkCards();
  loadTcpdumpFiles();
});
</script>

<template>
  <div class="tcpdump-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane :label="t('tcpdump.captureManagement')" name="capture">
        <el-card>
          <h3>{{ t('tcpdump.startCaptureBtn') }}</h3>
          <el-form :model="captureForm" label-width="120px" style="margin-top: 20px">
            <el-form-item :label="t('tcpdump.networkCard')" required>
              <el-select v-model="captureForm.networkCard" :placeholder="t('tcpdump.selectNetworkCard')">
                <el-option
                  v-for="card in networkCards"
                  :key="card.name"
                  :label="`${card.name} (${card.ipAddress})`"
                  :value="card.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('tcpdump.captureDuration')" required>
              <el-input-number v-model="captureForm.duration" :min="10" :max="3600" />
            </el-form-item>
            <el-form-item :label="t('tcpdump.fileSizeMB')" required>
              <el-input-number v-model="captureForm.fileSize" :min="1" :max="1000" />
            </el-form-item>
            <el-form-item :label="t('tcpdump.filterCondition')">
              <el-input v-model="captureForm.filter" :placeholder="t('tcpdump.filterPlaceholder')" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCapture" :loading="capturing">{{ t('tcpdump.startCaptureBtn') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top: 20px">
          <h3>{{ t('tcpdump.availableNics') }}</h3>
          <el-table :data="networkCards" border style="margin-top: 10px">
            <el-table-column prop="name" :label="t('tcpdump.name')" />
            <el-table-column prop="description" :label="t('tcpdump.description')" />
            <el-table-column prop="ipAddress" :label="t('tcpdump.ipAddress')" />
            <el-table-column prop="macAddress" :label="t('tcpdump.macAddress')" />
          </el-table>
        </el-card>
      </el-tab-pane>
      <el-tab-pane :label="t('tcpdump.fileList')" name="files">
        <div class="toolbar">
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedNames.length === 0">
            {{ t('tcpdump.batchDelete') }}
          </el-button>
        </div>
        <el-table :data="tcpdumpFiles" v-loading="loading" @selection-change="handleSelectionChange" border>
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" :label="t('tcpdump.fileName')" min-width="200" />
          <el-table-column prop="size" :label="t('tcpdump.sizeKB')" width="100">
            <template #default="{ row }">{{ ((row as TcpdumpFile).size / 1024).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('tcpdump.createTime')" width="180" />
          <el-table-column :label="t('common.actions')" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDownload((row as TcpdumpFile).name)">
                {{ t('common.download') }}
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete((row as TcpdumpFile).name)">
                {{ t('common.delete') }}
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
import { useI18n } from 'vue-i18n';
import type { NetworkCard, CaptureRequest, TcpdumpFile } from '@/types/tcpdump';
import {
  listNetworkCards,
  doCapture,
  listTcpdumpFiles,
  downloadTcpdumpFile,
  deleteTcpdumpFile,
  batchDeleteTcpdumpFiles,
} from '@/api/tcpdump';

const { t } = useI18n();

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
    ElMessage.warning(t('tcpdump.selectNetworkCardRequired'));
    return;
  }
  capturing.value = true;
  try {
    await doCapture(captureForm);
    ElMessage.success(t('tcpdump.captureTaskSubmitted'));
  } catch (e: unknown) {
    ElMessage.error(t('tcpdump.captureFailed'));
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
    await ElMessageBox.confirm(t('tcpdump.deleteConfirm'), t('common.tip'), { type: 'warning' });
    await deleteTcpdumpFile(name);
    ElMessage.success(t('tcpdump.deleteSuccess'));
    await loadTcpdumpFiles();
  } catch (e: unknown) {
    // cancelled
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(t('tcpdump.batchDeleteConfirm'), t('common.tip'), { type: 'warning' });
    await batchDeleteTcpdumpFiles({ names: selectedNames.value });
    ElMessage.success(t('tcpdump.batchDeleteSuccess'));
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
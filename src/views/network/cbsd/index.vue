<script setup lang="ts">
/**
 * CBSD 管理页面
 *
 * 功能：
 * - CBSD 信息列表 + 编辑弹窗
 * - CBSD 证书管理 Tab
 * - SAS 配置管理 Tab
 * - SAS 协议操作（注册/注销/频谱查询/Grant/Heartbeat/Relinquish）
 * - CBSD 日志 Tab
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus';
import { Search, Refresh, Edit, Delete, Upload, Promotion, Setting, Document } from '@element-plus/icons-vue';

import {
  getCbsdInfoList,
  updateCbsdInfo,
  getCbsdCertificates,
  uploadCbsdCertificate,
  deleteCbsdCertificate,
  triggerCbsdResultTask,
  registerCBSDs,
  deregisterCBSDs,
  enableCBSD,
  disableCBSD,
  spectrumInquiry,
  grantCBSD,
  relinquishCBSD,
  sasHeartbeat,
  getSasConfig,
  updateSasConfig,
  getCbsdLogs,
  getCbsdStatusCount,
} from '@/api/cbsd';
import type { CbsdInfo, CbsdCertificate, CbsdInfoUpdateParams, SasConfig, CbsdLog } from '@/types/cbsd';

const { t } = useI18n();

// ============ 公共 ============
const activeTab = ref('info');

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ CBSD 信息列表 ============
const infoLoading = ref(false);
const infoData = ref<CbsdInfo[]>([]);
const infoTotal = ref(0);

interface InfoQueryParams {
  page: number;
  pageSize: number;
  elementId: string;
  cbsdId: string;
}
const infoQueryParams = reactive<InfoQueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
  cbsdId: '',
});

async function loadCbsdInfoList() {
  infoLoading.value = true;
  try {
    const result = await getCbsdInfoList({
      page: infoQueryParams.page,
      pageSize: infoQueryParams.pageSize,
      elementId: infoQueryParams.elementId ? Number(infoQueryParams.elementId) : undefined,
      cbsdId: infoQueryParams.cbsdId || undefined,
    });
    infoData.value = result.list;
    infoTotal.value = result.total;
  } catch (e) {
    console.error('[CbsdManagement] load info failed:', e);
  } finally {
    infoLoading.value = false;
  }
}

function handleInfoSearch() {
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

function handleInfoReset() {
  infoQueryParams.elementId = '';
  infoQueryParams.cbsdId = '';
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

function handleInfoPageChange(page: number) {
  infoQueryParams.page = page;
  loadCbsdInfoList();
}

function handleInfoSizeChange(size: number) {
  infoQueryParams.pageSize = size;
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

// 编辑弹窗
const editDialogVisible = ref(false);
const editForm = reactive<CbsdInfoUpdateParams & { id?: number }>({
  id: undefined,
  cbsdId: '',
  fccId: '',
  serialNumber: '',
  latitude: undefined,
  longitude: undefined,
  height: undefined,
  heightType: '',
  antennaGain: undefined,
  cbsdCategory: '',
  status: '',
});

function handleEdit(row: CbsdInfo) {
  editForm.id = row.id;
  editForm.cbsdId = row.cbsdId ?? '';
  editForm.fccId = row.fccId ?? '';
  editForm.serialNumber = row.serialNumber ?? '';
  editForm.latitude = row.latitude ?? undefined;
  editForm.longitude = row.longitude ?? undefined;
  editForm.height = row.height ?? undefined;
  editForm.heightType = row.heightType ?? '';
  editForm.antennaGain = row.antennaGain ?? undefined;
  editForm.cbsdCategory = row.cbsdCategory ?? '';
  editForm.status = row.status ?? '';
  editDialogVisible.value = true;
}

async function handleEditSave() {
  if (!editForm.id) return;
  try {
    const { id, ...data } = editForm;
    await updateCbsdInfo(id, data);
    ElMessage.success(t('common.editSuccess'));
    editDialogVisible.value = false;
    loadCbsdInfoList();
  } catch (e) {
    console.error('[CbsdManagement] update failed:', e);
    ElMessage.error(t('common.operateFailed'));
  }
}

// 触发 CBSD 结果任务
const triggering = ref(false);
async function handleTriggerResultTask() {
  try {
    await ElMessageBox.confirm(
      t('cbsd.confirmTriggerResultTask'),
      t('common.confirm'),
      { type: 'info' }
    );
    triggering.value = true;
    await triggerCbsdResultTask();
    ElMessage.success(t('cbsd.resultTaskTriggered'));
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[CbsdManagement] trigger failed:', e);
    }
  } finally {
    triggering.value = false;
  }
}

// 批量注册
async function handleRegister(row: CbsdInfo) {
  try {
    await ElMessageBox.confirm(
      t('cbsd.confirmRegister', { id: row.cbsdId || row.elementId }),
      t('common.confirm'),
      { type: 'info' }
    );
    await registerCBSDs({ elementIds: [row.elementId] });
    ElMessage.success(t('cbsd.registerSuccess'));
    loadCbsdInfoList();
  } catch (e) {
    if (e !== 'cancel') console.error('[CbsdManagement] register failed:', e);
  }
}

// 批量注销
async function handleDeregister(row: CbsdInfo) {
  try {
    await ElMessageBox.confirm(
      t('cbsd.confirmDeregister', { id: row.cbsdId || row.elementId }),
      t('common.confirm'),
      { type: 'warning' }
    );
    await deregisterCBSDs({ elementIds: [row.elementId] });
    ElMessage.success(t('cbsd.deregisterSuccess'));
    loadCbsdInfoList();
  } catch (e) {
    if (e !== 'cancel') console.error('[CbsdManagement] deregister failed:', e);
  }
}

// 启用
async function handleEnable(row: CbsdInfo) {
  try {
    await enableCBSD(row.id);
    ElMessage.success(t('cbsd.enableSuccess'));
    loadCbsdInfoList();
  } catch (e) {
    console.error('[CbsdManagement] enable failed:', e);
  }
}

// 禁用
async function handleDisable(row: CbsdInfo) {
  try {
    await disableCBSD(row.id);
    ElMessage.success(t('cbsd.disableSuccess'));
    loadCbsdInfoList();
  } catch (e) {
    console.error('[CbsdManagement] disable failed:', e);
  }
}

// 频谱查询
const spectrumLoading = ref(false);
async function handleSpectrumInquiry(row: CbsdInfo) {
  spectrumLoading.value = true;
  try {
    const result = await spectrumInquiry({ elementIds: [row.elementId] });
    ElMessage.success(t('cbsd.spectrumInquirySuccess'));
    console.log('[CbsdManagement] spectrum inquiry result:', result);
  } catch (e) {
    console.error('[CbsdManagement] spectrum inquiry failed:', e);
    ElMessage.error(t('cbsd.spectrumInquiryFailed'));
  } finally {
    spectrumLoading.value = false;
  }
}

// ============ CBSD 证书 ============
const certLoading = ref(false);
const certData = ref<CbsdCertificate[]>([]);
const certUploading = ref(false);

async function loadCertificates() {
  certLoading.value = true;
  try {
    const result = await getCbsdCertificates();
    certData.value = result;
  } catch (e) {
    console.error('[CbsdManagement] load certificates failed:', e);
  } finally {
    certLoading.value = false;
  }
}

async function handleCertUpload(options: { file: File }) {
  certUploading.value = true;
  try {
    await uploadCbsdCertificate(options.file);
    ElMessage.success(t('cbsd.certUploadSuccess'));
    loadCertificates();
  } catch (e) {
    console.error('[CbsdManagement] upload certificate failed:', e);
    ElMessage.error(t('cbsd.certUploadFailed'));
  } finally {
    certUploading.value = false;
  }
}

async function handleCertDelete(row: CbsdCertificate) {
  try {
    await ElMessageBox.confirm(
      t('cbsd.confirmDeleteCert', { name: row.fileName || row.id }),
      t('common.confirm'),
      { type: 'warning' }
    );
    await deleteCbsdCertificate(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadCertificates();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[CbsdManagement] delete certificate failed:', e);
    }
  }
}

// ============ SAS 配置 ============
const sasConfigLoading = ref(false);
const sasConfigData = ref<SasConfig | null>(null);
const sasConfigDialogVisible = ref(false);
const sasConfigForm = reactive<Partial<SasConfig>>({
  sasUrl: '',
  userId: '',
  fccId: '',
  cpiId: '',
  cpiName: '',
  enabled: true,
});

async function loadSasConfig() {
  sasConfigLoading.value = true;
  try {
    const result = await getSasConfig();
    sasConfigData.value = result[0] || null;
  } catch (e) {
    console.error('[CbsdManagement] load SAS config failed:', e);
  } finally {
    sasConfigLoading.value = false;
  }
}

function openSasConfigDialog() {
  if (sasConfigData.value) {
    sasConfigForm.sasUrl = sasConfigData.value.sasUrl || '';
    sasConfigForm.userId = sasConfigData.value.userId || '';
    sasConfigForm.fccId = sasConfigData.value.fccId || '';
    sasConfigForm.cpiId = sasConfigData.value.cpiId || '';
    sasConfigForm.cpiName = sasConfigData.value.cpiName || '';
    sasConfigForm.enabled = sasConfigData.value.enabled ?? true;
  } else {
    sasConfigForm.sasUrl = '';
    sasConfigForm.userId = '';
    sasConfigForm.fccId = '';
    sasConfigForm.cpiId = '';
    sasConfigForm.cpiName = '';
    sasConfigForm.enabled = true;
  }
  sasConfigDialogVisible.value = true;
}

async function handleSasConfigSave() {
  try {
    await updateSasConfig({ ...sasConfigForm });
    ElMessage.success(t('common.editSuccess'));
    sasConfigDialogVisible.value = false;
    loadSasConfig();
  } catch (e) {
    console.error('[CbsdManagement] save SAS config failed:', e);
    ElMessage.error(t('common.operateFailed'));
  }
}

// ============ CBSD 日志 ============
const logLoading = ref(false);
const logData = ref<CbsdLog[]>([]);
const logTotal = ref(0);
const logQuery = reactive({
  page: 1,
  pageSize: 20,
  elementId: '',
  operation: '',
});

async function loadCbsdLogs() {
  logLoading.value = true;
  try {
    const result = await getCbsdLogs({
      page: logQuery.page,
      pageSize: logQuery.pageSize,
      elementId: logQuery.elementId ? Number(logQuery.elementId) : undefined,
      operation: logQuery.operation || undefined,
    });
    logData.value = result.list;
    logTotal.value = result.total;
  } catch (e) {
    console.error('[CbsdManagement] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogSearch() {
  logQuery.page = 1;
  loadCbsdLogs();
}

function handleLogReset() {
  logQuery.elementId = '';
  logQuery.operation = '';
  logQuery.page = 1;
  loadCbsdLogs();
}

function handleLogPageChange(page: number) {
  logQuery.page = page;
  loadCbsdLogs();
}

function handleLogSizeChange(size: number) {
  logQuery.pageSize = size;
  logQuery.page = 1;
  loadCbsdLogs();
}

// ============ Tab 切换 ============
function handleTabChange(tab: string | number) {
  if (tab === 'info' && infoData.value.length === 0) loadCbsdInfoList();
  else if (tab === 'cert' && certData.value.length === 0) loadCertificates();
  else if (tab === 'sas' && !sasConfigData.value) loadSasConfig();
  else if (tab === 'log' && logData.value.length === 0) loadCbsdLogs();
}

// ============ 生命周期 ============
onMounted(() => {
  loadCbsdInfoList();
});
</script>

<template>
  <div class="cbsd-management-page">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- Tab1: CBSD 信息 -->
      <el-tab-pane :label="t('cbsd.cbsdInfo')" name="info">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleInfoSearch">
            <el-form-item :label="t('device.deviceId')">
              <el-input
                v-model="infoQueryParams.elementId"
                :placeholder="t('device.deviceId')"
                clearable
                style="width: 120px"
                @keyup.enter="handleInfoSearch"
              />
            </el-form-item>
            <el-form-item label="CBSD ID">
              <el-input
                v-model="infoQueryParams.cbsdId"
                :placeholder="'CBSD ID'"
                clearable
                style="width: 150px"
                @keyup.enter="handleInfoSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleInfoSearch">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleInfoReset">{{ t('common.reset') }}</el-button>
              <el-button
                type="warning"
                :icon="Promotion"
                :loading="triggering"
                @click="handleTriggerResultTask"
              >
                {{ t('cbsd.triggerResultTask') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="infoLoading" :data="infoData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="elementId" :label="t('device.deviceId')" width="90" />
            <el-table-column prop="cbsdId" label="CBSD ID" min-width="130" />
            <el-table-column prop="fccId" label="FCC ID" min-width="120" />
            <el-table-column prop="serialNumber" :label="t('device.serialNumber')" min-width="130" />
            <el-table-column prop="latitude" :label="t('device.latitude')" width="100" />
            <el-table-column prop="longitude" :label="t('device.longitude')" width="100" />
            <el-table-column prop="height" :label="t('device.height')" width="80" />
            <el-table-column prop="heightType" :label="t('device.heightType')" width="90" />
            <el-table-column prop="antennaGain" :label="t('device.antennaGain')" width="90" />
            <el-table-column prop="cbsdCategory" :label="t('device.category')" width="80" />
            <el-table-column prop="status" :label="t('common.status')" width="80" />
            <el-table-column prop="registrationTime" :label="t('device.registrationTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.registrationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="lastContactTime" :label="t('device.lastContactTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.lastContactTime) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row as CbsdInfo)">
                  <Edit /> {{ t('common.edit') }}
                </el-button>
                <el-button link type="success" size="small" @click="handleRegister(row as CbsdInfo)">
                  {{ t('cbsd.register') }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeregister(row as CbsdInfo)">
                  {{ t('cbsd.deregister') }}
                </el-button>
                <el-button link type="info" size="small" :loading="spectrumLoading" @click="handleSpectrumInquiry(row as CbsdInfo)">
                  {{ t('cbsd.spectrumInquiry') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="infoQueryParams.page"
              v-model:page-size="infoQueryParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="infoTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleInfoSizeChange"
              @current-change="handleInfoPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: CBSD 证书 -->
      <el-tab-pane :label="t('cbsd.certificate')" name="cert">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-upload
            :show-file-list="false"
            :before-upload="() => false"
            :on-change="(file: UploadFile) => handleCertUpload({ file: (file.raw as File) })"
            accept=".pem,.crt,.cer,.cert"
          >
            <el-button type="success" :icon="Upload" :loading="certUploading">{{ t('cbsd.uploadCertificate') }}</el-button>
          </el-upload>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="certLoading" :data="certData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" :label="t('device.deviceId')" width="100" />
            <el-table-column prop="fileName" :label="t('file.fileName')" min-width="240" />
            <el-table-column prop="filePath" :label="t('file.filePath')" min-width="240" />
            <el-table-column prop="uploadTime" :label="t('file.uploadTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.uploadTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('common.status')" width="100" />
            <el-table-column :label="t('common.actions')" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleCertDelete(row as CbsdCertificate)">
                  <Delete /> {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: SAS 配置 -->
      <el-tab-pane :label="t('cbsd.sasConfig')" name="sas">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-button type="primary" :icon="Setting" @click="openSasConfigDialog">
            {{ t('common.edit') }}
          </el-button>
        </el-card>

        <el-card v-loading="sasConfigLoading" shadow="never" :body-style="{ padding: '24px' }">
          <el-descriptions v-if="sasConfigData" :column="2" border>
            <el-descriptions-item :label="t('cbsd.sasUrl')">{{ sasConfigData.sasUrl || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('cbsd.userId')">{{ sasConfigData.userId || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('cbsd.fccId')">{{ sasConfigData.fccId || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('cbsd.cpiId')">{{ sasConfigData.cpiId || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('cbsd.cpiName')">{{ sasConfigData.cpiName || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('common.status')">
              <el-tag :type="sasConfigData.enabled ? 'success' : 'danger'">
                {{ sasConfigData.enabled ? t('common.enabled') : t('common.disabled') }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else :description="t('cbsd.noSasConfig')" />
        </el-card>
      </el-tab-pane>

      <!-- Tab4: CBSD 日志 -->
      <el-tab-pane :label="t('cbsd.cbsdLogs')" name="log">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleLogSearch">
            <el-form-item :label="t('device.deviceId')">
              <el-input
                v-model="logQuery.elementId"
                :placeholder="t('device.deviceId')"
                clearable
                style="width: 120px"
                @keyup.enter="handleLogSearch"
              />
            </el-form-item>
            <el-form-item :label="t('cbsd.operation')">
              <el-input
                v-model="logQuery.operation"
                :placeholder="t('cbsd.operation')"
                clearable
                style="width: 150px"
                @keyup.enter="handleLogSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleLogSearch">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleLogReset">{{ t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="logLoading" :data="logData" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" :label="t('device.deviceId')" width="100" />
            <el-table-column prop="operation" :label="t('cbsd.operation')" min-width="150" />
            <el-table-column prop="result" :label="t('common.result')" min-width="120" />
            <el-table-column prop="detail" :label="t('common.detail')" min-width="240" show-overflow-tooltip />
            <el-table-column prop="createTime" :label="t('common.createTime')" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="logQuery.page"
              v-model:page-size="logQuery.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="logTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleLogSizeChange"
              @current-change="handleLogPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- CBSD 信息编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" :title="t('cbsd.editCbsd')" width="600px" @close="editDialogVisible = false">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="CBSD ID">
          <el-input v-model="editForm.cbsdId" :placeholder="t('cbsd.cbsdIdPlaceholder')" />
        </el-form-item>
        <el-form-item label="FCC ID">
          <el-input v-model="editForm.fccId" :placeholder="t('cbsd.fccIdPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('device.serialNumber')">
          <el-input v-model="editForm.serialNumber" :placeholder="t('device.serialNumberPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('device.latitude')">
          <el-input-number v-model="editForm.latitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('device.longitude')">
          <el-input-number v-model="editForm.longitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('device.height')">
          <el-input-number v-model="editForm.height" :precision="1" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('device.heightType')">
          <el-input v-model="editForm.heightType" :placeholder="'AGL / AMSL'" />
        </el-form-item>
        <el-form-item :label="t('device.antennaGain')">
          <el-input-number v-model="editForm.antennaGain" :precision="1" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('device.category')">
          <el-input v-model="editForm.cbsdCategory" :placeholder="'A / B'" />
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-input v-model="editForm.status" :placeholder="t('common.status')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleEditSave">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- SAS 配置编辑弹窗 -->
    <el-dialog v-model="sasConfigDialogVisible" :title="t('cbsd.sasConfig')" width="600px" @close="sasConfigDialogVisible = false">
      <el-form :model="sasConfigForm" label-width="120px">
        <el-form-item :label="t('cbsd.sasUrl')">
          <el-input v-model="sasConfigForm.sasUrl" :placeholder="t('cbsd.sasUrlPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('cbsd.userId')">
          <el-input v-model="sasConfigForm.userId" :placeholder="t('cbsd.userIdPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('cbsd.fccId')">
          <el-input v-model="sasConfigForm.fccId" :placeholder="t('cbsd.fccIdPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('cbsd.cpiId')">
          <el-input v-model="sasConfigForm.cpiId" :placeholder="t('cbsd.cpiIdPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('cbsd.cpiName')">
          <el-input v-model="sasConfigForm.cpiName" :placeholder="t('cbsd.cpiNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-switch v-model="sasConfigForm.enabled" :active-text="t('common.enabled')" :inactive-text="t('common.disabled')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sasConfigDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSasConfigSave">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.cbsd-management-page {
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
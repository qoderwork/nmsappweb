<script setup lang="ts">
/**
 * License 授权管理页面
 *
 * 功能：
 * - Tab1: License 列表（展示授权信息、状态、过期时间等）+ 上传 License 按钮
 * - Tab2: SAS 配置（auto_register 开关）
 * - Tab3: Entra 端点管理（CRUD 表格）
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus, Edit, Delete, Upload, View } from '@element-plus/icons-vue';

import {
  getLicenses,
  getLicense,
  updateLicense,
  getSASConfig,
  saveSASConfig,
  getEntraEndpoints,
  createEntraEndpoint,
  updateEntraEndpoint,
  deleteEntraEndpoint,
  uploadLicenseFile,
} from '@/api/license';
import type { License, SASConfig, EntraEndpoint } from '@/types/license';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('list');
const loading = ref(false);

// Tab1: License 列表
const licenseList = ref<License[]>([]);
const licenseLoading = ref(false);

// Tab2: SAS 配置
const sasForm = reactive<SASConfig>({
  id: null,
  tenantCode: null,
  autoRegister: undefined,
});
const sasSaving = ref(false);

// Tab3: Entra 端点
const entraList = ref<EntraEndpoint[]>([]);
const entraLoading = ref(false);
const entraDialogVisible = ref(false);
const entraDialogTitle = ref(t('license.addEntraEndpoint'));
const isEntraEdit = ref(false);
const entraForm = reactive<Partial<EntraEndpoint>>({
  id: undefined,
  tenantId: '',
  clientId: '',
  secretKey: '',
  tenantIdInNms: '',
  endpointName: '',
  nmsFqdn: '',
});
const entraFormRules = {
  endpointName: [{ required: true, message: t('license.enterEndpointName'), trigger: 'blur' }],
  tenantId: [{ required: true, message: t('license.enterTenancyId'), trigger: 'blur' }],
  clientId: [{ required: true, message: t('license.enterClientId'), trigger: 'blur' }],
  secretKey: [{ required: true, message: t('license.enterSecretKey'), trigger: 'blur' }],
};

// License 详情弹窗
const detailDialogVisible = ref(false);
const detailData = ref<License | null>(null);
const detailLoading = ref(false);

// 上传
const uploadInputRef = ref<HTMLInputElement | null>(null);

// ============ 方法 ============

/** 加载 License 列表 */
async function loadLicenses() {
  licenseLoading.value = true;
  try {
    const result = await getLicenses();
    licenseList.value = result;
  } catch (e) {
    console.error('[LicenseManagement] load licenses failed:', e);
  } finally {
    licenseLoading.value = false;
  }
}

/** 加载 SAS 配置 */
async function loadSASConfig() {
  try {
    const result = await getSASConfig();
    Object.assign(sasForm, result);
  } catch (e) {
    console.error('[LicenseManagement] load SAS config failed:', e);
  }
}

/** 保存 SAS 配置 */
async function handleSaveSAS() {
  sasSaving.value = true;
  try {
    await saveSASConfig({ autoRegister: sasForm.autoRegister });
    ElMessage.success(t('license.sasConfigSaveSuccess'));
  } catch (e) {
    console.error('[LicenseManagement] save SAS config failed:', e);
  } finally {
    sasSaving.value = false;
  }
}

/** 加载 Entra 端点列表 */
async function loadEntraEndpoints() {
  entraLoading.value = true;
  try {
    const result = await getEntraEndpoints();
    entraList.value = result;
  } catch (e) {
    console.error('[LicenseManagement] load entra endpoints failed:', e);
  } finally {
    entraLoading.value = false;
  }
}

/** 打开新增 Entra 端点弹窗 */
function handleAddEntra() {
  entraDialogTitle.value = t('license.addEntraEndpoint');
  isEntraEdit.value = false;
  entraForm.id = undefined;
  entraForm.tenantId = '';
  entraForm.clientId = '';
  entraForm.secretKey = '';
  entraForm.tenantIdInNms = '';
  entraForm.endpointName = '';
  entraForm.nmsFqdn = '';
  entraDialogVisible.value = true;
}

/** 打开编辑 Entra 端点弹窗 */
function handleEditEntra(row: EntraEndpoint) {
  entraDialogTitle.value = t('license.editEntraEndpoint');
  isEntraEdit.value = true;
  entraForm.id = row.id;
  entraForm.tenantId = row.tenantId ?? '';
  entraForm.clientId = row.clientId ?? '';
  entraForm.secretKey = row.secretKey ?? '';
  entraForm.tenantIdInNms = row.tenantIdInNms ?? '';
  entraForm.endpointName = row.endpointName ?? '';
  entraForm.nmsFqdn = row.nmsFqdn ?? '';
  entraDialogVisible.value = true;
}

/** 保存 Entra 端点 */
async function handleSaveEntra() {
  if (!entraForm.endpointName) {
    ElMessage.warning(t('license.enterEndpointName'));
    return;
  }
  if (!entraForm.tenantId) {
    ElMessage.warning(t('license.enterTenancyId'));
    return;
  }
  if (!entraForm.clientId) {
    ElMessage.warning(t('license.enterClientId'));
    return;
  }
  if (!entraForm.secretKey) {
    ElMessage.warning(t('license.enterSecretKey'));
    return;
  }
  try {
    if (isEntraEdit.value && entraForm.id) {
      await updateEntraEndpoint(entraForm.id, { ...entraForm });
      ElMessage.success(t('license.updateSuccess'));
    } else {
      await createEntraEndpoint({ ...entraForm });
      ElMessage.success(t('license.createSuccess'));
    }
    entraDialogVisible.value = false;
    loadEntraEndpoints();
  } catch (e) {
    console.error('[LicenseManagement] save entra endpoint failed:', e);
  }
}

/** 删除 Entra 端点 */
async function handleDeleteEntra(row: EntraEndpoint) {
  try {
    await ElMessageBox.confirm(
      t('license.deleteEntraConfirm', { name: row.endpointName || row.id }),
      t('license.deleteConfirm'),
      { type: 'warning' }
    );
    await deleteEntraEndpoint(row.id);
    ElMessage.success(t('license.deleteSuccess'));
    loadEntraEndpoints();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[LicenseManagement] delete entra endpoint failed:', e);
    }
  }
}

/** 查看 License 详情 */
async function handleViewLicense(row: License) {
  detailDialogVisible.value = true;
  detailLoading.value = true;
  try {
    const result = await getLicense(row.id);
    detailData.value = result;
  } catch (e) {
    console.error('[LicenseManagement] view license failed:', e);
  } finally {
    detailLoading.value = false;
  }
}

/** 触发上传 */
function handleUploadClick() {
  uploadInputRef.value?.click();
}

/** 处理文件选择 */
async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadLicenseFile(file);
    ElMessage.success(t('license.licenseUploadSuccess'));
    loadLicenses();
    if (result) {
      detailData.value = result;
      detailDialogVisible.value = true;
    }
  } catch (err) {
    console.error('[LicenseManagement] upload failed:', err);
  } finally {
    target.value = '';
  }
}

/** 格式化时间戳 */
function formatTimestamp(ts?: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

/** 获取状态标签类型 */
function getLicenseStatusType(status?: string | null): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'active' || status === t('license.licenseStatusActive')) return 'success';
  if (status === 'expired' || status === t('license.licenseStatusExpired')) return 'danger';
  if (status === 'pending' || status === t('license.licenseStatusPending')) return 'warning';
  return 'info';
}

/** 获取状态文本 */
function getLicenseStatusText(status?: string | null): string {
  if (!status) return t('license.licenseStatusUnknown');
  const map: Record<string, string> = {
    active: t('license.licenseStatusActive'),
    expired: t('license.licenseStatusExpired'),
    pending: t('license.licenseStatusPending'),
    invalid: t('license.licenseStatusInvalid'),
  };
  return map[status] || status;
}

/** Tab 切换 */
function handleTabChange(tabName: string | number) {
  if (tabName === 'list') {
    loadLicenses();
  } else if (tabName === 'sas') {
    loadSASConfig();
  } else if (tabName === 'entra') {
    loadEntraEndpoints();
  }
}

// ============ 生命周期 ============
onMounted(() => {
  loadLicenses();
});
</script>

<template>
  <div class="license-management-page">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- Tab1: License 列表 -->
      <el-tab-pane :label="t('license.licenseList')" name="list">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <div style="margin-bottom: 16px;">
            <el-button type="primary" :icon="Upload" @click="handleUploadClick">
              {{ t('license.uploadLicense') }}
            </el-button>
            <el-button :icon="Refresh" @click="loadLicenses">{{ t('license.refresh') }}</el-button>
          </div>

          <el-table
            v-loading="licenseLoading"
            :data="licenseList"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" :label="t('license.index')" width="60" />
            <el-table-column prop="licenseName" :label="t('license.licenseName')" min-width="160" />
            <el-table-column prop="tenantCode" :label="t('license.licenseId')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="licenseType" :label="t('license.licenseType')" width="120" />
            <el-table-column prop="status" :label="t('common.status')" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getLicenseStatusType(row.status)" size="small">
                  {{ getLicenseStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expiryDate" :label="t('license.expiryDate')" min-width="160">
              <template #default="{ row }">
                {{ formatTimestamp(row.expiryDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="enbQuantity" :label="t('license.enbQuantity')" width="100" align="center" />
            <el-table-column prop="gnbQuantity" :label="t('license.gnbQuantity')" width="100" align="center" />
            <el-table-column prop="cpeQuantity" :label="t('license.cpeQuantity')" width="100" align="center" />
            <el-table-column prop="userQuantity" :label="t('license.userQuantity')" width="100" align="center" />
            <el-table-column prop="omcName" :label="t('license.omcName')" min-width="120" />
            <el-table-column prop="provinceAbbreviation" :label="t('license.province')" width="100" />
            <el-table-column prop="vendorCode" :label="t('license.vendorCode')" width="100" />
            <el-table-column :label="t('common.actions')" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewLicense(row as License)">
                  <View />
                  {{ t('common.detail') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: SAS 配置 -->
      <el-tab-pane :label="t('license.sasConfig')" name="sas">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :model="sasForm" label-width="160px" style="max-width: 500px">
            <el-form-item :label="t('license.autoRegister')">
              <el-switch v-model="sasForm.autoRegister" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="sasSaving" @click="handleSaveSAS">{{ t('license.save') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: Entra 端点管理 -->
      <el-tab-pane :label="t('license.entraEndpoints')" name="entra">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <div style="margin-bottom: 16px;">
            <el-button type="primary" :icon="Plus" @click="handleAddEntra">{{ t('license.addEndpoint') }}</el-button>
            <el-button :icon="Refresh" @click="loadEntraEndpoints">{{ t('license.refresh') }}</el-button>
          </div>

          <el-table
            v-loading="entraLoading"
            :data="entraList"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" :label="t('license.index')" width="60" />
            <el-table-column prop="endpointName" :label="t('license.endpointName')" min-width="140" />
            <el-table-column prop="tenantId" :label="t('license.tenancyId')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="clientId" :label="t('license.clientId')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="tenantIdInNms" :label="t('license.nmsTenancyId')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="nmsFqdn" :label="t('license.nmsFqdn')" min-width="160" show-overflow-tooltip />
            <el-table-column :label="t('common.actions')" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditEntra(row as EntraEndpoint)">
                  <Edit />
                  {{ t('common.edit') }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteEntra(row as EntraEndpoint)">
                  <Delete />
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 隐藏的文件上传 input -->
    <input
      ref="uploadInputRef"
      type="file"
      style="display: none"
      accept=".lic,.txt,.json"
      @change="handleFileChange"
    />

    <!-- Entra 端点表单弹窗 -->
    <el-dialog v-model="entraDialogVisible" :title="entraDialogTitle" width="560px">
      <el-form :model="entraForm" :rules="entraFormRules" label-width="140px">
        <el-form-item :label="t('license.endpointName')" prop="endpointName">
          <el-input v-model="entraForm.endpointName" :placeholder="t('license.enterEndpointName')" />
        </el-form-item>
        <el-form-item :label="t('license.tenancyId')" prop="tenantId">
          <el-input v-model="entraForm.tenantId" :placeholder="t('license.enterTenancyId')" />
        </el-form-item>
        <el-form-item :label="t('license.clientId')" prop="clientId">
          <el-input v-model="entraForm.clientId" :placeholder="t('license.enterClientId')" />
        </el-form-item>
        <el-form-item :label="t('license.secretKey')" prop="secretKey">
          <el-input v-model="entraForm.secretKey" type="password" show-password :placeholder="t('license.enterSecretKey')" />
        </el-form-item>
        <el-form-item :label="t('license.nmsTenancyId')">
          <el-input v-model="entraForm.tenantIdInNms" :placeholder="t('license.enterNmsTenancyId')" />
        </el-form-item>
        <el-form-item :label="t('license.nmsFqdn')">
          <el-input v-model="entraForm.nmsFqdn" :placeholder="t('license.enterNmsFqdn')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="entraDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveEntra">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- License 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="t('license.licenseDetail')" width="700px">
      <el-descriptions v-loading="detailLoading" :column="2" border>
        <el-descriptions-item :label="t('license.licenseName')">{{ detailData?.licenseName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.licenseId')">{{ detailData?.tenantCode || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.licenseType')">{{ detailData?.licenseType || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">
          <el-tag :type="getLicenseStatusType(detailData?.status)" size="small">
            {{ getLicenseStatusText(detailData?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('license.expiryDate')">{{ formatTimestamp(detailData?.expiryDate) }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.notBefore')">{{ formatTimestamp(detailData?.notBefore) }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.enbQuantity')">{{ detailData?.enbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.gnbQuantity')">{{ detailData?.gnbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.cpeQuantity')">{{ detailData?.cpeQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.userQuantity')">{{ detailData?.userQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.capacity')">{{ detailData?.capacity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.omcName')">{{ detailData?.omcName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.province')">{{ detailData?.provinceAbbreviation || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.vendorCode')">{{ detailData?.vendorCode || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.timezone')">{{ detailData?.timezone || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.acsUrl')">{{ detailData?.acsUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.subject')">{{ detailData?.subject || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.issuer')">{{ detailData?.issuer || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.machineFingerprint')">{{ detailData?.machineFingerprint || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.verifiedAt')">{{ formatTimestamp(detailData?.verifiedAt) }}</el-descriptions-item>
        <el-descriptions-item :label="t('license.features')" :span="2">{{ detailData?.features || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.license-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}
</style>
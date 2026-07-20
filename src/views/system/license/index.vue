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
  licenseId: null,
  autoRegister: undefined,
});
const sasSaving = ref(false);

// Tab3: Entra 端点
const entraList = ref<EntraEndpoint[]>([]);
const entraLoading = ref(false);
const entraDialogVisible = ref(false);
const entraDialogTitle = ref('新增 Entra 端点');
const isEntraEdit = ref(false);
const entraForm = reactive<Partial<EntraEndpoint>>({
  id: undefined,
  tenancyId: '',
  clientId: '',
  secretKey: '',
  tenancyIdInNms: '',
  endpointName: '',
  nmsFqdn: '',
});
const entraFormRules = {
  endpointName: [{ required: true, message: '请输入端点名称', trigger: 'blur' }],
  tenancyId: [{ required: true, message: '请输入 Tenancy ID', trigger: 'blur' }],
  clientId: [{ required: true, message: '请输入 Client ID', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入 Secret Key', trigger: 'blur' }],
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
    ElMessage.success('SAS 配置保存成功');
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
  entraDialogTitle.value = '新增 Entra 端点';
  isEntraEdit.value = false;
  entraForm.id = undefined;
  entraForm.tenancyId = '';
  entraForm.clientId = '';
  entraForm.secretKey = '';
  entraForm.tenancyIdInNms = '';
  entraForm.endpointName = '';
  entraForm.nmsFqdn = '';
  entraDialogVisible.value = true;
}

/** 打开编辑 Entra 端点弹窗 */
function handleEditEntra(row: EntraEndpoint) {
  entraDialogTitle.value = '编辑 Entra 端点';
  isEntraEdit.value = true;
  entraForm.id = row.id;
  entraForm.tenancyId = row.tenancyId ?? '';
  entraForm.clientId = row.clientId ?? '';
  entraForm.secretKey = row.secretKey ?? '';
  entraForm.tenancyIdInNms = row.tenancyIdInNms ?? '';
  entraForm.endpointName = row.endpointName ?? '';
  entraForm.nmsFqdn = row.nmsFqdn ?? '';
  entraDialogVisible.value = true;
}

/** 保存 Entra 端点 */
async function handleSaveEntra() {
  if (!entraForm.endpointName) {
    ElMessage.warning('请输入端点名称');
    return;
  }
  if (!entraForm.tenancyId) {
    ElMessage.warning('请输入 Tenancy ID');
    return;
  }
  if (!entraForm.clientId) {
    ElMessage.warning('请输入 Client ID');
    return;
  }
  if (!entraForm.secretKey) {
    ElMessage.warning('请输入 Secret Key');
    return;
  }
  try {
    if (isEntraEdit.value && entraForm.id) {
      await updateEntraEndpoint(entraForm.id, { ...entraForm });
      ElMessage.success('更新成功');
    } else {
      await createEntraEndpoint({ ...entraForm });
      ElMessage.success('创建成功');
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
      `确定要删除 Entra 端点 "${row.endpointName || row.id}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteEntraEndpoint(row.id);
    ElMessage.success('删除成功');
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
    ElMessage.success('License 文件上传成功');
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
  if (status === 'active' || status === '生效') return 'success';
  if (status === 'expired' || status === '过期') return 'danger';
  if (status === 'pending' || status === '待验证') return 'warning';
  return 'info';
}

/** 获取状态文本 */
function getLicenseStatusText(status?: string | null): string {
  if (!status) return '未知';
  const map: Record<string, string> = {
    active: '生效',
    expired: '过期',
    pending: '待验证',
    invalid: '无效',
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
      <el-tab-pane label="License 列表" name="list">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <div style="margin-bottom: 16px;">
            <el-button type="primary" :icon="Upload" @click="handleUploadClick">
              上传 License
            </el-button>
            <el-button :icon="Refresh" @click="loadLicenses">刷新</el-button>
          </div>

          <el-table
            v-loading="licenseLoading"
            :data="licenseList"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="licenseName" label="授权名称" min-width="160" />
            <el-table-column prop="licenseId" label="授权 ID" min-width="160" show-overflow-tooltip />
            <el-table-column prop="licenseType" label="授权类型" width="120" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getLicenseStatusType(row.status)" size="small">
                  {{ getLicenseStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expiryDate" label="过期时间" min-width="160">
              <template #default="{ row }">
                {{ formatTimestamp(row.expiryDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="enbQuantity" label="eNB 数量" width="100" align="center" />
            <el-table-column prop="gnbQuantity" label="gNB 数量" width="100" align="center" />
            <el-table-column prop="cpeQuantity" label="CPE 数量" width="100" align="center" />
            <el-table-column prop="userQuantity" label="用户数量" width="100" align="center" />
            <el-table-column prop="omcName" label="OMC 名称" min-width="120" />
            <el-table-column prop="provinceAbbreviation" label="省份" width="100" />
            <el-table-column prop="vendorCode" label="厂商代码" width="100" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewLicense(row as License)">
                  <View />
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: SAS 配置 -->
      <el-tab-pane label="SAS 配置" name="sas">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :model="sasForm" label-width="160px" style="max-width: 500px">
            <el-form-item label="自动注册">
              <el-switch v-model="sasForm.autoRegister" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="sasSaving" @click="handleSaveSAS">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: Entra 端点管理 -->
      <el-tab-pane label="Entra 端点" name="entra">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <div style="margin-bottom: 16px;">
            <el-button type="primary" :icon="Plus" @click="handleAddEntra">新增端点</el-button>
            <el-button :icon="Refresh" @click="loadEntraEndpoints">刷新</el-button>
          </div>

          <el-table
            v-loading="entraLoading"
            :data="entraList"
            stripe
            border
            style="width: 100%"
            row-key="id"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="endpointName" label="端点名称" min-width="140" />
            <el-table-column prop="tenancyId" label="Tenancy ID" min-width="160" show-overflow-tooltip />
            <el-table-column prop="clientId" label="Client ID" min-width="160" show-overflow-tooltip />
            <el-table-column prop="tenancyIdInNms" label="NMS Tenancy ID" min-width="160" show-overflow-tooltip />
            <el-table-column prop="nmsFqdn" label="NMS FQDN" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditEntra(row as EntraEndpoint)">
                  <Edit />
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteEntra(row as EntraEndpoint)">
                  <Delete />
                  删除
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
        <el-form-item label="端点名称" prop="endpointName">
          <el-input v-model="entraForm.endpointName" placeholder="请输入端点名称" />
        </el-form-item>
        <el-form-item label="Tenancy ID" prop="tenancyId">
          <el-input v-model="entraForm.tenancyId" placeholder="请输入 Tenancy ID" />
        </el-form-item>
        <el-form-item label="Client ID" prop="clientId">
          <el-input v-model="entraForm.clientId" placeholder="请输入 Client ID" />
        </el-form-item>
        <el-form-item label="Secret Key" prop="secretKey">
          <el-input v-model="entraForm.secretKey" type="password" show-password placeholder="请输入 Secret Key" />
        </el-form-item>
        <el-form-item label="NMS Tenancy ID">
          <el-input v-model="entraForm.tenancyIdInNms" placeholder="请输入 NMS Tenancy ID" />
        </el-form-item>
        <el-form-item label="NMS FQDN">
          <el-input v-model="entraForm.nmsFqdn" placeholder="请输入 NMS FQDN" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="entraDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEntra">确定</el-button>
      </template>
    </el-dialog>

    <!-- License 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="License 详情" width="700px">
      <el-descriptions v-loading="detailLoading" :column="2" border>
        <el-descriptions-item label="授权名称">{{ detailData?.licenseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="授权 ID">{{ detailData?.licenseId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="授权类型">{{ detailData?.licenseType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getLicenseStatusType(detailData?.status)" size="small">
            {{ getLicenseStatusText(detailData?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ formatTimestamp(detailData?.expiryDate) }}</el-descriptions-item>
        <el-descriptions-item label="生效时间">{{ formatTimestamp(detailData?.notBefore) }}</el-descriptions-item>
        <el-descriptions-item label="eNB 数量">{{ detailData?.enbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="gNB 数量">{{ detailData?.gnbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="CPE 数量">{{ detailData?.cpeQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户数量">{{ detailData?.userQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="容量">{{ detailData?.capacity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="OMC 名称">{{ detailData?.omcName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="省份">{{ detailData?.provinceAbbreviation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="厂商代码">{{ detailData?.vendorCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="时区">{{ detailData?.timezone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="ACS URL">{{ detailData?.acsUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Subject">{{ detailData?.subject || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Issuer">{{ detailData?.issuer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="机器指纹">{{ detailData?.machineFingerprint || '-' }}</el-descriptions-item>
        <el-descriptions-item label="验证时间">{{ formatTimestamp(detailData?.verifiedAt) }}</el-descriptions-item>
        <el-descriptions-item label="特性" :span="2">{{ detailData?.features || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
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

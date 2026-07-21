<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElInputNumber, ElButton, ElTable, ElTableColumn, ElTabs, ElTabPane, ElTag } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Switch, Monitor, Setting, List } from '@element-plus/icons-vue';

const { t } = useI18n();

import {
  listCoreNetworks,
  createCoreNetwork,
  updateCoreNetwork,
  deleteCoreNetwork,
  changeCoreNetworkSwitch,
  listUEList,
  listUENumberStatistic,
  getUeInfos,
  getCoreNetworkAlarms,
  getCoreNetworkUserInfo,
  getCoreNetworkUpfTraffic,
  listOperationLogs,
} from '@/api/core-network';
import type {
  CoreNetwork,
  CoreNetworkOperationLog,
  CoreNetworkAlarmVo,
  UeInfo,
  UeListVo,
  UeNumberStatisticVo,
  CoreNetworkUserInfoVo,
  CoreNetworkUpfTrafficVo,
} from '@/types/core-network';

const activeTab = ref('network');
const selectedCoreNetworkId = ref<number | null>(null);

// --- 核心网管理 ---
const networkLoading = ref(false);
const networkList = ref<CoreNetwork[]>([]);
const networkDialogVisible = ref(false);
const isEditNetwork = ref(false);
const networkForm = reactive<Partial<CoreNetwork>>({
  id: undefined,
  name: '',
  install_location: '',
  ip: '',
  port: 0,
});

// --- UE管理 ---
const ueLoading = ref(false);
const ueList = ref<UeListVo[]>([]);
const ueInfoList = ref<UeInfo[]>([]);
const ueStatistics = ref<UeNumberStatisticVo | null>(null);

// --- KPI管理 ---
const kpiLoading = ref(false);
const userInfo = ref<CoreNetworkUserInfoVo | null>(null);
const upfTraffic = ref<CoreNetworkUpfTrafficVo | null>(null);
const alarms = ref<CoreNetworkAlarmVo[]>([]);

// --- 操作日志 ---
const logLoading = ref(false);
const logList = ref<CoreNetworkOperationLog[]>([]);
const logTotal = ref(0);
const logQuery = reactive({
  page: 1,
  pageSize: 20,
});

watch(selectedCoreNetworkId, () => {
  if (selectedCoreNetworkId.value) {
    loadUEData();
    loadKpiData();
    loadLogs();
  }
});

function getSeverityClass(severity?: string): 'info' | 'danger' | 'warning' | 'primary' | 'success' | undefined {
  const map: Record<string, 'info' | 'danger' | 'warning'> = {
    'critical': 'danger',
    'major': 'danger',
    'minor': 'warning',
    'warning': 'warning',
    'info': 'info',
  };
  return map[severity?.toLowerCase() || ''] || 'info';
}

function getSeverityText(severity?: string): string {
  const map: Record<string, string> = {
    'critical': t('coreNetwork.critical'),
    'major': t('coreNetwork.major'),
    'minor': t('coreNetwork.minor'),
    'warning': t('coreNetwork.warning'),
    'info': t('coreNetwork.info'),
  };
  return map[severity?.toLowerCase() || ''] || severity || t('coreNetwork.unknown');
}

function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// --- 核心网管理方法 ---
async function loadNetworks() {
  networkLoading.value = true;
  try {
    const result = await listCoreNetworks();
    networkList.value = result;
    if (result.length > 0 && !selectedCoreNetworkId.value) {
      selectedCoreNetworkId.value = result[0].id;
    }
  } catch (e) {
    console.error('[CoreNetwork] load networks failed:', e);
  } finally {
    networkLoading.value = false;
  }
}

function openAddNetwork() {
  isEditNetwork.value = false;
  networkForm.id = undefined;
  networkForm.name = '';
  networkForm.install_location = '';
  networkForm.ip = '';
  networkForm.port = 0;
  networkDialogVisible.value = true;
}

function openEditNetwork(row: CoreNetwork) {
  isEditNetwork.value = true;
  networkForm.id = row.id;
  networkForm.name = row.name || '';
  networkForm.install_location = row.install_location || '';
  networkForm.ip = row.ip || '';
  networkForm.port = row.port || 0;
  networkDialogVisible.value = true;
}

async function saveNetwork() {
  if (!networkForm.name) {
    ElMessage.warning(t('coreNetwork.namePlaceholder'));
    return;
  }
  try {
    if (isEditNetwork.value && networkForm.id !== undefined) {
      await updateCoreNetwork(networkForm.id, networkForm);
      ElMessage.success(t('common.editSuccess'));
    } else {
      await createCoreNetwork(networkForm);
      ElMessage.success(t('common.addSuccess'));
    }
    networkDialogVisible.value = false;
    loadNetworks();
  } catch (e) {
    console.error('[CoreNetwork] save network failed:', e);
  }
}

async function handleDeleteNetwork(row: CoreNetwork) {
  try {
    const confirmMsg = t('coreNetwork.confirmDelete').replace('{name}', row.name || '');
    await ElMessageBox.confirm(confirmMsg, t('coreNetwork.deleteConfirm'), { type: 'warning' });
    await deleteCoreNetwork(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadNetworks();
  } catch (e) {
    if (e !== 'cancel') console.error('[CoreNetwork] delete network failed:', e);
  }
}

async function handleToggleSwitch(row: CoreNetwork) {
  try {
    const enable = !(row.deleted || false);
    await changeCoreNetworkSwitch({ coreNetworkId: row.id, enable });
    ElMessage.success(enable ? t('coreNetwork.enabled') : t('coreNetwork.disabled'));
    loadNetworks();
  } catch (e) {
    console.error('[CoreNetwork] toggle switch failed:', e);
  }
}

// --- UE管理方法 ---
async function loadUEData() {
  if (!selectedCoreNetworkId.value) return;
  ueLoading.value = true;
  try {
    const [ueResult, ueInfoResult, statsResult] = await Promise.all([
      listUEList({ coreNetworkId: selectedCoreNetworkId.value }),
      getUeInfos({ coreNetworkId: selectedCoreNetworkId.value }),
      listUENumberStatistic({ coreNetworkId: selectedCoreNetworkId.value }),
    ]);
    ueList.value = ueResult || [];
    ueInfoList.value = ueInfoResult || [];
    ueStatistics.value = statsResult;
  } catch (e) {
    console.error('[CoreNetwork] load UE data failed:', e);
  } finally {
    ueLoading.value = false;
  }
}

// --- KPI管理方法 ---
async function loadKpiData() {
  if (!selectedCoreNetworkId.value) return;
  kpiLoading.value = true;
  try {
    const [userResult, trafficResult, alarmResult] = await Promise.all([
      getCoreNetworkUserInfo({ coreNetworkId: selectedCoreNetworkId.value }),
      getCoreNetworkUpfTraffic({ coreNetworkId: selectedCoreNetworkId.value }),
      getCoreNetworkAlarms({ coreNetworkId: selectedCoreNetworkId.value }),
    ]);
    userInfo.value = userResult;
    upfTraffic.value = trafficResult;
    alarms.value = alarmResult || [];
  } catch (e) {
    console.error('[CoreNetwork] load KPI data failed:', e);
  } finally {
    kpiLoading.value = false;
  }
}

// --- 操作日志方法 ---
async function loadLogs() {
  if (!selectedCoreNetworkId.value) return;
  logLoading.value = true;
  try {
    const result = await listOperationLogs(selectedCoreNetworkId.value, logQuery.page, logQuery.pageSize);
    logList.value = result.list || [];
    logTotal.value = result.total || 0;
  } catch (e) {
    console.error('[CoreNetwork] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogPageChange(page: number) {
  logQuery.page = page;
  loadLogs();
}

function handleLogSizeChange(size: number) {
  logQuery.pageSize = size;
  logQuery.page = 1;
  loadLogs();
}

onMounted(() => {
  loadNetworks();
});
</script>

<template>
  <div class="core-network-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="never" :title="t('coreNetwork.networkList')">
          <div class="network-list-header">
            <el-button type="primary" size="small" :icon="Plus" @click="openAddNetwork">{{ t('common.add') }}</el-button>
            <el-button size="small" :icon="Refresh" @click="loadNetworks">{{ t('common.refresh') }}</el-button>
          </div>
          <el-table :data="networkList" :loading="networkLoading" border size="small" highlight-current-row @current-change="(row) => selectedCoreNetworkId = (row as CoreNetwork)?.id ?? null">
            <el-table-column prop="name" :label="t('coreNetwork.name')" />
            <el-table-column prop="ip" :label="t('coreNetwork.ip')" />
            <el-table-column prop="port" :label="t('coreNetwork.port')" />
            <el-table-column :label="t('coreNetwork.status')" width="80">
              <template #default="{ row }">
                <el-switch :value="!((row as CoreNetwork).deleted || false)" @change="handleToggleSwitch(row as CoreNetwork)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="100">
              <template #default="{ row }">
                <el-button size="small" :icon="Edit" @click="openEditNetwork(row as CoreNetwork)">{{ t('common.edit') }}</el-button>
                <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteNetwork(row as CoreNetwork)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card shadow="never">
          <el-tabs v-model="activeTab" type="border-card" v-if="selectedCoreNetworkId">
            <!-- UE管理 -->
            <el-tab-pane :label="t('coreNetwork.ueManagement')" name="ue">
              <div class="stat-row">
                <el-statistic :title="t('coreNetwork.ueTotal')" :value="ueStatistics?.total || 0" />
              </div>
              <el-tabs type="border-card">
                <el-tab-pane :label="t('coreNetwork.ueList')">
                  <el-table :data="ueList" :loading="ueLoading" border size="small">
                    <el-table-column prop="imsi" label="IMSI" />
                    <el-table-column prop="msisdn" label="MSISDN" />
                    <el-table-column prop="category" :label="t('coreNetwork.name')" />
                  </el-table>
                </el-tab-pane>
                <el-tab-pane :label="t('coreNetwork.ueDetail')">
                  <el-table :data="ueInfoList" :loading="ueLoading" border size="small">
                    <el-table-column prop="imsi" label="IMSI" />
                    <el-table-column prop="imei" label="IMEI" />
                    <el-table-column prop="msisdn" label="MSISDN" />
                    <el-table-column prop="state" :label="t('coreNetwork.status')" />
                    <el-table-column prop="startTime" :label="t('coreNetwork.eventTime')">
                      <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </el-tab-pane>

            <!-- KPI管理 -->
            <el-tab-pane :label="t('coreNetwork.kpis')" name="kpi">
              <div class="stat-row">
                <el-statistic :title="t('coreNetwork.totalUsers')" :value="userInfo?.totalUsers || 0" />
                <el-statistic :title="t('coreNetwork.activeUsers')" :value="userInfo?.activeUsers || 0" />
                <el-statistic :title="t('coreNetwork.uplinkTraffic')" :value="upfTraffic?.uplinkBps || 0" />
                <el-statistic :title="t('coreNetwork.downlinkTraffic')" :value="upfTraffic?.downlinkBps || 0" />
              </div>
              <el-table :data="alarms" :loading="kpiLoading" border size="small">
                <el-table-column prop="severity" :label="t('coreNetwork.severity')" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getSeverityClass(row.severity)">{{ getSeverityText(row.severity) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="alarmIdentifier" :label="t('coreNetwork.alarmIdentifier')" />
                <el-table-column prop="probableCause" :label="t('coreNetwork.probableCause')" />
                <el-table-column prop="eventTime" :label="t('coreNetwork.eventTime')">
                  <template #default="{ row }">{{ formatTime(row.eventTime) }}</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 操作日志 -->
            <el-tab-pane :label="t('coreNetwork.statistics')" name="log">
              <el-table :data="logList" :loading="logLoading" border size="small">
                <el-table-column prop="log_type" :label="t('coreNetwork.logType')" />
                <el-table-column prop="user" :label="t('coreNetwork.operator')" />
                <el-table-column prop="operation_time" :label="t('coreNetwork.operationTime')">
                  <template #default="{ row }">{{ formatTime(row.operation_time) }}</template>
                </el-table-column>
                <el-table-column prop="result" :label="t('coreNetwork.result')" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.result === 0 ? 'success' : 'danger'">{{ row.result === 0 ? t('coreNetwork.success') : t('coreNetwork.failed') }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="info" :label="t('coreNetwork.detail')" show-overflow-tooltip />
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="logQuery.page"
                  v-model:page-size="logQuery.pageSize"
                  :total="logTotal"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleLogSizeChange"
                  @current-change="handleLogPageChange"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
          <div v-else class="empty-tip">
            {{ t('coreNetwork.pleaseSelectCoreNetwork') }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 核心网编辑对话框 -->
    <el-dialog :title="isEditNetwork ? t('coreNetwork.editCoreNetwork') : t('coreNetwork.addCoreNetwork')" v-model="networkDialogVisible" width="400px">
      <el-form :model="networkForm" label-width="100px">
        <el-form-item :label="t('coreNetwork.name')" required>
          <el-input v-model="networkForm.name" :placeholder="t('coreNetwork.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('coreNetwork.installLocation')">
          <el-input v-model="networkForm.install_location" :placeholder="t('coreNetwork.installLocationPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('coreNetwork.ipAddress')">
          <el-input v-model="networkForm.ip" :placeholder="t('coreNetwork.ipPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('coreNetwork.port')">
          <el-input-number v-model="networkForm.port" :min="1" :max="65535" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="networkDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveNetwork">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.core-network-page {
  padding: 16px;
}

.network-list-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
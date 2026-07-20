<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElInputNumber, ElButton, ElTable, ElTableColumn, ElTabs, ElTabPane, ElTag } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Switch, Monitor, Setting, List } from '@element-plus/icons-vue';

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
    'critical': '严重',
    'major': '重要',
    'minor': '次要',
    'warning': '警告',
    'info': '信息',
  };
  return map[severity?.toLowerCase() || ''] || severity || '未知';
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
    ElMessage.warning('请输入核心网名称');
    return;
  }
  try {
    if (isEditNetwork.value && networkForm.id !== undefined) {
      await updateCoreNetwork(networkForm.id, networkForm);
      ElMessage.success('修改成功');
    } else {
      await createCoreNetwork(networkForm);
      ElMessage.success('添加成功');
    }
    networkDialogVisible.value = false;
    loadNetworks();
  } catch (e) {
    console.error('[CoreNetwork] save network failed:', e);
  }
}

async function handleDeleteNetwork(row: CoreNetwork) {
  try {
    await ElMessageBox.confirm(`确定要删除核心网 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteCoreNetwork(row.id);
    ElMessage.success('删除成功');
    loadNetworks();
  } catch (e) {
    if (e !== 'cancel') console.error('[CoreNetwork] delete network failed:', e);
  }
}

async function handleToggleSwitch(row: CoreNetwork) {
  try {
    const enable = !(row.deleted || false);
    await changeCoreNetworkSwitch({ coreNetworkId: row.id, enable });
    ElMessage.success(enable ? '已启用' : '已禁用');
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
        <el-card shadow="never" title="核心网列表">
          <div class="network-list-header">
            <el-button type="primary" size="small" :icon="Plus" @click="openAddNetwork">新增</el-button>
            <el-button size="small" :icon="Refresh" @click="loadNetworks">刷新</el-button>
          </div>
          <el-table :data="networkList" :loading="networkLoading" border size="small" highlight-current-row @current-change="(row) => selectedCoreNetworkId = (row as CoreNetwork)?.id ?? null">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="ip" label="IP" />
            <el-table-column prop="port" label="端口" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch :value="!((row as CoreNetwork).deleted || false)" @change="handleToggleSwitch(row as CoreNetwork)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" :icon="Edit" @click="openEditNetwork(row as CoreNetwork)">编辑</el-button>
                <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteNetwork(row as CoreNetwork)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card shadow="never">
          <el-tabs v-model="activeTab" type="border-card" v-if="selectedCoreNetworkId">
            <!-- UE管理 -->
            <el-tab-pane label="UE管理" name="ue">
              <div class="stat-row">
                <el-statistic title="UE总数" :value="ueStatistics?.total || 0" />
              </div>
              <el-tabs type="border-card">
                <el-tab-pane label="UE列表">
                  <el-table :data="ueList" :loading="ueLoading" border size="small">
                    <el-table-column prop="imsi" label="IMSI" />
                    <el-table-column prop="msisdn" label="MSISDN" />
                    <el-table-column prop="category" label="类别" />
                  </el-table>
                </el-tab-pane>
                <el-tab-pane label="UE详情">
                  <el-table :data="ueInfoList" :loading="ueLoading" border size="small">
                    <el-table-column prop="imsi" label="IMSI" />
                    <el-table-column prop="imei" label="IMEI" />
                    <el-table-column prop="msisdn" label="MSISDN" />
                    <el-table-column prop="state" label="状态" />
                    <el-table-column prop="startTime" label="开始时间">
                      <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </el-tab-pane>

            <!-- KPI管理 -->
            <el-tab-pane label="KPI管理" name="kpi">
              <div class="stat-row">
                <el-statistic title="总用户数" :value="userInfo?.totalUsers || 0" />
                <el-statistic title="活跃用户" :value="userInfo?.activeUsers || 0" />
                <el-statistic title="上行流量(bps)" :value="upfTraffic?.uplinkBps || 0" />
                <el-statistic title="下行流量(bps)" :value="upfTraffic?.downlinkBps || 0" />
              </div>
              <el-table :data="alarms" :loading="kpiLoading" border size="small">
                <el-table-column prop="severity" label="级别" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getSeverityClass(row.severity)">{{ getSeverityText(row.severity) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="alarmIdentifier" label="告警标识" />
                <el-table-column prop="probableCause" label="原因" />
                <el-table-column prop="eventTime" label="时间">
                  <template #default="{ row }">{{ formatTime(row.eventTime) }}</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 操作日志 -->
            <el-tab-pane label="操作日志" name="log">
              <el-table :data="logList" :loading="logLoading" border size="small">
                <el-table-column prop="log_type" label="类型" />
                <el-table-column prop="user" label="操作人" />
                <el-table-column prop="operation_time" label="操作时间">
                  <template #default="{ row }">{{ formatTime(row.operation_time) }}</template>
                </el-table-column>
                <el-table-column prop="result" label="结果" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.result === 0 ? 'success' : 'danger'">{{ row.result === 0 ? '成功' : '失败' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="info" label="详情" show-overflow-tooltip />
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
            请从左侧选择一个核心网
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 核心网编辑对话框 -->
    <el-dialog :title="isEditNetwork ? '编辑核心网' : '新增核心网'" v-model="networkDialogVisible" width="400px">
      <el-form :model="networkForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="networkForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="networkForm.install_location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="networkForm.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="networkForm.port" :min="1" :max="65535" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="networkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNetwork">确定</el-button>
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
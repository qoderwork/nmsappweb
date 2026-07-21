<script setup lang="ts">
/**
 * 拓扑管理页面
 */
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Document, Folder } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

import {
  getLteTopology,
  getNrTopology,
  reloadLteTopology,
  reloadNrTopology,
  listBatchUpgradeLogs,
} from '@/api/topology';
import type { TopologyBBU, ListBatchUpgradeLogVO } from '@/types/topology';

import TopologyTree from './components/TopologyTree.vue';
import TopologyGraph from './components/TopologyGraph.vue';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('lte');

// LTE 拓扑
const lteLoading = ref(false);
const lteElementId = ref('');
const lteBBU = ref<TopologyBBU | null>(null);

// NR 拓扑
const nrLoading = ref(false);
const nrElementId = ref('');
const nrBBU = ref<TopologyBBU | null>(null);

// 批量升级日志
const logLoading = ref(false);
const logList = ref<ListBatchUpgradeLogVO[]>([]);
const logQuery = reactive({
  page: 1,
  pageSize: 20,
  elementId: '',
  operationUser: '',
  startTime: '',
  endTime: '',
});
const logTotal = ref(0);

// ============ 方法 ============

async function queryLteTopology() {
  if (!lteElementId.value) {
    ElMessage.warning(t('topology.enterDeviceId'));
    return;
  }
  lteLoading.value = true;
  try {
    const result = await getLteTopology({ id: Number(lteElementId.value) });
    lteBBU.value = result.bbu;
  } catch (e) {
    console.error('[Topology] query LTE failed:', e);
  } finally {
    lteLoading.value = false;
  }
}

async function queryNrTopology() {
  if (!nrElementId.value) {
    ElMessage.warning(t('topology.enterDeviceId'));
    return;
  }
  nrLoading.value = true;
  try {
    const result = await getNrTopology({ id: Number(nrElementId.value) });
    nrBBU.value = result.bbu;
  } catch (e) {
    console.error('[Topology] query NR failed:', e);
  } finally {
    nrLoading.value = false;
  }
}

async function handleReloadLte() {
  if (!lteElementId.value) {
    ElMessage.warning(t('topology.enterDeviceId'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('topology.confirmReloadLte'), t('common.confirm'), { type: 'warning' });
    await reloadLteTopology({ id: Number(lteElementId.value) });
    ElMessage.success(t('topology.reloadTriggered'));
    queryLteTopology();
  } catch (e) {
    if (e !== 'cancel') console.error('[Topology] reload failed:', e);
  }
}

async function handleReloadNr() {
  if (!nrElementId.value) {
    ElMessage.warning(t('topology.enterDeviceId'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('topology.confirmReloadNr'), t('common.confirm'), { type: 'warning' });
    await reloadNrTopology({ id: Number(nrElementId.value) });
    ElMessage.success(t('topology.reloadTriggered'));
    queryNrTopology();
  } catch (e) {
    if (e !== 'cancel') console.error('[Topology] reload NR failed:', e);
  }
}

async function loadBatchUpgradeLogs() {
  if (!logQuery.elementId) {
    ElMessage.warning(t('topology.enterDeviceId'));
    return;
  }
  logLoading.value = true;
  try {
    const result = await listBatchUpgradeLogs({
      elementId: Number(logQuery.elementId),
      operationUser: logQuery.operationUser || undefined,
      startTime: logQuery.startTime || undefined,
      endTime: logQuery.endTime || undefined,
      page: logQuery.page,
      pageSize: logQuery.pageSize,
    });
    logList.value = result;
    logTotal.value = result.length;
  } catch (e) {
    console.error('[Topology] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogSearch() {
  logQuery.page = 1;
  loadBatchUpgradeLogs();
}

function handleLogReset() {
  logQuery.operationUser = '';
  logQuery.startTime = '';
  logQuery.endTime = '';
  logQuery.page = 1;
  loadBatchUpgradeLogs();
}

function handleLogPageChange(page: number) {
  logQuery.page = page;
  loadBatchUpgradeLogs();
}

function handleLogSizeChange(size: number) {
  logQuery.pageSize = size;
  logQuery.page = 1;
  loadBatchUpgradeLogs();
}

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function getResultText(result?: number | null): string {
  if (result === 1) return t('topology.success');
  if (result === 0) return t('topology.failed');
  return t('topology.inProgress');
}

function getResultType(result?: number | null): 'success' | 'danger' | 'warning' {
  if (result === 1) return 'success';
  if (result === 0) return 'danger';
  return 'warning';
}
</script>

<template>
  <div class="topology-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- LTE 拓扑 -->
      <el-tab-pane :label="t('topology.lteTopology')" name="lte">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="queryLteTopology">
            <el-form-item :label="t('topology.deviceId')">
              <el-input v-model="lteElementId" :placeholder="t('topology.bbuIdPlaceholder')" clearable style="width: 150px" @keyup.enter="queryLteTopology" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="queryLteTopology">{{ t('topology.query') }}</el-button>
              <el-button :icon="Refresh" @click="handleReloadLte">{{ t('topology.reload') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-loading="lteLoading" shadow="never" :body-style="{ padding: '0' }">
          <template v-if="lteBBU">
            <div class="topology-header">
              <div class="topology-header__info">
                <el-icon size="20"><Folder /></el-icon>
                <span class="topology-header__name">{{ lteBBU.deviceName || lteBBU.serialNumber || 'BBU' }}</span>
                <span class="topology-header__sn">{{ lteBBU.serialNumber }}</span>
              </div>
            </div>
            <TopologyGraph :bbu="lteBBU">
              <template #tree>
                <div v-for="port in lteBBU.ports" :key="port.portIndex" class="topology-port-section">
                  <div class="topology-port-title">
                    <el-icon><Document /></el-icon>
                    {{ t('topology.port') }} {{ port.portIndex }} - {{ port.type }}
                  </div>
                  <TopologyTree :devices="port.nextLevelDevices" :level="0" />
                </div>
              </template>
            </TopologyGraph>
          </template>
          <el-empty v-else :description="t('topology.noTopologyData')" />
        </el-card>
      </el-tab-pane>

      <!-- NR 拓扑 -->
      <el-tab-pane :label="t('topology.nrTopology')" name="nr">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="queryNrTopology">
            <el-form-item :label="t('topology.deviceId')">
              <el-input v-model="nrElementId" :placeholder="t('topology.gnbIdPlaceholder')" clearable style="width: 150px" @keyup.enter="queryNrTopology" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="queryNrTopology">{{ t('topology.query') }}</el-button>
              <el-button :icon="Refresh" @click="handleReloadNr">{{ t('topology.reload') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-loading="nrLoading" shadow="never" :body-style="{ padding: '0' }">
          <template v-if="nrBBU">
            <div class="topology-header">
              <div class="topology-header__info">
                <el-icon size="20"><Folder /></el-icon>
                <span class="topology-header__name">{{ nrBBU.deviceName || nrBBU.serialNumber || 'gNB' }}</span>
                <span class="topology-header__sn">{{ nrBBU.serialNumber }}</span>
              </div>
            </div>
            <TopologyGraph :bbu="nrBBU">
              <template #tree>
                <div v-for="port in nrBBU.ports" :key="port.portIndex" class="topology-port-section">
                  <div class="topology-port-title">
                    <el-icon><Document /></el-icon>
                    {{ t('topology.port') }} {{ port.portIndex }} - {{ port.type }}
                  </div>
                  <TopologyTree :devices="port.nextLevelDevices" :level="0" />
                </div>
              </template>
            </TopologyGraph>
          </template>
          <el-empty v-else :description="t('topology.noTopologyData')" />
        </el-card>
      </el-tab-pane>

      <!-- 升级日志 -->
      <el-tab-pane :label="t('topology.upgradeLog')" name="logs">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleLogSearch">
            <el-form-item :label="t('topology.deviceId')">
              <el-input v-model="logQuery.elementId" :placeholder="t('topology.deviceIdPlaceholder')" clearable style="width: 120px" @keyup.enter="handleLogSearch" />
            </el-form-item>
            <el-form-item :label="t('topology.operationUser')">
              <el-input v-model="logQuery.operationUser" :placeholder="t('topology.username')" clearable style="width: 120px" @keyup.enter="handleLogSearch" />
            </el-form-item>
            <el-form-item :label="t('topology.startTime')">
              <el-date-picker v-model="logQuery.startTime" type="datetime" :placeholder="t('topology.startTime')" value-format="YYYY-MM-DD HH:mm:ss" style="width: 180px" />
            </el-form-item>
            <el-form-item :label="t('topology.endTime')">
              <el-date-picker v-model="logQuery.endTime" type="datetime" :placeholder="t('topology.endTime')" value-format="YYYY-MM-DD HH:mm:ss" style="width: 180px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleLogSearch">{{ t('topology.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleLogReset">{{ t('topology.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="logLoading" :data="logList" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="operationUser" :label="t('topology.operationUser')" width="120" />
            <el-table-column prop="operationTime" :label="t('topology.operationTime')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.operationTime) }}</template>
            </el-table-column>
            <el-table-column prop="downloadedTime" :label="t('topology.downloadTime')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.downloadedTime) }}</template>
            </el-table-column>
            <el-table-column prop="upgradedTime" :label="t('topology.upgradeTime')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.upgradedTime) }}</template>
            </el-table-column>
            <el-table-column prop="result" :label="t('topology.result')" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getResultType(row.result)" size="small">{{ getResultText(row.result) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="faultInfo" :label="t('topology.faultInfo')" min-width="160" show-overflow-tooltip />
            <el-table-column :label="t('topology.versionChange')" min-width="300">
              <template #default="{ row }">
                <div v-for="v in row.versionInfo" :key="v.serialNumber" class="version-change-item">
                  {{ v.serialNumber }}: {{ v.originalVersion }} → {{ v.upgradedVersion }}
                </div>
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
  </div>
</template>

<style lang="scss" scoped>
.topology-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.topology-header {
  padding: 12px 16px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.topology-header__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topology-header__name {
  font-size: 16px;
  font-weight: 600;
}

.topology-header__sn {
  color: var(--text-secondary);
  font-family: monospace;
}

.topology-port-section {
  border-bottom: 1px solid var(--border-color);
}

.topology-port-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--bg-secondary);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.version-change-item {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import {
  Search,
  Refresh,
  Setting,
  View,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  Upload,
  Download,
  Document,
} from '@element-plus/icons-vue';

import {
  getZTPResults,
  getZTPLogs,
  getZTPRetryLogs,
  getZTPHistoryFiles,
  getZTPSetting,
  saveZTPSetting,
  setZTPStatus,
  batchReztp,
  deleteZTPFiles,
  getTBGList,
  addTBG,
  modifyTBG,
  deleteTBG,
  importTBG,
  downloadTBGTemplate,
  getPSAPIDList,
  syncPSAPID,
  getPSAPIDSyncLogs,
} from '@/api/ztp';
import type {
  ZTPResultVo,
  ZTPLog,
  ZTPRetryLogVo,
  HistoryZTPFileVo,
  ZTPSetting,
  TBG,
  PSAPID,
  PSAPIDSyncLog,
} from '@/api/ztp';
import { getDeviceGroups } from '@/api/device';
import type { DeviceGroup } from '@/types/device';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

const activeTab = ref<'results' | 'tbg' | 'psap'>('results');

/* ============ 进度枚举（0-7，对齐 Java） ============ */
const progressOptions = [
  { label: t('ztp.progressNotStarted'), value: 0 },
  { label: t('ztp.progressStartZTP'), value: 1 },
  { label: t('ztp.progressFileDownloaded'), value: 2 },
  { label: t('ztp.progressParamValidating'), value: 3 },
  { label: t('ztp.progressParamConfiguring'), value: 4 },
  { label: t('ztp.progressCellActivating'), value: 5 },
  { label: t('ztp.progressCompleted'), value: 6 },
  { label: t('ztp.progressCompletedWithFault'), value: 7 },
];
function progressLabel(v: number | null): string {
  if (v === null || v === undefined) return '-';
  return progressOptions.find((p) => p.value === v)?.label ?? String(v);
}
function progressTagType(v: number | null): 'success' | 'warning' | 'danger' | 'info' {
  if (v === 7) return 'danger';
  if (v === 6) return 'success';
  if (v === null || v === undefined) return 'info';
  return 'warning';
}

function resultTagType(r: string): 'success' | 'danger' | 'warning' | 'info' {
  const s = (r || '').toLowerCase();
  if (s.includes('success') || s === '1') return 'success';
  if (s.includes('fail') || s === '2') return 'danger';
  if (s.includes('progress') || s.includes('run') || s.includes('start')) return 'warning';
  return 'info';
}
function resultLabel(r: string): string {
  const s = (r || '').toLowerCase();
  if (s.includes('success')) return t('ztp.success');
  if (s.includes('fail')) return t('ztp.fail');
  return r || t('ztp.noData');
}

function statusTagType(s: string): 'success' | 'info' {
  return s === 'enable' ? 'success' : 'info';
}
function statusLabel(s: string): string {
  return s === 'enable' ? t('ztp.enable') : t('ztp.disable');
}

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return time;
}
function durationTime(start?: string | null, end?: string | null): string {
  if (!start || !end) return '-';
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return '-';
  const sec = Math.floor((e - s) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

/* ============ 设备组 ============ */
const deviceGroups = ref<DeviceGroup[]>([]);
async function loadDeviceGroups() {
  try {
    deviceGroups.value = await getDeviceGroups();
  } catch (e) {
    deviceGroups.value = [];
  }
}

/* ============ ZTP 结果 ============ */
const resultLoading = ref(false);
const resultList = ref<ZTPResultVo[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({
  searchText: '',
  /** ''=全部, 'inprogress', 'success' */
  succeedTab: '' as '' | 'inprogress' | 'success',
  progress: undefined as number | string | undefined,
  result: undefined as number | string | undefined,
  deviceGroupId: '',
  page: 1,
  pageSize: 20,
});
const selectedRows = ref<any[]>([]);

function buildResultQuery() {
  const q: Record<string, unknown> = {
    page: resultQuery.page,
    pageSize: resultQuery.pageSize,
    searchText: resultQuery.searchText || undefined,
    deviceGroupId: resultQuery.deviceGroupId || undefined,
  };
  if (resultQuery.succeedTab === 'inprogress') q.succeed = false;
  else if (resultQuery.succeedTab === 'success') q.succeed = true;
  const p = resultQuery.progress;
  if (p !== '' && p !== undefined && p !== null) q.progress = Number(p);
  const r = resultQuery.result;
  if (r !== '' && r !== undefined && r !== null) q.result = Number(r);
  return q;
}

async function loadResults() {
  resultLoading.value = true;
  try {
    const res = await getZTPResults(buildResultQuery() as any);
    resultList.value = res?.list || [];
    resultTotal.value = res?.total || 0;
  } catch (e) {
    console.error('[ZTP] load results failed:', e);
  } finally {
    resultLoading.value = false;
  }
}

function handleResultPageChange(page: number) {
  resultQuery.page = page;
  loadResults();
}
function handleResultSizeChange(size: number) {
  resultQuery.pageSize = size;
  resultQuery.page = 1;
  loadResults();
}
function handleSearch() {
  resultQuery.page = 1;
  loadResults();
}
function handleReset() {
  resultQuery.searchText = '';
  resultQuery.succeedTab = '';
  resultQuery.progress = undefined;
  resultQuery.result = undefined;
  resultQuery.deviceGroupId = '';
  resultQuery.page = 1;
  loadResults();
}

/* ---- 日志 / 重试日志 / 历史文件 ---- */
const logDialogVisible = ref(false);
const logList = ref<ZTPLog[]>([]);
const logLoading = ref(false);
async function viewLogs(row: any) {
  logDialogVisible.value = true;
  logLoading.value = true;
  try {
    logList.value = await getZTPLogs(row.elementId);
  } catch (e) {
    console.error('[ZTP] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

const retryLogDialogVisible = ref(false);
const retryLogList = ref<ZTPRetryLogVo[]>([]);
const retryLogLoading = ref(false);
async function viewRetryLogs(row: any) {
  retryLogDialogVisible.value = true;
  retryLogLoading.value = true;
  try {
    retryLogList.value = await getZTPRetryLogs(row.elementId);
  } catch (e) {
    console.error('[ZTP] load retry logs failed:', e);
  } finally {
    retryLogLoading.value = false;
  }
}

const historyDialogVisible = ref(false);
const historyList = ref<HistoryZTPFileVo[]>([]);
const historyTotal = ref(0);
const historyLoading = ref(false);
const historyQuery = reactive({ elementId: 0, page: 1, pageSize: 20 });
async function viewHistoryFiles(row: any) {
  historyQuery.elementId = row.elementId;
  historyQuery.page = 1;
  historyDialogVisible.value = true;
  await loadHistoryFiles();
}
async function loadHistoryFiles() {
  historyLoading.value = true;
  try {
    const res = await getZTPHistoryFiles(historyQuery);
    historyList.value = res?.list || [];
    historyTotal.value = res?.total || 0;
  } catch (e) {
    console.error('[ZTP] load history files failed:', e);
  } finally {
    historyLoading.value = false;
  }
}
function handleHistoryPageChange(page: number) {
  historyQuery.page = page;
  loadHistoryFiles();
}

/* ---- 启用 / 禁用 / 重试 ---- */
async function changeStatus(rows: any[], target: 'enable' | 'disable') {
  const ids = rows.map((r) => r.elementId);
  if (ids.length === 0) return;
  try {
    await setZTPStatus({ elementIds: ids, status: target });
    ElMessage.success(t('ztp.success'));
    loadResults();
  } catch (e) {
    console.error('[ZTP] set status failed:', e);
  }
}
async function handleEnable(rows: any[]) {
  try {
    await ElMessageBox.confirm(t('ztp.confirmEnable'), t('ztp.enable'), { type: 'warning' });
    await changeStatus(rows, 'enable');
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
}
async function handleDisable(rows: any[]) {
  try {
    await ElMessageBox.confirm(t('ztp.confirmDisable'), t('ztp.disable'), { type: 'warning' });
    await changeStatus(rows, 'disable');
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
}
async function handleRetry(rows: any[]) {
  const ids = rows.map((r) => r.elementId);
  if (ids.length === 0) return;
  try {
    await ElMessageBox.confirm(t('ztp.confirmRetry'), t('ztp.retry'), { type: 'warning' });
    // 老逻辑：先删除 ZTP 文件（清空进度），后端会重新生成并开通
    await deleteZTPFiles(ids);
    ElMessage.success(t('ztp.success'));
    loadResults();
  } catch (e) {
    if (e !== 'cancel') console.error('[ZTP] retry failed:', e);
  }
}

/* ---- 批量重新 ZTP ---- */
const batchReztpDialogVisible = ref(false);
const batchReztpScope = ref<'element' | 'deviceGroup' | 'market'>('element');
const batchReztpIds = ref('');
function openBatchReztp() {
  batchReztpScope.value = 'element';
  batchReztpIds.value = '';
  batchReztpDialogVisible.value = true;
}
async function submitBatchReztp() {
  const req: Record<string, unknown> = { scope: batchReztpScope.value };
  if (batchReztpScope.value === 'element') {
    const ids = selectedRows.value.map((r) => r.elementId);
    if (ids.length === 0) {
      ElMessage.warning(t('ztp.selectedCount', { count: 0 }));
      return;
    }
    req.elementIds = ids;
  } else {
    const ids = batchReztpIds.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      ElMessage.warning(t('ztp.idList'));
      return;
    }
    if (batchReztpScope.value === 'deviceGroup') req.deviceGroupIds = ids;
    else req.markets = ids;
  }
  try {
    await batchReztp(req as any);
    ElMessage.success(t('ztp.success'));
    batchReztpDialogVisible.value = false;
    loadResults();
  } catch (e) {
    console.error('[ZTP] batch reztp failed:', e);
  }
}

/* ============ ZTP 配置 ============ */
const settingDialogVisible = ref(false);
const settingLoading = ref(false);
const loadedSetting = ref<ZTPSetting>({});
const settingForm = reactive<Record<string, any>>({
  gnbIdStart: null,
  gnbIdEnd: null,
  tacStart: null,
  tacEnd: null,
  ztpTimeoutTime: null,
  radiusThreshold: null,
  wifiPositioning: false,
  ptpEnable: false,
  spectrumSpatialUrl: '',
  msagUrl: '',
  bmcUrl: '',
  gmlcUrl: '',
  tPlatformUrl: '',
  lmfUrls: '',
  sftpUsername: '',
  sftpPassword: '',
});
async function openSetting() {
  settingDialogVisible.value = true;
  settingLoading.value = true;
  try {
    const s = await getZTPSetting();
    loadedSetting.value = s || {};
    Object.assign(settingForm, {
      gnbIdStart: s?.gnbIdStart ?? null,
      gnbIdEnd: s?.gnbIdEnd ?? null,
      tacStart: s?.tacStart ?? null,
      tacEnd: s?.tacEnd ?? null,
      ztpTimeoutTime: s?.ztpTimeoutTime ?? null,
      radiusThreshold: s?.radiusThreshold ?? null,
      wifiPositioning: s?.wifiPositioning ?? false,
      ptpEnable: s?.ptpEnable ?? false,
      spectrumSpatialUrl: s?.spectrumSpatialUrl ?? '',
      msagUrl: s?.msagUrl ?? '',
      bmcUrl: s?.bmcUrl ?? '',
      gmlcUrl: s?.gmlcUrl ?? '',
      tPlatformUrl: s?.tPlatformUrl ?? '',
      lmfUrls: (s?.lmfUrls || []).join(','),
      sftpUsername: s?.sftpUsername ?? '',
      sftpPassword: s?.sftpPassword ?? '',
    });
  } catch (e) {
    console.error('[ZTP] load setting failed:', e);
  } finally {
    settingLoading.value = false;
  }
}
async function saveSetting() {
  try {
    const payload: ZTPSetting = {
      ...loadedSetting.value,
      gnbIdStart: settingForm.gnbIdStart || null,
      gnbIdEnd: settingForm.gnbIdEnd || null,
      tacStart: settingForm.tacStart || null,
      tacEnd: settingForm.tacEnd || null,
      ztpTimeoutTime: settingForm.ztpTimeoutTime || null,
      radiusThreshold: settingForm.radiusThreshold || null,
      wifiPositioning: !!settingForm.wifiPositioning,
      ptpEnable: !!settingForm.ptpEnable,
      spectrumSpatialUrl: settingForm.spectrumSpatialUrl || null,
      msagUrl: settingForm.msagUrl || null,
      bmcUrl: settingForm.bmcUrl || null,
      gmlcUrl: settingForm.gmlcUrl || null,
      tPlatformUrl: settingForm.tPlatformUrl || null,
      lmfUrls: settingForm.lmfUrls
        ? settingForm.lmfUrls.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      sftpUsername: settingForm.sftpUsername || null,
      sftpPassword: settingForm.sftpPassword || null,
    };
    await saveZTPSetting(payload);
    ElMessage.success(t('ztp.success'));
    settingDialogVisible.value = false;
  } catch (e) {
    console.error('[ZTP] save setting failed:', e);
  }
}

/* ============ TBG 管理 ============ */
const tbgLoading = ref(false);
const tbgList = ref<TBG[]>([]);
const tbgTotal = ref(0);
const tbgQuery = reactive({ name: '', page: 1, pageSize: 20 });
const tbgDialogVisible = ref(false);
const isEditTbg = ref(false);
const tbgForm = reactive({ id: 0, name: '', ip: '', port: 8080 });

async function loadTBGList() {
  tbgLoading.value = true;
  try {
    const res = await getTBGList({ name: tbgQuery.name, page: tbgQuery.page, pageSize: tbgQuery.pageSize });
    tbgList.value = res?.list || [];
    tbgTotal.value = res?.total || 0;
  } catch (e) {
    console.error('[ZTP] load TBG list failed:', e);
  } finally {
    tbgLoading.value = false;
  }
}
function handleTbgPageChange(page: number) {
  tbgQuery.page = page;
  loadTBGList();
}
function handleTbgSizeChange(size: number) {
  tbgQuery.pageSize = size;
  tbgQuery.page = 1;
  loadTBGList();
}
function handleTbgSearch() {
  tbgQuery.page = 1;
  loadTBGList();
}
function openAddTbg() {
  isEditTbg.value = false;
  tbgForm.id = 0;
  tbgForm.name = '';
  tbgForm.ip = '';
  tbgForm.port = 8080;
  tbgDialogVisible.value = true;
}
function openEditTbg(row: any) {
  isEditTbg.value = true;
  tbgForm.id = row.id;
  tbgForm.name = row.name || '';
  tbgForm.ip = row.ip || '';
  tbgForm.port = row.port || 8080;
  tbgDialogVisible.value = true;
}
async function saveTbg() {
  if (!tbgForm.name || !tbgForm.ip) {
    ElMessage.warning(t('ztp.columnName') + ' / ' + t('ztp.columnIp'));
    return;
  }
  try {
    if (isEditTbg.value) {
      await modifyTBG({ id: tbgForm.id, name: tbgForm.name, ip: tbgForm.ip, port: tbgForm.port });
    } else {
      await addTBG({ name: tbgForm.name, ip: tbgForm.ip, port: tbgForm.port });
    }
    ElMessage.success(t('ztp.success'));
    tbgDialogVisible.value = false;
    loadTBGList();
  } catch (e) {
    console.error('[ZTP] save TBG failed:', e);
  }
}
async function handleDeleteTbg(row: any) {
  try {
    await ElMessageBox.confirm(t('ztp.confirmDeleteTbg', { name: row.name || row.id }), t('ztp.deleteTbg'), {
      type: 'warning',
    });
    await deleteTBG([row.id]);
    ElMessage.success(t('ztp.success'));
    loadTBGList();
  } catch (e) {
    if (e !== 'cancel') console.error('[ZTP] delete TBG failed:', e);
  }
}
async function handleImportTbg(file: File) {
  try {
    await importTBG(file);
    ElMessage.success(t('ztp.success'));
    loadTBGList();
  } catch (e) {
    console.error('[ZTP] import TBG failed:', e);
  }
  return false;
}
function handleDownloadTbgTemplate() {
  downloadTBGTemplate();
}

/* ============ PSAP-ID ============ */
const psapLoading = ref(false);
const psapList = ref<PSAPID[]>([]);
const psapTotal = ref(0);
const psapQuery = reactive({ psapId: '', page: 1, pageSize: 20 });
const syncLogDialogVisible = ref(false);
const syncLogList = ref<PSAPIDSyncLog[]>([]);
const syncLogTotal = ref(0);
const syncLogLoading = ref(false);
const syncLogQuery = reactive({ page: 1, pageSize: 20 });
const syncLoading = ref(false);

async function loadPSAPIDList() {
  psapLoading.value = true;
  try {
    const res = await getPSAPIDList({ psapId: psapQuery.psapId, page: psapQuery.page, pageSize: psapQuery.pageSize });
    psapList.value = res?.list || [];
    psapTotal.value = res?.total || 0;
  } catch (e) {
    console.error('[ZTP] load PSAP-ID list failed:', e);
  } finally {
    psapLoading.value = false;
  }
}
function handlePsapPageChange(page: number) {
  psapQuery.page = page;
  loadPSAPIDList();
}
function handlePsapSizeChange(size: number) {
  psapQuery.pageSize = size;
  psapQuery.page = 1;
  loadPSAPIDList();
}
function handlePsapSearch() {
  psapQuery.page = 1;
  loadPSAPIDList();
}
async function handleSyncPSAPID() {
  syncLoading.value = true;
  try {
    const tenantId = Number(authStore.tenantId) || 1;
    await syncPSAPID({ tenantId });
    ElMessage.success(t('ztp.syncSuccess'));
    loadPSAPIDList();
  } catch (e) {
    console.error('[ZTP] sync PSAP-ID failed:', e);
  } finally {
    syncLoading.value = false;
  }
}
async function openSyncLogs() {
  syncLogQuery.page = 1;
  syncLogDialogVisible.value = true;
  await loadSyncLogs();
}
async function loadSyncLogs() {
  syncLogLoading.value = true;
  try {
    const res = await getPSAPIDSyncLogs({ page: syncLogQuery.page, pageSize: syncLogQuery.pageSize });
    syncLogList.value = res?.list || [];
    syncLogTotal.value = res?.total || 0;
  } catch (e) {
    console.error('[ZTP] load sync logs failed:', e);
  } finally {
    syncLogLoading.value = false;
  }
}
function handleSyncLogPageChange(page: number) {
  syncLogQuery.page = page;
  loadSyncLogs();
}

onMounted(() => {
  loadDeviceGroups();
  loadResults();
  loadTBGList();
  loadPSAPIDList();
});
</script>

<template>
  <div class="ztp-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ========== ZTP 结果 ========== -->
      <el-tab-pane :label="t('ztp.tabResults')" name="results">
        <div class="page-header">
          <el-input
            v-model="resultQuery.searchText"
            :placeholder="t('ztp.searchPlaceholder')"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-radio-group v-model="resultQuery.succeedTab" @change="handleSearch">
            <el-radio-button :value="''">{{ t('ztp.all') }}</el-radio-button>
            <el-radio-button value="inprogress">{{ t('ztp.inProgress') }}</el-radio-button>
            <el-radio-button value="success">{{ t('ztp.success') }}</el-radio-button>
          </el-radio-group>
          <el-select v-model="resultQuery.progress" :placeholder="t('ztp.filterProgress')" clearable style="width: 160px" @change="handleSearch">
            <el-option :label="t('ztp.filterAll')" :value="''" />
            <el-option v-for="p in progressOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
          <el-select v-model="resultQuery.result" :placeholder="t('ztp.filterResult')" clearable style="width: 130px" @change="handleSearch">
            <el-option :label="t('ztp.filterAll')" :value="''" />
            <el-option :label="t('ztp.success')" :value="1" />
            <el-option :label="t('ztp.fail')" :value="2" />
          </el-select>
          <el-select v-model="resultQuery.deviceGroupId" :placeholder="t('ztp.filterDeviceGroup')" clearable filterable style="width: 180px" @change="handleSearch">
            <el-option v-for="g in deviceGroups" :key="g.id" :label="(g.group_name as string) || ''" :value="(g.id as string)" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('ztp.query') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('ztp.reset') }}</el-button>
          <el-button :icon="Refresh" @click="loadResults">{{ t('ztp.refresh') }}</el-button>
          <el-button type="warning" v-permission="'ZTP.BatchZTPRetry'" @click="openBatchReztp">{{ t('ztp.batchRetry') }}</el-button>
          <el-button type="info" v-permission="'ZTP.GetZTPSetting'" :icon="Setting" @click="openSetting">{{ t('ztp.setting') }}</el-button>
        </div>

        <el-table :data="resultList" v-loading="resultLoading" border stripe row-key="elementId"
          @selection-change="(rows: any) => (selectedRows = rows)">
          <el-table-column type="selection" width="46" reserve-selection />
          <el-table-column :label="t('ztp.columnStatus')" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" :label="t('ztp.columnDeviceName')" min-width="140" show-overflow-tooltip />
          <el-table-column prop="serialNumber" :label="t('ztp.columnSerialNumber')" min-width="150" show-overflow-tooltip />
          <el-table-column prop="mode" :label="t('ztp.columnMode')" width="120" />
          <el-table-column prop="mac" :label="t('ztp.columnMac')" width="140" />
          <el-table-column prop="ztpFileName" :label="t('ztp.columnFileName')" min-width="160" show-overflow-tooltip />
          <el-table-column :label="t('ztp.columnResult')" width="100">
            <template #default="{ row }">
              <el-tag :type="resultTagType(row.result)" size="small">{{ resultLabel(row.result) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('ztp.columnProgress')" width="130">
            <template #default="{ row }">
              <el-tag :type="progressTagType(row.progress)" size="small">{{ progressLabel(row.progress) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('ztp.columnInfo')" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.info || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('ztp.columnStartTime')" width="160">
            <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('ztp.columnEndTime')" width="160">
            <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('ztp.columnDuration')" width="110">
            <template #default="{ row }">{{ durationTime(row.startTime, row.endTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('ztp.log')" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="View" @click="viewLogs(row)">{{ t('ztp.log') }}</el-button>
              <el-button size="small" :icon="Document" @click="viewRetryLogs(row)">{{ t('ztp.retryLogs') }}</el-button>
              <el-button size="small" :icon="Document" @click="viewHistoryFiles(row)">{{ t('ztp.historyFiles') }}</el-button>
              <el-button size="small" :icon="RefreshRight" type="warning" @click="handleRetry([row])">{{ t('ztp.retry') }}</el-button>
              <el-button
                v-if="row.status !== 'enable'"
                size="small"
                :icon="Setting"
                @click="handleEnable([row])"
                >{{ t('ztp.enable') }}</el-button
              >
              <el-button v-else size="small" @click="handleDisable([row])">{{ t('ztp.disable') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <span class="sel-tip" v-if="selectedRows.length">{{ t('ztp.selectedCount', { count: selectedRows.length }) }}</span>
          <el-button
            v-if="selectedRows.length"
            size="small"
            type="warning"
            @click="handleRetry(selectedRows)"
            >{{ t('ztp.retry') }}</el-button
          >
          <el-button v-if="selectedRows.length" size="small" @click="handleEnable(selectedRows)">{{ t('ztp.enable') }}</el-button>
          <el-button v-if="selectedRows.length" size="small" @click="handleDisable(selectedRows)">{{ t('ztp.disable') }}</el-button>
          <el-pagination
            v-model:current-page="resultQuery.page"
            v-model:page-size="resultQuery.pageSize"
            :total="resultTotal"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleResultSizeChange"
            @current-change="handleResultPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== TBG 管理 ========== -->
      <el-tab-pane :label="t('ztp.tabTbg')" name="tbg">
        <div class="page-header">
          <el-input v-model="tbgQuery.name" :placeholder="t('ztp.columnName')" clearable style="width: 200px"
            @keyup.enter="handleTbgSearch" @clear="handleTbgSearch" />
          <el-button type="primary" :icon="Search" @click="handleTbgSearch">{{ t('ztp.query') }}</el-button>
          <el-button v-permission="'ZTP.AddTBG'" type="primary" :icon="Plus" @click="openAddTbg">{{ t('ztp.addTbg') }}</el-button>
          <el-upload
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="(file: any) => { handleImportTbg(file); return false; }"
          >
            <el-button v-permission="'ZTP.ImportTBGFile'" :icon="Upload">{{ t('ztp.importTbg') }}</el-button>
          </el-upload>
          <el-button v-permission="'ZTP.ImportTBGFile'" :icon="Download" @click="handleDownloadTbgTemplate">{{ t('ztp.downloadTemplate') }}</el-button>
          <el-button :icon="Refresh" @click="loadTBGList">{{ t('ztp.refresh') }}</el-button>
        </div>

        <el-table :data="tbgList" v-loading="tbgLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" :label="t('ztp.columnName')" min-width="160" />
          <el-table-column prop="ip" :label="t('ztp.columnIp')" min-width="140" />
          <el-table-column prop="port" :label="t('ztp.columnPort')" width="100" />
          <el-table-column :label="t('ztp.columnCreateTime')" min-width="160">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('ztp.log')" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" v-permission="'ZTP.ModifyTBG'" @click="openEditTbg(row)">{{ t('ztp.editTbg') }}</el-button>
              <el-button size="small" type="danger" :icon="Delete" v-permission="'ZTP.DeleteTBG'" @click="handleDeleteTbg(row)">{{ t('ztp.deleteTbg') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="tbgQuery.page"
            v-model:page-size="tbgQuery.pageSize"
            :total="tbgTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleTbgSizeChange"
            @current-change="handleTbgPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== PSAP ID ========== -->
      <el-tab-pane :label="t('ztp.tabPsap')" name="psap">
        <div class="page-header">
          <el-input v-model="psapQuery.psapId" :placeholder="t('ztp.columnPsapId')" clearable style="width: 220px"
            @keyup.enter="handlePsapSearch" @clear="handlePsapSearch" />
          <el-button type="primary" :icon="Search" @click="handlePsapSearch">{{ t('ztp.query') }}</el-button>
          <el-button :icon="Refresh" @click="loadPSAPIDList">{{ t('ztp.refresh') }}</el-button>
          <el-button type="success" :icon="RefreshRight" v-loading="syncLoading" v-permission="'ZTP.SyncPSAPID'" @click="handleSyncPSAPID">{{ t('ztp.sync') }}</el-button>
          <el-button :icon="Document" v-permission="'ZTP.ListSyncPSAPIDLog'" @click="openSyncLogs">{{ t('ztp.syncLogs') }}</el-button>
        </div>

        <el-table :data="psapList" v-loading="psapLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="psap_id" :label="t('ztp.columnPsapId')" min-width="160" />
          <el-table-column prop="name" :label="t('ztp.columnName')" min-width="140" />
          <el-table-column prop="address" :label="t('ztp.columnAddress')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="latitude" :label="t('ztp.columnLatitude')" width="120" />
          <el-table-column prop="longitude" :label="t('ztp.columnLongitude')" width="120" />
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="psapQuery.page"
            v-model:page-size="psapQuery.pageSize"
            :total="psapTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePsapSizeChange"
            @current-change="handlePsapPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ========== ZTP 日志 ========== -->
    <el-dialog :title="t('ztp.log')" v-model="logDialogVisible" width="720px">
      <el-table :data="logList" v-loading="logLoading" border stripe max-height="420">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="progress" :label="t('ztp.columnProgress')" width="90">
          <template #default="{ row }">
            <el-tag :type="progressTagType(row.progress)" size="small">{{ progressLabel(row.progress) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="done" :label="t('ztp.columnStatus')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.done ? 'success' : 'warning'" size="small">{{ row.done ? t('ztp.success') : t('ztp.inProgress') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="info" :label="t('ztp.columnInfo')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="t('ztp.columnStartTime')" width="160">
          <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
        </el-table-column>
        <el-table-column :label="t('ztp.columnEndTime')" width="160">
          <template #default="{ row }">{{ formatTime(row.end_time) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- ========== 重试日志 ========== -->
    <el-dialog :title="t('ztp.retryLogs')" v-model="retryLogDialogVisible" width="720px">
      <el-table :data="retryLogList" v-loading="retryLogLoading" border stripe max-height="420">
        <el-table-column prop="operationDate" :label="t('ztp.columnStartTime')" min-width="180" />
        <el-table-column prop="message" :label="t('ztp.columnInfo')" min-width="280" show-overflow-tooltip />
      </el-table>
    </el-dialog>

    <!-- ========== 历史文件 ========== -->
    <el-dialog :title="t('ztp.historyFiles')" v-model="historyDialogVisible" width="760px">
      <el-table :data="historyList" v-loading="historyLoading" border stripe max-height="420">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="neName" :label="t('ztp.columnDeviceName')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="fileName" :label="t('ztp.columnFileName')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="t('ztp.columnStartTime')" min-width="170">
          <template #default="{ row }">{{ formatTime(row.generateTime) }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="historyTotal > historyQuery.pageSize">
        <el-pagination
          v-model:current-page="historyQuery.page"
          :page-size="historyQuery.pageSize"
          :total="historyTotal"
          layout="total, prev, pager, next"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>

    <!-- ========== 批量重开 ZTP ========== -->
    <el-dialog :title="t('ztp.batchReztpTitle')" v-model="batchReztpDialogVisible" width="520px">
      <el-form label-width="100px">
        <el-form-item :label="t('ztp.scope')">
          <el-select v-model="batchReztpScope">
            <el-option :label="t('ztp.scopeElement')" value="element" />
            <el-option :label="t('ztp.scopeDeviceGroup')" value="deviceGroup" />
            <el-option :label="t('ztp.scopeMarket')" value="market" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchReztpScope !== 'element'" :label="t('ztp.idList')">
          <el-input v-model="batchReztpIds" type="textarea" :rows="3" :placeholder="t('ztp.idList')" />
        </el-form-item>
        <el-form-item v-else :label="t('ztp.selectedCount', { count: 0 })">
          <span>{{ t('ztp.selectedCount', { count: selectedRows.length }) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchReztpDialogVisible = false">{{ t('ztp.reset') }}</el-button>
        <el-button type="primary" @click="submitBatchReztp">{{ t('ztp.submit') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== ZTP 配置 ========== -->
    <el-dialog :title="t('ztp.settingTitle')" v-model="settingDialogVisible" width="560px" v-loading="settingLoading">
      <el-form :model="settingForm" label-width="200px">
        <el-form-item :label="t('ztp.gnbIdStart')">
          <el-input-number v-model="settingForm.gnbIdStart" :min="0" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.gnbIdEnd')">
          <el-input-number v-model="settingForm.gnbIdEnd" :min="0" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.tacStart')">
          <el-input-number v-model="settingForm.tacStart" :min="0" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.tacEnd')">
          <el-input-number v-model="settingForm.tacEnd" :min="0" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.ztpTimeoutTime')">
          <el-input-number v-model="settingForm.ztpTimeoutTime" :min="1" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.radiusThreshold')">
          <el-input-number v-model="settingForm.radiusThreshold" :min="0" :controls="false" style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('ztp.wifiPositioning')">
          <el-switch v-model="settingForm.wifiPositioning" />
        </el-form-item>
        <el-form-item :label="t('ztp.ptpEnable')">
          <el-switch v-model="settingForm.ptpEnable" />
        </el-form-item>
        <el-form-item :label="t('ztp.spectrumSpatialUrl')">
          <el-input v-model="settingForm.spectrumSpatialUrl" />
        </el-form-item>
        <el-form-item :label="t('ztp.msagUrl')">
          <el-input v-model="settingForm.msagUrl" />
        </el-form-item>
        <el-form-item :label="t('ztp.bmcUrl')">
          <el-input v-model="settingForm.bmcUrl" />
        </el-form-item>
        <el-form-item :label="t('ztp.gmlcUrl')">
          <el-input v-model="settingForm.gmlcUrl" />
        </el-form-item>
        <el-form-item :label="t('ztp.tPlatformUrl')">
          <el-input v-model="settingForm.tPlatformUrl" />
        </el-form-item>
        <el-form-item :label="t('ztp.lmfUrls')">
          <el-input v-model="settingForm.lmfUrls" />
        </el-form-item>
        <el-form-item :label="t('ztp.sftpUsername')">
          <el-input v-model="settingForm.sftpUsername" />
        </el-form-item>
        <el-form-item :label="t('ztp.sftpPassword')">
          <el-input v-model="settingForm.sftpPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingDialogVisible = false">{{ t('ztp.reset') }}</el-button>
        <el-button type="primary" v-permission="'ZTP.ModifyZTPSetting'" @click="saveSetting">{{ t('ztp.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== TBG 编辑 ========== -->
    <el-dialog :title="isEditTbg ? t('ztp.editTbg') : t('ztp.addTbg')" v-model="tbgDialogVisible" width="500px">
      <el-form :model="tbgForm" label-width="100px">
        <el-form-item :label="t('ztp.columnName')" required>
          <el-input v-model="tbgForm.name" />
        </el-form-item>
        <el-form-item :label="t('ztp.columnIp')" required>
          <el-input v-model="tbgForm.ip" />
        </el-form-item>
        <el-form-item :label="t('ztp.columnPort')">
          <el-input-number v-model="tbgForm.port" :min="1" :max="65535" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tbgDialogVisible = false">{{ t('ztp.reset') }}</el-button>
        <el-button type="primary" @click="saveTbg">{{ t('ztp.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== PSAP 同步日志 ========== -->
    <el-dialog :title="t('ztp.syncLogs')" v-model="syncLogDialogVisible" width="720px">
      <el-table :data="syncLogList" v-loading="syncLogLoading" border stripe max-height="420">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="operator" :label="t('ztp.columnOperator')" width="140" />
          <el-table-column :label="t('ztp.columnSyncStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? t('ztp.success') : t('ztp.fail') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="detail" :label="t('ztp.columnDetail')" min-width="240" show-overflow-tooltip />
        <el-table-column :label="t('ztp.columnStartTime')" width="170">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="syncLogTotal > 0">
        <el-pagination
          v-model:current-page="syncLogQuery.page"
          v-model:page-size="syncLogQuery.pageSize"
          :total="syncLogTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handleSyncLogPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.ztp-page {
  padding: 16px;
}
.page-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.sel-tip {
  margin-right: auto;
  color: var(--el-color-primary);
  font-size: 13px;
}
</style>

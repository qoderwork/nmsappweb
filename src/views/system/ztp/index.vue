<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
  ElTag,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElSwitch,
  ElUpload,
} from 'element-plus';
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Download,
  Upload,
  Setting,
  View,
  RefreshRight,
  Document,
} from '@element-plus/icons-vue';

import {
  // ZTP
  getZTPResults,
  getZTPSetting,
  saveZTPSetting,
  getZTPLogs,
  getZTPRetryLogs,
  getZTPHistoryFiles,
  setZTPStatus,
  batchReztp,
  deleteZTPFiles,
  // TBG
  getTBGList,
  addTBG,
  modifyTBG,
  deleteTBG,
  importTBG,
  downloadTBGTemplate,
  // PSAP-ID
  getPSAPIDList,
  syncPSAPID,
  getPSAPIDSyncLogs,
  // North Reports
  getNorthReports,
  createNorthReport,
  updateNorthReport,
  deleteNorthReport,
} from '@/api/ztp';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
import type {
  ZTPResultVo,
  ZTPLog,
  ZTPSetting,
  ZTPRetryLogVo,
  HistoryZTPFileVo,
  TBG,
  PSAPID,
  PSAPIDSyncLog,
  NorthReport,
} from '@/api/ztp';

const activeTab = ref('results');

/* ============ ZTP 结果 ============ */
const resultLoading = ref(false);
const resultList = ref<ZTPResultVo[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({
  searchText: '',
  progress: '',
  result: '',
  page: 1,
  pageSize: 20,
});

const logDialogVisible = ref(false);
const logList = ref<ZTPLog[]>([]);
const logLoading = ref(false);
const currentLogElementId = ref(0);

const retryLogDialogVisible = ref(false);
const retryLogList = ref<ZTPRetryLogVo[]>([]);
const retryLogLoading = ref(false);

const historyDialogVisible = ref(false);
const historyList = ref<HistoryZTPFileVo[]>([]);
const historyTotal = ref(0);
const historyLoading = ref(false);
const historyQuery = reactive({
  elementId: 0,
  page: 1,
  pageSize: 20,
});

const batchReztpDialogVisible = ref(false);
const batchReztpScope = ref<'element' | 'deviceGroup' | 'market'>('element');
const batchReztpIds = ref('');

async function loadResults() {
  resultLoading.value = true;
  try {
    const res = await getZTPResults(resultQuery);
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

async function viewLogs(row: ZTPResultVo) {
  currentLogElementId.value = row.elementId;
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

async function viewRetryLogs(row: ZTPResultVo) {
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

async function viewHistoryFiles(row: ZTPResultVo) {
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

async function handleRetry(row: ZTPResultVo) {
  try {
    await ElMessageBox.confirm(`确定要对网元 "${row.elementName}" 重新执行 ZTP 吗？`, '重试确认', { type: 'warning' });
    await batchReztp({ scope: 'element', elementIds: [row.elementId] });
    ElMessage.success('已提交重试');
    loadResults();
  } catch (e) {
    if (e !== 'cancel') console.error('[ZTP] retry failed:', e);
  }
}

async function handleToggleStatus(row: ZTPResultVo) {
  const newStatus = row.progress === 'enable' ? 'disable' : 'enable';
  try {
    await setZTPStatus({ elementIds: [row.elementId], status: newStatus });
    ElMessage.success('状态已更新');
    loadResults();
  } catch (e) {
    console.error('[ZTP] toggle status failed:', e);
  }
}

function openBatchReztp() {
  batchReztpScope.value = 'element';
  batchReztpIds.value = '';
  batchReztpDialogVisible.value = true;
}

async function submitBatchReztp() {
  const ids = batchReztpIds.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !isNaN(n));

  if (ids.length === 0) {
    ElMessage.warning('请输入有效的 ID');
    return;
  }

  try {
    const req: Record<string, unknown> = { scope: batchReztpScope.value };
    if (batchReztpScope.value === 'element') req.elementIds = ids;
    else if (batchReztpScope.value === 'deviceGroup') req.deviceGroupIds = ids;
    else req.markets = ids.map(String);

    await batchReztp(req as any);
    ElMessage.success('批量重开已提交');
    batchReztpDialogVisible.value = false;
    loadResults();
  } catch (e) {
    console.error('[ZTP] batch reztp failed:', e);
  }
}

function getResultTagType(result: string) {
  if (result === 'success' || result === 'succeed') return 'success';
  if (result === 'failed' || result === 'failure') return 'danger';
  if (result === 'running' || result === 'in_progress') return 'warning';
  return 'info';
}

function getSucceedTagType(succeed: boolean) {
  return succeed ? 'success' : 'danger';
}

/* ============ ZTP 配置 ============ */
const settingLoading = ref(false);
const settingForm = reactive<ZTPSetting>({
  enable: false,
  tbgServerId: undefined,
  provisionTimeout: 300,
  retryCount: 3,
  retryInterval: 60,
});

async function loadSetting() {
  settingLoading.value = true;
  try {
    const result = await getZTPSetting();
    Object.assign(settingForm, result);
  } catch (e) {
    console.error('[ZTP] load setting failed:', e);
  } finally {
    settingLoading.value = false;
  }
}

async function saveSetting() {
  try {
    await saveZTPSetting({ ...settingForm });
    ElMessage.success('配置保存成功');
  } catch (e) {
    console.error('[ZTP] save setting failed:', e);
  }
}

/* ============ TBG 管理 ============ */
const tbgLoading = ref(false);
const tbgList = ref<TBG[]>([]);
const tbgTotal = ref(0);
const tbgQuery = reactive({
  name: '',
  page: 1,
  pageSize: 20,
});
const tbgDialogVisible = ref(false);
const isEditTbg = ref(false);
const tbgForm = reactive({
  id: undefined as number | undefined,
  name: '',
  ip: '',
  port: 8080,
});

async function loadTBGList() {
  tbgLoading.value = true;
  try {
    const res = await getTBGList(tbgQuery);
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

function openAddTbg() {
  isEditTbg.value = false;
  tbgForm.id = undefined;
  tbgForm.name = '';
  tbgForm.ip = '';
  tbgForm.port = 8080;
  tbgDialogVisible.value = true;
}

function openEditTbg(row: TBG) {
  isEditTbg.value = true;
  tbgForm.id = row.id;
  tbgForm.name = row.name;
  tbgForm.ip = row.ip;
  tbgForm.port = row.port;
  tbgDialogVisible.value = true;
}

async function saveTbg() {
  if (!tbgForm.name || !tbgForm.ip) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    if (isEditTbg.value && tbgForm.id !== undefined) {
      await modifyTBG({ id: tbgForm.id, name: tbgForm.name, ip: tbgForm.ip, port: tbgForm.port });
      ElMessage.success('修改成功');
    } else {
      await addTBG({ name: tbgForm.name, ip: tbgForm.ip, port: tbgForm.port });
      ElMessage.success('添加成功');
    }
    tbgDialogVisible.value = false;
    loadTBGList();
  } catch (e) {
    console.error('[ZTP] save TBG failed:', e);
  }
}

async function handleDeleteTbg(row: TBG) {
  try {
    await ElMessageBox.confirm(`确定要删除 TBG "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteTBG([row.id]);
    ElMessage.success('删除成功');
    loadTBGList();
  } catch (e) {
    if (e !== 'cancel') console.error('[ZTP] delete TBG failed:', e);
  }
}

async function handleImportTbg(file: File) {
  try {
    const res = await importTBG(file);
    ElMessage.success(`导入成功，共 ${res?.count ?? 0} 条`);
    loadTBGList();
  } catch (e) {
    console.error('[ZTP] import TBG failed:', e);
  }
  return false; // prevent el-upload default
}

function handleDownloadTbgTemplate() {
  downloadTBGTemplate();
}

/* ============ PSAP-ID ============ */
const psapLoading = ref(false);
const psapList = ref<PSAPID[]>([]);
const psapTotal = ref(0);
const psapQuery = reactive({
  psapId: '',
  page: 1,
  pageSize: 20,
});

const syncLogDialogVisible = ref(false);
const syncLogList = ref<PSAPIDSyncLog[]>([]);
const syncLogTotal = ref(0);
const syncLogLoading = ref(false);
const syncLogQuery = reactive({
  page: 1,
  pageSize: 20,
});

const syncLoading = ref(false);

async function loadPSAPIDList() {
  psapLoading.value = true;
  try {
    const res = await getPSAPIDList(psapQuery);
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

async function handleSyncPSAPID() {
  syncLoading.value = true;
  try {
    const licenseId = Number(authStore.licenseId) || 1;
    const res = await syncPSAPID({ licenseId });
    ElMessage.success(`同步完成，共 ${res?.count ?? 0} 条`);
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
    const res = await getPSAPIDSyncLogs(syncLogQuery);
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

function handleSyncLogSizeChange(size: number) {
  syncLogQuery.pageSize = size;
  syncLogQuery.page = 1;
  loadSyncLogs();
}

/* ============ 北向报告 ============ */
const reportLoading = ref(false);
const reportList = ref<NorthReport[]>([]);
const reportDialogVisible = ref(false);
const isEditReport = ref(false);
const reportForm = reactive<NorthReport>({
  id: undefined,
  name: '',
  type: '',
  schedule: '',
  enabled: true,
  description: '',
});

async function loadReports() {
  reportLoading.value = true;
  try {
    reportList.value = (await getNorthReports()) || [];
  } catch (e) {
    console.error('[ZTP] load north reports failed:', e);
  } finally {
    reportLoading.value = false;
  }
}

function openAddReport() {
  isEditReport.value = false;
  reportForm.id = undefined;
  reportForm.name = '';
  reportForm.type = '';
  reportForm.schedule = '';
  reportForm.enabled = true;
  reportForm.description = '';
  reportDialogVisible.value = true;
}

function openEditReport(row: NorthReport) {
  isEditReport.value = true;
  reportForm.id = row.id;
  reportForm.name = row.name;
  reportForm.type = row.type || '';
  reportForm.schedule = row.schedule || '';
  reportForm.enabled = row.enabled ?? true;
  reportForm.description = row.description || '';
  reportDialogVisible.value = true;
}

async function saveReport() {
  if (!reportForm.name) {
    ElMessage.warning('请输入报告名称');
    return;
  }
  try {
    if (isEditReport.value && reportForm.id !== undefined) {
      await updateNorthReport(reportForm.id, { ...reportForm });
      ElMessage.success('修改成功');
    } else {
      await createNorthReport({ ...reportForm });
      ElMessage.success('创建成功');
    }
    reportDialogVisible.value = false;
    loadReports();
  } catch (e) {
    console.error('[ZTP] save north report failed:', e);
  }
}

async function handleDeleteReport(row: NorthReport) {
  try {
    await ElMessageBox.confirm(`确定要删除报告 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteNorthReport(row.id!);
    ElMessage.success('删除成功');
    loadReports();
  } catch (e) {
    if (e !== 'cancel') console.error('[ZTP] delete north report failed:', e);
  }
}

/* ============ 工具函数 ============ */
function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function formatFileSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

onMounted(() => {
  loadResults();
  loadSetting();
  loadTBGList();
  loadPSAPIDList();
  loadReports();
});
</script>

<template>
  <div class="ztp-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ========== ZTP 结果 ========== -->
      <el-tab-pane label="ZTP 结果" name="results">
        <div class="page-header">
          <el-input
            v-model="resultQuery.searchText"
            placeholder="搜索网元名称 / 序列号"
            clearable
            style="width: 260px;"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select v-model="resultQuery.progress" placeholder="进度筛选" clearable style="width: 160px;" @change="handleSearch">
            <el-option label="待执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-select v-model="resultQuery.result" placeholder="结果筛选" clearable style="width: 160px;" @change="handleSearch">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="loadResults">刷新</el-button>
          <el-button type="warning" @click="openBatchReztp">批量重开</el-button>
        </div>

        <el-table :data="resultList" v-loading="resultLoading" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="elementName" label="网元名称" min-width="140" />
          <el-table-column prop="serialNumber" label="序列号" min-width="140" />
          <el-table-column prop="deviceGroupName" label="设备组" min-width="120" />
          <el-table-column prop="progress" label="进度" width="110">
            <template #default="{ row }">
              <el-tag :type="getResultTagType(row.progress)" size="small">
                {{ row.progress || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="getResultTagType(row.result)" size="small">
                {{ row.result || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="succeed" label="是否成功" width="100">
            <template #default="{ row }">
              <el-tag :type="getSucceedTagType(row.succeed)" size="small">
                {{ row.succeed ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="170">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="170">
            <template #default="{ row }">
              {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="View" @click="viewLogs(row as ZTPResultVo)">日志</el-button>
              <el-button size="small" type="warning" :icon="RefreshRight" @click="handleRetry(row as ZTPResultVo)">重试</el-button>
              <el-button size="small" :icon="Document" @click="viewRetryLogs(row as ZTPResultVo)">重试日志</el-button>
              <el-button size="small" type="info" :icon="Document" @click="viewHistoryFiles(row as ZTPResultVo)">历史文件</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="resultQuery.page"
            v-model:page-size="resultQuery.pageSize"
            :total="resultTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleResultSizeChange"
            @current-change="handleResultPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ========== ZTP 配置 ========== -->
      <el-tab-pane label="ZTP 配置" name="settings">
        <el-card shadow="never" v-loading="settingLoading">
          <el-form :model="settingForm" label-width="200px">
            <el-form-item label="启用 ZTP">
              <el-switch v-model="settingForm.enable" />
            </el-form-item>
            <el-form-item label="TBG 服务器 ID">
              <el-input-number v-model="settingForm.tbgServerId" :min="0" />
            </el-form-item>
            <el-form-item label="开通超时时间（秒）">
              <el-input-number v-model="settingForm.provisionTimeout" :min="60" :max="3600" />
            </el-form-item>
            <el-form-item label="重试次数">
              <el-input-number v-model="settingForm.retryCount" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="重试间隔（秒）">
              <el-input-number v-model="settingForm.retryInterval" :min="10" :max="3600" />
            </el-form-item>
            <el-form-item>
              <el-button v-permission="'ztp.saveSetting'" type="primary" :icon="Setting" @click="saveSetting">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ========== TBG 管理 ========== -->
      <el-tab-pane label="TBG 管理" name="tbg">
        <div class="page-header">
          <el-button v-permission="'ztp.addTbg'" type="primary" :icon="Plus" @click="openAddTbg">新增 TBG</el-button>
          <el-upload
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="(file: any) => { handleImportTbg(file); return false; }"
          >
            <el-button :icon="Upload">导入</el-button>
          </el-upload>
          <el-button :icon="Download" @click="handleDownloadTbgTemplate">下载模板</el-button>
          <el-button :icon="Refresh" @click="loadTBGList">刷新</el-button>
        </div>

        <el-table :data="tbgList" v-loading="tbgLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column prop="ip" label="IP 地址" min-width="140" />
          <el-table-column prop="port" label="端口" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="openEditTbg(row as TBG)">编辑</el-button>
              <el-button v-permission="'ztp.deleteTbg'" size="small" type="danger" :icon="Delete" @click="handleDeleteTbg(row as TBG)">删除</el-button>
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

      <!-- ========== PSAP-ID ========== -->
      <el-tab-pane label="PSAP-ID" name="psapid">
        <div class="page-header">
          <el-input
            v-model="psapQuery.psapId"
            placeholder="搜索 PSAP-ID"
            clearable
            style="width: 220px;"
            @keyup.enter="() => { psapQuery.page = 1; loadPSAPIDList(); }"
            @clear="() => { psapQuery.page = 1; loadPSAPIDList(); }"
          />
          <el-button type="primary" :icon="Search" @click="() => { psapQuery.page = 1; loadPSAPIDList(); }">查询</el-button>
          <el-button :icon="Refresh" @click="loadPSAPIDList">刷新</el-button>
          <el-button type="success" :icon="RefreshRight" v-loading="syncLoading" @click="handleSyncPSAPID">同步</el-button>
          <el-button :icon="Document" @click="openSyncLogs">同步日志</el-button>
        </div>

        <el-table :data="psapList" v-loading="psapLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="psapId" label="PSAP-ID" min-width="160" />
          <el-table-column prop="latitude" label="纬度" width="120" />
          <el-table-column prop="longitude" label="经度" width="120" />
          <el-table-column prop="marketId" label="市场 ID" width="100" />
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

      <!-- ========== 北向报告 ========== -->
      <el-tab-pane label="北向报告" name="reports">
        <div class="page-header">
          <el-button v-permission="'ztp.addReport'" type="primary" :icon="Plus" @click="openAddReport">新增报告</el-button>
          <el-button :icon="Refresh" @click="loadReports">刷新</el-button>
        </div>

        <el-table :data="reportList" v-loading="reportLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="报告名称" min-width="180" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="schedule" label="调度计划" min-width="140" />
          <el-table-column prop="enabled" label="启用状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                {{ row.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="openEditReport(row as NorthReport)">编辑</el-button>
              <el-button v-permission="'ztp.deleteReport'" size="small" type="danger" :icon="Delete" @click="handleDeleteReport(row as NorthReport)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ========== ZTP 日志对话框 ========== -->
    <el-dialog title="ZTP 日志" v-model="logDialogVisible" width="700px">
      <el-table :data="logList" v-loading="logLoading" border stripe max-height="400">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="step" label="步骤" width="140" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getResultTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="timestamp" label="时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- ========== 重试日志对话框 ========== -->
    <el-dialog title="ZTP 重试日志" v-model="retryLogDialogVisible" width="700px">
      <el-table :data="retryLogList" v-loading="retryLogLoading" border stripe max-height="400">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="retryCount" label="重试次数" width="100" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getResultTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="timestamp" label="时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- ========== 历史文件对话框 ========== -->
    <el-dialog title="ZTP 历史文件" v-model="historyDialogVisible" width="750px">
      <el-table :data="historyList" v-loading="historyLoading" border stripe max-height="400">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件类型" width="110" />
        <el-table-column prop="fileSize" label="文件大小" width="110">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.uploadTime) }}
          </template>
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

    <!-- ========== 批量重开对话框 ========== -->
    <el-dialog title="批量重开 ZTP" v-model="batchReztpDialogVisible" width="500px">
      <el-form label-width="100px">
        <el-form-item label="范围">
          <el-select v-model="batchReztpScope">
            <el-option label="网元" value="element" />
            <el-option label="设备组" value="deviceGroup" />
            <el-option label="市场" value="market" />
          </el-select>
        </el-form-item>
        <el-form-item label="ID 列表">
          <el-input
            v-model="batchReztpIds"
            type="textarea"
            :rows="3"
            placeholder="输入 ID，多个用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchReztpDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchReztp">提交</el-button>
      </template>
    </el-dialog>

    <!-- ========== TBG 编辑对话框 ========== -->
    <el-dialog :title="isEditTbg ? '编辑 TBG' : '新增 TBG'" v-model="tbgDialogVisible" width="500px">
      <el-form :model="tbgForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="tbgForm.name" placeholder="请输入 TBG 名称" />
        </el-form-item>
        <el-form-item label="IP 地址" required>
          <el-input v-model="tbgForm.ip" placeholder="请输入 IP 地址" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="tbgForm.port" :min="1" :max="65535" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tbgDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTbg">确定</el-button>
      </template>
    </el-dialog>

    <!-- ========== PSAP-ID 同步日志对话框 ========== -->
    <el-dialog title="PSAP-ID 同步日志" v-model="syncLogDialogVisible" width="700px">
      <el-table :data="syncLogList" v-loading="syncLogLoading" border stripe max-height="400">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="licenseId" label="License ID" width="110" />
        <el-table-column prop="count" label="同步数量" width="100" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getResultTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="160" show-overflow-tooltip />
        <el-table-column prop="syncTime" label="同步时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.syncTime) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="syncLogTotal > 0">
        <el-pagination
          v-model:current-page="syncLogQuery.page"
          v-model:page-size="syncLogQuery.pageSize"
          :total="syncLogTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSyncLogSizeChange"
          @current-change="handleSyncLogPageChange"
        />
      </div>
    </el-dialog>

    <!-- ========== 北向报告编辑对话框 ========== -->
    <el-dialog :title="isEditReport ? '编辑北向报告' : '新增北向报告'" v-model="reportDialogVisible" width="550px">
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="报告名称" required>
          <el-input v-model="reportForm.name" placeholder="请输入报告名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="reportForm.type" placeholder="请输入报告类型" />
        </el-form-item>
        <el-form-item label="调度计划">
          <el-input v-model="reportForm.schedule" placeholder="例如: 0 2 * * *（cron 表达式）" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="reportForm.enabled" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="reportForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReport">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ztp-management-page {
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
  margin-top: 16px;
}
</style>

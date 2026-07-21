<script setup lang="ts">
/**
 * 告警管理页面（完整版）
 *
 * 功能：
 * - 两个主标签页：告警监控 / 告警库
 * - 告警模板侧边栏（增删改查、邮件通知开关）
 * - 告警列表（搜索、筛选、分页、批量操作）
 * - 告警详情、评论、确认/取消确认、清除、删除
 * - 告警过滤器管理
 * - 告警同步配置 / 邮件通知配置
 * - 告警库导入/下载模板/删除
 * - 告警严重级别饼图（ECharts）
 * - WebSocket 实时告警推送
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus';
import {
  Search, Refresh, Warning, CircleCheck, CircleClose, Delete,
  Plus, Setting, Message, Filter, Download, Upload, Picture,
  MoreFilled, Edit, View,
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { useI18n } from 'vue-i18n';

import {
  getAlarms, getAlarm, deleteAlarm, clearAlarm, confirmAlarm, unconfirmAlarm,
  batchClearAlarms, addCommentForAlarm, getSeverityCount, getAlarmStatisticTopN,
  getAlarmStatistic, getActiveAlarmProbableCause, getAlarmEventType,
  getAlarmLibrary, deleteAlarmLibrary, importAlarmLibrary, downloadAlarmLibraryTemplate,
  getAlarmTemplates, createAlarmTemplate, updateAlarmTemplate, deleteAlarmTemplate,
  getAlarmTemplate, updateAlarmTemplateEmailNotification,
  getAlarmFilters, createAlarmFilter, updateAlarmFilter, deleteAlarmFilter, toggleAlarmFilterEnable,
  getAlarmSyncConfig, updateAlarmSyncConfig,
  getEmailNotificationConfig, updateEmailNotificationConfig,
} from '@/api/alarm';
import type {
  Alarm, AlarmQueryParams, AlarmSeverity, AlarmLibrary as AlarmLibraryType,
  AlarmTemplate, AlarmFilter, AlarmSyncConfig, EmailNotificationConfig,
  SeverityCount,
} from '@/types/alarm';
import { AlarmStatus, AlarmType } from '@/types/alarm';
import { http } from '@/utils/request';
import { useAlarmPush, WsTopics, type AlarmPushMessage } from '@/composables/useWebSocketMessage';

const { t } = useI18n();

// ============ 主标签页 ============
const activeTab = ref('monitor');

// ============ 告警模板侧边栏 ============
const templateList = ref<AlarmTemplate[]>([]);
const selectedTemplateId = ref<number | null>(null);
const templateLoading = ref(false);

async function loadTemplates() {
  templateLoading.value = true;
  try {
    templateList.value = await getAlarmTemplates();
  } catch (e) {
    console.error('[Alarm] load templates failed:', e);
  } finally {
    templateLoading.value = false;
  }
}

function handleSelectTemplate(tpl: AlarmTemplate) {
  selectedTemplateId.value = selectedTemplateId.value === tpl.id ? null : tpl.id;
  queryParams.page = 1;
  loadData();
}

// 模板右键菜单
const templateContextMenuVisible = ref(false);
const templateContextMenuTarget = ref<AlarmTemplate | null>(null);
const templateContextMenuPos = reactive({ x: 0, y: 0 });

function handleTemplateContextMenu(e: MouseEvent, tpl: AlarmTemplate) {
  e.preventDefault();
  templateContextMenuTarget.value = tpl;
  templateContextMenuPos.x = e.clientX;
  templateContextMenuPos.y = e.clientY;
  templateContextMenuVisible.value = true;
}

function closeContextMenu() {
  templateContextMenuVisible.value = false;
}

// 模板弹窗
const templateDialogVisible = ref(false);
const templateDialogMode = ref<'add' | 'edit'>('add');
const templateFormLoading = ref(false);
const templateForm = reactive({
  id: undefined as number | undefined,
  name: '',
  description: '',
  enableEmailNotification: false,
  emails: '',
  executeOnAllBaseStation: false,
  executeOnAllCPE: false,
  executeOnAllAlarm: false,
  baseStationIds: '',
  cpeIds: '',
  alarmIds: '',
});

function openAddTemplateDialog() {
  templateDialogMode.value = 'add';
  Object.assign(templateForm, {
    id: undefined,
    name: '',
    description: '',
    enableEmailNotification: false,
    emails: '',
    executeOnAllBaseStation: false,
    executeOnAllCPE: false,
    executeOnAllAlarm: false,
    baseStationIds: '',
    cpeIds: '',
    alarmIds: '',
  });
  templateDialogVisible.value = true;
}

async function openEditTemplateDialog(tpl: AlarmTemplate) {
  templateDialogMode.value = 'edit';
  templateFormLoading.value = true;
  try {
    const detail = await getAlarmTemplate(tpl.id);
    templateForm.id = detail.id;
    templateForm.name = detail.name ?? '';
    templateForm.description = detail.description ?? '';
    templateForm.enableEmailNotification = !!detail.enableEmailNotification;
    templateForm.emails = detail.emails ?? '';
    templateForm.executeOnAllBaseStation = !!detail.executeOnAllBaseStation;
    templateForm.executeOnAllCPE = !!detail.executeOnAllCPE;
    templateForm.executeOnAllAlarm = !!detail.executeOnAllAlarm;
    templateForm.baseStationIds = detail.baseStationIds ?? '';
    templateForm.cpeIds = detail.cpeIds ?? '';
    templateForm.alarmIds = detail.alarmIds ?? '';
  } catch (e) {
    console.error('[Alarm] load template detail failed:', e);
  } finally {
    templateFormLoading.value = false;
    templateDialogVisible.value = true;
  }
}

async function handleSaveTemplate() {
  if (!templateForm.name?.trim()) {
    ElMessage.warning(t('alarm.enterTemplateName'));
    return;
  }
  templateFormLoading.value = true;
  try {
    if (templateDialogMode.value === 'add') {
      await createAlarmTemplate(templateForm);
      ElMessage.success(t('alarm.templateCreateSuccess'));
    } else {
      await updateAlarmTemplate(templateForm.id!, templateForm);
      ElMessage.success(t('alarm.templateUpdateSuccess'));
    }
    templateDialogVisible.value = false;
    loadTemplates();
  } catch (e) {
    console.error('[Alarm] save template failed:', e);
  } finally {
    templateFormLoading.value = false;
  }
}

async function handleDeleteTemplate(tpl: AlarmTemplate) {
  try {
    await ElMessageBox.confirm(t('alarm.deleteTemplateConfirm', { name: tpl.name }), t('alarm.deleteConfirmTitle'), { type: 'warning' });
    await deleteAlarmTemplate(tpl.id);
    ElMessage.success(t('alarm.templateDeleteSuccess'));
    if (selectedTemplateId.value === tpl.id) {
      selectedTemplateId.value = null;
    }
    loadTemplates();
    loadData();
  } catch (e) {
    if (e !== 'cancel') console.error('[Alarm] delete template failed:', e);
  }
}

async function handleToggleTemplateEmail(tpl: AlarmTemplate) {
  try {
    const newVal = !tpl.enableEmailNotification;
    await updateAlarmTemplateEmailNotification(tpl.id, { enableEmailNotification: newVal });
    tpl.enableEmailNotification = newVal;
    ElMessage.success(newVal ? t('alarm.emailNotifyEnabledSuccess') : t('alarm.emailNotifyDisabledSuccess'));
  } catch (e) {
    console.error('[Alarm] toggle template email failed:', e);
  }
}

// ============ 告警列表 ============
const loading = ref(false);
const tableData = ref<Alarm[]>([]);
const total = ref(0);
const selectedIds = ref<(number | string)[]>([]);
const eventTypes = ref<string[]>([]);

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
  severity: AlarmSeverity | null;
  alarmStatus: AlarmStatus | null;
  eventType: string;
  probableCause: string;
  alarmSource: string;
  startTime: string;
  endTime: string;
  timeRange: [string, string] | null;
}

const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
  severity: null,
  alarmStatus: null,
  eventType: '',
  probableCause: '',
  alarmSource: '',
  startTime: '',
  endTime: '',
  timeRange: null,
});

const filterExpanded = ref<string[]>(['filter']);

async function loadEventTypes() {
  try {
    eventTypes.value = await getAlarmEventType();
  } catch (e) {
    console.error('[Alarm] load event types failed:', e);
  }
}

async function loadData() {
  loading.value = true;
  try {
    const params: AlarmQueryParams = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
      severity: queryParams.severity ?? undefined,
      alarmStatus: queryParams.alarmStatus ?? undefined,
      eventType: queryParams.eventType || undefined,
      probableCause: queryParams.probableCause || undefined,
      alarmSource: queryParams.alarmSource || undefined,
    };
    if (queryParams.timeRange && queryParams.timeRange[0]) {
      params.startTime = queryParams.timeRange[0];
      params.endTime = queryParams.timeRange[1];
    }
    if (selectedTemplateId.value) {
      params.alarmTemplateId = selectedTemplateId.value;
    }
    const result = await getAlarms(params);
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[Alarm] load data failed:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.page = 1;
  loadData();
}

function handleReset() {
  queryParams.keyword = '';
  queryParams.severity = null;
  queryParams.alarmStatus = null;
  queryParams.eventType = '';
  queryParams.probableCause = '';
  queryParams.alarmSource = '';
  queryParams.timeRange = null;
  queryParams.page = 1;
  loadData();
}

function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

function handleSelectionChange(selection: Alarm[]) {
  selectedIds.value = selection.map(a => a.id);
}

// ============ 告警操作 ============
async function handleConfirm(row: Alarm) {
  try {
    await confirmAlarm(row.id);
    ElMessage.success(t('alarm.confirmSuccess'));
    loadData();
  } catch (e) {
    console.error('[Alarm] confirm failed:', e);
  }
}

async function handleUnconfirm(row: Alarm) {
  try {
    await unconfirmAlarm(row.id);
    ElMessage.success(t('alarm.unconfirmSuccess'));
    loadData();
  } catch (e) {
    console.error('[Alarm] unconfirm failed:', e);
  }
}

async function handleClear(row: Alarm) {
  try {
    await clearAlarm(row.id);
    ElMessage.success(t('alarm.clearSuccess'));
    loadData();
  } catch (e) {
    console.error('[Alarm] clear failed:', e);
  }
}

async function handleDeleteAlarm(row: Alarm) {
  try {
    await ElMessageBox.confirm(t('alarm.deleteAlarmConfirm'), t('alarm.deleteConfirmTitle'), { type: 'warning' });
    await deleteAlarm(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadData();
  } catch (e) {
    if (e !== 'cancel') console.error('[Alarm] delete failed:', e);
  }
}

async function handleBatchClear() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning(t('alarm.selectAlarmsToClear'));
    return;
  }
  try {
    await ElMessageBox.confirm(
      t('alarm.batchClearConfirm', { count: selectedIds.value.length }),
      t('alarm.batchClearTitle'),
      { type: 'warning' },
    );
    await batchClearAlarms(selectedIds.value);
    ElMessage.success(t('alarm.batchClearSuccess'));
    selectedIds.value = [];
    loadData();
  } catch (e) {
    if (e !== 'cancel') console.error('[Alarm] batch clear failed:', e);
  }
}

// ============ 手动同步 ============
const syncing = ref(false);
async function handleManualSync() {
  syncing.value = true;
  try {
    await http.post('/alarms/sync');
    ElMessage.success(t('alarm.syncRequestSent'));
    loadData();
  } catch (e) {
    console.error('[Alarm] manual sync failed:', e);
  } finally {
    syncing.value = false;
  }
}

// ============ 导出 CSV ============
function handleExportCSV() {
  const headers = [
    t('alarm.csvHeaders.alarmIdentifier'),
    t('alarm.csvHeaders.severity'),
    t('alarm.csvHeaders.probableCause'),
    t('alarm.csvHeaders.alarmSource'),
    t('alarm.csvHeaders.networkElement'),
    t('alarm.csvHeaders.alarmStatus'),
    t('alarm.csvHeaders.eventTime'),
    t('alarm.csvHeaders.clearTime'),
    t('alarm.csvHeaders.clearUser'),
    t('alarm.csvHeaders.comment'),
  ];
  const rows = tableData.value.map(a => [
    a.alarmIdentifier ?? '',
    getSeverityText(a.severity),
    a.probableCause ?? '',
    a.alarmSource ?? '',
    a.networkElement ?? '',
    getAlarmStatusText(a.alarmStatus),
    formatTime(a.eventTime),
    formatTime(a.clearedTime),
    a.clearUser ?? '',
    a.comment ?? '',
  ]);
  const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alarms_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============ 告警详情弹窗 ============
const detailDialogVisible = ref(false);
const detailAlarm = ref<Alarm | null>(null);
const detailLoading = ref(false);

async function handleViewDetail(row: Alarm) {
  detailLoading.value = true;
  detailDialogVisible.value = true;
  try {
    detailAlarm.value = await getAlarm(row.id);
  } catch (e) {
    console.error('[Alarm] load detail failed:', e);
    detailAlarm.value = row;
  } finally {
    detailLoading.value = false;
  }
}

// ============ 评论弹窗 ============
const commentDialogVisible = ref(false);
const commentForm = reactive({ alarmId: 0, comment: '' });

function handleOpenComment(row: Alarm) {
  commentForm.alarmId = row.id;
  commentForm.comment = row.comment ?? '';
  commentDialogVisible.value = true;
}

async function handleSaveComment() {
  if (!commentForm.comment.trim()) {
    ElMessage.warning(t('alarm.enterCommentContent'));
    return;
  }
  try {
    await addCommentForAlarm(commentForm.alarmId, { comment: commentForm.comment });
    ElMessage.success(t('alarm.commentSaved'));
    commentDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[Alarm] save comment failed:', e);
  }
}

// ============ 同步配置弹窗 ============
const syncConfigDialogVisible = ref(false);
const syncConfigLoading = ref(false);
const syncConfig = reactive<AlarmSyncConfig>({
  enabled: false,
  syncInterval: 60,
  sourceAddress: '',
});

async function openSyncConfigDialog() {
  syncConfigLoading.value = true;
  syncConfigDialogVisible.value = true;
  try {
    const data = await getAlarmSyncConfig();
    Object.assign(syncConfig, data);
  } catch (e) {
    console.error('[Alarm] load sync config failed:', e);
  } finally {
    syncConfigLoading.value = false;
  }
}

async function handleSaveSyncConfig() {
  try {
    await updateAlarmSyncConfig({ ...syncConfig });
    ElMessage.success(t('alarm.syncConfigSaved'));
    syncConfigDialogVisible.value = false;
  } catch (e) {
    console.error('[Alarm] save sync config failed:', e);
  }
}

// ============ 邮件配置弹窗 ============
const emailConfigDialogVisible = ref(false);
const emailConfigLoading = ref(false);
const emailConfig = reactive<EmailNotificationConfig>({
  enabled: false,
  smtpHost: '',
  smtpPort: 25,
  smtpUser: '',
  smtpPassword: '',
  recipients: [],
});
const emailRecipientsStr = ref('');

async function openEmailConfigDialog() {
  emailConfigLoading.value = true;
  emailConfigDialogVisible.value = true;
  try {
    const data = await getEmailNotificationConfig();
    Object.assign(emailConfig, data);
    emailRecipientsStr.value = (data.recipients || []).join(', ');
  } catch (e) {
    console.error('[Alarm] load email config failed:', e);
  } finally {
    emailConfigLoading.value = false;
  }
}

async function handleSaveEmailConfig() {
  try {
    emailConfig.recipients = emailRecipientsStr.value.split(',').map(s => s.trim()).filter(Boolean);
    await updateEmailNotificationConfig({ ...emailConfig });
    ElMessage.success(t('alarm.emailConfigSaved'));
    emailConfigDialogVisible.value = false;
  } catch (e) {
    console.error('[Alarm] save email config failed:', e);
  }
}

// ============ 告警过滤器弹窗 ============
const filterDialogVisible = ref(false);
const filterList = ref<AlarmFilter[]>([]);
const filterLoading = ref(false);

const filterEditDialogVisible = ref(false);
const filterEditMode = ref<'add' | 'edit'>('add');
const filterForm = reactive({
  id: undefined as number | undefined,
  filterRuleName: '',
  enable: true,
  executionAction: 1,
  alarmSources: '',
  executeOnAllBaseStation: false,
  executeOnAllCPE: false,
  executionOnAllAlarm: false,
  startTime: '',
  endTime: '',
  baseStationIds: '',
  cpeIds: '',
  alarmIds: '',
});

async function openFilterDialog() {
  filterDialogVisible.value = true;
  await loadFilters();
}

async function loadFilters() {
  filterLoading.value = true;
  try {
    filterList.value = await getAlarmFilters();
  } catch (e) {
    console.error('[Alarm] load filters failed:', e);
  } finally {
    filterLoading.value = false;
  }
}

function openAddFilterDialog() {
  filterEditMode.value = 'add';
  Object.assign(filterForm, {
    id: undefined,
    filterRuleName: '',
    enable: true,
    executionAction: 1,
    alarmSources: '',
    executeOnAllBaseStation: false,
    executeOnAllCPE: false,
    executionOnAllAlarm: false,
    startTime: '',
    endTime: '',
    baseStationIds: '',
    cpeIds: '',
    alarmIds: '',
  });
  filterEditDialogVisible.value = true;
}

function openEditFilterDialog(filter: AlarmFilter) {
  filterEditMode.value = 'edit';
  filterForm.id = filter.id;
  filterForm.filterRuleName = filter.filterRuleName ?? '';
  filterForm.enable = !!filter.enable;
  filterForm.executionAction = filter.executionAction ?? 1;
  filterForm.alarmSources = filter.alarmSources ?? '';
  filterForm.executeOnAllBaseStation = !!filter.executeOnAllBaseStation;
  filterForm.executeOnAllCPE = !!filter.executeOnAllCPE;
  filterForm.executionOnAllAlarm = !!filter.executionOnAllAlarm;
  filterForm.startTime = filter.startTime ?? '';
  filterForm.endTime = filter.endTime ?? '';
  filterForm.baseStationIds = filter.baseStationIds ?? '';
  filterForm.cpeIds = filter.cpeIds ?? '';
  filterForm.alarmIds = filter.alarmIds ?? '';
  filterEditDialogVisible.value = true;
}

async function handleSaveFilter() {
  if (!filterForm.filterRuleName?.trim()) {
    ElMessage.warning(t('alarm.enterFilterName'));
    return;
  }
  try {
    if (filterEditMode.value === 'add') {
      await createAlarmFilter(filterForm);
      ElMessage.success(t('alarm.filterCreateSuccess'));
    } else {
      await updateAlarmFilter(filterForm.id!, filterForm);
      ElMessage.success(t('alarm.filterUpdateSuccess'));
    }
    filterEditDialogVisible.value = false;
    loadFilters();
  } catch (e) {
    console.error('[Alarm] save filter failed:', e);
  }
}

async function handleDeleteFilter(filter: AlarmFilter) {
  try {
    await ElMessageBox.confirm(t('alarm.deleteFilterConfirm', { name: filter.filterRuleName }), t('alarm.deleteConfirmTitle'), { type: 'warning' });
    await deleteAlarmFilter(filter.id);
    ElMessage.success(t('alarm.filterDeleteSuccess'));
    loadFilters();
  } catch (e) {
    if (e !== 'cancel') console.error('[Alarm] delete filter failed:', e);
  }
}

async function handleToggleFilter(filter: AlarmFilter) {
  try {
    await toggleAlarmFilterEnable(filter.id);
    filter.enable = !filter.enable;
    ElMessage.success(filter.enable ? t('alarm.enabledSuccess') : t('alarm.disabledSuccess'));
  } catch (e) {
    console.error('[Alarm] toggle filter failed:', e);
  }
}

// ============ 告警统计图表弹窗 ============
const chartDialogVisible = ref(false);
const chartLoading = ref(false);
let chartInstance: echarts.ECharts | null = null;
const chartRef = ref<HTMLElement | null>(null);

async function openChartDialog() {
  chartDialogVisible.value = true;
  chartLoading.value = true;
  try {
    const severityData = await getSeverityCount();
    await nextTick();
    if (!chartRef.value) return;
    if (chartInstance) {
      chartInstance.dispose();
    }
    chartInstance = echarts.init(chartRef.value);
    const pieData = severityData.map(item => ({
      name: getSeverityText(item.severity as AlarmSeverity),
      value: item.alarmCount,
    }));
    const colorMap: Record<string, string> = {
      [t('alarm.critical')]: '#F56C6C',
      [t('alarm.major')]: '#E6A23C',
      [t('alarm.minor')]: '#F0C020',
      [t('alarm.warning')]: '#E6A23C',
      [t('alarm.info')]: '#909399',
    };
    chartInstance.setOption({
      title: { text: t('alarm.chartTitle'), left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      color: pieData.map(d => colorMap[d.name] || '#409EFF'),
      series: [
        {
          name: t('alarm.chartSeriesName'),
          type: 'pie',
          radius: '60%',
          data: pieData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
          label: { formatter: '{b}: {c}' },
        },
      ],
    });
  } catch (e) {
    console.error('[Alarm] load chart data failed:', e);
  } finally {
    chartLoading.value = false;
  }
}

function handleResizeChart() {
  chartInstance?.resize();
}

// ============ 告警库 (Tab 2) ============
const libraryList = ref<AlarmLibraryType[]>([]);
const libraryLoading = ref(false);
const libraryPage = ref(1);
const libraryPageSize = ref(20);

const libraryPaged = computed(() => {
  const start = (libraryPage.value - 1) * libraryPageSize.value;
  return libraryList.value.slice(start, start + libraryPageSize.value);
});

async function loadLibrary() {
  libraryLoading.value = true;
  try {
    libraryList.value = await getAlarmLibrary();
  } catch (e) {
    console.error('[Alarm] load library failed:', e);
  } finally {
    libraryLoading.value = false;
  }
}

async function handleDeleteLibrary(row: AlarmLibraryType) {
  try {
    await ElMessageBox.confirm(t('alarm.deleteLibraryConfirm'), t('alarm.deleteLibraryConfirmTitle'), { type: 'warning' });
    await deleteAlarmLibrary(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadLibrary();
  } catch (e) {
    if (e !== 'cancel') console.error('[Alarm] delete library failed:', e);
  }
}

async function handleImportLibrary(uploadFile: UploadFile) {
  if (!uploadFile.raw) return;
  try {
    await importAlarmLibrary(uploadFile.raw);
    ElMessage.success(t('alarm.importSuccess'));
    loadLibrary();
  } catch (e) {
    console.error('[Alarm] import library failed:', e);
  }
}

async function handleDownloadTemplate() {
  try {
    await downloadAlarmLibraryTemplate();
    ElMessage.success(t('alarm.downloadTemplateSuccess'));
  } catch (e) {
    console.error('[Alarm] download template failed:', e);
  }
}

// ============ 辅助函数 ============
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function getSeverityType(severity?: AlarmSeverity | null): 'danger' | 'warning' | 'info' | 'success' {
  if (!severity) return 'info';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'major') return 'danger';
  if (s === 'minor') return 'warning';
  if (s === 'warning') return 'info';
  return 'success';
}

function getSeverityColor(severity?: AlarmSeverity | null): string {
  if (!severity) return '#909399';
  const map: Record<string, string> = {
    Critical: '#F56C6C',
    Major: '#E6A23C',
    Minor: '#F0C020',
    Warning: '#E6A23C',
    Info: '#909399',
  };
  return map[severity] || '#909399';
}

function getSeverityText(severity?: AlarmSeverity | null): string {
  if (!severity) return t('alarm.unknown');
  const map: Record<string, string> = {
    Critical: t('alarm.critical'),
    Major: t('alarm.major'),
    Minor: t('alarm.minor'),
    Warning: t('alarm.warning'),
    Info: t('alarm.info'),
  };
  return map[severity] || severity;
}

function getAlarmStatusText(status?: AlarmStatus | null): string {
  if (status === AlarmStatus.ActiveUnconfirmed) return t('alarm.activeUnconfirmed');
  if (status === AlarmStatus.HistoryUnconfirmed) return t('alarm.historyUnconfirmed');
  if (status === AlarmStatus.ActiveConfirmed) return t('alarm.activeConfirmed');
  if (status === AlarmStatus.HistoryConfirmed) return t('alarm.historyConfirmed');
  return t('alarm.unknown');
}

function getAlarmStatusType(status?: AlarmStatus | null): 'danger' | 'warning' | 'success' | 'info' {
  if (status === AlarmStatus.ActiveUnconfirmed) return 'danger';
  if (status === AlarmStatus.HistoryUnconfirmed) return 'warning';
  if (status === AlarmStatus.ActiveConfirmed) return 'warning';
  if (status === AlarmStatus.HistoryConfirmed) return 'success';
  return 'info';
}

function isUnconfirmed(status?: AlarmStatus | null): boolean {
  return status === AlarmStatus.ActiveUnconfirmed || status === AlarmStatus.HistoryUnconfirmed;
}

// ============ 生命周期 ============
// ============ WebSocket 实时告警推送 ============
useAlarmPush((alarm: AlarmPushMessage) => {
  // 将新告警插入列表顶部（仅在告警监控 Tab 且未使用模板过滤时）
  if (activeTab.value === 'monitor' && !selectedTemplateId.value) {
    const newAlarm: Alarm = {
      id: alarm.id,
      alarmId: alarm.alarmId,
      alarmName: alarm.alarmName,
      alarmLevel: alarm.alarmLevel,
      alarmStatus: alarm.alarmStatus,
      deviceName: alarm.deviceName,
      serialNumber: alarm.serialNumber,
      createTime: alarm.createTime,
    } as Alarm;
    // 插入列表顶部
    tableData.value = [newAlarm, ...tableData.value];
    total.value += 1;
  }
});

onMounted(() => {
  loadTemplates();
  loadEventTypes();
  loadData();
  loadLibrary();
  document.addEventListener('click', closeContextMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

watch(activeTab, (val) => {
  if (val === 'monitor') {
    loadData();
  } else if (val === 'library') {
    loadLibrary();
  }
});
</script>

<template>
  <div class="alarm-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== Tab 1: 告警监控 ==================== -->
      <el-tab-pane :label="t('alarm.alarmMonitor')" name="monitor">
        <div class="monitor-layout">
          <!-- 左侧模板面板 -->
          <div class="template-sidebar">
            <div class="sidebar-header">
              <span class="sidebar-title">{{ t('alarm.alarmTemplate') }}</span>
              <el-button v-permission="'alarm.template.create'" type="primary" size="small" :icon="Plus" circle @click="openAddTemplateDialog" />
            </div>
            <div v-loading="templateLoading" class="sidebar-list">
              <div
                v-for="tpl in templateList"
                :key="tpl.id"
                class="template-item"
                :class="{ active: selectedTemplateId === tpl.id }"
                @click="handleSelectTemplate(tpl)"
                @contextmenu="handleTemplateContextMenu($event, tpl)"
              >
                <div class="template-name">{{ tpl.name || t('alarm.unnamedTemplate') }}</div>
                <div class="template-desc">{{ tpl.description || t('alarm.templateDesc') }}</div>
                <div class="template-badges">
                  <el-tag v-if="tpl.enableEmailNotification" size="small" type="success">{{ t('alarm.emailNotify') }}</el-tag>
                </div>
              </div>
              <div v-if="templateList.length === 0 && !templateLoading" class="sidebar-empty">
                {{ t('alarm.noTemplate') }}
              </div>
            </div>

            <!-- 右键菜单 -->
            <teleport to="body">
              <div
                v-show="templateContextMenuVisible"
                class="context-menu"
                :style="{ left: templateContextMenuPos.x + 'px', top: templateContextMenuPos.y + 'px' }"
              >
                <div class="context-menu-item" @click="templateContextMenuTarget && openEditTemplateDialog(templateContextMenuTarget)">
                  <el-icon><Edit /></el-icon> {{ t('device.edit') }}
                </div>
                <div class="context-menu-item" @click="templateContextMenuTarget && handleDeleteTemplate(templateContextMenuTarget)">
                  <el-icon><Delete /></el-icon> {{ t('common.delete') }}
                </div>
                <div class="context-menu-item" @click="templateContextMenuTarget && handleToggleTemplateEmail(templateContextMenuTarget)">
                  <el-icon><Message /></el-icon>
                  {{ templateContextMenuTarget?.enableEmailNotification ? t('alarm.emailNotifyDisabledSuccess') : t('alarm.emailNotifyEnabledSuccess') }}
                </div>
              </div>
            </teleport>
          </div>

          <!-- 右侧告警列表 -->
          <div class="alarm-content">
            <!-- 工具栏 -->
            <div class="toolbar">
              <el-button v-permission="'alarm.sync'" :icon="Refresh" :loading="syncing" @click="handleManualSync">{{ t('alarm.manualSync') }}</el-button>
              <el-button v-permission="'alarm.syncConfig'" :icon="Setting" @click="openSyncConfigDialog">{{ t('alarm.syncConfig') }}</el-button>
              <el-button v-permission="'alarm.emailConfig'" :icon="Message" @click="openEmailConfigDialog">{{ t('alarm.emailConfig') }}</el-button>
              <el-button v-permission="'alarm.filter'" :icon="Filter" @click="openFilterDialog">{{ t('alarm.filter') }}</el-button>
              <el-button v-permission="'alarm.export'" :icon="Download" @click="handleExportCSV">{{ t('alarm.export') }}</el-button>
              <el-button v-permission="'alarm.chart'" :icon="Picture" @click="openChartDialog">{{ t('alarm.statsChart') }}</el-button>
              <div v-if="selectedTemplateId" class="toolbar-template-hint">
                <el-tag closable @close="selectedTemplateId = null; handleSearch()">
                  {{ t('alarm.alarmTemplate') }}: {{ templateList.find(t => t.id === selectedTemplateId)?.name }}
                </el-tag>
              </div>
            </div>

            <!-- 搜索筛选（可折叠） -->
            <el-collapse v-model="filterExpanded" class="search-collapse">
              <el-collapse-item :title="t('alarm.searchCondition')" name="filter">
                <el-form :inline="true" @submit.prevent="handleSearch" class="search-form">
                  <el-form-item :label="t('alarm.severity')">
                    <el-select v-model="queryParams.severity" :placeholder="t('alarm.all')" clearable style="width: 120px">
                      <el-option value="Critical" :label="t('alarm.critical')" />
                      <el-option value="Major" :label="t('alarm.major')" />
                      <el-option value="Minor" :label="t('alarm.minor')" />
                      <el-option value="Warning" :label="t('alarm.warning')" />
                      <el-option value="Info" :label="t('alarm.info')" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('alarm.alarmStatus')">
                    <el-select v-model="queryParams.alarmStatus" :placeholder="t('alarm.all')" clearable style="width: 140px">
                      <el-option :value="1" :label="t('alarm.activeUnconfirmed')" />
                      <el-option :value="2" :label="t('alarm.historyUnconfirmed')" />
                      <el-option :value="3" :label="t('alarm.activeConfirmed')" />
                      <el-option :value="4" :label="t('alarm.historyConfirmed')" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('alarm.eventType')">
                    <el-select v-model="queryParams.eventType" :placeholder="t('alarm.all')" clearable filterable style="width: 160px">
                      <el-option v-for="et in eventTypes" :key="et" :value="et" :label="et" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('alarm.probableCause')">
                    <el-input v-model="queryParams.probableCause" :placeholder="t('alarm.probableCause')" clearable style="width: 160px" />
                  </el-form-item>
                  <el-form-item :label="t('alarm.alarmSource')">
                    <el-input v-model="queryParams.alarmSource" :placeholder="t('alarm.alarmSource')" clearable style="width: 160px" />
                  </el-form-item>
                  <el-form-item :label="t('alarm.timeRange')">
                    <el-date-picker
                      v-model="queryParams.timeRange"
                      type="datetimerange"
                      range-separator="-"
                      :start-placeholder="t('monitor.startTime')"
                      :end-placeholder="t('monitor.endTime')"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      style="width: 360px"
                    />
                  </el-form-item>
                  <el-form-item :label="t('alarm.keyword')">
                    <el-input
                      v-model="queryParams.keyword"
                      :placeholder="t('alarm.keywordPlaceholder')"
                      clearable
                      style="width: 200px"
                      @keyup.enter="handleSearch"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                    <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
                  </el-form-item>
                </el-form>
              </el-collapse-item>
            </el-collapse>

            <!-- 批量操作栏 -->
            <div v-if="selectedIds.length > 0" class="batch-bar">
              <span>{{ t('alarm.selectedAlarms', { count: selectedIds.length }) }}</span>
              <el-button v-permission="'alarm.clear'" type="danger" size="small" style="margin-left: 16px" @click="handleBatchClear">
                {{ t('alarm.batchClear') }}
              </el-button>
            </div>

            <!-- 数据表格 -->
            <el-table
              v-loading="loading"
              :data="tableData"
              stripe
              border
              style="width: 100%"
              row-key="id"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="50" />
              <el-table-column prop="severity" :label="t('alarm.severity')" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSeverityType(row.severity)" size="small">
                    {{ getSeverityText(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="alarmIdentifier" :label="t('alarm.alarmIdentifier')" min-width="160" show-overflow-tooltip />
              <el-table-column prop="probableCause" :label="t('alarm.probableCause')" min-width="160" show-overflow-tooltip />
              <el-table-column prop="alarmSource" :label="t('alarm.alarmSource')" min-width="130" show-overflow-tooltip />
              <el-table-column prop="networkElement" :label="t('alarm.networkElement')" min-width="120" show-overflow-tooltip />
              <el-table-column prop="alarmStatus" :label="t('alarm.alarmStatus')" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getAlarmStatusType(row.alarmStatus)" size="small">
                    {{ getAlarmStatusText(row.alarmStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="eventTime" :label="t('alarm.eventTime')" min-width="160">
                <template #default="{ row }">{{ formatTime(row.eventTime) }}</template>
              </el-table-column>
              <el-table-column prop="clearedTime" :label="t('alarm.clearTime')" min-width="160">
                <template #default="{ row }">{{ formatTime(row.clearedTime) }}</template>
              </el-table-column>
              <el-table-column prop="clearUser" :label="t('alarm.clearUser')" min-width="90" show-overflow-tooltip />
              <el-table-column prop="comment" :label="t('alarm.comment')" min-width="120" show-overflow-tooltip />
              <el-table-column :label="t('common.actions')" width="320" fixed="right">
                <template #default="{ row }">
                  <el-button v-permission="'alarm.view'" link type="primary" size="small" @click="handleViewDetail(row as Alarm)">
                    <el-icon><View /></el-icon> {{ t('common.detail') }}
                  </el-button>
                  <el-button
                    v-permission="'alarm.confirm'"
                    v-if="isUnconfirmed(row.alarmStatus)"
                    link type="success" size="small"
                    @click="handleConfirm(row as Alarm)"
                  >
                    <el-icon><CircleCheck /></el-icon> {{ t('alarm.confirm') }}
                  </el-button>
                  <el-button
                    v-permission="'alarm.confirm'"
                    v-else
                    link type="warning" size="small"
                    @click="handleUnconfirm(row as Alarm)"
                  >
                    <el-icon><CircleClose /></el-icon> {{ t('alarm.unconfirm') }}
                  </el-button>
                  <el-button v-permission="'alarm.clear'" link type="primary" size="small" @click="handleClear(row as Alarm)">
                    <el-icon><Warning /></el-icon> {{ t('alarm.clear') }}
                  </el-button>
                  <el-button v-permission="'alarm.comment'" link type="info" size="small" @click="handleOpenComment(row as Alarm)">{{ t('alarm.comment') }}</el-button>
                  <el-button v-permission="'alarm.delete'" link type="danger" size="small" @click="handleDeleteAlarm(row as Alarm)">
                    <el-icon><Delete /></el-icon> {{ t('common.delete') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="queryParams.page"
                v-model:page-size="queryParams.pageSize"
                :page-sizes="[20, 50, 100]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 2: 告警库 ==================== -->
      <el-tab-pane :label="t('alarm.alarmLibrary')" name="library">
        <div class="library-toolbar">
          <el-upload
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="() => false"
            :on-change="handleImportLibrary"
          >
            <el-button v-permission="'alarm.library.import'" type="primary" :icon="Upload">{{ t('common.import') }}</el-button>
          </el-upload>
          <el-button v-permission="'alarm.library.download'" :icon="Download" @click="handleDownloadTemplate">{{ t('alarm.downloadTemplate') }}</el-button>
        </div>

        <el-table
          v-loading="libraryLoading"
          :data="libraryPaged"
          stripe
          border
          style="width: 100%"
          row-key="id"
        >
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="alarmIdentifier" :label="t('alarm.alarmIdentifier')" min-width="180" show-overflow-tooltip />
          <el-table-column prop="probableCause" :label="t('alarm.probableCause')" min-width="180" show-overflow-tooltip />
          <el-table-column prop="severity" :label="t('alarm.severity')" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.severity)" size="small">
                {{ getSeverityText(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="eventType" :label="t('alarm.eventType')" min-width="140" show-overflow-tooltip />
          <el-table-column prop="alarmSource" :label="t('alarm.alarmSource')" min-width="140" show-overflow-tooltip />
          <el-table-column prop="explanation" :label="t('alarm.handleSuggestion')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="specificProblem" :label="t('alarm.specificProblem')" min-width="180" show-overflow-tooltip />
          <el-table-column :label="t('common.actions')" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button v-permission="'alarm.library.delete'" link type="danger" size="small" @click="handleDeleteLibrary(row as AlarmLibraryType)">
                    <el-icon><Delete /></el-icon> {{ t('common.delete') }}
                  </el-button>
                </template>
              </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="libraryPage"
            v-model:page-size="libraryPageSize"
            :page-sizes="[20, 50, 100]"
            :total="libraryList.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 弹窗区域 ==================== -->

    <!-- 1. 告警详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="t('alarm.alarmDetail')" width="700px" destroy-on-close>
      <div v-loading="detailLoading">
        <el-descriptions v-if="detailAlarm" :column="2" border>
          <el-descriptions-item :label="t('alarm.alarmIdentifier')">{{ detailAlarm.id }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.alarmIdentifier')">{{ detailAlarm.alarmIdentifier || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.severity')">
            <el-tag :type="getSeverityType(detailAlarm.severity)" size="small">
              {{ getSeverityText(detailAlarm.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('alarm.probableCause')">{{ detailAlarm.probableCause || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.alarmSource')">{{ detailAlarm.alarmSource || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.networkElement')">{{ detailAlarm.networkElement || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.eventType')">{{ detailAlarm.eventType || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.alarmStatus')">
            <el-tag :type="getAlarmStatusType(detailAlarm.alarmStatus)" size="small">
              {{ getAlarmStatusText(detailAlarm.alarmStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('alarm.eventTime')">{{ formatTime(detailAlarm.eventTime) }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.updateTime')">{{ formatTime(detailAlarm.updateTime) }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.clearTime')">{{ formatTime(detailAlarm.clearedTime) }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.clearUser')">{{ detailAlarm.clearUser || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.specificProblem')">{{ detailAlarm.specificProblem || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.alarmIdentifier')">{{ detailAlarm.alarmId || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('device.neId')">{{ detailAlarm.elementId ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('device.licenseId')">{{ detailAlarm.licenseId ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.isSuppressed')">{{ detailAlarm.isSuppressed ? t('common.yes') : t('common.no') }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.suppressionReason')">{{ detailAlarm.suppressionReason || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.handleSuggestion')" :span="2">{{ detailAlarm.handleSuggestion || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.additionalInfo')" :span="2">{{ detailAlarm.additionalInformation || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.comment')" :span="2">{{ detailAlarm.comment || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('device.createTime')">{{ formatTime(detailAlarm.createTime) }}</el-descriptions-item>
          <el-descriptions-item :label="t('alarm.isExported')">{{ detailAlarm.exported ? t('common.yes') : t('common.no') }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- 2. 模板新增/编辑弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="templateDialogMode === 'add' ? t('alarm.addTemplate') : t('alarm.editTemplate')"
      width="600px"
      destroy-on-close
    >
      <el-form :model="templateForm" label-width="130px" v-loading="templateFormLoading">
        <el-form-item :label="t('alarm.templateName')" required>
          <el-input v-model="templateForm.name" :placeholder="t('alarm.enterTemplateName')" />
        </el-form-item>
        <el-form-item :label="t('common.description')">
          <el-input v-model="templateForm.description" type="textarea" :rows="2" :placeholder="t('alarm.enterTemplateDesc')" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllBaseStation')">
          <el-switch v-model="templateForm.executeOnAllBaseStation" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllCPE')">
          <el-switch v-model="templateForm.executeOnAllCPE" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllAlarm')">
          <el-switch v-model="templateForm.executeOnAllAlarm" />
        </el-form-item>
        <el-form-item :label="t('alarm.baseStationIdList')" v-if="!templateForm.executeOnAllBaseStation">
          <el-input v-model="templateForm.baseStationIds" :placeholder="t('alarm.baseStationIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.cpeIdList')" v-if="!templateForm.executeOnAllCPE">
          <el-input v-model="templateForm.cpeIds" :placeholder="t('alarm.cpeIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.alarmIdList')" v-if="!templateForm.executeOnAllAlarm">
          <el-input v-model="templateForm.alarmIds" :placeholder="t('alarm.alarmIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.emailNotifyEnabled')">
          <el-switch v-model="templateForm.enableEmailNotification" />
        </el-form-item>
        <el-form-item :label="t('alarm.emailAddress')" v-if="templateForm.enableEmailNotification">
          <el-input v-model="templateForm.emails" :placeholder="t('alarm.emailAddress')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="templateFormLoading" @click="handleSaveTemplate">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 3. 告警过滤器弹窗 -->
    <el-dialog v-model="filterDialogVisible" :title="t('alarm.filter')" width="800px" destroy-on-close>
      <div style="margin-bottom: 12px">
        <el-button type="primary" :icon="Plus" @click="openAddFilterDialog">{{ t('alarm.addFilter') }}</el-button>
      </div>
      <el-table v-loading="filterLoading" :data="filterList" stripe border>
        <el-table-column prop="filterRuleName" :label="t('alarm.filterName')" min-width="150" />
        <el-table-column prop="enable" :label="t('alarm.enable')" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enable" @change="handleToggleFilter(row as AlarmFilter)" />
          </template>
        </el-table-column>
        <el-table-column prop="executionAction" :label="t('alarm.executionAction')" width="100" align="center">
          <template #default="{ row }">
            {{ row.executionAction === 1 ? t('alarm.block') : t('alarm.forward') }}
          </template>
        </el-table-column>
        <el-table-column prop="alarmSources" :label="t('alarm.alarmSourceList')" min-width="140" show-overflow-tooltip />
        <el-table-column prop="user" :label="t('common.creator')" width="100" />
        <el-table-column prop="updateTime" :label="t('alarm.updateTime')" width="160">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditFilterDialog(row as AlarmFilter)">{{ t('device.edit') }}</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteFilter(row as AlarmFilter)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 3b. 过滤器编辑子弹窗 -->
    <el-dialog
      v-model="filterEditDialogVisible"
      :title="filterEditMode === 'add' ? t('alarm.addFilter') : t('alarm.editFilter')"
      width="600px"
      destroy-on-close
      append-to-body
    >
      <el-form :model="filterForm" label-width="130px">
        <el-form-item :label="t('alarm.filterName')" required>
          <el-input v-model="filterForm.filterRuleName" :placeholder="t('alarm.enterFilterName')" />
        </el-form-item>
        <el-form-item :label="t('alarm.executionAction')">
          <el-select v-model="filterForm.executionAction" style="width: 100%">
            <el-option :value="1" :label="t('alarm.block')" />
            <el-option :value="2" :label="t('alarm.forward')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('alarm.alarmSourceList')">
          <el-input v-model="filterForm.alarmSources" :placeholder="t('alarm.alarmSourceList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllBaseStation')">
          <el-switch v-model="filterForm.executeOnAllBaseStation" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllCPE')">
          <el-switch v-model="filterForm.executeOnAllCPE" />
        </el-form-item>
        <el-form-item :label="t('alarm.applyAllAlarm')">
          <el-switch v-model="filterForm.executionOnAllAlarm" />
        </el-form-item>
        <el-form-item :label="t('alarm.baseStationIdList')" v-if="!filterForm.executeOnAllBaseStation">
          <el-input v-model="filterForm.baseStationIds" :placeholder="t('alarm.baseStationIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.cpeIdList')" v-if="!filterForm.executeOnAllCPE">
          <el-input v-model="filterForm.cpeIds" :placeholder="t('alarm.cpeIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.alarmIdList')" v-if="!filterForm.executionOnAllAlarm">
          <el-input v-model="filterForm.alarmIds" :placeholder="t('alarm.alarmIdList')" />
        </el-form-item>
        <el-form-item :label="t('alarm.effectiveTime')">
          <el-date-picker
            v-model="filterForm.startTime"
            type="datetime"
            :placeholder="t('monitor.startTime')"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 48%"
          />
          <span style="margin: 0 8px">{{ t('common.to') }}</span>
          <el-date-picker
            v-model="filterForm.endTime"
            type="datetime"
            :placeholder="t('monitor.endTime')"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 48%"
          />
        </el-form-item>
        <el-form-item :label="t('alarm.enable')">
          <el-switch v-model="filterForm.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="filterEditDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveFilter">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 4. 同步配置弹窗 -->
    <el-dialog v-model="syncConfigDialogVisible" :title="t('alarm.syncConfig')" width="500px" destroy-on-close>
      <el-form :model="syncConfig" label-width="110px" v-loading="syncConfigLoading">
        <el-form-item :label="t('alarm.enableSync')">
          <el-switch v-model="syncConfig.enabled" />
        </el-form-item>
        <el-form-item :label="t('alarm.syncInterval')">
          <el-input-number v-model="syncConfig.syncInterval" :min="10" :max="86400" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('alarm.sourceAddress')">
          <el-input v-model="syncConfig.sourceAddress" :placeholder="t('alarm.sourceAddress')" />
        </el-form-item>
        <el-form-item :label="t('alarm.lastSyncTime')">
          <span>{{ formatTime(syncConfig.lastSyncTime) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="syncConfigDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveSyncConfig">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 5. 邮件配置弹窗 -->
    <el-dialog v-model="emailConfigDialogVisible" :title="t('alarm.emailConfig')" width="550px" destroy-on-close>
      <el-form :model="emailConfig" label-width="110px" v-loading="emailConfigLoading">
        <el-form-item :label="t('alarm.enableEmail')">
          <el-switch v-model="emailConfig.enabled" />
        </el-form-item>
        <el-form-item :label="t('alarm.smtpServer')">
          <el-input v-model="emailConfig.smtpHost" placeholder="smtp.example.com" />
        </el-form-item>
        <el-form-item :label="t('alarm.smtpPort')">
          <el-input-number v-model="emailConfig.smtpPort" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('alarm.smtpUser')">
          <el-input v-model="emailConfig.smtpUser" :placeholder="t('alarm.smtpUser')" />
        </el-form-item>
        <el-form-item :label="t('alarm.smtpPassword')">
          <el-input v-model="emailConfig.smtpPassword" type="password" show-password :placeholder="t('alarm.smtpPassword')" />
        </el-form-item>
        <el-form-item :label="t('alarm.recipient')">
          <el-input v-model="emailRecipientsStr" :placeholder="t('alarm.recipient')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="emailConfigDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveEmailConfig">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 6. 评论弹窗 -->
    <el-dialog v-model="commentDialogVisible" :title="t('alarm.addComment')" width="450px" destroy-on-close>
      <el-form :model="commentForm" label-width="60px">
        <el-form-item :label="t('alarm.comment')">
          <el-input v-model="commentForm.comment" type="textarea" :rows="4" :placeholder="t('alarm.enterComment')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commentDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveComment">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 7. 统计图表弹窗 -->
    <el-dialog
      v-model="chartDialogVisible"
      :title="t('alarm.statsChart')"
      width="600px"
      destroy-on-close
      @opened="handleResizeChart"
    >
      <div v-loading="chartLoading" ref="chartRef" style="width: 100%; height: 400px;"></div>
      <template #footer>
        <el-button @click="chartDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.alarm-page {
  width: 100%;
}

.monitor-layout {
  display: flex;
  gap: 12px;
  min-height: calc(100vh - 200px);
}

/* 左侧模板面板 */
.template-sidebar {
  width: 250px;
  min-width: 250px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color, #fff);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-weight: 600;
  font-size: 14px;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.template-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-light, #f5f7fa);
    border-color: var(--el-border-color-lighter, #ebeef5);
  }

  &.active {
    background: var(--el-color-primary-light-9, #ecf5ff);
    border-color: var(--el-color-primary-light-5, #a0cfff);
  }
}

.template-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.template-badges {
  display: flex;
  gap: 4px;
}

.sidebar-empty {
  text-align: center;
  color: var(--el-text-color-secondary, #909399);
  padding: 24px 0;
  font-size: 13px;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
  padding: 4px 0;
  min-width: 140px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light, #f5f7fa);
  }
}

/* 右侧内容 */
.alarm-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.toolbar-template-hint {
  margin-left: auto;
}

.search-collapse {
  border: none;
}

.search-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  border-bottom: none;
  height: 32px;
  line-height: 32px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.batch-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-color-info-light-9, #f4f4f5);
  border-radius: 4px;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

/* 告警库 */
.library-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

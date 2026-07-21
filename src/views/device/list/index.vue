<script setup lang="ts">
/**
 * 设备列表页
 *
 * 功能：
 * - 设备列表展示（分页、多选）
 * - 关键字搜索 + 高级筛选
 * - 设备在线统计卡片
 * - 新增设备（批量序列号）
 * - 导入设备（文件上传）
 * - 批量删除
 * - 导出 CSV
 * - 行右键菜单：详情、设置、配置管理、模型树、清空命令队列、恢复出厂、告警同步、删除
 */
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Upload,
  Download,
  MoreFilled,
  ArrowDown,
  ArrowUp,
} from '@element-plus/icons-vue';

import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  importDevices,
  emptyDeviceCommands,
  getDeviceGroups,
} from '@/api/device';
import { getModelTree, refreshModelTree, reloadModelTree } from '@/api/parameter';
import { getDeviceOnlineInfo, type DeviceOnlineInfo } from '@/api/dashboard';
import { http } from '@/utils/request';
import type { Device, DeviceGroup, DeviceQueryParams } from '@/types/device';
import type { ModelTreeNode } from '@/types/parameter';

const router = useRouter();
const { t } = useI18n();

// ============ 查询与表格状态 ============
const loading = ref(false);
const tableData = ref<Device[]>([]);
const total = ref(0);
const selectedRows = ref<Device[]>([]);

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
  status: string;
  groupId: string;
  softwareVersion: string;
  product: string;
}

const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: '',
  groupId: '',
  softwareVersion: '',
  product: '',
});

// ============ UI 状态 ============
const showAdvanced = ref(false);
const showStats = ref(true);

// ============ 设备分组 ============
const deviceGroups = ref<DeviceGroup[]>([]);

// ============ 在线统计 ============
const onlineInfo = ref<DeviceOnlineInfo | null>(null);

// ============ 右键菜单 ============
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  row: null as Device | null,
});

// ============ 新增设备对话框 ============
const addDialogVisible = ref(false);
const addDialogLoading = ref(false);
const addForm = reactive({
  serialNumbers: '',
  groupId: '',
});

// ============ 导入设备对话框 ============
const importDialogVisible = ref(false);
const importDialogLoading = ref(false);
const importForm = reactive({
  file: null as File | null,
  groupId: '',
});
const uploadRef = ref();

// ============ 设备设置对话框 ============
const settingsDialogVisible = ref(false);
const settingsDialogLoading = ref(false);
const settingsForm = reactive({
  ne_neid: 0,
  device_name: '',
  installation_location: '',
  longitude: '',
  latitude: '',
  site_id: '',
});

// ============ 模型树对话框 ============
const modelTreeDialogVisible = ref(false);
const modelTreeLoading = ref(false);
const modelTreeData = ref<ModelTreeNode[]>([]);
const modelTreeElementId = ref<number | string>('');
const modelTreeDeviceName = ref('');

// ============ 配置管理对话框（占位） ============
const configDialogVisible = ref(false);
const configDeviceId = ref<number | string>('');
const configDeviceName = ref('');

// ============ 计算属性 ============
const batchDeleteDisabled = computed(() => selectedRows.value.length === 0);

// ============ 数据加载 ============

/** 加载设备列表 */
async function loadData() {
  loading.value = true;
  try {
    const params: DeviceQueryParams = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
    };
    if (queryParams.keyword) params.keyword = queryParams.keyword;
    if (queryParams.status) params.status = queryParams.status as any;
    if (queryParams.groupId) params.groupId = queryParams.groupId;
    if (queryParams.softwareVersion) params.softwareVersion = queryParams.softwareVersion;
    if (queryParams.product) params.product = queryParams.product;

    const result = await getDevices(params);
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[DeviceList] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 加载设备分组 */
async function loadDeviceGroups() {
  try {
    deviceGroups.value = await getDeviceGroups();
  } catch (e) {
    console.error('[DeviceList] load groups failed:', e);
  }
}

/** 加载在线统计 */
async function loadOnlineInfo() {
  try {
    onlineInfo.value = await getDeviceOnlineInfo();
  } catch (e) {
    console.error('[DeviceList] load online info failed:', e);
  }
}

// ============ 搜索 ============

function handleSearch() {
  queryParams.page = 1;
  loadData();
}

function handleReset() {
  queryParams.keyword = '';
  queryParams.status = '';
  queryParams.groupId = '';
  queryParams.softwareVersion = '';
  queryParams.product = '';
  queryParams.page = 1;
  loadData();
}

// ============ 分页 ============

function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

// ============ 表格多选 ============

function handleSelectionChange(rows: Device[]) {
  selectedRows.value = rows;
}

// ============ 刷新 ============

function handleRefresh() {
  loadData();
  loadOnlineInfo();
}

// ============ 新增设备 ============

function openAddDialog() {
  addForm.serialNumbers = '';
  addForm.groupId = '';
  addDialogVisible.value = true;
}

async function handleAddDevice() {
  if (!addForm.serialNumbers.trim()) {
    ElMessage.warning('请输入序列号');
    return;
  }
  addDialogLoading.value = true;
  try {
    const serials = addForm.serialNumbers
      .split(/[;；\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sn of serials) {
      await createDevice({
        serial_number: sn,
        ne_areaid: addForm.groupId ? Number(addForm.groupId) : undefined,
      } as Partial<Device>);
    }
    ElMessage.success(`成功添加 ${serials.length} 个设备`);
    addDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[DeviceList] add device failed:', e);
  } finally {
    addDialogLoading.value = false;
  }
}

// ============ 导入设备 ============

function openImportDialog() {
  importForm.file = null;
  importForm.groupId = '';
  importDialogVisible.value = true;
}

function handleFileChange(uploadFile: any) {
  importForm.file = uploadFile?.raw || uploadFile?.file || null;
}

async function handleImportDevice() {
  if (!importForm.file) {
    ElMessage.warning('请选择文件');
    return;
  }
  importDialogLoading.value = true;
  try {
    const result = await importDevices(importForm.file, {
      deviceGroupId: importForm.groupId || undefined,
    });
    ElMessage.success(
      `导入完成：新增 ${result.addedCount}，修改 ${result.modifiedCount}，失败 ${result.failedCount}`
    );
    importDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[DeviceList] import failed:', e);
  } finally {
    importDialogLoading.value = false;
  }
}

function downloadTemplate() {
  // 生成简单 CSV 模板
  const header = 'serial_number,device_name,device_ip,device_group\n';
  const example = 'SN001,MyDevice,192.168.1.1,\n';
  const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'device_import_template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ============ 批量删除 ============

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个设备吗？此操作不可恢复。`,
      '批量删除确认',
      { type: 'warning' }
    );
    loading.value = true;
    let successCount = 0;
    let failCount = 0;
    for (const row of selectedRows.value) {
      try {
        await deleteDevice(row.ne_neid);
        successCount++;
      } catch {
        failCount++;
      }
    }
    ElMessage.success(`删除完成：成功 ${successCount}，失败 ${failCount}`);
    selectedRows.value = [];
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] batch delete failed:', e);
    }
  } finally {
    loading.value = false;
  }
}

// ============ 导出 CSV ============

function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }
  const columns = [
    { key: 'serial_number', label: '序列号' },
    { key: 'device_name', label: '设备名称' },
    { key: 'device_type', label: '设备类型' },
    { key: 'generation', label: '代次' },
    { key: 'product', label: '产品' },
    { key: 'model_name', label: '型号' },
    { key: 'device_ip', label: 'IP 地址' },
    { key: 'software_version', label: '软件版本' },
    { key: 'hardware_version', label: '硬件版本' },
    { key: 'status', label: '状态' },
    { key: 'site_id', label: '站点 ID' },
    { key: 'longitude', label: '经度' },
    { key: 'latitude', label: '纬度' },
    { key: 'creation_time', label: '创建时间' },
  ];

  const escapeCsv = (val: unknown): string => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => c.label).join(',');
  const rows = tableData.value.map((row) =>
    columns.map((c) => escapeCsv((row as any)[c.key])).join(',')
  );
  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devices_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success('导出成功');
}

// ============ 右键菜单 ============

function handleRowContextMenu(row: Device, _column: unknown, event: MouseEvent) {
  event.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.row = row;
}

function openContextMenuByButton(row: Device, event: MouseEvent) {
  event.stopPropagation();
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  contextMenu.visible = true;
  contextMenu.x = rect.left;
  contextMenu.y = rect.bottom + 4;
  contextMenu.row = row;
}

function closeContextMenu() {
  contextMenu.visible = false;
}

function handleContextAction(action: string) {
  const row = contextMenu.row;
  if (!row) return;
  closeContextMenu();

  switch (action) {
    case 'detail':
      handleView(row);
      break;
    case 'settings':
      openSettingsDialog(row);
      break;
    case 'config':
      openConfigDialog(row);
      break;
    case 'modelTree':
      openModelTreeDialog(row);
      break;
    case 'emptyCommands':
      handleEmptyCommands(row);
      break;
    case 'factoryReset':
      handleFactoryReset(row);
      break;
    case 'alarmSync':
      handleAlarmSync(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
  }
}

// ============ 行操作 ============

function handleView(row: Device) {
  router.push(`/device/detail/${row.ne_neid}`);
}

async function handleDelete(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${row.device_name || row.serial_number}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteDevice(row.ne_neid);
    ElMessage.success(t('common.deleteSuccess'));
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] delete failed:', e);
    }
  }
}

// ============ 设备设置对话框 ============

function openSettingsDialog(row: Device) {
  settingsForm.ne_neid = row.ne_neid;
  settingsForm.device_name = row.device_name || '';
  settingsForm.installation_location = row.installation_location || '';
  settingsForm.longitude = row.longitude || '';
  settingsForm.latitude = row.latitude || '';
  settingsForm.site_id = row.site_id || '';
  settingsDialogVisible.value = true;
}

async function handleSaveSettings() {
  settingsDialogLoading.value = true;
  try {
    await updateDevice(settingsForm.ne_neid, {
      device_name: settingsForm.device_name,
      installation_location: settingsForm.installation_location,
      longitude: settingsForm.longitude,
      latitude: settingsForm.latitude,
      site_id: settingsForm.site_id,
    } as Partial<Device>);
    ElMessage.success(t('common.editSuccess'));
    settingsDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[DeviceList] update device failed:', e);
  } finally {
    settingsDialogLoading.value = false;
  }
}

// ============ 配置管理对话框（占位） ============

function openConfigDialog(row: Device) {
  configDeviceId.value = row.ne_neid;
  configDeviceName.value = row.device_name || row.serial_number || '';
  configDialogVisible.value = true;
}

// ============ 模型树对话框 ============

function openModelTreeDialog(row: Device) {
  modelTreeElementId.value = row.ne_neid;
  modelTreeDeviceName.value = row.device_name || row.serial_number || '';
  modelTreeData.value = [];
  modelTreeDialogVisible.value = true;
  loadModelTree();
}

async function loadModelTree() {
  modelTreeLoading.value = true;
  try {
    modelTreeData.value = await getModelTree(modelTreeElementId.value);
  } catch (e) {
    console.error('[DeviceList] load model tree failed:', e);
    modelTreeData.value = [];
  } finally {
    modelTreeLoading.value = false;
  }
}

async function handleReloadModelTree() {
  try {
    await reloadModelTree(modelTreeElementId.value);
    ElMessage.success('重载成功');
    loadModelTree();
  } catch (e) {
    console.error('[DeviceList] reload model tree failed:', e);
  }
}

async function handleRefreshModelTree() {
  try {
    await refreshModelTree(modelTreeElementId.value);
    ElMessage.success('刷新成功');
    loadModelTree();
  } catch (e) {
    console.error('[DeviceList] refresh model tree failed:', e);
  }
}

// ============ 清空命令队列 ============

async function handleEmptyCommands(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定要清空设备 "${row.device_name || row.serial_number}" 的命令队列吗？`,
      '清空命令队列',
      { type: 'warning' }
    );
    const result = await emptyDeviceCommands(row.ne_neid);
    ElMessage.success(`已清空 ${result?.cleared ?? 0} 条命令`);
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] empty commands failed:', e);
    }
  }
}

// ============ 恢复出厂 ============

async function handleFactoryReset(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定要对设备 "${row.device_name || row.serial_number}" 执行恢复出厂设置吗？此操作不可撤销！`,
      '恢复出厂设置',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    );
    await http.post(`/devices/${row.ne_neid}/factory-reset`);
    ElMessage.success('恢复出厂设置命令已下发');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] factory reset failed:', e);
    }
  }
}

// ============ 告警同步 ============

async function handleAlarmSync(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定要同步设备 "${row.device_name || row.serial_number}" 的告警信息吗？`,
      '告警同步',
      { type: 'info' }
    );
    await http.post(`/devices/${row.ne_neid}/sync-alarm`);
    ElMessage.success('告警同步命令已下发');
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] alarm sync failed:', e);
    }
  }
}

// ============ 格式化工具 ============

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

function getStatusType(status?: string | null): 'success' | 'danger' | 'info' {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'danger';
  return 'info';
}

function getStatusText(status?: string | null): string {
  if (status === 'online') return t('device.online');
  if (status === 'offline') return t('device.offline');
  return '未知';
}

/** 模型树节点渲染 */
function renderModelTreeNode(data: any): string {
  const node = data as ModelTreeNode;
  const parts = [node.name];
  if (node.type) parts.push(`(${node.type})`);
  if (node.value != null && node.value !== '') parts.push(`= ${node.value}`);
  if (node.writable) parts.push('[RW]');
  return parts.join(' ');
}

// ============ 全局点击关闭菜单 ============

function onDocumentClick() {
  if (contextMenu.visible) {
    closeContextMenu();
  }
}

// ============ 生命周期 ============

onMounted(() => {
  loadData();
  loadDeviceGroups();
  loadOnlineInfo();
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <div class="device-list-page">
    <!-- ========== 在线统计卡片（可折叠） ========== -->
    <el-card shadow="never" :body-style="{ padding: '12px 16px' }" class="stats-card">
      <div class="stats-header" @click="showStats = !showStats">
        <span class="stats-title">设备在线统计</span>
        <el-icon><ArrowUp v-if="showStats" /><ArrowDown v-else /></el-icon>
      </div>
      <el-collapse-transition>
        <div v-show="showStats" class="stats-body">
          <div v-if="onlineInfo" class="stats-grid">
            <!-- gNB -->
            <div class="stat-item">
              <div class="stat-label">gNB</div>
              <div class="stat-values">
                <span class="stat-online">
                  <el-tag type="success" size="small">在线 {{ onlineInfo.gnbOnlineCount }}</el-tag>
                </span>
                <span class="stat-offline">
                  <el-tag type="danger" size="small">离线 {{ onlineInfo.gnbOfflineCount }}</el-tag>
                </span>
              </div>
            </div>
            <!-- eNB -->
            <div class="stat-item">
              <div class="stat-label">eNB</div>
              <div class="stat-values">
                <span class="stat-online">
                  <el-tag type="success" size="small">在线 {{ onlineInfo.enbOnlineCount }}</el-tag>
                </span>
                <span class="stat-offline">
                  <el-tag type="danger" size="small">离线 {{ onlineInfo.enbOfflineCount }}</el-tag>
                </span>
              </div>
            </div>
            <!-- CPE -->
            <div class="stat-item">
              <div class="stat-label">CPE</div>
              <div class="stat-values">
                <span class="stat-online">
                  <el-tag type="success" size="small">在线 {{ onlineInfo.cpeOnlineCount }}</el-tag>
                </span>
                <span class="stat-offline">
                  <el-tag type="danger" size="small">离线 {{ onlineInfo.cpeOfflineCount }}</el-tag>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="stats-empty">暂无统计数据</div>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- ========== 工具栏 + 搜索 ========== -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button v-permission="'device.create'" type="primary" :icon="Plus" @click="openAddDialog">
            {{ t('device.add') }}
          </el-button>
          <el-button v-permission="'device.import'" :icon="Upload" @click="openImportDialog">
            {{ t('common.import') }}
          </el-button>
          <el-button
            v-permission="'device.delete'"
            type="danger"
            :icon="Delete"
            :disabled="batchDeleteDisabled"
            @click="handleBatchDelete"
          >
            {{ t('common.batch') }}{{ t('common.delete') }}
            <template v-if="selectedRows.length > 0">
              ({{ selectedRows.length }})
            </template>
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="handleRefresh">
            {{ t('common.refresh') }}
          </el-button>
          <el-button v-permission="'device.export'" :icon="Download" @click="handleExport">
            {{ t('common.export') }}
          </el-button>
        </div>
      </div>

      <!-- 搜索筛选 -->
      <div class="search-bar">
        <el-form :inline="true" @submit.prevent="handleSearch" class="search-form">
          <el-form-item>
            <el-input
              v-model="queryParams.keyword"
              :placeholder="t('device.search')"
              clearable
              :prefix-icon="Search"
              style="width: 260px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              {{ t('common.search') }}
            </el-button>
            <el-button @click="showAdvanced = !showAdvanced">
              高级筛选
              <el-icon class="el-icon--right">
                <ArrowDown v-if="!showAdvanced" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
            <el-button @click="handleReset">{{ t('common.reset') }}</el-button>
          </el-form-item>
        </el-form>

        <!-- 高级筛选 -->
        <el-collapse-transition>
          <div v-show="showAdvanced" class="advanced-filters">
            <el-form :inline="true" class="search-form">
              <el-form-item label="在线状态">
                <el-select
                  v-model="queryParams.status"
                  placeholder="全部"
                  clearable
                  style="width: 140px"
                  @change="handleSearch"
                >
                  <el-option label="全部" value="" />
                  <el-option :label="t('device.online')" value="online" />
                  <el-option :label="t('device.offline')" value="offline" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('device.group')">
                <el-select
                  v-model="queryParams.groupId"
                  :placeholder="t('common.selectPlaceholder')"
                  clearable
                  style="width: 180px"
                  @change="handleSearch"
                >
                  <el-option
                    v-for="g in deviceGroups"
                    :key="g.id"
                    :label="g.group_name || g.id"
                    :value="g.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="软件版本">
                <el-input
                  v-model="queryParams.softwareVersion"
                  placeholder="请输入软件版本"
                  clearable
                  style="width: 160px"
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
              <el-form-item label="产品类型">
                <el-input
                  v-model="queryParams.product"
                  placeholder="请输入产品类型"
                  clearable
                  style="width: 160px"
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-collapse-transition>
      </div>
    </el-card>

    <!-- ========== 数据表格 ========== -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        row-key="ne_neid"
        @selection-change="handleSelectionChange"
        @row-contextmenu="handleRowContextMenu"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column
          type="index"
          label="#"
          width="60"
          :index="(i: number) => (queryParams.page - 1) * queryParams.pageSize + i + 1"
        />
        <el-table-column prop="serial_number" :label="t('device.sn')" min-width="140">
          <template #default="{ row }">
            <span class="device-serial">{{ row.serial_number || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="device_name" :label="t('device.name')" min-width="140">
          <template #default="{ row }">
            {{ row.device_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_type" label="设备类型" min-width="100">
          <template #default="{ row }">
            {{ row.device_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="generation" label="代次" min-width="80">
          <template #default="{ row }">
            {{ row.generation || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="product" label="产品" min-width="100">
          <template #default="{ row }">
            {{ row.product || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="model_name" :label="t('device.model')" min-width="120">
          <template #default="{ row }">
            {{ row.model_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_ip" :label="t('device.ip')" min-width="120">
          <template #default="{ row }">
            {{ row.device_ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="software_version" :label="t('device.version')" min-width="120">
          <template #default="{ row }">
            {{ row.software_version || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="hardware_version" label="硬件版本" min-width="110">
          <template #default="{ row }">
            {{ row.hardware_version || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="t('device.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="site_id" label="站点 ID" min-width="100">
          <template #default="{ row }">
            {{ row.site_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="longitude" :label="t('device.longitude')" min-width="100">
          <template #default="{ row }">
            {{ row.longitude || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="latitude" :label="t('device.latitude')" min-width="100">
          <template #default="{ row }">
            {{ row.latitude || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="creation_time" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.creation_time) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              :icon="MoreFilled"
              link
              size="small"
              @click.stop="openContextMenuByButton(row as Device, $event)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- ========== 右键菜单 ========== -->
    <teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div class="context-menu-item" @click="handleContextAction('detail')">
          详情
        </div>
        <div v-permission="'device.edit'" class="context-menu-item" @click="handleContextAction('settings')">
          设置
        </div>
        <div v-permission="'device.config'" class="context-menu-item" @click="handleContextAction('config')">
          配置管理
        </div>
        <div v-permission="'device.modelTree'" class="context-menu-item" @click="handleContextAction('modelTree')">
          模型树
        </div>
        <div class="context-menu-divider" />
        <div v-permission="'device.emptyCommands'" class="context-menu-item" @click="handleContextAction('emptyCommands')">
          清空命令队列
        </div>
        <div v-permission="'device.factoryReset'" class="context-menu-item" @click="handleContextAction('factoryReset')">
          恢复出厂
        </div>
        <div v-permission="'device.alarmSync'" class="context-menu-item" @click="handleContextAction('alarmSync')">
          告警同步
        </div>
        <div class="context-menu-divider" />
        <div v-permission="'device.delete'" class="context-menu-item context-menu-item--danger" @click="handleContextAction('delete')">
          删除
        </div>
      </div>
    </teleport>

    <!-- ========== 新增设备对话框 ========== -->
    <el-dialog
      v-model="addDialogVisible"
      :title="t('device.add')"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="序列号" required>
          <el-input
            v-model="addForm.serialNumbers"
            type="textarea"
            :rows="6"
            placeholder="请输入设备序列号，多个用分号(;)分隔，每行一个"
          />
        </el-form-item>
        <el-form-item :label="t('device.group')">
          <el-select
            v-model="addForm.groupId"
            :placeholder="t('common.selectPlaceholder')"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="g in deviceGroups"
              :key="g.id"
              :label="g.group_name || g.id"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="addDialogLoading" @click="handleAddDevice">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 导入设备对话框 ========== -->
    <el-dialog
      v-model="importDialogVisible"
      :title="t('device.import')"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.csv"
            :on-change="handleFileChange"
            :on-remove="() => (importForm.file = null)"
          >
            <el-button :icon="Upload">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx、.csv 格式
                <el-link type="primary" @click.prevent="downloadTemplate" style="margin-left: 8px;">
                  下载模板
                </el-link>
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('device.group')">
          <el-select
            v-model="importForm.groupId"
            :placeholder="t('common.selectPlaceholder')"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="g in deviceGroups"
              :key="g.id"
              :label="g.group_name || g.id"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="importDialogLoading" @click="handleImportDevice">
          {{ t('common.import') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 设备设置对话框 ========== -->
    <el-dialog
      v-model="settingsDialogVisible"
      :title="t('device.edit')"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="120px">
        <el-form-item :label="t('device.name')">
          <el-input v-model="settingsForm.device_name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item :label="t('device.location')">
          <el-input v-model="settingsForm.installation_location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item :label="t('device.longitude')">
          <el-input v-model="settingsForm.longitude" placeholder="请输入经度" />
        </el-form-item>
        <el-form-item :label="t('device.latitude')">
          <el-input v-model="settingsForm.latitude" placeholder="请输入纬度" />
        </el-form-item>
        <el-form-item label="站点 ID">
          <el-input v-model="settingsForm.site_id" placeholder="请输入站点 ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="settingsDialogLoading" @click="handleSaveSettings">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 模型树对话框 ========== -->
    <el-dialog
      v-model="modelTreeDialogVisible"
      :title="`${t('parameter.modelTree')} - ${modelTreeDeviceName}`"
      width="700px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div class="model-tree-toolbar">
        <el-button size="small" @click="handleReloadModelTree">
          重新加载
        </el-button>
        <el-button size="small" @click="handleRefreshModelTree">
          刷新参数
        </el-button>
      </div>
      <div v-loading="modelTreeLoading" class="model-tree-container">
        <el-tree
          v-if="modelTreeData.length > 0"
          :data="modelTreeData"
          :props="{ children: 'children', label: renderModelTreeNode }"
          node-key="path"
          default-expand-all
          :expand-on-click-node="false"
        />
        <el-empty v-else description="暂无模型树数据" />
      </div>
      <template #footer>
        <el-button @click="modelTreeDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== 配置管理对话框（占位） ========== -->
    <el-dialog
      v-model="configDialogVisible"
      :title="`${t('device.configuration')} - ${configDeviceName}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="config-placeholder">
        <el-empty description="配置管理功能开发中..." />
      </div>
      <template #footer>
        <el-button @click="configDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.device-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base, 12px);
  width: 100%;
}

/* ========== 统计卡片 ========== */
.stats-card {
  .stats-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;

    .stats-title {
      font-weight: 600;
      font-size: 14px;
    }
  }

  .stats-body {
    margin-top: 12px;
  }

  .stats-grid {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
    padding: 12px 16px;
    background: var(--el-fill-color-light, #f5f7fa);
    border-radius: 8px;

    .stat-label {
      font-weight: 600;
      font-size: 15px;
      color: var(--el-text-color-primary);
    }

    .stat-values {
      display: flex;
      gap: 8px;
    }
  }

  .stats-empty {
    color: var(--el-text-color-secondary);
    text-align: center;
    padding: 16px 0;
  }
}

/* ========== 工具栏 ========== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

/* ========== 搜索 ========== */
.search-bar {
  .search-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 8px;
    }
  }

  .advanced-filters {
    padding-top: 4px;
    border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
    margin-top: 4px;
  }
}

/* ========== 表格 ========== */
.device-serial {
  font-family: var(--font-mono, 'Consolas', 'Monaco', monospace);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

/* ========== 右键菜单 ========== */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
  padding: 4px 0;
  min-width: 140px;

  .context-menu-item {
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--el-color-primary-light-9, #ecf5ff);
      color: var(--el-color-primary, #409eff);
    }

    &--danger {
      color: var(--el-color-danger, #f56c6c);

      &:hover {
        background: var(--el-color-danger-light-9, #fef0f0);
        color: var(--el-color-danger, #f56c6c);
      }
    }
  }

  .context-menu-divider {
    height: 1px;
    background: var(--el-border-color-lighter, #ebeef5);
    margin: 4px 8px;
  }
}

/* ========== 模型树 ========== */
.model-tree-toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.model-tree-container {
  max-height: 60vh;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
  padding: 8px;
}

/* ========== 配置占位 ========== */
.config-placeholder {
  padding: 40px 0;
}
</style>

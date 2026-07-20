<script setup lang="ts">
/**
 * 参数管理页面
 *
 * Tab1: 参数模板
 * Tab2: 参数集
 * Tab3: 参数日志
 * Tab4: 备份日志
 * Tab5: 批量配置
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View, Document } from '@element-plus/icons-vue';

import {
  getParameterTemplates,
  createParameterTemplate,
  updateParameterTemplate,
  deleteParameterTemplate,
  deployParameterTemplate,
  getParameterTemplateDeployLogs,
  getParameterSets,
  createParameterSet,
  updateParameterSet,
  deleteParameterSet,
  getParameterLogs,
  getParameterBackupLogs,
  triggerParameterBackup,
  getBatchConfigurations,
  getBatchConfigurationDetail,
} from '@/api/parameter';
import type {
  ParameterTemplate,
  ParameterSet,
  ParameterLog,
  ParameterBackupLog,
  BatchConfigTaskVo,
  BatchConfigDetailItem,
} from '@/types/parameter';

const { t } = useI18n();

// ============ 通用状态 ============
const activeTab = ref('template');

// ============ Tab1: 参数模板 ============
const templateLoading = ref(false);
const templateList = ref<ParameterTemplate[]>([]);
const templateTotal = ref(0);
const templateQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const templateDialogVisible = ref(false);
const templateDialogTitle = ref('新增参数模板');
const isEditTemplate = ref(false);
const templateForm = reactive<Partial<ParameterTemplate>>({
  id: undefined,
  name: '',
  description: '',
  scope: 'device',
  device_group_ids: '',
  parameter_json: '',
});

const deployDialogVisible = ref(false);
const deployTemplateId = ref(0);
const deployElementIds = ref<number[]>([]);

const deployLogDialogVisible = ref(false);
const deployLogList = ref<ParameterLog[]>([]);
const deployLogTotal = ref(0);
const deployLogQuery = reactive({ page: 1, pageSize: 10 });

async function loadTemplates() {
  templateLoading.value = true;
  try {
    const res = await getParameterTemplates({
      page: templateQuery.page,
      pageSize: templateQuery.pageSize,
      keyword: templateQuery.keyword || undefined,
    });
    templateList.value = res.list;
    templateTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load templates failed:', e);
  } finally {
    templateLoading.value = false;
  }
}

function handleTemplateSearch() {
  templateQuery.page = 1;
  loadTemplates();
}

function handleTemplateReset() {
  templateQuery.keyword = '';
  templateQuery.page = 1;
  loadTemplates();
}

function handleAddTemplate() {
  templateDialogTitle.value = '新增参数模板';
  isEditTemplate.value = false;
  templateForm.id = undefined;
  templateForm.name = '';
  templateForm.description = '';
  templateForm.scope = 'device';
  templateForm.device_group_ids = '';
  templateForm.parameter_json = '';
  templateDialogVisible.value = true;
}

function handleEditTemplate(row: ParameterTemplate) {
  templateDialogTitle.value = '编辑参数模板';
  isEditTemplate.value = true;
  templateForm.id = row.id;
  templateForm.name = row.name ?? '';
  templateForm.description = row.description ?? '';
  templateForm.scope = row.scope ?? 'device';
  templateForm.device_group_ids = row.device_group_ids ?? '';
  templateForm.parameter_json = row.parameter_json ?? '';
  templateDialogVisible.value = true;
}

async function handleSaveTemplate() {
  if (!templateForm.name) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  try {
    const data = { ...templateForm };
    if (isEditTemplate.value && templateForm.id) {
      await updateParameterTemplate(templateForm.id, data);
      ElMessage.success('更新成功');
    } else {
      await createParameterTemplate(data);
      ElMessage.success('创建成功');
    }
    templateDialogVisible.value = false;
    loadTemplates();
  } catch (e) {
    console.error('[ParameterManagement] save template failed:', e);
  }
}

async function handleDeleteTemplate(row: ParameterTemplate) {
  try {
    await ElMessageBox.confirm(`确定删除模板 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteParameterTemplate(row.id);
    ElMessage.success('删除成功');
    loadTemplates();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParameterManagement] delete template failed:', e);
  }
}

function handleDeployTemplate(row: ParameterTemplate) {
  deployTemplateId.value = row.id;
  deployElementIds.value = [];
  deployDialogVisible.value = true;
}

async function handleConfirmDeploy() {
  if (!deployElementIds.value.length) {
    ElMessage.warning('请选择设备');
    return;
  }
  try {
    await deployParameterTemplate(deployTemplateId.value, { element_ids: deployElementIds.value });
    ElMessage.success('部署成功');
    deployDialogVisible.value = false;
  } catch (e) {
    console.error('[ParameterManagement] deploy template failed:', e);
  }
}

async function handleViewDeployLogs(row: ParameterTemplate) {
  deployLogDialogVisible.value = true;
  deployTemplateId.value = row.id;
  deployLogQuery.page = 1;
  await loadDeployLogs();
}

async function loadDeployLogs() {
  try {
    const res = await getParameterTemplateDeployLogs(deployTemplateId.value, {
      page: deployLogQuery.page,
      pageSize: deployLogQuery.pageSize,
    });
    deployLogList.value = res.list;
    deployLogTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load deploy logs failed:', e);
  }
}

// ============ Tab2: 参数集 ============
const setLoading = ref(false);
const setList = ref<ParameterSet[]>([]);
const setTotal = ref(0);
const setQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const setDialogVisible = ref(false);
const setDialogTitle = ref('新增参数集');
const isEditSet = ref(false);
const setForm = reactive<Partial<ParameterSet>>({
  id: undefined,
  name: '',
  description: '',
  parameters: '',
});

async function loadSets() {
  setLoading.value = true;
  try {
    const res = await getParameterSets({
      page: setQuery.page,
      pageSize: setQuery.pageSize,
      keyword: setQuery.keyword || undefined,
    });
    setList.value = res.list;
    setTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load sets failed:', e);
  } finally {
    setLoading.value = false;
  }
}

function handleSetSearch() {
  setQuery.page = 1;
  loadSets();
}

function handleSetReset() {
  setQuery.keyword = '';
  setQuery.page = 1;
  loadSets();
}

function handleAddSet() {
  setDialogTitle.value = '新增参数集';
  isEditSet.value = false;
  setForm.id = undefined;
  setForm.name = '';
  setForm.description = '';
  setForm.parameters = '';
  setDialogVisible.value = true;
}

function handleEditSet(row: ParameterSet) {
  setDialogTitle.value = '编辑参数集';
  isEditSet.value = true;
  setForm.id = row.id;
  setForm.name = row.name ?? '';
  setForm.description = row.description ?? '';
  setForm.parameters = row.parameters ?? '';
  setDialogVisible.value = true;
}

async function handleSaveSet() {
  if (!setForm.name) {
    ElMessage.warning('请输入参数集名称');
    return;
  }
  try {
    const data = { ...setForm };
    if (isEditSet.value && setForm.id) {
      await updateParameterSet(setForm.id, data);
      ElMessage.success('更新成功');
    } else {
      await createParameterSet(data);
      ElMessage.success('创建成功');
    }
    setDialogVisible.value = false;
    loadSets();
  } catch (e) {
    console.error('[ParameterManagement] save set failed:', e);
  }
}

async function handleDeleteSet(row: ParameterSet) {
  try {
    await ElMessageBox.confirm(`确定删除参数集 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteParameterSet(row.id);
    ElMessage.success('删除成功');
    loadSets();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParameterManagement] delete set failed:', e);
  }
}

// ============ Tab3: 参数日志 ============
const logLoading = ref(false);
const logList = ref<ParameterLog[]>([]);
const logTotal = ref(0);
const logQuery = reactive({ page: 1, pageSize: 20, keyword: '' });

async function loadLogs() {
  logLoading.value = true;
  try {
    const res = await getParameterLogs({
      page: logQuery.page,
      pageSize: logQuery.pageSize,
      keyword: logQuery.keyword || undefined,
    });
    logList.value = res.list;
    logTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogSearch() {
  logQuery.page = 1;
  loadLogs();
}

function handleLogReset() {
  logQuery.keyword = '';
  logQuery.page = 1;
  loadLogs();
}

// ============ Tab4: 备份日志 ============
const backupLoading = ref(false);
const backupList = ref<ParameterBackupLog[]>([]);
const backupTotal = ref(0);
const backupQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const backupElementId = ref<number | undefined>(undefined);

async function loadBackups() {
  backupLoading.value = true;
  try {
    const res = await getParameterBackupLogs({
      page: backupQuery.page,
      pageSize: backupQuery.pageSize,
      keyword: backupQuery.keyword || undefined,
    });
    backupList.value = res.list;
    backupTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load backups failed:', e);
  } finally {
    backupLoading.value = false;
  }
}

function handleBackupSearch() {
  backupQuery.page = 1;
  loadBackups();
}

function handleBackupReset() {
  backupQuery.keyword = '';
  backupQuery.page = 1;
  loadBackups();
}

async function handleTriggerBackup() {
  if (!backupElementId.value) {
    ElMessage.warning('请输入设备 ID');
    return;
  }
  try {
    await triggerParameterBackup(backupElementId.value);
    ElMessage.success('备份触发成功');
    loadBackups();
  } catch (e) {
    console.error('[ParameterManagement] trigger backup failed:', e);
  }
}

// ============ Tab5: 批量配置 ============
const batchLoading = ref(false);
const batchList = ref<BatchConfigTaskVo[]>([]);
const batchTotal = ref(0);
const batchQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const batchDetailDialogVisible = ref(false);
const batchDetailList = ref<BatchConfigDetailItem[]>([]);
const batchDetailTaskId = ref(0);

async function loadBatchConfigs() {
  batchLoading.value = true;
  try {
    const res = await getBatchConfigurations({
      page: batchQuery.page,
      pageSize: batchQuery.pageSize,
      keyword: batchQuery.keyword || undefined,
    });
    batchList.value = res.list;
    batchTotal.value = res.total;
  } catch (e) {
    console.error('[ParameterManagement] load batch configs failed:', e);
  } finally {
    batchLoading.value = false;
  }
}

function handleBatchSearch() {
  batchQuery.page = 1;
  loadBatchConfigs();
}

function handleBatchReset() {
  batchQuery.keyword = '';
  batchQuery.page = 1;
  loadBatchConfigs();
}

async function handleViewBatchDetail(row: BatchConfigTaskVo) {
  batchDetailTaskId.value = row.id;
  try {
    const res = await getBatchConfigurationDetail(row.id);
    batchDetailList.value = res;
    batchDetailDialogVisible.value = true;
  } catch (e) {
    console.error('[ParameterManagement] load batch detail failed:', e);
  }
}

// ============ 通用方法 ============
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ 生命周期 ============
onMounted(() => {
  loadTemplates();
  loadSets();
  loadLogs();
  loadBackups();
  loadBatchConfigs();
});
</script>

<template>
  <div class="parameter-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab1: 参数模板 -->
      <el-tab-pane label="参数模板" name="template">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleTemplateSearch">
            <el-form-item label="关键字">
              <el-input v-model="templateQuery.keyword" placeholder="模板名称" clearable style="width: 200px" @keyup.enter="handleTemplateSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleTemplateSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleTemplateReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddTemplate">新增模板</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="templateLoading" :data="templateList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="description" label="描述" min-width="180" />
            <el-table-column prop="scope" label="范围" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.scope === 'deviceGroup' ? '设备组' : '设备' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Edit" @click="handleEditTemplate(row as ParameterTemplate)">编辑</el-button>
                <el-button link type="success" size="small" @click="handleDeployTemplate(row as ParameterTemplate)">部署</el-button>
                <el-button link type="info" size="small" :icon="Document" @click="handleViewDeployLogs(row as ParameterTemplate)">部署日志</el-button>
                <el-button link type="danger" size="small" :icon="Delete" @click="handleDeleteTemplate(row as ParameterTemplate)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="templateQuery.page" v-model:page-size="templateQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="templateTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { templateQuery.pageSize = s; templateQuery.page = 1; loadTemplates(); }" @current-change="(p: number) => { templateQuery.page = p; loadTemplates(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: 参数集 -->
      <el-tab-pane label="参数集" name="set">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSetSearch">
            <el-form-item label="关键字">
              <el-input v-model="setQuery.keyword" placeholder="参数集名称" clearable style="width: 200px" @keyup.enter="handleSetSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSetSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleSetReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddSet">新增参数集</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="setLoading" :data="setList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Edit" @click="handleEditSet(row as ParameterSet)">编辑</el-button>
                <el-button link type="danger" size="small" :icon="Delete" @click="handleDeleteSet(row as ParameterSet)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="setQuery.page" v-model:page-size="setQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="setTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { setQuery.pageSize = s; setQuery.page = 1; loadSets(); }" @current-change="(p: number) => { setQuery.page = p; loadSets(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: 参数日志 -->
      <el-tab-pane label="参数日志" name="log">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleLogSearch">
            <el-form-item label="关键字">
              <el-input v-model="logQuery.keyword" placeholder="参数名/操作人" clearable style="width: 200px" @keyup.enter="handleLogSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleLogSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleLogReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="logLoading" :data="logList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="element_id" label="设备 ID" width="100" />
            <el-table-column prop="parameter_name" label="参数名" min-width="160" />
            <el-table-column prop="old_value" label="旧值" min-width="120" />
            <el-table-column prop="new_value" label="新值" min-width="120" />
            <el-table-column prop="operation_type" label="操作类型" width="100" />
            <el-table-column prop="user" label="操作人" width="120" />
            <el-table-column prop="operation_time" label="操作时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.operation_time) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="logQuery.page" v-model:page-size="logQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="logTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { logQuery.pageSize = s; logQuery.page = 1; loadLogs(); }" @current-change="(p: number) => { logQuery.page = p; loadLogs(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab4: 备份日志 -->
      <el-tab-pane label="备份日志" name="backup">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleBackupSearch">
            <el-form-item label="关键字">
              <el-input v-model="backupQuery.keyword" placeholder="设备 ID" clearable style="width: 200px" @keyup.enter="handleBackupSearch" />
            </el-form-item>
            <el-form-item label="设备 ID">
              <el-input-number v-model="backupElementId" :min="1" placeholder="设备 ID" style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleBackupSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleBackupReset">重置</el-button>
              <el-button type="warning" @click="handleTriggerBackup">触发备份</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="backupLoading" :data="backupList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="element_id" label="设备 ID" width="100" />
            <el-table-column prop="backup_time" label="备份时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.backup_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="file_path" label="文件路径" min-width="260" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status ?? '-' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="backupQuery.page" v-model:page-size="backupQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="backupTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { backupQuery.pageSize = s; backupQuery.page = 1; loadBackups(); }" @current-change="(p: number) => { backupQuery.page = p; loadBackups(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab5: 批量配置 -->
      <el-tab-pane label="批量配置" name="batch">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleBatchSearch">
            <el-form-item label="关键字">
              <el-input v-model="batchQuery.keyword" placeholder="任务名称" clearable style="width: 200px" @keyup.enter="handleBatchSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleBatchSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleBatchReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="batchLoading" :data="batchList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="任务名称" min-width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'info'" size="small">{{ row.status ?? '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_count" label="总数" width="80" />
            <el-table-column prop="success_count" label="成功" width="80" />
            <el-table-column prop="fail_count" label="失败" width="80" />
            <el-table-column prop="create_time" label="创建时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="View" @click="handleViewBatchDetail(row as BatchConfigTaskVo)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="batchQuery.page" v-model:page-size="batchQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="batchTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { batchQuery.pageSize = s; batchQuery.page = 1; loadBatchConfigs(); }" @current-change="(p: number) => { batchQuery.page = p; loadBatchConfigs(); }" />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 参数模板弹窗 -->
    <el-dialog v-model="templateDialogVisible" :title="templateDialogTitle" width="600px">
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="templateForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="范围">
          <el-select v-model="templateForm.scope" placeholder="请选择范围" style="width: 100%">
            <el-option label="设备" value="device" />
            <el-option label="设备组" value="deviceGroup" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备组 IDs" v-if="templateForm.scope === 'deviceGroup'">
          <el-input v-model="templateForm.device_group_ids" type="textarea" :rows="2" placeholder="JSON 格式，如 [1,2,3]" />
        </el-form-item>
        <el-form-item label="参数 JSON">
          <el-input v-model="templateForm.parameter_json" type="textarea" :rows="6" placeholder='JSON 格式参数，如 {"param1":"value1"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 部署弹窗 -->
    <el-dialog v-model="deployDialogVisible" title="部署模板" width="500px">
      <el-form label-width="100px">
        <el-form-item label="设备 IDs">
          <el-select-v2 v-model="deployElementIds" :options="[]" multiple clearable placeholder="请选择或输入设备 ID" allow-create filterable style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deployDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmDeploy">部署</el-button>
      </template>
    </el-dialog>

    <!-- 部署日志弹窗 -->
    <el-dialog v-model="deployLogDialogVisible" title="部署日志" width="800px">
      <el-table :data="deployLogList" stripe border style="width: 100%" max-height="400">
        <el-table-column prop="parameter_name" label="参数名" min-width="140" />
        <el-table-column prop="old_value" label="旧值" min-width="120" />
        <el-table-column prop="new_value" label="新值" min-width="120" />
        <el-table-column prop="operation_type" label="操作类型" width="100" />
        <el-table-column prop="operation_time" label="操作时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.operation_time) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="deployLogQuery.page" v-model:page-size="deployLogQuery.pageSize" :page-sizes="[10, 20, 50]" :total="deployLogTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { deployLogQuery.pageSize = s; deployLogQuery.page = 1; loadDeployLogs(); }" @current-change="(p: number) => { deployLogQuery.page = p; loadDeployLogs(); }" />
      </div>
    </el-dialog>

    <!-- 参数集弹窗 -->
    <el-dialog v-model="setDialogVisible" :title="setDialogTitle" width="600px">
      <el-form :model="setForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="setForm.name" placeholder="请输入参数集名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="setForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="参数 JSON">
          <el-input v-model="setForm.parameters" type="textarea" :rows="6" placeholder='JSON 格式参数，如 {"param1":"value1"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSet">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量配置详情弹窗 -->
    <el-dialog v-model="batchDetailDialogVisible" title="批量配置详情" width="700px">
      <el-table :data="batchDetailList" stripe border style="width: 100%" max-height="400">
        <el-table-column prop="element_id" label="设备 ID" width="100" />
        <el-table-column prop="element_name" label="设备名称" min-width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status ?? '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="200" />
      </el-table>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.parameter-management-page {
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

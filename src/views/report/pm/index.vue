<script setup lang="ts">
/**
 * PM 性能管理页面
 *
 * 功能：
 * - Tab1: KPI 管理（CRUD 表格）
 * - Tab2: PM 模板（CRUD 表格）
 * - Tab3: PM 文件日志（只读列表 + 下载）
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';

import {
  getKpiList,
  createKpi,
  updateKpi,
  deleteKpi,
  getTemplateList,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getFileLogs,
  downloadPMFile,
} from '@/api/pm';
import type { PMKpi, PMTemplate, PMFileLog } from '@/types/pm';

const { t } = useI18n();

// ============ 公共 ============
const activeTab = ref('kpi');

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ KPI 管理 ============
const kpiLoading = ref(false);
const kpiData = ref<PMKpi[]>([]);
const kpiTotal = ref(0);

interface KpiQueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}
const kpiQueryParams = reactive<KpiQueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
});

// KPI 弹窗
const kpiDialogVisible = ref(false);
const kpiDialogTitle = ref('新增 KPI');
const kpiIsEdit = ref(false);
const kpiForm = reactive<Partial<PMKpi>>({
  id: undefined,
  name: '',
  description: '',
  type: '',
  formula: '',
  unit: '',
  granularity: '',
  status: true,
});

async function loadKpiList() {
  kpiLoading.value = true;
  try {
    const result = await getKpiList({
      page: kpiQueryParams.page,
      pageSize: kpiQueryParams.pageSize,
      keyword: kpiQueryParams.keyword || undefined,
    });
    kpiData.value = result.list;
    kpiTotal.value = result.total;
  } catch (e) {
    console.error('[PMManagement] load kpi failed:', e);
  } finally {
    kpiLoading.value = false;
  }
}

function handleKpiSearch() {
  kpiQueryParams.page = 1;
  loadKpiList();
}

function handleKpiReset() {
  kpiQueryParams.keyword = '';
  kpiQueryParams.page = 1;
  loadKpiList();
}

function handleKpiPageChange(page: number) {
  kpiQueryParams.page = page;
  loadKpiList();
}

function handleKpiSizeChange(size: number) {
  kpiQueryParams.pageSize = size;
  kpiQueryParams.page = 1;
  loadKpiList();
}

function handleKpiAdd() {
  kpiDialogTitle.value = '新增 KPI';
  kpiIsEdit.value = false;
  Object.assign(kpiForm, {
    id: undefined, name: '', description: '', type: '',
    formula: '', unit: '', granularity: '', status: true,
  });
  kpiDialogVisible.value = true;
}

function handleKpiEdit(row: PMKpi) {
  kpiDialogTitle.value = '编辑 KPI';
  kpiIsEdit.value = true;
  Object.assign(kpiForm, {
    id: row.id, name: row.name, description: row.description,
    type: row.type, formula: row.formula, unit: row.unit,
    granularity: row.granularity, status: row.status,
  });
  kpiDialogVisible.value = true;
}

async function handleKpiSave() {
  if (!kpiForm.name) {
    ElMessage.warning('请输入 KPI 名称');
    return;
  }
  try {
    if (kpiIsEdit.value && kpiForm.id) {
      await updateKpi(kpiForm.id, kpiForm);
      ElMessage.success('更新成功');
    } else {
      await createKpi(kpiForm);
      ElMessage.success('创建成功');
    }
    kpiDialogVisible.value = false;
    loadKpiList();
  } catch (e) {
    console.error('[PMManagement] save kpi failed:', e);
  }
}

async function handleKpiDelete(row: PMKpi) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 KPI "${row.name}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteKpi(row.id);
    ElMessage.success('删除成功');
    loadKpiList();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[PMManagement] delete kpi failed:', e);
    }
  }
}

// ============ PM 模板 ============
const tplLoading = ref(false);
const tplData = ref<PMTemplate[]>([]);
const tplTotal = ref(0);

interface TplQueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}
const tplQueryParams = reactive<TplQueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
});

// 模板弹窗
const tplDialogVisible = ref(false);
const tplDialogTitle = ref('新增 PM 模板');
const tplIsEdit = ref(false);
const tplForm = reactive<Partial<PMTemplate>>({
  id: undefined,
  name: '',
  description: '',
  kpiIds: [],
  granularity: '',
  status: true,
});

/** KPI IDs 输入用字符串辅助变量 */
const tplKpiIdsStr = ref('');

async function loadTemplateList() {
  tplLoading.value = true;
  try {
    const result = await getTemplateList({
      page: tplQueryParams.page,
      pageSize: tplQueryParams.pageSize,
      keyword: tplQueryParams.keyword || undefined,
    });
    tplData.value = result.list;
    tplTotal.value = result.total;
  } catch (e) {
    console.error('[PMManagement] load template failed:', e);
  } finally {
    tplLoading.value = false;
  }
}

function handleTplSearch() {
  tplQueryParams.page = 1;
  loadTemplateList();
}

function handleTplReset() {
  tplQueryParams.keyword = '';
  tplQueryParams.page = 1;
  loadTemplateList();
}

function handleTplPageChange(page: number) {
  tplQueryParams.page = page;
  loadTemplateList();
}

function handleTplSizeChange(size: number) {
  tplQueryParams.pageSize = size;
  tplQueryParams.page = 1;
  loadTemplateList();
}

function handleTplAdd() {
  tplDialogTitle.value = '新增 PM 模板';
  tplIsEdit.value = false;
  Object.assign(tplForm, {
    id: undefined, name: '', description: '',
    kpiIds: [], granularity: '', status: true,
  });
  tplKpiIdsStr.value = '';
  tplDialogVisible.value = true;
}

function handleTplEdit(row: PMTemplate) {
  tplDialogTitle.value = '编辑 PM 模板';
  tplIsEdit.value = true;
  Object.assign(tplForm, {
    id: row.id, name: row.name, description: row.description,
    kpiIds: row.kpiIds ?? [], granularity: row.granularity, status: row.status,
  });
  tplKpiIdsStr.value = row.kpiIds ? (Array.isArray(row.kpiIds) ? row.kpiIds.join(', ') : String(row.kpiIds)) : '';
  tplDialogVisible.value = true;
}

async function handleTplSave() {
  if (!tplForm.name) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  // 将字符串转为 number[]
  const kpiIds = tplKpiIdsStr.value
    ? tplKpiIdsStr.value.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
    : [];
  try {
    const saveData = { ...tplForm, kpiIds };
    if (tplIsEdit.value && tplForm.id) {
      await updateTemplate(tplForm.id, saveData);
      ElMessage.success('更新成功');
    } else {
      await createTemplate(saveData);
      ElMessage.success('创建成功');
    }
    tplDialogVisible.value = false;
    loadTemplateList();
  } catch (e) {
    console.error('[PMManagement] save template failed:', e);
  }
}

async function handleTplDelete(row: PMTemplate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${row.name}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteTemplate(row.id);
    ElMessage.success('删除成功');
    loadTemplateList();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[PMManagement] delete template failed:', e);
    }
  }
}

// ============ PM 文件日志 ============
const logLoading = ref(false);
const logData = ref<PMFileLog[]>([]);
const logTotal = ref(0);

interface LogQueryParams {
  page: number;
  pageSize: number;
  elementId: string;
}
const logQueryParams = reactive<LogQueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
});

async function loadFileLogs() {
  logLoading.value = true;
  try {
    const result = await getFileLogs({
      page: logQueryParams.page,
      pageSize: logQueryParams.pageSize,
      elementId: logQueryParams.elementId ? Number(logQueryParams.elementId) : undefined,
    });
    logData.value = result.list;
    logTotal.value = result.total;
  } catch (e) {
    console.error('[PMManagement] load file logs failed:', e);
  } finally {
    logLoading.value = false;
  }
}

function handleLogSearch() {
  logQueryParams.page = 1;
  loadFileLogs();
}

function handleLogReset() {
  logQueryParams.elementId = '';
  logQueryParams.page = 1;
  loadFileLogs();
}

function handleLogPageChange(page: number) {
  logQueryParams.page = page;
  loadFileLogs();
}

function handleLogSizeChange(size: number) {
  logQueryParams.pageSize = size;
  logQueryParams.page = 1;
  loadFileLogs();
}

/** 格式化文件大小 */
function formatFileSize(size?: number | null): string {
  if (size == null) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** 下载 PM 文件（按设备 ID 批量下载） */
async function handleDownloadFile(row: PMFileLog) {
  try {
    const blob = await downloadPMFile({ elementId: row.elementId });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = row.fileName || `pm_files_${row.elementId}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (e) {
    console.error('[PMManagement] download file failed:', e);
    ElMessage.error('下载失败');
  }
}

// ============ Tab 切换加载数据 ============
function handleTabChange(tab: string | number) {
  if (tab === 'kpi' && kpiData.value.length === 0) loadKpiList();
  else if (tab === 'template' && tplData.value.length === 0) loadTemplateList();
  else if (tab === 'log' && logData.value.length === 0) loadFileLogs();
}

// ============ 生命周期 ============
onMounted(() => {
  loadKpiList();
});
</script>

<template>
  <div class="pm-management-page">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- Tab1: KPI 管理 -->
      <el-tab-pane label="KPI 管理" name="kpi">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleKpiSearch">
            <el-form-item label="关键字">
              <el-input
                v-model="kpiQueryParams.keyword"
                placeholder="KPI 名称"
                clearable
                style="width: 200px"
                @keyup.enter="handleKpiSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleKpiSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleKpiReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleKpiAdd">新增 KPI</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="kpiLoading" :data="kpiData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="description" label="描述" min-width="180" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="formula" label="公式" min-width="160" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="granularity" label="粒度" width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status ? 'success' : 'info'" size="small">
                  {{ row.status ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleKpiEdit(row as PMKpi)">
                  <Edit /> 编辑
                </el-button>
                <el-button link type="danger" size="small" @click="handleKpiDelete(row as PMKpi)">
                  <Delete /> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="kpiQueryParams.page"
              v-model:page-size="kpiQueryParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="kpiTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleKpiSizeChange"
              @current-change="handleKpiPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: PM 模板 -->
      <el-tab-pane label="PM 模板" name="template">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleTplSearch">
            <el-form-item label="关键字">
              <el-input
                v-model="tplQueryParams.keyword"
                placeholder="模板名称"
                clearable
                style="width: 200px"
                @keyup.enter="handleTplSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleTplSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleTplReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleTplAdd">新增模板</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="tplLoading" :data="tplData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="模板名称" min-width="140" />
            <el-table-column prop="description" label="描述" min-width="180" />
            <el-table-column prop="kpiIds" label="KPI IDs" min-width="160">
              <template #default="{ row }">
                {{ row.kpiIds ? (Array.isArray(row.kpiIds) ? row.kpiIds.join(', ') : row.kpiIds) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="granularity" label="粒度" width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status ? 'success' : 'info'" size="small">
                  {{ row.status ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleTplEdit(row as PMTemplate)">
                  <Edit /> 编辑
                </el-button>
                <el-button link type="danger" size="small" @click="handleTplDelete(row as PMTemplate)">
                  <Delete /> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="tplQueryParams.page"
              v-model:page-size="tplQueryParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="tplTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleTplSizeChange"
              @current-change="handleTplPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: PM 文件日志 -->
      <el-tab-pane label="PM 文件日志" name="log">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleLogSearch">
            <el-form-item label="设备 ID">
              <el-input
                v-model="logQueryParams.elementId"
                placeholder="设备 ID"
                clearable
                style="width: 150px"
                @keyup.enter="handleLogSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleLogSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleLogReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="logLoading" :data="logData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" label="设备 ID" width="100" />
            <el-table-column prop="fileName" label="文件名" min-width="240" />
            <el-table-column prop="fileType" label="文件类型" width="100" />
            <el-table-column prop="fileSize" label="文件大小" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="上传时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.uploadTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Download" @click="handleDownloadFile(row as PMFileLog)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="logQueryParams.page"
              v-model:page-size="logQueryParams.pageSize"
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

    <!-- KPI 编辑弹窗 -->
    <el-dialog v-model="kpiDialogVisible" :title="kpiDialogTitle" width="560px" @close="kpiDialogVisible = false">
      <el-form :model="kpiForm" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="kpiForm.name" placeholder="请输入 KPI 名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="kpiForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="kpiForm.type" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="公式">
          <el-input v-model="kpiForm.formula" placeholder="请输入计算公式" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="kpiForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="粒度">
          <el-input v-model="kpiForm.granularity" placeholder="请输入粒度" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="kpiForm.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kpiDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleKpiSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- PM 模板编辑弹窗 -->
    <el-dialog v-model="tplDialogVisible" :title="tplDialogTitle" width="560px" @close="tplDialogVisible = false">
      <el-form :model="tplForm" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="tplForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tplForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="KPI IDs">
          <el-input v-model="tplKpiIdsStr" placeholder="如: 1,2,3" />
        </el-form-item>
        <el-form-item label="粒度">
          <el-input v-model="tplForm.granularity" placeholder="请输入粒度" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="tplForm.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTplSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.pm-management-page {
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

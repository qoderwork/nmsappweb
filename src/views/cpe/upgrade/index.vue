<script setup lang="ts">
/**
 * CPE 升级任务管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getUpgradeTasks, createUpgradeTask, startUpgradeTask, getUpgradeTask, getUpgradeResults } from '@/api/upgrade';
import type { UpgradeTaskVo, UpgradeResultVo } from '@/types/upgrade';

const { t } = useI18n();

const queryParams = reactive({ keyword: '', page: 1, pageSize: 20 });
const loading = ref(false);
const taskList = ref<UpgradeTaskVo[]>([]);
const total = ref(0);

const addDialogVisible = ref(false);
const addForm = reactive({ name: '', executeMode: 1, upgradeFileId: undefined as number | undefined, elementIds: [] as number[] });

const resultDialogVisible = ref(false);
const resultLoading = ref(false);
const resultList = ref<UpgradeResultVo[]>([]);
const resultTaskId = ref<number>(0);

async function loadTasks() {
  loading.value = true;
  try {
    const res = await getUpgradeTasks({ keyword: queryParams.keyword || undefined, page: queryParams.page, pageSize: queryParams.pageSize, deviceType: 'cpe' });
    taskList.value = res.list; total.value = res.total;
  } catch (e) { console.error('[CpeUpgrade] load failed:', e); }
  finally { loading.value = false; }
}

function handleSearch() { queryParams.page = 1; loadTasks(); }
function handlePageChange(page: number) { queryParams.page = page; loadTasks(); }
function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.page = 1; loadTasks(); }

function openAddDialog() { addForm.name = ''; addForm.executeMode = 1; addForm.upgradeFileId = undefined; addForm.elementIds = []; addDialogVisible.value = true; }

async function handleAdd() {
  if (!addForm.name.trim()) { ElMessage.warning(t('common.required')); return; }
  try {
    await createUpgradeTask({ name: addForm.name, execute_mode: addForm.executeMode, device_type: 'cpe', upgrade_file_id: addForm.upgradeFileId, scope: 'element', element_ids: addForm.elementIds.join(',') });
    ElMessage.success(t('common.addSuccess')); addDialogVisible.value = false; loadTasks();
  } catch (e) { console.error('[CpeUpgrade] add failed:', e); }
}

async function handleStart(task: UpgradeTaskVo) { try { await startUpgradeTask(task.id); ElMessage.success(t('common.operateSuccess')); loadTasks(); } catch (e) { console.error('[CpeUpgrade] start failed:', e); } }

async function openResultDialog(task: UpgradeTaskVo) {
  resultTaskId.value = task.id; resultDialogVisible.value = true; resultLoading.value = true;
  try { const res = await getUpgradeResults(task.id); resultList.value = (res || []) as UpgradeResultVo[]; } catch (e) { console.error('[CpeUpgrade] results failed:', e); }
  finally { resultLoading.value = false; }
}

function getStatusText(s?: number | null) { const m: Record<number, string> = { 1: '等待中', 2: '执行中', 3: '已完成', 4: '已取消' }; return s ? (m[s] || String(s)) : '-'; }
function getStatusType(s?: number | null): 'info' | 'warning' | 'success' | 'danger' { if (s === 3) return 'success'; if (s === 4) return 'danger'; if (s === 2) return 'warning'; return 'info'; }

onMounted(() => loadTasks());
</script>

<template>
  <div class="cpe-upgrade-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item>
          <el-input v-model="queryParams.keyword" :placeholder="t('common.search')" clearable style="width: 240px" @keyup.enter="handleSearch" @clear="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="queryParams.keyword = ''; handleSearch()">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新建任务</el-button>
      </div>
      <el-table v-loading.lazy="loading" :data="taskList" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="任务名" min-width="160" />
        <el-table-column prop="user" label="创建人" width="120" />
        <el-table-column prop="version" label="版本" width="120" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template></el-table-column>
        <el-table-column prop="deviceCount" label="设备数" width="80" />
        <el-table-column prop="progress" label="进度" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column :label="t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openResultDialog(row as any)">查看结果</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="handleStart(row as any)">启动</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新建升级任务" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="任务名称" required><el-input v-model="addForm.name" /></el-form-item>
        <el-form-item label="执行模式"><el-select v-model="addForm.executeMode" style="width: 100%"><el-option :value="1" label="立即执行" /><el-option :value="2" label="手动启动" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="addDialogVisible = false">{{ t('common.cancel') }}</el-button><el-button type="primary" @click="handleAdd">{{ t('common.confirm') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="resultDialogVisible" title="执行结果" width="800px">
      <el-table v-loading="resultLoading" :data="resultList" stripe border row-key="element_id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="device_name" label="设备名" min-width="140" />
        <el-table-column prop="serial_number" label="序列号" width="160" />
        <el-table-column prop="old_version" label="旧版本" width="120" />
        <el-table-column prop="new_version" label="新版本" width="120" />
        <el-table-column label="结果" width="80"><template #default="{ row: r }"><el-tag :type="r.success ? 'success' : 'danger'" size="small">{{ r.success ? '成功' : '失败' }}</el-tag></template></el-table-column>
        <el-table-column prop="message" label="信息" min-width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.cpe-upgrade-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

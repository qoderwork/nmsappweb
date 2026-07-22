<script setup lang="ts">
/**
 * 批量添加实例
 *
 * 批量添加 TR069 对象（如 AMF/Slice/TA/PLMN）
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { batchAddObject, listBatchAddObjectTasks, getBatchAddObjectTaskDetail, type BatchAddObjectTask } from '@/api/misc';

const { t } = useI18n();

const queryParams = reactive({ page: 1, pageSize: 20 });
const loading = ref(false);
const taskList = ref<BatchAddObjectTask[]>([]);
const total = ref(0);

const addDialogVisible = ref(false);
const addForm = reactive({
  ids: [] as number[],
  type: 'AMFRegion',
  amfNumber: 1,
  sliceNumber: 1,
  taNumber: 1,
  plmnNumber: 1,
});

const resultDialogVisible = ref(false);
const resultLoading = ref(false);
const resultTask = ref<any>(null);

async function loadTasks() {
  loading.value = true;
  try {
    const res = await listBatchAddObjectTasks({ page: queryParams.page, pageSize: queryParams.pageSize });
    taskList.value = res.list; total.value = res.total;
  } catch (e) { console.error('[BatchObject] load failed:', e); }
  finally { loading.value = false; }
}

function handlePageChange(page: number) { queryParams.page = page; loadTasks(); }
function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.page = 1; loadTasks(); }

function openAddDialog() {
  addForm.ids = []; addForm.type = 'AMFRegion'; addForm.amfNumber = 1; addForm.sliceNumber = 1; addForm.taNumber = 1; addForm.plmnNumber = 1;
  addDialogVisible.value = true;
}

async function handleAdd() {
  if (addForm.ids.length === 0) { ElMessage.warning('请选择设备'); return; }
  try {
    await batchAddObject({ ids: addForm.ids, type: addForm.type, amfNumber: addForm.amfNumber, sliceNumber: addForm.sliceNumber, taNumber: addForm.taNumber, plmnNumber: addForm.plmnNumber });
    ElMessage.success(t('common.addSuccess')); addDialogVisible.value = false; loadTasks();
  } catch (e) { console.error('[BatchObject] add failed:', e); }
}

async function openResultDialog(task: BatchAddObjectTask) {
  resultDialogVisible.value = true; resultLoading.value = true;
  try { resultTask.value = await getBatchAddObjectTaskDetail(String(task.id)); }
  catch (e) { console.error('[BatchObject] detail failed:', e); }
  finally { resultLoading.value = false; }
}

function getStatusText(s: number) { const m: Record<number, string> = { 1: '等待中', 2: '执行中', 3: '已完成', 4: '已取消' }; return m[s] || String(s); }
function getStatusType(s: number): 'info' | 'warning' | 'success' | 'danger' { if (s === 3) return 'success'; if (s === 4) return 'danger'; if (s === 2) return 'warning'; return 'info'; }

onMounted(() => loadTasks());
</script>

<template>
  <div class="batch-object-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新建任务</el-button>
      </div>
      <el-table v-loading.lazy="loading" :data="taskList" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="任务名" min-width="160" />
        <el-table-column prop="user" label="创建人" width="120" />
        <el-table-column prop="operationTime" label="操作时间" width="170" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template></el-table-column>
        <el-table-column prop="progress" label="进度" width="100" />
        <el-table-column :label="t('common.actions')" width="120" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="openResultDialog(row as any)">查看详情</el-button></template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="批量添加对象" width="600px">
      <el-form :model="addForm" label-width="120px">
        <el-form-item label="对象类型" required>
          <el-select v-model="addForm.type" style="width: 100%">
            <el-option value="AMFRegion" label="AMF Region" />
            <el-option value="Slice" label="Slice" />
            <el-option value="TA" label="Tracking Area" />
            <el-option value="PLMN" label="PLMN" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="addForm.type === 'AMFRegion'" label="AMF 数量">
          <el-input-number v-model="addForm.amfNumber" :min="1" :max="8" />
        </el-form-item>
        <el-form-item v-if="addForm.type === 'Slice'" label="Slice 数量">
          <el-input-number v-model="addForm.sliceNumber" :min="1" :max="8" />
        </el-form-item>
        <el-form-item v-if="addForm.type === 'TA'" label="TA 数量">
          <el-input-number v-model="addForm.taNumber" :min="1" :max="256" />
        </el-form-item>
        <el-form-item v-if="addForm.type === 'PLMN'" label="PLMN 数量">
          <el-input-number v-model="addForm.plmnNumber" :min="1" :max="6" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="addDialogVisible = false">{{ t('common.cancel') }}</el-button><el-button type="primary" @click="handleAdd">{{ t('common.confirm') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="resultDialogVisible" title="任务详情" width="700px">
      <el-table v-if="resultTask" v-loading="resultLoading" :data="resultTask.results || []" stripe border row-key="elementId">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="serialNumber" label="序列号" width="160" />
        <el-table-column prop="deviceName" label="设备名" min-width="140" />
        <el-table-column label="结果" width="80"><template #default="{ row: r }"><el-tag :type="r.results === 1 ? 'success' : 'danger'" size="small">{{ r.results === 1 ? '成功' : '失败' }}</el-tag></template></el-table-column>
        <el-table-column prop="failureReason" label="失败原因" min-width="160" />
      </el-table>
      <div v-else v-loading="resultLoading" style="text-align:center;padding:40px">{{ t('common.noData') }}</div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.batch-object-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

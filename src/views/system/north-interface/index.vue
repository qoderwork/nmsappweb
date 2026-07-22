<script setup lang="ts">
/**
 * 北向接口上报管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const loading = ref(false);

interface NorthReport {
  id: number;
  name: string;
  enabled: boolean;
  updateTime: string;
  createTime: string;
}
const tableData = ref<NorthReport[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const form = reactive({ id: 0, name: '', enabled: true });

async function loadData() {
  loading.value = true;
  try { tableData.value = []; } // TODO: connect north reports API
  catch (e) { console.error('[NorthInterface] load failed:', e); }
  finally { loading.value = false; }
}

function openAdd() { dialogMode.value = 'add'; form.id = 0; form.name = ''; form.enabled = true; dialogVisible.value = true; }
function openEdit(row: NorthReport) { dialogMode.value = 'edit'; form.id = row.id; form.name = row.name; form.enabled = row.enabled; dialogVisible.value = true; }

async function handleSave() {
  if (!form.name.trim()) { ElMessage.warning(t('common.required')); return; }
  try {
    // TODO: call north reports API
    ElMessage.success(dialogMode.value === 'add' ? t('common.addSuccess') : t('common.editSuccess'));
    dialogVisible.value = false; loadData();
  } catch (e) { console.error('[NorthInterface] save failed:', e); }
}

async function handleDelete(row: NorthReport) {
  try { await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), { type: 'warning' }); /* TODO: call delete API */ ElMessage.success(t('common.deleteSuccess')); loadData(); }
  catch (e) { if (e !== 'cancel') console.error('[NorthInterface] delete failed:', e); }
}

onMounted(() => loadData());
</script>

<template>
  <div class="north-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openAdd">新建上报任务</el-button>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="任务名" min-width="200" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '禁用' }}</el-tag></template></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column :label="t('common.actions')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row as any)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row as any)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新建上报任务' : '编辑上报任务'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button><el-button type="primary" @click="handleSave">{{ t('common.confirm') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.north-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
</style>

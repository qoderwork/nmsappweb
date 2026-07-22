<script setup lang="ts">
/**
 * SSH 访问计时器管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { listSSHAccessTimers, setSSHAccessTimer } from '@/api/ssh';
import type { SSHAccessTimerVO } from '@/types/ssh';

const { t } = useI18n();
const loading = ref(false);
const tableData = ref<SSHAccessTimerVO[]>([]);
const total = ref(0);
const queryParams = reactive({ page: 1, pageSize: 20 });

const dialogVisible = ref(false);
const form = reactive({ elementIds: [] as number[], deviceGroupIds: [] as string[], deadline: 0 });

async function loadData() {
  loading.value = true;
  try {
    const res = await listSSHAccessTimers({ page: queryParams.page, pageSize: queryParams.pageSize });
    tableData.value = Array.isArray(res) ? res : [];
    total.value = Array.isArray(res) ? res.length : 0;
  } catch (e) { console.error('[SshAccess] load failed:', e); }
  finally { loading.value = false; }
}

function handlePageChange(p: number) { queryParams.page = p; loadData(); }
function handleSizeChange(s: number) { queryParams.pageSize = s; queryParams.page = 1; loadData(); }
function openDialog() { form.elementIds = []; form.deviceGroupIds = []; form.deadline = Math.floor(Date.now() / 1000) + 3600; dialogVisible.value = true; }

async function handleSave() {
  try {
    await setSSHAccessTimer({ elementIds: form.elementIds, deviceGroupIds: form.deviceGroupIds, deadline: form.deadline });
    ElMessage.success(t('common.operateSuccess')); dialogVisible.value = false; loadData();
  } catch (e) { console.error('[SshAccess] save failed:', e); }
}

onMounted(() => loadData());
</script>

<template>
  <div class="ssh-access-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <el-button type="primary" :icon="Plus" @click="openDialog">设置 SSH 访问定时器</el-button>
      </div>
      <el-table v-loading.lazy="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="serialNumber" label="序列号" width="160" />
        <el-table-column prop="deviceName" label="设备名" min-width="140" />
        <el-table-column label="SSH状态" width="100">
          <template #default="{ row }"><el-tag :type="row.sshStatus === 'accessible' ? 'success' : 'danger'" size="small">{{ row.sshStatus === 'accessible' ? '可访问' : '不可访问' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止时间" width="170" />
        <el-table-column prop="tenancyName" label="租户" width="120" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="设置 SSH 访问定时器" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="截止时间" required>
          <el-date-picker v-model="form.deadline" type="datetime" placeholder="选择截止时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button><el-button type="primary" @click="handleSave">{{ t('common.confirm') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.ssh-access-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

<script setup lang="ts">
/**
 * SAS CBSD 管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Upload } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getCbsdInfoList, importCBSDs, downloadCbsdTemplate, getSasConfig, updateSasConfig } from '@/api/cbsd';
import type { CbsdInfo } from '@/types/cbsd';

const { t } = useI18n();
const queryParams = reactive({ keyword: '', page: 1, pageSize: 20 });
const loading = ref(false);
const tableData = ref<CbsdInfo[]>([]);
const total = ref(0);

const sasConfig = reactive({ enabled: false });
const importDialogVisible = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const res = await getCbsdInfoList({ page: queryParams.page, pageSize: queryParams.pageSize } as any);
    tableData.value = (res as any).list || []; total.value = (res as any).total || 0;
  } catch (e) { console.error('[SAS] load failed:', e); }
  finally { loading.value = false; }
}

async function loadSasConfig() {
  try { const res = await getSasConfig(); if (Array.isArray(res) && res.length > 0) sasConfig.enabled = res[0].enabled || false; }
  catch (e) { console.error('[SAS] config load failed:', e); }
}

async function handleToggleConfig() {
  try { await updateSasConfig(sasConfig); ElMessage.success(t('common.operateSuccess')); }
  catch (e) { console.error('[SAS] config save failed:', e); }
}

async function handleImport(file: any) {
  try { await importCBSDs(file.raw); ElMessage.success('导入成功'); importDialogVisible.value = false; loadData(); }
  catch (e) { console.error('[SAS] import failed:', e); }
}

async function handleDownloadTemplate() { await downloadCbsdTemplate(); }
function handleSearch() { queryParams.page = 1; loadData(); }
function handlePageChange(p: number) { queryParams.page = p; loadData(); }
function handleSizeChange(s: number) { queryParams.pageSize = s; queryParams.page = 1; loadData(); }

onMounted(() => { loadData(); loadSasConfig(); });
</script>

<template>
  <div class="sas-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true">
        <el-form-item label="SAS 自动注册">
          <el-switch v-model="sasConfig.enabled" @change="handleToggleConfig" />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Upload" @click="importDialogVisible = true">导入 CBSD</el-button>
          <el-button link @click="handleDownloadTemplate">下载模板</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="cbsd_serial_number" label="CBSD SN" width="180" />
        <el-table-column prop="serial_number" label="设备 SN" width="160" />
        <el-table-column prop="cbsd_id" label="CBSD ID" width="160" />
        <el-table-column prop="grant_id" label="Grant ID" width="160" />
        <el-table-column prop="operation_state" label="状态" width="120" />
        <el-table-column label="启用" width="80"><template #default="{ row }"><el-tag :type="row.enable ? 'success' : 'info'" size="small">{{ row.enable ? '是' : '否' }}</el-tag></template></el-table-column>
        <el-table-column prop="last_registration_time" label="注册时间" width="170" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog v-model="importDialogVisible" title="导入 CBSD" width="400px">
      <el-upload drag :auto-upload="false" :on-change="handleImport" accept=".xlsx,.xls,.csv">
        <el-icon size="40"><Upload /></el-icon>
        <div>拖拽文件或点击上传</div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.sas-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

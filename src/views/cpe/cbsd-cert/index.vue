<script setup lang="ts">
/**
 * CPE CBSD 证书文件管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getCbsdInfoList } from '@/api/cbsd';
import type { CbsdInfo } from '@/types/cbsd';

const { t } = useI18n();
const queryParams = reactive({ page: 1, pageSize: 20, keyword: '' });
const loading = ref(false);
const tableData = ref<CbsdInfo[]>([]);
const total = ref(0);

async function loadData() {
  loading.value = true;
  try {
    const res = await getCbsdInfoList({ page: queryParams.page, pageSize: queryParams.pageSize } as any);
    tableData.value = (res as any).list || res; total.value = (res as any).total || 0;
  } catch (e) { console.error('[CpeCbsd] load failed:', e); }
  finally { loading.value = false; }
}

function handlePageChange(p: number) { queryParams.page = p; loadData(); }
function handleSizeChange(s: number) { queryParams.pageSize = s; queryParams.page = 1; loadData(); }

onMounted(() => loadData());
</script>

<template>
  <div class="cpe-cbsd-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <div style="padding: 12px 16px">
        <span style="font-size:14px;color:#606266">CBSD 证书文件列表</span>
      </div>
      <el-table v-loading.lazy="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="cbsd_serial_number" label="CBSD 序列号" width="180" />
        <el-table-column prop="serial_number" label="设备序列号" width="160" />
        <el-table-column prop="cbsd_id" label="CBSD ID" width="160" />
        <el-table-column prop="grant_id" label="Grant ID" width="160" />
        <el-table-column prop="operation_state" label="状态" width="100" />
        <el-table-column prop="last_registration_time" label="最后注册时间" width="170" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.cpe-cbsd-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

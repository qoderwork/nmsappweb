<script setup lang="ts">
/**
 * CPE 设备监控
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getDevices } from '@/api/device';
import type { Device } from '@/types/device';

const { t } = useI18n();

const queryParams = reactive({ keyword: '', page: 1, pageSize: 20, device_type: 'cpe' as const });
const loading = ref(false);
const tableData = ref<Device[]>([]);
const total = ref(0);

async function loadData() {
  loading.value = true;
  try {
    const res = await getDevices({
      keyword: queryParams.keyword || undefined,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      device_type: 'cpe',
    } as any);
    tableData.value = res.list; total.value = res.total;
  } catch (e) { console.error('[CpeMonitor] load failed:', e); }
  finally { loading.value = false; }
}

function handleSearch() { queryParams.page = 1; loadData(); }
function handlePageChange(page: number) { queryParams.page = page; loadData(); }
function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.page = 1; loadData(); }
function getStatusType(s?: string | null) { if (s === 'online') return 'success' as const; if (s === 'offline') return 'danger' as const; return 'info' as const; }
function formatTime(t?: string | null) { return t || '-'; }

onMounted(() => loadData());
</script>

<template>
  <div class="cpe-monitor-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item>
          <el-input v-model="queryParams.keyword" placeholder="搜索序列号/设备名/IP" clearable style="width: 260px" @keyup.enter="handleSearch" @clear="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="queryParams.keyword = ''; handleSearch()">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading.lazy="loading" :data="tableData" stripe border style="width: 100%" row-key="ne_neid">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="serial_number" label="序列号" width="160" />
        <el-table-column prop="device_name" label="设备名" min-width="140" />
        <el-table-column prop="device_ip" label="IP" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ row.status || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="software_version" label="软件版本" width="120" />
        <el-table-column prop="product" label="产品型号" width="120" />
        <el-table-column prop="installation_location" label="安装位置" min-width="140" />
        <el-table-column prop="creation_time" label="创建时间" width="170" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.cpe-monitor-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

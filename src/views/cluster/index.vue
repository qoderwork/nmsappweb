<script setup lang="ts">
/**
 * 群组管理 (Cluster)
 * 左侧集群树 + 右侧设备表格
 */
import { ref, reactive, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getDevices } from '@/api/device';
import type { Device } from '@/types/device';

const { t } = useI18n();

const treeData = ref<Array<{ id: string; label: string; children?: any[] }>>([]);
const activeCluster = ref('');
const queryParams = reactive({ keyword: '', page: 1, pageSize: 20 });
const loading = ref(false);
const tableData = ref<Device[]>([]);
const total = ref(0);

async function loadClusters() {
  // 使用设备组作为集群的简化实现
  try {
    const { getDeviceGroups } = await import('@/api/device');
    const groups = await getDeviceGroups();
    treeData.value = groups
      .filter((g: any) => !g.default_group)
      .map((g: any) => ({ id: g.id, label: g.group_name || g.id }));
  } catch (e) { console.error('[Cluster] load clusters failed:', e); }
}

async function loadDevices() {
  loading.value = true;
  try {
    const params: any = { keyword: queryParams.keyword || undefined, page: queryParams.page, pageSize: queryParams.pageSize };
    if (activeCluster.value) params.group_id = activeCluster.value;
    const res = await getDevices(params);
    tableData.value = res.list; total.value = res.total;
  } catch (e) { console.error('[Cluster] load devices failed:', e); }
  finally { loading.value = false; }
}

function handleNodeClick(node: any) {
  activeCluster.value = node.id;
  queryParams.page = 1;
  loadDevices();
}

function handleSearch() { queryParams.page = 1; loadDevices(); }
function handlePageChange(p: number) { queryParams.page = p; loadDevices(); }
function handleSizeChange(s: number) { queryParams.pageSize = s; queryParams.page = 1; loadDevices(); }
function getStatusType(s?: string | null): 'success' | 'danger' | 'info' { if (s === 'online') return 'success'; if (s === 'offline') return 'danger'; return 'info'; }

onMounted(async () => { await loadClusters(); loadDevices(); });
</script>

<template>
  <div class="cluster-page">
    <div class="cluster-layout">
      <el-card shadow="never" class="cluster-tree" :body-style="{ padding: '8px' }">
        <div style="font-weight:600;padding:8px 12px;font-size:14px">设备组</div>
        <el-tree :data="treeData" node-key="id" default-expand-all highlight-current @node-click="handleNodeClick" />
      </el-card>
      <div class="cluster-main">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleSearch">
            <el-form-item>
              <el-input v-model="queryParams.keyword" placeholder="搜索设备" clearable style="width: 240px" @keyup.enter="handleSearch" @clear="handleSearch">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" row-key="ne_neid">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="serial_number" label="序列号" width="160" />
            <el-table-column prop="device_name" label="设备名" min-width="140" />
            <el-table-column prop="device_ip" label="IP" width="140" />
            <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ row.status || '-' }}</el-tag></template></el-table-column>
            <el-table-column prop="software_version" label="软件版本" width="120" />
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cluster-page { width: 100%; height: 100%; }
.cluster-layout { display: flex; gap: var(--spacing-base, 12px); height: 100%; }
.cluster-tree { width: 240px; flex-shrink: 0; overflow: auto; }
.cluster-main { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-base, 12px); min-width: 0; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

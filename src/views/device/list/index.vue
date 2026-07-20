<script setup lang="ts">
/**
 * 设备列表页
 *
 * 功能：
 * - 设备列表展示（分页）
 * - 关键字搜索
 * - 设备详情查看
 * - 设备删除
 */
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';

import { getDevices, deleteDevice } from '@/api/device';
import type { Device, DeviceQueryParams } from '@/types/device';

const router = useRouter();
const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<Device[]>([]);
const total = ref(0);
interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
});

// ============ 计算属性 ============
/** 表格列配置 */
const columns = computed(() => [
  { prop: 'serial_number', label: '序列号', minWidth: 140 },
  { prop: 'device_name', label: '设备名称', minWidth: 140 },
  { prop: 'device_ip', label: 'IP 地址', minWidth: 120 },
  { prop: 'software_version', label: '软件版本', minWidth: 120 },
  { prop: 'status', label: '状态', minWidth: 80 },
  { prop: 'creation_time', label: '创建时间', minWidth: 160 },
]);

// ============ 方法 ============

/** 加载设备列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getDevices(queryParams);
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[DeviceList] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  loadData();
}

/** 重置搜索 */
function handleReset() {
  queryParams.keyword = '';
  queryParams.page = 1;
  loadData();
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

/** 每页条数变化 */
function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

/** 查看设备详情 */
function handleView(row: Device) {
  router.push(`/device/detail/${row.ne_neid}`);
}

/** 删除设备 */
async function handleDelete(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${row.device_name || row.serial_number}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteDevice(row.ne_neid);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceList] delete failed:', e);
    }
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取状态标签类型 */
function getStatusType(status?: string | null): 'success' | 'danger' | 'info' {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'danger';
  return 'info';
}

/** 获取状态文本 */
function getStatusText(status?: string | null): string {
  if (status === 'online') return '在线';
  if (status === 'offline') return '离线';
  return '未知';
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="device-list-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="设备名称/序列号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        row-key="ne_neid"
      >
        <el-table-column
          type="index"
          label="#"
          width="60"
          :index="(i: number) => (queryParams.page - 1) * queryParams.pageSize + i + 1"
        />
        <el-table-column prop="serial_number" label="序列号" min-width="140">
          <template #default="{ row }">
            <span class="device-serial">{{ row.serial_number || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="device_name" label="设备名称" min-width="140">
          <template #default="{ row }">
            {{ row.device_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_ip" label="IP 地址" min-width="120">
          <template #default="{ row }">
            {{ row.device_ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="software_version" label="软件版本" min-width="120">
          <template #default="{ row }">
            {{ row.software_version || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creation_time" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.creation_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row as Device)">
              详情
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as Device)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.device-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.device-serial {
  font-family: var(--font-mono);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>
<template>
  <div class="heartbeat-container">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleSendHeartbeat">发送心跳</el-button>
      </div>
      <el-table :data="heartbeatStatusList" v-loading="loading" border style="margin-top: 20px">
        <el-table-column prop="sn" label="设备SN" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(row as HeartbeatStatus).status === 'ONLINE' ? 'success' : 'danger'">
              {{ (row as HeartbeatStatus).status === 'ONLINE' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" label="设备类型" width="120" />
        <el-table-column prop="lastHeartbeatTime" label="最后心跳时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleSendHeartbeatBySN((row as HeartbeatStatus).sn)">
              发送
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        layout="total, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { HeartbeatStatus } from '@/types/heartbeat';
import { listHeartbeatStatus, sendHeartbeat } from '@/api/heartbeat';

const loading = ref(false);
const heartbeatStatusList = ref<HeartbeatStatus[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

async function loadHeartbeatStatus() {
  loading.value = true;
  try {
    const res = await listHeartbeatStatus({ page: page.value, pageSize: pageSize.value });
    heartbeatStatusList.value = res.list || [];
    total.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleSendHeartbeat() {
  ElMessage.info('请选择具体设备发送心跳');
}

async function handleSendHeartbeatBySN(sn: string) {
  try {
    await sendHeartbeat(sn);
    ElMessage.success('心跳发送成功');
    await loadHeartbeatStatus();
  } catch (e: unknown) {
    ElMessage.error('发送失败');
  }
}

function handlePageChange(p: number) {
  page.value = p;
  loadHeartbeatStatus();
}

function handleSizeChange(s: number) {
  pageSize.value = s;
  loadHeartbeatStatus();
}

onMounted(() => {
  loadHeartbeatStatus();
});
</script>

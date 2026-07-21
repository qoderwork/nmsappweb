<template>
  <div class="heartbeat-container">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleSendHeartbeat">{{ t('heartbeat.sendHeartbeat') }}</el-button>
      </div>
      <el-table :data="heartbeatStatusList" v-loading="loading" border style="margin-top: 20px">
        <el-table-column prop="sn" :label="t('heartbeat.deviceSn')" min-width="150" />
        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="(row as HeartbeatStatus).status === 'ONLINE' ? 'success' : 'danger'">
              {{ (row as HeartbeatStatus).status === 'ONLINE' ? t('heartbeat.online') : t('heartbeat.offline') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" :label="t('heartbeat.deviceType')" width="120" />
        <el-table-column prop="lastHeartbeatTime" :label="t('heartbeat.lastHeartbeatTime')" width="180" />
        <el-table-column :label="t('common.actions')" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleSendHeartbeatBySN((row as HeartbeatStatus).sn)">
              {{ t('heartbeat.send') }}
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
import { useI18n } from 'vue-i18n';
import type { HeartbeatStatus } from '@/types/heartbeat';
import { listHeartbeatStatus, sendHeartbeat } from '@/api/heartbeat';

const { t } = useI18n();

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
  ElMessage.info(t('heartbeat.pleaseSelectDeviceToSend'));
}

async function handleSendHeartbeatBySN(sn: string) {
  try {
    await sendHeartbeat(sn);
    ElMessage.success(t('heartbeat.heartbeatSendSuccess'));
    await loadHeartbeatStatus();
  } catch (e: unknown) {
    ElMessage.error(t('heartbeat.sendFailed'));
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
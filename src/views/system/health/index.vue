<template>
  <div class="health-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- MySQL -->
      <el-tab-pane :label="t('health.mysql')" name="mysql">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadMysql">{{ t('common.refresh') }}</el-button>
        </div>
        <el-descriptions :column="2" border v-loading="mysqlLoading">
          <el-descriptions-item :label="t('health.uptime')">{{ mysqlInfo?.uptime || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.threadsConnected')">{{ mysqlInfo?.threadsConnected || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.abortedConnects')">{{ mysqlInfo?.abortedConnects || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.slowQueries')">{{ mysqlInfo?.slowQueries || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.createdTmpTables')">{{ mysqlInfo?.createdTmpTables || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.createdTmpDiskTables')">{{ mysqlInfo?.createdTmpDiskTables || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.tableLocksWaited')">{{ mysqlInfo?.tableLocksWaited || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.comRollback')">{{ mysqlInfo?.comRollback || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- Redis -->
      <el-tab-pane :label="t('health.redis')" name="redis">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadRedis">{{ t('common.refresh') }}</el-button>
        </div>
        <el-descriptions :column="2" border v-loading="redisLoading">
          <el-descriptions-item :label="t('health.processId')">{{ redisInfo?.processId || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.redisVersion')">{{ redisInfo?.redisVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.gccVersion')">{{ redisInfo?.gccVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.uptimeInSeconds')">{{ redisInfo?.uptimeInSeconds || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.uptimeInDays')">{{ redisInfo?.uptimeInDays || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.connectedClients')">{{ redisInfo?.connectedClients || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.totalConnectionsReceived')">{{ redisInfo?.totalConnectionsReceived || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('health.totalCommandsProcessed')">{{ redisInfo?.totalCommandsProcessed || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 队列 -->
      <el-tab-pane :label="t('health.queues')" name="queues">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadQueues">{{ t('common.refresh') }}</el-button>
        </div>
        <el-table :data="queueList" v-loading="queueLoading" border stripe>
          <el-table-column prop="queueName" :label="t('health.queueName')" min-width="220" />
          <el-table-column prop="length" :label="t('health.length')" width="160" />
        </el-table>
      </el-tab-pane>

      <!-- HA 上报 -->
      <el-tab-pane :label="t('health.haStatus')" name="ha">
        <div class="toolbar">
          <el-button type="primary" :icon="Check" @click="submitHA">{{ t('common.submit') }}</el-button>
        </div>
        <el-form label-width="140px" style="max-width: 560px">
          <el-form-item :label="t('health.hostname')">
            <el-input v-model="haForm.hostname" />
          </el-form-item>
          <el-form-item :label="t('health.componentName')">
            <el-input v-model="haForm.componentName" />
          </el-form-item>
          <el-form-item :label="t('health.status')">
            <el-input v-model="haForm.status" />
          </el-form-item>
          <el-form-item :label="t('health.oldStatus')">
            <el-input v-model="haForm.oldStatus" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Check } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  getMysqlInfo,
  getRedisInfo,
  getQueueInfo,
  reportHAStatus,
} from '@/api/health';
import type {
  MysqlInfo,
  RedisInfo,
  QueueInfo,
  HAComponentStatus,
} from '@/types/health';

const { t } = useI18n();

const activeTab = ref<'mysql' | 'redis' | 'queues' | 'ha'>('mysql');

// MySQL
const mysqlLoading = ref(false);
const mysqlInfo = ref<MysqlInfo | null>(null);

// Redis
const redisLoading = ref(false);
const redisInfo = ref<RedisInfo | null>(null);

// Queues
const queueLoading = ref(false);
const queueList = ref<QueueInfo[]>([]);

// HA
const haForm = reactive<HAComponentStatus>({
  hostname: '',
  componentName: '',
  status: '',
  oldStatus: '',
});

async function loadMysql() {
  mysqlLoading.value = true;
  try {
    const data = await getMysqlInfo();
    mysqlInfo.value = (data as MysqlInfo) || null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    mysqlLoading.value = false;
  }
}

async function loadRedis() {
  redisLoading.value = true;
  try {
    const data = await getRedisInfo();
    redisInfo.value = (data as RedisInfo) || null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    redisLoading.value = false;
  }
}

async function loadQueues() {
  queueLoading.value = true;
  try {
    const data = await getQueueInfo();
    queueList.value = (data as QueueInfo[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    queueLoading.value = false;
  }
}

async function submitHA() {
  try {
    await reportHAStatus({ ...haForm });
    ElMessage.success(t('common.operateSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

onMounted(() => {
  loadMysql();
  loadRedis();
  loadQueues();
});
</script>

<style scoped>
.health-page {
  padding: 12px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
</style>

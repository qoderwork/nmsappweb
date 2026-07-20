<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Timer } from '@element-plus/icons-vue';

import { getNtpConfig, updateNtpConfig, getNtpStatus } from '@/api/ntp';

const loading = ref(false);
const saving = ref(false);
const status = ref('');

const config = reactive({
  ntpServer: '',
  enable: false,
});

async function loadConfig() {
  loading.value = true;
  try {
    const result = await getNtpConfig();
    Object.assign(config, result);
  } catch (e) {
    console.error('[NTP] load config failed:', e);
  } finally {
    loading.value = false;
  }
}

async function loadStatus() {
  try {
    const result = await getNtpStatus();
    status.value = result.status || '-';
  } catch (e) {
    console.error('[NTP] load status failed:', e);
  }
}

async function saveConfig() {
  if (config.enable && !config.ntpServer) {
    ElMessage.warning('启用 NTP 时必须填写服务器地址');
    return;
  }
  saving.value = true;
  try {
    await updateNtpConfig(config);
    ElMessage.success('保存成功');
    loadStatus();
  } catch (e) {
    console.error('[NTP] save config failed:', e);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadConfig();
  loadStatus();
});
</script>

<template>
  <div class="ntp-page" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Timer /></el-icon>
          <span>NTP 配置</span>
          <el-button size="small" :icon="Refresh" @click="loadConfig" style="margin-left: auto;">刷新</el-button>
        </div>
      </template>

      <el-form :model="config" label-width="160px" style="max-width: 600px;">
        <el-form-item label="NTP 服务器">
          <el-input v-model="config.ntpServer" placeholder="如 ntp.aliyun.com" />
        </el-form-item>
        <el-form-item label="启用 NTP 同步">
          <el-switch v-model="config.enable" />
        </el-form-item>
        <el-form-item label="同步状态">
          <el-tag :type="status === 'synchronized' ? 'success' : 'info'">{{ status || '-' }}</el-tag>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.ntp-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}
</style>
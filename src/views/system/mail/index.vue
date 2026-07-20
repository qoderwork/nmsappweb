<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Message, Promotion } from '@element-plus/icons-vue';

import { getMailConfig, updateMailConfig, testMail } from '@/api/mail';
import type { MailConfig } from '@/types/mail';

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const config = reactive<MailConfig>({
  host: '',
  port: 25,
  username: '',
  password: '',
  mailAuthentication: false,
  superUserEmail: '',
});

async function loadConfig() {
  loading.value = true;
  try {
    const result = await getMailConfig();
    Object.assign(config, result);
    config.password = '';
  } catch (e) {
    console.error('[Mail] load config failed:', e);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (!config.host || !config.port || !config.username) {
    ElMessage.warning('请填写主机、端口和用户名');
    return;
  }
  saving.value = true;
  try {
    await updateMailConfig(config);
    ElMessage.success('保存成功');
  } catch (e) {
    console.error('[Mail] save config failed:', e);
  } finally {
    saving.value = false;
  }
}

async function handleTest() {
  testing.value = true;
  try {
    await testMail();
    ElMessage.success('测试邮件已发送');
  } catch (e) {
    console.error('[Mail] test failed:', e);
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="mail-page" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Message /></el-icon>
          <span>邮件配置</span>
          <div style="margin-left: auto;">
            <el-button size="small" :icon="Refresh" @click="loadConfig">刷新</el-button>
            <el-button size="small" type="primary" :icon="Promotion" :loading="testing" @click="handleTest">发送测试邮件</el-button>
          </div>
        </div>
      </template>

      <el-form :model="config" label-width="160px" style="max-width: 600px;">
        <el-form-item label="SMTP 服务器" required>
          <el-input v-model="config.host" placeholder="如 smtp.example.com" />
        </el-form-item>
        <el-form-item label="端口" required>
          <el-input-number v-model="config.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input v-model="config.username" placeholder="发件邮箱地址" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="config.password" type="password" show-password placeholder="留空表示不修改" />
        </el-form-item>
        <el-form-item label="启用邮箱认证">
          <el-switch v-model="config.mailAuthentication" />
        </el-form-item>
        <el-form-item label="超级管理员邮箱">
          <el-input v-model="config.superUserEmail" placeholder="接收系统通知的邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.mail-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}
</style>
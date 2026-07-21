<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Refresh, Message, Promotion } from '@element-plus/icons-vue';

import { getMailConfig, updateMailConfig, testMail } from '@/api/mail';
import type { MailConfig } from '@/types/mail';

const { t } = useI18n();

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
    ElMessage.warning(t('mail.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    await updateMailConfig(config);
    ElMessage.success(t('mail.saveSuccess'));
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
    ElMessage.success(t('mail.testMailSent'));
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
          <span>{{ t('mail.mailConfig') }}</span>
          <div style="margin-left: auto;">
            <el-button size="small" :icon="Refresh" @click="loadConfig">{{ t('common.refresh') }}</el-button>
            <el-button size="small" type="primary" :icon="Promotion" :loading="testing" @click="handleTest">{{ t('mail.sendTestMail') }}</el-button>
          </div>
        </div>
      </template>

      <el-form :model="config" label-width="160px" style="max-width: 600px;">
        <el-form-item :label="t('mail.smtpServer')" required>
          <el-input v-model="config.host" :placeholder="t('mail.smtpPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('mail.port')" required>
          <el-input-number v-model="config.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item :label="t('mail.username')" required>
          <el-input v-model="config.username" :placeholder="t('mail.senderEmailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('mail.password')">
          <el-input v-model="config.password" type="password" show-password :placeholder="t('mail.passwordLeaveEmpty')" />
        </el-form-item>
        <el-form-item :label="t('mail.enableMailAuth')">
          <el-switch v-model="config.mailAuthentication" />
        </el-form-item>
        <el-form-item :label="t('mail.superAdminEmail')">
          <el-input v-model="config.superUserEmail" :placeholder="t('mail.superAdminEmailPlaceholder')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">{{ t('mail.saveConfig') }}</el-button>
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
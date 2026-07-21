<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Refresh, Lock } from '@element-plus/icons-vue';

import { getSecurityRule, updateSecurityRule } from '@/api/security';
import type { SecurityRule } from '@/types/security';

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const rule = reactive<SecurityRule>({
  maximumNumberOfFailedLoginAttempts: 5,
  minimumLengthOfUsername: 4,
  maximumLengthOfUsername: 20,
  minimumLengthOfPassword: 14,
  maximumLengthOfPassword: 100,
  minimumLengthOfAdminPassword: 30,
  maximumLengthOfAdminPassword: 120,
});

async function loadRule() {
  loading.value = true;
  try {
    const result = await getSecurityRule();
    Object.assign(rule, result);
  } catch (e) {
    console.error('[Security] load rule failed:', e);
  } finally {
    loading.value = false;
  }
}

async function saveRule() {
  if (rule.maximumNumberOfFailedLoginAttempts <= 0) {
    ElMessage.warning(t('security.maxFailedLoginMustBePositive'));
    return;
  }
  if (rule.maximumLengthOfUsername < rule.minimumLengthOfUsername) {
    ElMessage.warning(t('security.usernameMaxCannotLessThanMin'));
    return;
  }
  if (rule.maximumLengthOfPassword < rule.minimumLengthOfPassword) {
    ElMessage.warning(t('security.passwordMaxCannotLessThanMin'));
    return;
  }
  if (rule.maximumLengthOfAdminPassword < rule.minimumLengthOfAdminPassword) {
    ElMessage.warning(t('security.adminPasswordMaxCannotLessThanMin'));
    return;
  }
  saving.value = true;
  try {
    await updateSecurityRule(rule);
    ElMessage.success(t('security.saveSuccess'));
  } catch (e) {
    console.error('[Security] save rule failed:', e);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadRule();
});
</script>

<template>
  <div class="security-page" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Lock /></el-icon>
          <span>{{ t('security.securityConfig') }}</span>
          <el-button size="small" :icon="Refresh" @click="loadRule" style="margin-left: auto;">{{ t('common.refresh') }}</el-button>
        </div>
      </template>

      <el-form :model="rule" label-width="220px" style="max-width: 600px;">
        <el-divider content-position="left">{{ t('security.loginPolicy') }}</el-divider>
        <el-form-item :label="t('security.maxFailedLoginAttempts')">
          <el-input-number v-model="rule.maximumNumberOfFailedLoginAttempts" :min="1" :max="100" />
          <span class="form-tip">{{ t('security.maxFailedLoginHint') }}</span>
        </el-form-item>

        <el-divider content-position="left">{{ t('security.usernamePolicy') }}</el-divider>
        <el-form-item :label="t('security.usernameMinLength')">
          <el-input-number v-model="rule.minimumLengthOfUsername" :min="1" :max="100" />
        </el-form-item>
        <el-form-item :label="t('security.usernameMaxLength')">
          <el-input-number v-model="rule.maximumLengthOfUsername" :min="1" :max="100" />
        </el-form-item>

        <el-divider content-position="left">{{ t('security.userPasswordPolicy') }}</el-divider>
        <el-form-item :label="t('security.passwordMinLength')">
          <el-input-number v-model="rule.minimumLengthOfPassword" :min="1" :max="200" />
        </el-form-item>
        <el-form-item :label="t('security.passwordMaxLength')">
          <el-input-number v-model="rule.maximumLengthOfPassword" :min="1" :max="200" />
        </el-form-item>

        <el-divider content-position="left">{{ t('security.adminPasswordPolicy') }}</el-divider>
        <el-form-item :label="t('security.adminPasswordMinLength')">
          <el-input-number v-model="rule.minimumLengthOfAdminPassword" :min="1" :max="200" />
        </el-form-item>
        <el-form-item :label="t('security.adminPasswordMaxLength')">
          <el-input-number v-model="rule.maximumLengthOfAdminPassword" :min="1" :max="200" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveRule">{{ t('security.saveConfig') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.security-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.form-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
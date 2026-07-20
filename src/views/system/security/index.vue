<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Lock } from '@element-plus/icons-vue';

import { getSecurityRule, updateSecurityRule } from '@/api/security';
import type { SecurityRule } from '@/types/security';

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
    ElMessage.warning('最大失败登录次数必须大于 0');
    return;
  }
  if (rule.maximumLengthOfUsername < rule.minimumLengthOfUsername) {
    ElMessage.warning('用户名最大长度不能小于最小长度');
    return;
  }
  if (rule.maximumLengthOfPassword < rule.minimumLengthOfPassword) {
    ElMessage.warning('密码最大长度不能小于最小长度');
    return;
  }
  if (rule.maximumLengthOfAdminPassword < rule.minimumLengthOfAdminPassword) {
    ElMessage.warning('管理员密码最大长度不能小于最小长度');
    return;
  }
  saving.value = true;
  try {
    await updateSecurityRule(rule);
    ElMessage.success('保存成功');
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
          <span>安全策略配置</span>
          <el-button size="small" :icon="Refresh" @click="loadRule" style="margin-left: auto;">刷新</el-button>
        </div>
      </template>

      <el-form :model="rule" label-width="220px" style="max-width: 600px;">
        <el-divider content-position="left">登录策略</el-divider>
        <el-form-item label="最大失败登录次数">
          <el-input-number v-model="rule.maximumNumberOfFailedLoginAttempts" :min="1" :max="100" />
          <span class="form-tip">超过此次数后账户将被锁定</span>
        </el-form-item>

        <el-divider content-position="left">用户名策略</el-divider>
        <el-form-item label="用户名最小长度">
          <el-input-number v-model="rule.minimumLengthOfUsername" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="用户名最大长度">
          <el-input-number v-model="rule.maximumLengthOfUsername" :min="1" :max="100" />
        </el-form-item>

        <el-divider content-position="left">普通用户密码策略</el-divider>
        <el-form-item label="密码最小长度">
          <el-input-number v-model="rule.minimumLengthOfPassword" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="密码最大长度">
          <el-input-number v-model="rule.maximumLengthOfPassword" :min="1" :max="200" />
        </el-form-item>

        <el-divider content-position="left">管理员密码策略</el-divider>
        <el-form-item label="管理员密码最小长度">
          <el-input-number v-model="rule.minimumLengthOfAdminPassword" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="管理员密码最大长度">
          <el-input-number v-model="rule.maximumLengthOfAdminPassword" :min="1" :max="200" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveRule">保存配置</el-button>
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
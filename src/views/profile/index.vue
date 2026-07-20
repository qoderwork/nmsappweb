<script setup lang="ts">
/**
 * 个人中心页
 *
 * 上半部分：用户基本信息展示（头像 / 用户名 / 邮箱 / 角色）
 * 下半部分：修改密码表单（旧密码 / 新密码 / 确认密码 + 校验）
 */
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules, FormItemRule } from 'element-plus';

import { useAuthStore } from '@/stores/auth';
import { changePassword } from '@/api/auth';
import { showErrorMessage, showSuccessMessage } from '@/utils/error';
import { FormRules as FormRulePresets } from '@/utils/validate';
import type { ChangePasswordParams } from '@/types';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

// ============ 用户信息 ============
/** 用户名首字母（用于无头像时占位） */
const userInitial = computed(() => {
  const name = authStore.username || 'U';
  return name.charAt(0).toUpperCase();
});

/** 用户基本信息展示项 */
const userInfoItems = computed(() => {
  const user = authStore.user;
  return [
    {
      label: t('login.username'),
      value: user?.username ?? '-',
    },
    {
      label: '真实姓名',
      value: user?.realName ?? '-',
    },
    {
      label: '角色',
      value: user?.roles?.length ? user.roles.join('、') : '-',
    },
    {
      label: '租户 ID',
      value: user?.licenseId != null ? String(user.licenseId) : '-',
    },
  ];
});

// ============ 修改密码表单 ============
const pwdFormRef = ref<FormInstance>();
const pwdLoading = ref(false);

const pwdForm = reactive<ChangePasswordParams>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

/** 确认密码校验器：与 new_password 一致 */
const confirmPwdValidator: FormItemRule['validator'] = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'));
    return;
  }
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
    return;
  }
  callback();
};

const pwdRules = computed<FormRules>(() => ({
  oldPassword: [FormRulePresets.required('请输入旧密码')],
  newPassword: [
    FormRulePresets.required('请输入新密码'),
    FormRulePresets.password(),
  ],
  confirmPassword: [
    FormRulePresets.required('请再次输入新密码'),
    { validator: confirmPwdValidator, trigger: 'blur' },
  ],
}));

/** 重置密码表单 */
function resetPwdForm() {
  pwdFormRef.value?.resetFields();
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
}

/** 提交修改密码 */
async function handleChangePassword() {
  if (!pwdFormRef.value) return;
  try {
    await pwdFormRef.value.validate();
  } catch {
    return; // 校验未通过
  }

  pwdLoading.value = true;
  try {
    await changePassword(pwdForm);
    showSuccessMessage('密码修改成功，请重新登录');
    resetPwdForm();
    // 修改密码成功后退出登录，并跳转登录页强制使用新密码重新登录
    setTimeout(async () => {
      await authStore.logout();
      router.replace('/login');
    }, 1500);
  } catch (e) {
    showErrorMessage(e, '密码修改失败');
  } finally {
    pwdLoading.value = false;
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- 用户基本信息卡片 -->
    <el-card class="profile-card" shadow="never">
      <template #header>
        <div class="profile-card__header">
          <el-icon><User /></el-icon>
          <span>基本信息</span>
        </div>
      </template>

      <div class="profile-user">
        <!-- 头像 -->
        <div class="profile-user__avatar">
          <el-avatar :size="80" :src="authStore.avatar || undefined">
            {{ userInitial }}
          </el-avatar>
        </div>

        <!-- 用户描述信息 -->
        <el-descriptions
          class="profile-user__info"
          :column="3"
          :border="true"
          label-class-name="profile-user__label"
        >
          <el-descriptions-item
            v-for="item in userInfoItems"
            :key="item.label"
            :label="item.label"
          >
            {{ item.value }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 修改密码卡片 -->
    <el-card class="profile-card" shadow="never">
      <template #header>
        <div class="profile-card__header">
          <el-icon><Lock /></el-icon>
          <span>{{ t('layout.changePassword') }}</span>
        </div>
      </template>

      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="100px"
        label-position="right"
        class="profile-pwd-form"
      >
        <el-form-item :label="'旧密码'" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入旧密码"
            autocomplete="current-password"
            style="max-width: 360px"
          />
        </el-form-item>

        <el-form-item :label="'新密码'" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="至少 8 位，需包含大小写字母和数字"
            autocomplete="new-password"
            style="max-width: 360px"
          />
        </el-form-item>

        <el-form-item :label="'确认密码'" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            autocomplete="new-password"
            style="max-width: 360px"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="pwdLoading"
            @click="handleChangePassword"
          >
            {{ t('common.save') }}
          </el-button>
          <el-button @click="resetPwdForm">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  max-width: 960px;
}

.profile-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);

    .el-icon {
      color: var(--brand-primary);
      font-size: var(--font-size-lg);
    }
  }
}

.profile-user {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2xl);
  flex-wrap: wrap;

  &__avatar {
    flex-shrink: 0;

    :deep(.el-avatar) {
      background-color: var(--brand-primary);
      color: var(--text-inverse);
      font-size: var(--font-size-2xl);
      font-weight: 600;
    }
  }

  &__info {
    flex: 1;
    min-width: 320px;
  }

  &__label {
    width: 100px;
    background-color: var(--bg-hover) !important;
    color: var(--text-secondary) !important;
    font-weight: 500;
  }
}

.profile-pwd-form {
  max-width: 560px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .profile-user {
    flex-direction: column;
    align-items: center;

    &__info {
      width: 100%;
    }
  }

  .profile-pwd-form {
    max-width: 100%;

    :deep(.el-form-item__label) {
      width: 80px !important;
    }
  }
}
</style>

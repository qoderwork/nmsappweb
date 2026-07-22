<script setup lang="ts">
/**
 * 登录页
 *
 * 布局：左侧品牌展示区（渐变背景 + Logo + 标语 + 装饰图形），右侧登录表单
 * 移动端隐藏左侧品牌区
 *
 * 自适应验证码：
 *  - 首次登录不展示验证码输入框
 *  - 后端返回 required=true 或登录失败后展示验证码输入框并请求验证码图片
 *  - 验证码图片点击可刷新
 *  - 兼容 data:image/png;base64,... 与纯 base64 两种格式
 */
import { reactive, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';

import { useAuthStore } from '@/stores/auth';
import { useSettingsStore, type Locale } from '@/stores/settings';
import { changeLocale } from '@/locales';
import { getCaptcha } from '@/api/auth';
import { showErrorMessage, showSuccessMessage, BusinessError } from '@/utils/error';
import { FormRules as FormRulePresets } from '@/utils/validate';
import type { LoginParams } from '@/types';
import { needChangePassword, modifyPassword } from '@/api/user';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const needChangePasswordDialog = ref(false);
const modifyPasswordFormRef = ref<FormInstance>();
const modifyPasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const modifyPasswordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator(rule: unknown, value: string, callback: (error?: Error) => void) {
        if (value !== modifyPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

async function handleModifyPassword() {
  if (!modifyPasswordFormRef.value) return;
  try {
    await modifyPasswordFormRef.value.validate();
  } catch {
    return;
  }
  try {
    await modifyPassword({
      oldPassword: modifyPasswordForm.oldPassword,
      newPassword: modifyPasswordForm.newPassword,
    });
    showSuccessMessage('密码修改成功');
    needChangePasswordDialog.value = false;
    router.replace(redirect.value || '/dashboard');
  } catch (e) {
    showErrorMessage(e, '密码修改失败');
  }
}

// ============ 表单 ============
const loginFormRef = ref<FormInstance>();

const form = reactive<LoginParams>({
  username: '',
  password: '',
  verificationKey: '',
  verificationCode: '',
  remember: false,
});

/** 是否需要验证码（首次登录失败或后端要求时显示） */
const captchaRequired = ref(false);
/** 验证码图片 src（data URI 形式） */
const captchaImage = ref('');
/** 验证码图片加载中 */
const captchaLoading = ref(false);

/** 登录按钮 loading */
const loading = computed(() => authStore.loading);

/** 重定向地址 */
const redirect = computed(() => {
  const r = route.query.redirect;
  return typeof r === 'string' ? r : '';
});

/** 是否暗色 */
const isDark = computed(() => settingsStore.isDark);
/** 当前语言 */
const currentLocale = computed(() => settingsStore.locale);

/** 表单校验规则（验证码显示时动态加入） */
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    username: [FormRulePresets.required(t('login.usernameRequired'))],
    password: [FormRulePresets.required(t('login.passwordRequired'))],
  };
  if (captchaRequired.value) {
    base.verificationCode = [FormRulePresets.required(t('login.captchaRequired'))];
  }
  return base;
});

// ============ 主题 & 语言 ============
function toggleTheme() {
  settingsStore.toggleTheme();
}

function handleLanguageChange(cmd: string) {
  const next = cmd as Locale;
  if (next === settingsStore.locale) return;
  settingsStore.setLocale(next);
  changeLocale(next);
}

// ============ 验证码 ============
/**
 * 兼容 data:image/png;base64,xxx 与纯 base64 两种格式
 */
function resolveCaptchaImage(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}

/** 拉取验证码 */
async function refreshCaptcha() {
  captchaLoading.value = true;
  try {
    const res = await getCaptcha();
    form.verificationKey = res.key;
    captchaImage.value = resolveCaptchaImage(res.imageBase64);
    form.verificationCode = '';
  } catch (e) {
    showErrorMessage(e, '获取验证码失败');
  } finally {
    captchaLoading.value = false;
  }
}

// ============ 登录 ============
async function handleLogin() {
  if (!loginFormRef.value) return;
  try {
    await loginFormRef.value.validate();
  } catch {
    return; // 校验未通过
  }

  try {
    await authStore.login(form);
    showSuccessMessage(t('login.loginSuccess'));

    const changeRes = await needChangePassword();
    if (changeRes.needChange) {
      needChangePasswordDialog.value = true;
      return;
    }

    router.replace(redirect.value || '/dashboard');
  } catch (e: any) {
    // 后端返回：{code: 400, message: "captcha required", data: {required: true}}
    // 拦截器传 data.data 给 BusinessError，所以 e.data = {required: true}
    if (e?.data?.required === true && !captchaRequired.value) {
      captchaRequired.value = true;
      await refreshCaptcha();
      return;
    }

    showErrorMessage(e, t('login.loginFailed'));

    // 已展示验证码 -> 失败后刷新验证码
    if (captchaRequired.value) {
      await refreshCaptcha();
    }
  }
}

/** 回车提交 */
function handleEnter() {
  void handleLogin();
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧品牌展示区 -->
    <aside class="login-brand">
      <div class="login-brand__bg" aria-hidden="true">
        <span class="login-brand__circle login-brand__circle--1" />
        <span class="login-brand__circle login-brand__circle--2" />
        <span class="login-brand__circle login-brand__circle--3" />
      </div>

      <div class="login-brand__content">
        <div class="login-brand__logo">
          <svg viewBox="0 0 32 32" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#ffffff" />
            <circle cx="16" cy="16" r="2.6" fill="#0068b6" />
            <path
              d="M9.5 16 Q9.5 9.5 16 9.5"
              stroke="#0068b6"
              stroke-width="1.8"
              fill="none"
              stroke-linecap="round"
            />
            <path
              d="M6.5 16 Q6.5 6.5 16 6.5"
              stroke="#0068b6"
              stroke-width="1.8"
              fill="none"
              stroke-linecap="round"
              opacity="0.55"
            />
            <path
              d="M22.5 16 Q22.5 22.5 16 22.5"
              stroke="#0068b6"
              stroke-width="1.8"
              fill="none"
              stroke-linecap="round"
            />
            <path
              d="M25.5 16 Q25.5 25.5 16 25.5"
              stroke="#0068b6"
              stroke-width="1.8"
              fill="none"
              stroke-linecap="round"
              opacity="0.55"
            />
          </svg>
        </div>

        <h1 class="login-brand__title">{{ t('login.title') }}</h1>
        <p class="login-brand__subtitle">{{ t('login.subtitle') }}</p>

        <div class="login-brand__features">
          <div class="login-brand__feature">
            <div class="login-brand__feature-icon-wrapper">
              <el-icon class="login-brand__feature-icon"><Monitor /></el-icon>
            </div>
            <div class="login-brand__feature-text">
              <strong>Manage All Devices</strong>
              <span>One-stop multi-vendor access</span>
            </div>
          </div>
          <div class="login-brand__feature">
            <div class="login-brand__feature-icon-wrapper">
              <el-icon class="login-brand__feature-icon"><Connection /></el-icon>
            </div>
            <div class="login-brand__feature-text">
              <strong>Monitor in Real-time</strong>
              <span>Topology & fault visualization</span>
            </div>
          </div>
          <div class="login-brand__feature">
            <div class="login-brand__feature-icon-wrapper">
              <el-icon class="login-brand__feature-icon"><DataLine /></el-icon>
            </div>
            <div class="login-brand__feature-text">
              <strong>Analyze Smartly</strong>
              <span>Key metrics & trends</span>
            </div>
          </div>
        </div>

        <div class="login-brand__footer">
          <span>© {{ new Date().getFullYear() }} NMS · All rights reserved</span>
        </div>
      </div>
    </aside>

    <!-- 右侧登录表单区 -->
    <main class="login-main">
      <!-- 顶部右上角：主题 + 语言切换 -->
      <div class="login-main__toolbar">
        <button
          class="login-tool-btn"
          :title="t('layout.theme')"
          @click="toggleTheme"
        >
          <el-icon>
            <Moon v-if="isDark" />
            <Sunny v-else />
          </el-icon>
        </button>

        <el-dropdown trigger="click" @command="handleLanguageChange">
          <button class="login-tool-btn" :title="t('layout.language')">
            <span class="login-tool-btn__text">
              {{ currentLocale === 'zh' ? '中' : 'En' }}
            </span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh" :disabled="currentLocale === 'zh'">
                {{ t('layout.chinese') }}
              </el-dropdown-item>
              <el-dropdown-item command="en" :disabled="currentLocale === 'en'">
                {{ t('layout.english') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="login-card__header">
          <h2 class="login-card__title">{{ t('login.title') }}</h2>
          <p class="login-card__subtitle">{{ t('login.subtitle') }}</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="form"
          :rules="rules"
          size="large"
          label-position="top"
          @keyup.enter="handleEnter"
        >
          <!-- 用户名 -->
          <el-form-item :label="t('login.username')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="t('login.usernamePlaceholder')"
              :prefix-icon="undefined"
              clearable
              autocomplete="username"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item :label="t('login.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="t('login.passwordPlaceholder')"
              show-password
              autocomplete="current-password"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 验证码（自适应） -->
          <el-form-item
            v-if="captchaRequired"
            :label="t('login.captcha')"
            prop="verificationCode"
          >
            <div class="login-captcha">
              <el-input
                v-model="form.verificationCode"
                :placeholder="t('login.captchaPlaceholder')"
                maxlength="6"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
              <div
                class="login-captcha__image"
                :title="t('common.refresh')"
                @click="refreshCaptcha"
              >
                <img
                  v-if="captchaImage"
                  :src="captchaImage"
                  alt="captcha"
                />
                <span v-else class="login-captcha__placeholder">
                  <el-icon><Loading v-if="captchaLoading" /><Picture v-else /></el-icon>
                </span>
              </div>
            </div>
          </el-form-item>

          <!-- 记住我 -->
          <div class="login-card__options">
            <el-checkbox v-model="form.remember">
              {{ t('login.remember') }}
            </el-checkbox>
            <el-link type="primary" underline="never" class="login-card__forgot">
              {{ t('login.forgotPassword') }}
            </el-link>
          </div>

          <!-- 登录按钮 -->
          <el-button
            type="primary"
            size="large"
            class="login-card__submit"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? t('login.logging') : t('login.loginButton') }}
          </el-button>
        </el-form>

        <el-dialog
          v-model="needChangePasswordDialog"
          title="修改密码"
          width="400px"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
          :show-close="false"
        >
          <p style="color: #f59e0b; margin-bottom: 16px;">
            您正在使用初始密码登录，请修改密码后继续。
          </p>
          <el-form
            :model="modifyPasswordForm"
            :rules="modifyPasswordRules"
            ref="modifyPasswordFormRef"
            label-position="top"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="modifyPasswordForm.oldPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="modifyPasswordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="modifyPasswordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button type="primary" @click="handleModifyPassword">
              确认修改
            </el-button>
          </template>
        </el-dialog>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-page);
  overflow: hidden;
}

/* ============ 左侧品牌区 ============ */
.login-brand {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  overflow: hidden;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-active) 100%);
  color: #ffffff;

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);

    &--1 {
      width: 520px;
      height: 520px;
      top: -180px;
      right: -160px;
    }

    &--2 {
      width: 360px;
      height: 360px;
      bottom: -120px;
      left: -120px;
      background: rgba(255, 255, 255, 0.04);
    }

    &--3 {
      width: 160px;
      height: 160px;
      top: 60%;
      right: 12%;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-xl);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  }

  &__title {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 2px;
    line-height: 1.2;
  }

  &__subtitle {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-md);
    opacity: 0.85;
    letter-spacing: 1px;
  }

  &__features {
    margin-top: var(--spacing-3xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    width: 100%;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-base) 0;
    border-radius: var(--radius-lg);
    transition: transform var(--transition-base) var(--transition-ease);

    &:hover {
      transform: translateX(8px);
    }

    &-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      flex-shrink: 0;
    }

    &-icon {
      font-size: 22px;
      color: #ffffff;
    }

    &-text {
      display: flex;
      flex-direction: column;

      strong {
        font-size: var(--font-size-base);
        font-weight: 600;
      }

      span {
        font-size: var(--font-size-xs);
        opacity: 0.75;
        margin-top: 2px;
      }
    }
  }

  &__footer {
    margin-top: auto;
    padding-top: var(--spacing-2xl);
    font-size: var(--font-size-xs);
    opacity: 0.6;
  }
}

/* ============ 右侧表单区 ============ */
.login-main {
  position: relative;
  flex: 0 0 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  background-color: var(--bg-card);

  &__toolbar {
    position: absolute;
    top: var(--spacing-base);
    right: var(--spacing-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    z-index: 1;
  }
}

.login-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-md);
  color: var(--text-regular);
  background: transparent;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast) var(--transition-ease);

  &:hover {
    color: var(--brand-primary);
    border-color: var(--brand-primary);
    background-color: var(--brand-primary-light);
  }

  &__text {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
}

/* ============ 登录卡片 ============ */
.login-card {
  width: 100%;
  max-width: 380px;
  padding: var(--spacing-2xl) var(--spacing-xl);
  background-color: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-lighter);

  &__header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
  }

  &__subtitle {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
  }

  &__forgot {
    font-size: var(--font-size-sm);
  }

  &__submit {
    width: 100%;
    letter-spacing: 2px;
    font-weight: 600;
  }

  &__hint {
    margin-top: var(--spacing-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--text-placeholder);

    .el-icon {
      font-size: var(--font-size-sm);
    }
  }
}

/* ============ 验证码区 ============ */
.login-captcha {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;

  .el-input {
    flex: 1;
  }

  &__image {
    flex-shrink: 0;
    width: 120px;
    height: 40px;
    border: 1px solid var(--border-base);
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    background-color: var(--bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--transition-fast) var(--transition-ease);

    &:hover {
      border-color: var(--brand-primary);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    display: inline-flex;
    color: var(--text-placeholder);
    font-size: var(--font-size-md);
  }
}

/* ============ 响应式：移动端隐藏左侧品牌区 ============ */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-brand {
    display: none;
  }

  .login-main {
    flex: 1;
    padding: var(--spacing-xl);
  }

  .login-card {
    max-width: 100%;
    box-shadow: none;
    border: none;
    padding: 0;
  }
}
</style>

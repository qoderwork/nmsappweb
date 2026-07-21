<template>
  <div class="deviceauth-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane :label="t('deviceauth.authConfig')" name="config">
        <el-card>
          <el-form :model="authConfig" label-width="120px">
            <el-form-item :label="t('deviceauth.authType')" required>
              <el-select v-model="authConfig.authType">
                <el-option label="OAuth" value="OAUTH" />
                <el-option :label="t('deviceauth.local')" value="LOCAL" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('deviceauth.authUrl')">
              <el-input v-model="authConfig.authUrl" />
            </el-form-item>
            <el-form-item :label="t('deviceauth.authUsername')">
              <el-input v-model="authConfig.authUsername" />
            </el-form-item>
            <el-form-item :label="t('deviceauth.authPassword')">
              <el-input v-model="authConfig.authPassword" type="password" />
            </el-form-item>
            <el-form-item :label="t('deviceauth.verifySSL')">
              <el-switch v-model="authConfig.verifySSL" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">{{ t('deviceauth.saveConfig') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
      <el-tab-pane :label="t('deviceauth.authInfo')" name="info">
        <el-table :data="authInfoList" v-loading="loading" border>
          <el-table-column prop="sn" :label="t('deviceauth.deviceSN')" min-width="150" />
          <el-table-column prop="status" :label="t('deviceauth.authStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="(row as DeviceAuthInfo).status === 'SUCCESS' ? 'success' : 'danger'">
                {{ (row as DeviceAuthInfo).status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastAuthTime" :label="t('deviceauth.lastAuthTime')" width="180" />
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
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { DeviceAuthConfig, DeviceAuthInfo } from '@/types/deviceauth';
import { getDeviceAuthConfig, saveDeviceAuthConfig, getDeviceAuthInfo } from '@/api/deviceauth';

const { t } = useI18n();

const activeTab = ref('config');
const loading = ref(false);
const saving = ref(false);
const authInfoList = ref<DeviceAuthInfo[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const authConfig = reactive<DeviceAuthConfig>({
  authType: 'LOCAL',
  authUrl: '',
  authUsername: '',
  authPassword: '',
  verifySSL: true,
});

async function loadConfig() {
  try {
    const config = await getDeviceAuthConfig();
    Object.assign(authConfig, config);
  } catch (e: unknown) {
    console.error(e);
  }
}

async function loadAuthInfo() {
  loading.value = true;
  try {
    const res = await getDeviceAuthInfo({ page: page.value, pageSize: pageSize.value });
    authInfoList.value = res.list || [];
    total.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await saveDeviceAuthConfig(authConfig);
    ElMessage.success(t('deviceauth.saveSuccess'));
  } catch (e: unknown) {
    ElMessage.error(t('deviceauth.saveFailed'));
  } finally {
    saving.value = false;
  }
}

function handlePageChange(p: number) {
  page.value = p;
  loadAuthInfo();
}

function handleSizeChange(s: number) {
  pageSize.value = s;
  loadAuthInfo();
}

onMounted(() => {
  loadConfig();
});
</script>

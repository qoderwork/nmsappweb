<template>
  <div class="deviceauth-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="认证配置" name="config">
        <el-card>
          <el-form :model="authConfig" label-width="120px">
            <el-form-item label="认证类型" required>
              <el-select v-model="authConfig.authType">
                <el-option label="OAuth" value="OAUTH" />
                <el-option label="本地" value="LOCAL" />
              </el-select>
            </el-form-item>
            <el-form-item label="认证URL">
              <el-input v-model="authConfig.authUrl" />
            </el-form-item>
            <el-form-item label="认证用户名">
              <el-input v-model="authConfig.authUsername" />
            </el-form-item>
            <el-form-item label="认证密码">
              <el-input v-model="authConfig.authPassword" type="password" />
            </el-form-item>
            <el-form-item label="验证SSL">
              <el-switch v-model="authConfig.verifySSL" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="认证信息" name="info">
        <el-table :data="authInfoList" v-loading="loading" border>
          <el-table-column prop="sn" label="设备SN" min-width="150" />
          <el-table-column prop="status" label="认证状态" width="100">
            <template #default="{ row }">
              <el-tag :type="(row as DeviceAuthInfo).status === 'SUCCESS' ? 'success' : 'danger'">
                {{ (row as DeviceAuthInfo).status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastAuthTime" label="最后认证时间" width="180" />
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
import type { DeviceAuthConfig, DeviceAuthInfo } from '@/types/deviceauth';
import { getDeviceAuthConfig, saveDeviceAuthConfig, getDeviceAuthInfo } from '@/api/deviceauth';

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
    ElMessage.success('配置保存成功');
  } catch (e: unknown) {
    ElMessage.error('保存失败');
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

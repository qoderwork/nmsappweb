<script setup lang="ts">
/**
 * 系统配置页面
 *
 * 功能：
 * - 设备配置（Inform周期/信号阈值/自动注册/认证等）
 * - ACS 配置（文件服务器/STUN/连接请求等）
 * - 日志配置（PM/MR/设备日志/NMS日志保存时间）
 * - 北向配置（SNMP Trap/告警转发）
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

import {
  getDeviceSettings,
  updateDeviceSettings,
  getACSSettings,
  updateACSSettings,
  getLogSettings,
  updateLogSettings,
  getNorthBoundConfig,
  updateNorthBoundConfig,
} from '@/api/system-settings';
import type { DeviceConfig, ACSConfig, LogConfig, NorthBoundConfig } from '@/types/system-settings';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('device');
const loading = ref(false);
const saving = ref(false);

// 设备配置
const deviceForm = reactive<DeviceConfig>({
  deviceInformPeriod: null,
  cpeSignalWeakThreshold: null,
  cpeSignalStrongThreshold: null,
  autoRegistrationEnable: undefined,
  pmFileSaveTime: null,
  deviceLogFileSaveTime: null,
  alarmSaveTime: null,
  deviceAuthentication: undefined,
  authenticationAlgorithm: null,
  acsUsername: null,
  acsPassword: null,
  maxDeviceCount: null,
});

// ACS 配置
const acsForm = reactive<ACSConfig>({
  fileServer: null,
  nmsIP: null,
  stunServer: null,
  stunPort: null,
  stunUsername: null,
  stunPassword: null,
  stunMaximumKeepAlivePeriod: null,
  stunMinimumKeepAlivePeriod: null,
  udpConnectionRequestAddressNotificationLimit: null,
  connectionRequestUsername: null,
  connectionRequestPassword: null,
  fileServerUsername: null,
  fileServerPassword: null,
  connectionRequestPasswordChange: undefined,
  fileServerPasswordChange: undefined,
  stunPasswordChange: undefined,
  haAlarmProxyIP: null,
  parameterSyncPeriod: null,
  passwordEncryption: undefined,
  logUploadPeriod: null,
  vip: null,
});

// 日志配置
const logForm = reactive<LogConfig>({
  pmAndMrSaveTime: null,
  deviceLogSaveTime: null,
  nmsLogSaveTime: null,
  alarmSaveTime: null,
  northboundFileSaveTime: null,
});

// 北向配置
const northBoundForm = reactive<NorthBoundConfig>({
  enterpriseOid: null,
  useDefaultOid: undefined,
  ip: null,
  port: null,
  username: null,
  password: null,
  path: null,
  passwordChange: undefined,
  privateKey: null,
  type: null,
  enable: undefined,
  fileName: null,
});

// ============ 方法 ============

/** 加载所有配置 */
async function loadAllSettings() {
  loading.value = true;
  try {
    const [device, acs, log, northBound] = await Promise.all([
      getDeviceSettings(),
      getACSSettings(),
      getLogSettings(),
      getNorthBoundConfig(),
    ]);
    Object.assign(deviceForm, device);
    Object.assign(acsForm, acs);
    Object.assign(logForm, log);
    Object.assign(northBoundForm, northBound);
  } catch (e) {
    console.error('[SystemSettings] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 保存设备配置 */
async function saveDeviceSettings() {
  saving.value = true;
  try {
    await updateDeviceSettings({ ...deviceForm });
    ElMessage.success('设备配置保存成功');
  } catch (e) {
    console.error('[SystemSettings] save device settings failed:', e);
  } finally {
    saving.value = false;
  }
}

/** 保存 ACS 配置 */
async function saveACSSettings() {
  saving.value = true;
  try {
    await updateACSSettings({ ...acsForm });
    ElMessage.success('ACS 配置保存成功');
  } catch (e) {
    console.error('[SystemSettings] save ACS settings failed:', e);
  } finally {
    saving.value = false;
  }
}

/** 保存日志配置 */
async function saveLogSettings() {
  saving.value = true;
  try {
    await updateLogSettings({ ...logForm });
    ElMessage.success('日志配置保存成功');
  } catch (e) {
    console.error('[SystemSettings] save log settings failed:', e);
  } finally {
    saving.value = false;
  }
}

/** 保存北向配置 */
async function saveNorthBoundConfig() {
  saving.value = true;
  try {
    await updateNorthBoundConfig({ ...northBoundForm });
    ElMessage.success('北向配置保存成功');
  } catch (e) {
    console.error('[SystemSettings] save north-bound config failed:', e);
  } finally {
    saving.value = false;
  }
}

// ============ 生命周期 ============
onMounted(() => {
  loadAllSettings();
});
</script>

<template>
  <div v-loading="loading" class="system-settings-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 设备配置 -->
      <el-tab-pane label="设备配置" name="device">
        <el-form :model="deviceForm" label-width="200px" style="max-width: 700px">
          <el-form-item label="Inform 周期（秒）">
            <el-input-number v-model="deviceForm.deviceInformPeriod" :min="0" :max="86400" />
          </el-form-item>
          <el-form-item label="CPE 信号弱阈值">
            <el-input-number v-model="deviceForm.cpeSignalWeakThreshold" :precision="2" :step="0.1" />
          </el-form-item>
          <el-form-item label="CPE 信号强阈值">
            <el-input-number v-model="deviceForm.cpeSignalStrongThreshold" :precision="2" :step="0.1" />
          </el-form-item>
          <el-form-item label="自动注册">
            <el-switch v-model="deviceForm.autoRegistrationEnable" />
          </el-form-item>
          <el-form-item label="PM 文件保存时间（天）">
            <el-input-number v-model="deviceForm.pmFileSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="设备日志文件保存时间（天）">
            <el-input-number v-model="deviceForm.deviceLogFileSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="告警保存时间（天）">
            <el-input-number v-model="deviceForm.alarmSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="设备认证">
            <el-switch v-model="deviceForm.deviceAuthentication" />
          </el-form-item>
          <el-form-item label="认证算法">
            <el-select v-model="deviceForm.authenticationAlgorithm" placeholder="请选择" clearable>
              <el-option label="HMAC-MD5" value="HMAC-MD5" />
              <el-option label="HMAC-SHA1" value="HMAC-SHA1" />
              <el-option label="HMAC-SHA256" value="HMAC-SHA256" />
            </el-select>
          </el-form-item>
          <el-form-item label="ACS 用户名">
            <el-input v-model="deviceForm.acsUsername" />
          </el-form-item>
          <el-form-item label="ACS 密码">
            <el-input v-model="deviceForm.acsPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="最大设备数">
            <el-input-number v-model="deviceForm.maxDeviceCount" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveDeviceSettings">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ACS 配置 -->
      <el-tab-pane label="ACS 配置" name="acs">
        <el-form :model="acsForm" label-width="280px" style="max-width: 800px">
          <el-form-item label="文件服务器地址">
            <el-input v-model="acsForm.fileServer" placeholder="如: http://10.0.0.1/acs-file-server" />
          </el-form-item>
          <el-form-item label="NMS IP">
            <el-input v-model="acsForm.nmsIP" placeholder="NMS IP 地址" />
          </el-form-item>
          <el-form-item label="VIP">
            <el-input v-model="acsForm.vip" placeholder="虚拟 IP" />
          </el-form-item>
          <el-form-item label="STUN 服务器">
            <el-input v-model="acsForm.stunServer" placeholder="STUN 服务器地址" />
          </el-form-item>
          <el-form-item label="STUN 端口">
            <el-input-number v-model="acsForm.stunPort" :min="0" :max="65535" />
          </el-form-item>
          <el-form-item label="STUN 用户名">
            <el-input v-model="acsForm.stunUsername" />
          </el-form-item>
          <el-form-item label="STUN 密码">
            <el-input v-model="acsForm.stunPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="修改 STUN 密码">
            <el-switch v-model="acsForm.stunPasswordChange" />
          </el-form-item>
          <el-form-item label="STUN 最大 Keep-Alive 周期">
            <el-input-number v-model="acsForm.stunMaximumKeepAlivePeriod" :min="0" />
          </el-form-item>
          <el-form-item label="STUN 最小 Keep-Alive 周期">
            <el-input-number v-model="acsForm.stunMinimumKeepAlivePeriod" :min="0" />
          </el-form-item>
          <el-form-item label="UDP Connection Request 通知限制">
            <el-input-number v-model="acsForm.udpConnectionRequestAddressNotificationLimit" :min="0" />
          </el-form-item>
          <el-form-item label="Connection Request 用户名">
            <el-input v-model="acsForm.connectionRequestUsername" />
          </el-form-item>
          <el-form-item label="Connection Request 密码">
            <el-input v-model="acsForm.connectionRequestPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="修改 Connection Request 密码">
            <el-switch v-model="acsForm.connectionRequestPasswordChange" />
          </el-form-item>
          <el-form-item label="文件服务器用户名">
            <el-input v-model="acsForm.fileServerUsername" />
          </el-form-item>
          <el-form-item label="文件服务器密码">
            <el-input v-model="acsForm.fileServerPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="修改文件服务器密码">
            <el-switch v-model="acsForm.fileServerPasswordChange" />
          </el-form-item>
          <el-form-item label="HA 告警代理 IP">
            <el-input v-model="acsForm.haAlarmProxyIP" />
          </el-form-item>
          <el-form-item label="参数同步周期（秒）">
            <el-input-number v-model="acsForm.parameterSyncPeriod" :min="0" />
          </el-form-item>
          <el-form-item label="密码加密">
            <el-switch v-model="acsForm.passwordEncryption" />
          </el-form-item>
          <el-form-item label="日志上传周期（秒）">
            <el-input-number v-model="acsForm.logUploadPeriod" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveACSSettings">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 日志配置 -->
      <el-tab-pane label="日志配置" name="log">
        <el-form :model="logForm" label-width="220px" style="max-width: 700px">
          <el-form-item label="PM/MR 数据保存时间（天）">
            <el-input-number v-model="logForm.pmAndMrSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="设备日志保存时间（天）">
            <el-input-number v-model="logForm.deviceLogSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="NMS 日志保存时间（天）">
            <el-input-number v-model="logForm.nmsLogSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="告警保存时间（天）">
            <el-input-number v-model="logForm.alarmSaveTime" :min="0" />
          </el-form-item>
          <el-form-item label="北向文件保存时间（天）">
            <el-input-number v-model="logForm.northboundFileSaveTime" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveLogSettings">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 北向配置 -->
      <el-tab-pane label="北向配置" name="northbound">
        <el-form :model="northBoundForm" label-width="180px" style="max-width: 700px">
          <el-form-item label="启用">
            <el-switch v-model="northBoundForm.enable" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="northBoundForm.type" placeholder="请选择" clearable>
              <el-option label="SNMP v2c" :value="0" />
              <el-option label="SNMP v3" :value="1" />
              <el-option label="HTTP" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="IP 地址">
            <el-input v-model="northBoundForm.ip" placeholder="北向服务器 IP" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="northBoundForm.port" :min="0" :max="65535" />
          </el-form-item>
          <el-form-item label="路径">
            <el-input v-model="northBoundForm.path" placeholder="如: /snmp/v2c/trap" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="northBoundForm.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="northBoundForm.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="修改密码">
            <el-switch v-model="northBoundForm.passwordChange" />
          </el-form-item>
          <el-form-item label="Enterprise OID">
            <el-input-number v-model="northBoundForm.enterpriseOid" :min="0" />
          </el-form-item>
          <el-form-item label="使用默认 OID">
            <el-switch v-model="northBoundForm.useDefaultOid" />
          </el-form-item>
          <el-form-item label="私钥">
            <el-input v-model="northBoundForm.privateKey" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="文件名">
            <el-input v-model="northBoundForm.fileName" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveNorthBoundConfig">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.system-settings-page {
  width: 100%;
}
</style>

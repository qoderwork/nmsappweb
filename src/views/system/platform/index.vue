<template>
  <div class="platform-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 系统日期/时区 -->
      <el-tab-pane :label="t('platform.date')" name="date">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadDate">{{ t('common.refresh') }}</el-button>
        </div>
        <el-descriptions :column="1" border v-loading="dateLoading">
          <el-descriptions-item :label="t('platform.date')">
            {{ dateInfo?.date || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('platform.zones')">
            <el-tag v-for="z in zoneList" :key="z.zoneName" class="zone-tag">{{ z.zoneName }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 日志配置 -->
      <el-tab-pane :label="t('platform.logConfig')" name="logConfig">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadLogConfig">{{ t('common.refresh') }}</el-button>
          <el-button type="primary" :icon="Check" @click="saveLogConfig">{{ t('common.save') }}</el-button>
        </div>
        <el-form label-width="120px" style="max-width: 480px" v-loading="logConfigLoading">
          <el-form-item :label="t('platform.logLevel')">
            <el-select v-model="logConfigForm.level" style="width: 100%">
              <el-option value="DEBUG" label="DEBUG" />
              <el-option value="INFO" label="INFO" />
              <el-option value="WARN" label="WARN" />
              <el-option value="ERROR" label="ERROR" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- SFTP 日志传输 -->
      <el-tab-pane :label="t('platform.ftpLogConfig')" name="ftp">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadFtpConfig">{{ t('common.refresh') }}</el-button>
          <el-button type="primary" :icon="Check" @click="saveFtpConfig">{{ t('common.save') }}</el-button>
        </div>
        <el-form label-width="140px" style="max-width: 640px" v-loading="ftpLoading">
          <el-form-item :label="t('platform.ftpHost')">
            <el-input v-model="ftpForm.host" />
          </el-form-item>
          <el-form-item :label="t('platform.ftpPort')">
            <el-input-number v-model="ftpForm.port" :min="0" :max="65535" />
          </el-form-item>
          <el-form-item :label="t('platform.ftpUsername')">
            <el-input v-model="ftpForm.username" />
          </el-form-item>
          <el-form-item :label="t('platform.ftpPassword')">
            <el-input v-model="ftpForm.password" type="password" show-password />
          </el-form-item>
          <el-form-item :label="t('platform.ftpUploadPath')">
            <el-input v-model="ftpForm.uploadPath" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- HEC 配置 -->
      <el-tab-pane :label="t('platform.hecConfig')" name="hec">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadHecConfig">{{ t('common.refresh') }}</el-button>
          <el-button type="primary" :icon="Check" @click="saveHecConfig">{{ t('common.save') }}</el-button>
        </div>
        <el-form label-width="120px" style="max-width: 640px" v-loading="hecLoading">
          <el-form-item :label="t('platform.hecUrl')">
            <el-input v-model="hecForm.url" />
          </el-form-item>
          <el-form-item :label="t('platform.hecToken')">
            <el-input v-model="hecForm.token" type="password" show-password />
          </el-form-item>
          <el-form-item :label="t('platform.hecMode')">
            <el-select v-model="hecForm.mode" style="width: 100%">
              <el-option value="http" label="HTTP" />
              <el-option value="https" label="HTTPS" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 加密配置 -->
      <el-tab-pane :label="t('platform.secrets')" name="secrets">
        <div class="toolbar">
          <el-button :icon="Refresh" @click="loadSecrets">{{ t('common.refresh') }}</el-button>
          <el-button type="primary" :icon="Check" @click="saveSecrets">{{ t('common.save') }}</el-button>
        </div>
        <el-form label-width="160px" style="max-width: 640px" v-loading="secretsLoading">
          <el-form-item :label="t('platform.emailSecret')">
            <el-input v-model="secretsForm.emailSecret" />
          </el-form-item>
          <el-form-item :label="t('platform.addressSecret')">
            <el-input v-model="secretsForm.addressSecret" />
          </el-form-item>
          <el-form-item :label="t('platform.passwordSecret')">
            <el-input v-model="secretsForm.passwordSecret" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 下载 -->
      <el-tab-pane :label="t('platform.downloads')" name="downloads">
        <div class="toolbar">
          <el-button :icon="Download" @click="downloadRsaKey">{{ t('platform.rsaPublicKey') }}</el-button>
          <el-button :icon="Download" @click="downloadLogs">{{ t('platform.platformLogs') }}</el-button>
          <el-button :icon="Download" @click="downloadManual">{{ t('platform.manual') }}</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Check, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  getDate,
  getSupportedZone,
  listLogConfig,
  updateLogConfig,
  getFTPTransferLogConfig,
  updateFTPTransferLogConfig,
  getHECConfig,
  updateHECConfig,
  listNMSSecret,
  updateNMSSecret,
  downloadRSAPublicKey,
  downloadPlatformLogsURL,
  downloadManualURL,
} from '@/api/platform';
import type {
  DateVO,
  ZoneVO,
  PlatformLogConfig,
  FTPTransferLogConfig,
  HECConfig,
  NMSSecret,
} from '@/types/platform';
import { getToken } from '@/utils/auth';

const { t } = useI18n();

const activeTab = ref<'date' | 'logConfig' | 'ftp' | 'hec' | 'secrets' | 'downloads'>('date');

// Date / Zones
const dateLoading = ref(false);
const dateInfo = ref<DateVO | null>(null);
const zoneList = ref<ZoneVO[]>([]);

// LogConfig
const logConfigLoading = ref(false);
const logConfigForm = reactive<PlatformLogConfig>({ level: 'INFO' });

// FTP
const ftpLoading = ref(false);
const ftpForm = reactive<FTPTransferLogConfig>({
  username: '',
  password: '',
  host: '',
  port: 22,
  uploadPath: '',
  passwordChange: false,
});

// HEC
const hecLoading = ref(false);
const hecForm = reactive<HECConfig>({ url: '', token: '', mode: 'http' });

// Secrets
const secretsLoading = ref(false);
const secretsForm = reactive<NMSSecret>({
  emailSecret: '',
  addressSecret: '',
  passwordSecret: '',
});

async function loadDate() {
  dateLoading.value = true;
  try {
    const [d, z] = await Promise.all([getDate(), getSupportedZone()]);
    dateInfo.value = (d as DateVO) || null;
    zoneList.value = (z as ZoneVO[]) || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    dateLoading.value = false;
  }
}

async function loadLogConfig() {
  logConfigLoading.value = true;
  try {
    const data = await listLogConfig();
    const cfg = data as PlatformLogConfig;
    if (cfg) logConfigForm.level = cfg.level;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    logConfigLoading.value = false;
  }
}

async function saveLogConfig() {
  try {
    await updateLogConfig({ ...logConfigForm });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function loadFtpConfig() {
  ftpLoading.value = true;
  try {
    const data = await getFTPTransferLogConfig();
    const cfg = data as FTPTransferLogConfig;
    if (cfg) {
      Object.assign(ftpForm, cfg);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    ftpLoading.value = false;
  }
}

async function saveFtpConfig() {
  try {
    await updateFTPTransferLogConfig({ ...ftpForm });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function loadHecConfig() {
  hecLoading.value = true;
  try {
    const data = await getHECConfig();
    const cfg = data as HECConfig;
    if (cfg) Object.assign(hecForm, cfg);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    hecLoading.value = false;
  }
}

async function saveHecConfig() {
  try {
    await updateHECConfig({ ...hecForm });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

async function loadSecrets() {
  secretsLoading.value = true;
  try {
    const data = await listNMSSecret();
    const cfg = data as NMSSecret;
    if (cfg) Object.assign(secretsForm, cfg);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  } finally {
    secretsLoading.value = false;
  }
}

async function saveSecrets() {
  try {
    await updateNMSSecret({ ...secretsForm });
    ElMessage.success(t('common.editSuccess'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    ElMessage.error(msg);
  }
}

function buildAuthURL(url: string): string {
  const token = getToken();
  // 通过 query 参数传递 token（兼容后端 Bearer 认证：后端拦截 query ?token=）
  if (token) {
    return `${url}?token=${encodeURIComponent(token)}`;
  }
  return url;
}

function openDownload(url: string) {
  window.open(buildAuthURL(url), '_blank');
}

function downloadRsaKey() {
  openDownload(downloadRSAPublicKey());
}

function downloadLogs() {
  // POST 端点不支持直接 window.open，使用 fetch 触发下载
  const token = getToken();
  fetch(downloadPlatformLogsURL(), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'platform-logs.zip';
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      ElMessage.error(msg);
    });
}

function downloadManual() {
  openDownload(downloadManualURL());
}

onMounted(() => {
  loadDate();
  loadLogConfig();
  loadFtpConfig();
  loadHecConfig();
  loadSecrets();
});
</script>

<style scoped>
.platform-page {
  padding: 12px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.zone-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}
</style>

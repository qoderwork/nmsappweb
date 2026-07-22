<script setup lang="ts">
/**
 * 设备详情页
 *
 * 功能：
 * - 展示设备基本信息（Tab 分区）
 * - 设备操作（清空命令队列、删除）
 * - 返回列表
 * - CPE 专属信号质量面板
 */
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Delete, Refresh, Connection } from '@element-plus/icons-vue';

import { getDevice, deleteDevice, emptyDeviceCommands } from '@/api/device';
import type { Device } from '@/types/device';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const deviceId = ref<number | string>(route.params.id as string);
const device = ref<Device | null>(null);
const activeTab = ref('basic');

// 判断是否为 CPE 设备
const isCPE = computed(() => device.value?.device_type === 'cpe');

// ============ 方法 ============

/** 加载设备详情 */
async function loadData() {
  loading.value = true;
  try {
    const data = await getDevice(deviceId.value);
    device.value = data;
  } catch (e) {
    console.error('[DeviceDetail] load failed:', e);
    ElMessage.error(t('device.loadDeviceDetailFailed'));
  } finally {
    loading.value = false;
  }
}

/** 返回列表 */
function handleBack() {
  router.push('/device/list');
}

/** 删除设备 */
async function handleDelete() {
  if (!device.value) return;
  try {
    await ElMessageBox.confirm(
      t('device.deleteDeviceConfirm', { name: device.value.device_name || device.value.serial_number }),
      t('device.deleteConfirm'),
      { type: 'warning' }
    );
    await deleteDevice(deviceId.value);
    ElMessage.success(t('common.deleteSuccess'));
    router.push('/device/list');
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceDetail] delete failed:', e);
    }
  }
}

/** 清空命令队列 */
async function handleEmptyCommands() {
  try {
    await ElMessageBox.confirm(
      t('device.emptyCommandsConfirm'),
      t('device.emptyCommandsTitle'),
      { type: 'warning' }
    );
    const result = await emptyDeviceCommands(deviceId.value);
    ElMessage.success(t('device.clearedCommandsCount', { count: result.cleared }));
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[DeviceDetail] empty commands failed:', e);
    }
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取状态标签类型 */
function getStatusType(status?: string | null): 'success' | 'danger' | 'info' {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'danger';
  return 'info';
}

/** 获取状态文本 */
function getStatusText(status?: string | null): string {
  if (status === 'online') return t('device.online');
  if (status === 'offline') return t('device.offline');
  return t('device.unknown');
}

/** 解析 JSON 字段 */
function parseJsonField(jsonStr?: string | null): Record<string, any> | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="device-detail-page">
    <!-- 顶部操作栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <div class="detail-header">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ t('common.back') }}
          </el-button>
          <el-tag v-if="device?.device_type" type="info" size="small" style="margin-left: 12px">
            {{ device.device_type.toUpperCase() }}
          </el-tag>
        </div>
        <div class="header-actions">
          <el-button type="warning" :icon="Refresh" @click="handleEmptyCommands">
            {{ t('device.clearCommands') }}
          </el-button>
          <el-button type="danger" :icon="Delete" @click="handleDelete">
            {{ t('common.delete') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 设备详情 Tab -->
    <el-card v-loading="loading" shadow="never" :body-style="{ padding: '0' }">
      <template #header>
        <div class="card-header">
          <div class="header-info">
            <span class="header-title">{{ device?.device_name || device?.serial_number || t('device.deviceTitle', { id: deviceId }) }}</span>
            <el-tag v-if="device?.status" :type="getStatusType(device.status)" size="small" style="margin-left: 12px">
              {{ getStatusText(device.status) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- Tab1: 基本信息 -->
        <el-tab-pane :label="t('device.basicInfo')" name="basic">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item :label="t('device.neId')">{{ device.ne_neid }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.sn')">{{ device.serial_number || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.name')">{{ device.device_name || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.deviceType')">{{ device.device_type?.toUpperCase() || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.vendor')">{{ device.manufacturer || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.model')">{{ device.model_name || device.product || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.oui')">{{ device.oui || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.mac')">{{ device.mac || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.siteId')">{{ device.site_id || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.location')">{{ device.installation_location || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.longitudeLatitude')">
              <template v-if="device.longitude && device.latitude">
                {{ device.longitude }}, {{ device.latitude }}
              </template>
              <template v-else>-</template>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.createTime')">{{ formatTime(device.creation_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab2: 网络信息 -->
        <el-tab-pane :label="t('device.networkInfo')" name="network">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item :label="t('device.ip')">{{ device.device_ip || device.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.port')">{{ device.port || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.connectionRequestUrl')" :span="2">{{ device.coon_req_url || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.connectionRequestUsername')">{{ device.connection_request_username || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.connectionRequestPassword')">{{ device.connection_request_password ? '******' : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab3: 版本信息 -->
        <el-tab-pane :label="t('device.versionInfo')" name="version">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item :label="t('device.version')">{{ device.software_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.hardwareVersion')">{{ device.hardware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.firmwareVersion')">{{ device.firmware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.fullSoftwareVersion')">{{ device.full_software_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.targetVersion')">{{ device.target_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.targetHardwareVersion')">{{ device.target_hardware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.stmVersion')">{{ device.stm_version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.generation')">{{ device.generation || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.isNewVersion')">
              <el-tag :type="device.is_new_version ? 'success' : 'info'" size="small">
                {{ device.is_new_version ? t('common.yes') : t('common.no') }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab4: 状态信息 -->
        <el-tab-pane :label="t('device.statusInfo')" name="status">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item :label="t('device.status')">
              <el-tag :type="getStatusType(device.status)" size="small">
                {{ getStatusText(device.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.isInitialized')">
              <el-tag :type="device.is_initialized ? 'success' : 'warning'" size="small">
                {{ device.is_initialized ? t('common.yes') : t('common.no') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.ztpReady')">
              <el-tag :type="device.ready_to_ztp ? 'success' : 'info'" size="small">
                {{ device.ready_to_ztp ? t('common.yes') : t('common.no') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.openStationConfigStatus')">{{ device.open_station_config_status || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.inDiagnostics')">
              <el-tag :type="device.in_diagnostics ? 'warning' : 'info'" size="small">
                {{ device.in_diagnostics ? t('common.yes') : t('common.no') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.lowResource')">
              <el-tag :type="device.low_resource ? 'danger' : 'success'" size="small">
                {{ device.low_resource ? t('common.yes') : t('common.no') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.lastLogCollectionTime')">{{ formatTime(device.last_log_collection_time) }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.configFileUploadTime')">{{ formatTime(device.config_file_upload_time) }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.cbsdCertUploadTime')">{{ formatTime(device.cbsd_cert_file_upload_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab5: CPE 信号质量（仅 CPE 设备显示） -->
        <el-tab-pane v-if="isCPE" :label="t('device.signalQuality')" name="signal">
          <div class="signal-panel">
            <el-alert type="info" :closable="false" style="margin-bottom: 16px">
              <template #title>
                <el-icon><Connection /></el-icon>
                <span style="margin-left: 8px">{{ t('device.cpeWirelessSignalMonitoring') }}</span>
              </template>
              <div>{{ t('device.signalDataFromDevice') }}</div>
            </el-alert>

            <!-- GPS 位置信息 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }">
              <template #header>
                <span class="section-title">{{ t('device.gpsLocation') }}</span>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="t('device.longitude')">{{ device?.longitude || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('device.latitude')">{{ device?.latitude || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('device.location')">{{ device?.installation_location || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('ztp.psapId')">{{ device?.psap_id || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- WiFi/GPS 信息解析展示 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <span class="section-title">{{ t('device.wifiGpsRawInfo') }}</span>
              </template>
              <template v-if="device?.wifi_or_gps_info">
                <el-input
                  :model-value="device.wifi_or_gps_info"
                  type="textarea"
                  :rows="4"
                  readonly
                />
              </template>
              <el-empty v-else :description="t('device.noWifiGpsInfo')" :image-size="60" />
            </el-card>

            <!-- E911 数据解析展示 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <span class="section-title">{{ t('device.e911Data') }}</span>
              </template>
              <template v-if="device?.e911_data">
                <el-input
                  :model-value="device.e911_data"
                  type="textarea"
                  :rows="4"
                  readonly
                />
              </template>
              <el-empty v-else :description="t('device.noE911Data')" :image-size="60" />
            </el-card>

            <!-- 信号质量指标（需要后端 cpe_statistic_record API 支持） -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <div class="signal-card-header">
                  <span class="section-title">{{ t('device.signalMetricsTrend') }}</span>
                  <el-button type="primary" size="small" :loading="loading" @click="loadData">{{ t('common.refresh') }}</el-button>
                </div>
              </template>
              <el-alert type="warning" :closable="false">
                <template #title>
                  {{ t('device.signalMetricsNeedApi') }}
                </template>
              </el-alert>
              <el-empty :description="t('device.noRealtimeSignalData')" :image-size="60" />
            </el-card>
          </div>
        </el-tab-pane>

        <!-- Tab6: 扩展信息 -->
        <el-tab-pane :label="t('device.extendedInfo')" name="extended">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item :label="t('device.ztpParams')" :span="2">
              <el-input v-if="device.ztp_parameters" :model-value="device.ztp_parameters" type="textarea" :rows="3" readonly />
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('device.configFile')">{{ device.config_file || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.cbsdCertFile')">{{ device.cbsd_cert_file || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.aosFileName')">{{ device.aos_file_name || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.market')">{{ device.market || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('ztp.psapId')">{{ device.psap_id || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.rootNode')">{{ device.root_node || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('device.licenseId')">{{ device.tenant_id || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>

      <el-empty v-if="!device && !loading" :description="t('device.noDeviceData')" />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.device-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-tabs {
  padding: 0 16px 16px;
}

.detail-descriptions {
  padding: 16px 0;
}

.signal-panel {
  padding: 16px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.signal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
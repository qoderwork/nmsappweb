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
    ElMessage.error('加载设备详情失败');
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
      `确定要删除设备 "${device.value.device_name || device.value.serial_number}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteDevice(deviceId.value);
    ElMessage.success('删除成功');
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
      '确定要清空该设备的命令队列吗？',
      '确认',
      { type: 'warning' }
    );
    const result = await emptyDeviceCommands(deviceId.value);
    ElMessage.success(`已清空 ${result.cleared} 条命令`);
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
  if (status === 'online') return '在线';
  if (status === 'offline') return '离线';
  return '未知';
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
            清空命令队列
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
            <span class="header-title">{{ device?.device_name || device?.serial_number || `设备 ${deviceId}` }}</span>
            <el-tag v-if="device?.status" :type="getStatusType(device.status)" size="small" style="margin-left: 12px">
              {{ getStatusText(device.status) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- Tab1: 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item label="设备 ID">{{ device.ne_neid }}</el-descriptions-item>
            <el-descriptions-item label="序列号">{{ device.serial_number || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ device.device_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ device.device_type?.toUpperCase() || '-' }}</el-descriptions-item>
            <el-descriptions-item label="厂商">{{ device.manufacturer || '-' }}</el-descriptions-item>
            <el-descriptions-item label="型号">{{ device.model_name || device.product || '-' }}</el-descriptions-item>
            <el-descriptions-item label="OUI">{{ device.oui || '-' }}</el-descriptions-item>
            <el-descriptions-item label="MAC 地址">{{ device.mac || '-' }}</el-descriptions-item>
            <el-descriptions-item label="站点 ID">{{ device.site_id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="安装位置">{{ device.installation_location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经纬度">
              <template v-if="device.longitude && device.latitude">
                {{ device.longitude }}, {{ device.latitude }}
              </template>
              <template v-else>-</template>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(device.creation_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab2: 网络信息 -->
        <el-tab-pane label="网络信息" name="network">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item label="IP 地址">{{ device.device_ip || device.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item label="端口">{{ device.port || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Connection Request URL" :span="2">{{ device.coon_req_url || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Connection Request 用户名">{{ device.connection_request_username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Connection Request 密码">{{ device.connection_request_password ? '******' : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab3: 版本信息 -->
        <el-tab-pane label="版本信息" name="version">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item label="软件版本">{{ device.software_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="硬件版本">{{ device.hardware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="固件版本">{{ device.firmware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="完整软件版本">{{ device.full_software_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目标版本">{{ device.target_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目标硬件版本">{{ device.target_hardware_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="STM 版本">{{ device.stm_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Generation">{{ device.generation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="是否新版本">
              <el-tag :type="device.is_new_version ? 'success' : 'info'" size="small">
                {{ device.is_new_version ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab4: 状态信息 -->
        <el-tab-pane label="状态信息" name="status">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(device.status)" size="small">
                {{ getStatusText(device.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="是否初始化">
              <el-tag :type="device.is_initialized ? 'success' : 'warning'" size="small">
                {{ device.is_initialized ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="ZTP 就绪">
              <el-tag :type="device.ready_to_ztp ? 'success' : 'info'" size="small">
                {{ device.ready_to_ztp ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开站配置状态">{{ device.open_station_config_status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="诊断中">
              <el-tag :type="device.in_diagnostics ? 'warning' : 'info'" size="small">
                {{ device.in_diagnostics ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="低资源">
              <el-tag :type="device.low_resource ? 'danger' : 'success'" size="small">
                {{ device.low_resource ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后日志采集时间">{{ formatTime(device.last_log_collection_time) }}</el-descriptions-item>
            <el-descriptions-item label="配置上传时间">{{ formatTime(device.config_file_upload_time) }}</el-descriptions-item>
            <el-descriptions-item label="CBSD 证书上传时间">{{ formatTime(device.cbsd_cert_file_upload_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- Tab5: CPE 信号质量（仅 CPE 设备显示） -->
        <el-tab-pane v-if="isCPE" label="信号质量" name="signal">
          <div class="signal-panel">
            <el-alert type="info" :closable="false" style="margin-bottom: 16px">
              <template #title>
                <el-icon><Connection /></el-icon>
                <span style="margin-left: 8px">CPE 无线信号质量监控</span>
              </template>
              <div>以下数据来自设备上报的 WiFi/GPS 信息和诊断数据</div>
            </el-alert>

            <!-- GPS 位置信息 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }">
              <template #header>
                <span class="section-title">GPS 位置</span>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="经度">{{ device?.longitude || '-' }}</el-descriptions-item>
                <el-descriptions-item label="纬度">{{ device?.latitude || '-' }}</el-descriptions-item>
                <el-descriptions-item label="安装位置">{{ device?.installation_location || '-' }}</el-descriptions-item>
                <el-descriptions-item label="PSAP ID">{{ device?.psap_id || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- WiFi/GPS 信息解析展示 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <span class="section-title">WiFi/GPS 原始信息</span>
              </template>
              <template v-if="device?.wifi_or_gps_info">
                <el-input
                  :model-value="device.wifi_or_gps_info"
                  type="textarea"
                  :rows="4"
                  readonly
                />
              </template>
              <el-empty v-else description="暂无 WiFi/GPS 信息" :image-size="60" />
            </el-card>

            <!-- E911 数据解析展示 -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <span class="section-title">E911 数据</span>
              </template>
              <template v-if="device?.e911_data">
                <el-input
                  :model-value="device.e911_data"
                  type="textarea"
                  :rows="4"
                  readonly
                />
              </template>
              <el-empty v-else description="暂无 E911 数据" :image-size="60" />
            </el-card>

            <!-- 信号质量指标（需要后端 cpe_statistic_record API 支持） -->
            <el-card shadow="never" :body-style="{ padding: '16px' }" style="margin-top: 16px">
              <template #header>
                <div class="signal-card-header">
                  <span class="section-title">信号指标趋势</span>
                  <el-button type="primary" size="small" :loading="loading" @click="loadData">刷新</el-button>
                </div>
              </template>
              <el-alert type="warning" :closable="false">
                <template #title>
                  信号指标（RSRP/SINR/吞吐量等）需要后端提供 cpe_statistic_record 查询 API
                </template>
              </el-alert>
              <el-empty description="暂无实时信号数据" :image-size="60" />
            </el-card>
          </div>
        </el-tab-pane>

        <!-- Tab6: 扩展信息 -->
        <el-tab-pane label="扩展信息" name="extended">
          <el-descriptions v-if="device" :column="2" border class="detail-descriptions">
            <el-descriptions-item label="ZTP 参数" :span="2">
              <el-input v-if="device.ztp_parameters" :model-value="device.ztp_parameters" type="textarea" :rows="3" readonly />
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="配置文件">{{ device.config_file || '-' }}</el-descriptions-item>
            <el-descriptions-item label="CBSD 证书文件">{{ device.cbsd_cert_file || '-' }}</el-descriptions-item>
            <el-descriptions-item label="AOS 文件名">{{ device.aos_file_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Market">{{ device.market || '-' }}</el-descriptions-item>
            <el-descriptions-item label="PSAP ID">{{ device.psap_id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Root Node">{{ device.root_node || '-' }}</el-descriptions-item>
            <el-descriptions-item label="License ID">{{ device.license_id || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>

      <el-empty v-if="!device && !loading" description="暂无设备数据" />
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
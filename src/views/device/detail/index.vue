<script setup lang="ts">
/**
 * 设备详情页
 *
 * 功能：
 * - 展示设备基本信息
 * - 设备操作（清空命令队列）
 * - 返回列表
 */
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Delete, Refresh } from '@element-plus/icons-vue';

import { getDevice, deleteDevice, emptyDeviceCommands } from '@/api/device';
import type { Device } from '@/types/device';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const deviceId = ref<number | string>(route.params.id as string);
const device = ref<Device | null>(null);

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
        <el-button :icon="ArrowLeft" @click="handleBack">
          {{ t('common.back') }}
        </el-button>
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

    <!-- 设备基本信息 -->
    <el-card v-loading="loading" shadow="never" :body-style="{ padding: '24px' }">
      <template #header>
        <div class="card-header">
          <span class="header-title">{{ t('device.detail') }}</span>
          <el-tag v-if="device?.status" :type="getStatusType(device.status)" size="small">
            {{ getStatusText(device.status) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions v-if="device" :column="2" border>
        <el-descriptions-item label="设备 ID">
          {{ device.ne_neid }}
        </el-descriptions-item>
        <el-descriptions-item label="序列号">
          {{ device.serial_number || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="设备名称">
          {{ device.device_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP 地址">
          {{ device.device_ip || device.ip || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="厂商">
          {{ device.manufacturer || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="型号">
          {{ device.model_name || device.product || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="软件版本">
          {{ device.software_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="硬件版本">
          {{ device.hardware_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="固件版本">
          {{ device.firmware_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="完整软件版本">
          {{ device.full_software_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标版本">
          {{ device.target_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="STM 版本">
          {{ device.stm_version || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="OUI">
          {{ device.oui || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="MAC 地址">
          {{ device.mac || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="端口">
          {{ device.port || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="站点 ID">
          {{ device.site_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="安装位置">
          {{ device.installation_location || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="经纬度">
          <template v-if="device.longitude && device.latitude">
            {{ device.longitude }}, {{ device.latitude }}
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
        <el-descriptions-item label="是否初始化">
          {{ device.is_initialized ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="是否新版本">
          {{ device.is_new_version ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="ZTP 就绪">
          {{ device.ready_to_ztp ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="开站配置状态">
          {{ device.open_station_config_status || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(device.creation_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后日志采集时间">
          {{ formatTime(device.last_log_collection_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="配置上传时间">
          {{ formatTime(device.config_file_upload_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="CBSD 证书上传时间">
          {{ formatTime(device.cbsd_cert_file_upload_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="Connection Request URL">
          {{ device.coon_req_url || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="诊断中">
          {{ device.in_diagnostics ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="低资源">
          {{ device.low_resource ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="WiFi/GPS 信息" :span="2">
          {{ device.wifi_or_gps_info || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="E911 数据" :span="2">
          {{ device.e911_data || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="ZTP 参数" :span="2">
          {{ device.ztp_parameters || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-empty v-else description="暂无设备数据" />
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

.header-actions {
  display: flex;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}
</style>

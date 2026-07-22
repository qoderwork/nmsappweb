<script setup lang="ts">
/**
 * GIS 设备地图
 */
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { http } from '@/utils/request';

const { t } = useI18n();
const loading = ref(false);
const devices = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const res = await http.get<any[]>('/devices', { params: { page: 1, pageSize: 200 } });
    devices.value = (res as any).list || res || [];
  } catch (e) { console.error('[GIS] load failed:', e); }
  finally { loading.value = false; }
}

onMounted(() => loadData());
</script>

<template>
  <div class="gis-page">
    <el-card shadow="never">
      <template #header><span>设备位置一览</span></template>
      <el-table v-loading="loading" :data="devices.filter((d: any) => d.latitude && d.longitude)" stripe border style="width: 100%" row-key="ne_neid">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="serial_number" label="序列号" width="160" />
        <el-table-column prop="device_name" label="设备名" min-width="140" />
        <el-table-column prop="longitude" label="经度" width="140" />
        <el-table-column prop="latitude" label="纬度" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small">{{ row.status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="installation_location" label="安装位置" min-width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.gis-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
</style>

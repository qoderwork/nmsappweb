<script setup lang="ts">
/**
 * BS 证书管理 (License)
 */
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getLicenses } from '@/api/license';
import type { License } from '@/types/license';

const { t } = useI18n();
const loading = ref(false);
const tableData = ref<License[]>([]);

async function loadData() {
  loading.value = true;
  try { tableData.value = await getLicenses(); }
  catch (e) { console.error('[BsLicense] load failed:', e); }
  finally { loading.value = false; }
}

onMounted(() => loadData());
</script>

<template>
  <div class="bs-license-page">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading.lazy="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="license_name" label="证书名称" min-width="160" />
        <el-table-column prop="serial_number" label="序列号" width="160" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="expire_time" label="过期时间" width="170" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.bs-license-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
</style>

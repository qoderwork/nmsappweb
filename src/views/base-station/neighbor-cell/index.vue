<script setup lang="ts">
/**
 * 相邻小区管理
 *
 * 参考 Java gNB/Maintenance/NeighborCell：导出相邻小区信息。
 * Go 后端暂未实现 ModelTree.ExportNeighbourCellInfo，预留接口。
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { http } from '@/utils/request';

const { t } = useI18n();
const loading = ref(false);

async function handleExport() {
  loading.value = true;
  try {
    await http.post('/model-tree/export-neighbor-cell', {});
    ElMessage.success(t('neighborCell.exportSuccess'));
  } catch (e) {
    console.error('[NeighborCell] export failed:', e);
    ElMessage.error(t('neighborCell.exportFail'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="neighbor-cell-page">
    <el-card shadow="never">
      <el-alert :title="t('neighborCell.exportTitle')" type="info" :closable="false" show-icon style="margin-bottom:16px" />
      <el-button type="primary" :icon="Download" :loading="loading" @click="handleExport">
        {{ t('neighborCell.exportBtn') }}
      </el-button>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.neighbor-cell-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
</style>

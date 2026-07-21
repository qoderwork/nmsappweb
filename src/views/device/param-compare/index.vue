<script setup lang="ts">
/**
 * 参数对比页面
 */
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

interface CompareResult {
  deviceA: { id: number; name: string };
  deviceB?: { id: number; name: string };
  templateId: number | null;
  differences: DifferenceItem[];
}

interface DifferenceItem {
  parameterName: string;
  leftValue: string;
  rightValue: string;
  different: boolean;
}

const { t } = useI18n();

const compareType = ref<'device' | 'template'>('device');
const form = reactive({
  deviceAId: null as number | null,
  deviceBId: null as number | null,
  templateId: null as number | null,
});
const showDiffOnly = ref(true);
const compareResult = ref<CompareResult | null>(null);
const loading = ref(false);

const showDeviceB = computed(() => compareType.value === 'device');
const showTemplate = computed(() => compareType.value === 'template');

const filteredDifferences = computed(() => {
  if (!compareResult.value?.differences) return [];
  if (!showDiffOnly.value) return compareResult.value.differences;
  return compareResult.value.differences.filter((d: DifferenceItem) => d.different);
});

async function handleCompare() {
  if (compareType.value === 'device') {
    if (!form.deviceAId) {
      ElMessage.warning(t('paramCompare.pleaseSelectLeftDeviceId'));
      return;
    }
    if (!form.deviceBId) {
      ElMessage.warning(t('paramCompare.pleaseSelectRightDeviceId'));
      return;
    }
  } else {
    if (!form.deviceAId) {
      ElMessage.warning(t('paramCompare.pleaseSelectLeftDeviceId'));
      return;
    }
    if (!form.templateId) {
      ElMessage.warning(t('paramCompare.pleaseSelectTemplateId'));
      return;
    }
  }

  loading.value = true;
  try {
    // 模拟对比结果
    compareResult.value = {
      deviceA: { id: form.deviceAId!, name: `Device ${form.deviceAId}` },
      deviceB: form.deviceBId ? { id: form.deviceBId, name: `Device ${form.deviceBId}` } : undefined,
      templateId: form.templateId,
      differences: [],
    };
  } catch (e) {
    console.error('[ParamCompare] compare failed:', e);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  form.deviceAId = null;
  form.deviceBId = null;
  form.templateId = null;
  compareResult.value = null;
}
</script>

<template>
  <div class="param-compare-page">
    <el-card shadow="never">
      <template #header>
        <span class="card-title">{{ t('paramCompare.title') }}</span>
      </template>

      <el-form :model="form" label-width="140px">
        <el-form-item :label="t('paramCompare.compareType')">
          <el-radio-group v-model="compareType">
            <el-radio value="device">{{ t('paramCompare.deviceCompare') }}</el-radio>
            <el-radio value="template">{{ t('paramCompare.deviceTemplateCompare') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('paramCompare.deviceAId')">
          <el-input-number v-model="form.deviceAId" :min="1" :placeholder="t('paramCompare.pleaseSelectLeftDeviceId')" style="width: 220px" />
        </el-form-item>

        <el-form-item v-if="showDeviceB" :label="t('paramCompare.deviceBId')">
          <el-input-number v-model="form.deviceBId" :min="1" :placeholder="t('paramCompare.pleaseSelectRightDeviceId')" style="width: 220px" />
        </el-form-item>

        <el-form-item v-if="showTemplate" :label="t('paramCompare.templateId')">
          <el-input-number v-model="form.templateId" :min="1" :placeholder="t('paramCompare.pleaseSelectTemplateId')" style="width: 220px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleCompare">{{ t('paramCompare.compare') }}</el-button>
          <el-button @click="handleReset">{{ t('paramCompare.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="compareResult" shadow="never" class="result-card">
      <template #header>
        <div class="result-header">
          <span>{{ t('paramCompare.compareResult') }}</span>
          <el-switch v-model="showDiffOnly" :active-text="t('paramCompare.showDiffOnly')" />
        </div>
      </template>

      <el-table :data="filteredDifferences" stripe border style="width: 100%">
        <el-table-column prop="parameterName" :label="t('paramCompare.parameterName')" min-width="180" />
        <el-table-column prop="leftValue" :label="t('paramCompare.leftValue')" min-width="200" />
        <el-table-column prop="rightValue" :label="t('paramCompare.rightValue')" min-width="200" />
        <el-table-column :label="t('paramCompare.compareResult')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.different ? 'danger' : 'success'" size="small">
              {{ row.different ? t('paramCompare.different') : t('paramCompare.same') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="filteredDifferences.length === 0" :description="t('common.noData')" />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.param-compare-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.result-card {
  margin-top: var(--spacing-base);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
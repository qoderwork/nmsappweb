<script setup lang="ts">
/**
 * 参数对比页面
 *
 * 功能：
 * - 选择两个设备或设备与模板进行对比
 * - 对比结果展示（差异高亮）
 */
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';

import { compareParams } from '@/api/param-compare';
import type { ParamCompareResult } from '@/types/param-compare';

const { t } = useI18n();

// ============ 状态 ============
const compareType = ref<'device' | 'template'>('device');
const leftElementId = ref<number | undefined>(undefined);
const rightElementId = ref<number | undefined>(undefined);
const templateId = ref<number | undefined>(undefined);
const compareLoading = ref(false);
const compareResult = ref<ParamCompareResult[]>([]);
const showDiffOnly = ref(false);

// ============ 方法 ============
async function handleCompare() {
  if (!leftElementId.value) {
    ElMessage.warning('请选择左侧设备 ID');
    return;
  }
  if (compareType.value === 'device' && !rightElementId.value) {
    ElMessage.warning('请选择右侧设备 ID');
    return;
  }
  if (compareType.value === 'template' && !templateId.value) {
    ElMessage.warning('请选择模板 ID');
    return;
  }

  compareLoading.value = true;
  try {
    const data: Record<string, unknown> = {
      left_element_id: leftElementId.value,
    };
    if (compareType.value === 'device') {
      data.right_element_id = rightElementId.value;
    } else {
      data.template_id = templateId.value;
    }
    const res = await compareParams(data);
    compareResult.value = res;
  } catch (e) {
    console.error('[ParamCompare] compare failed:', e);
  } finally {
    compareLoading.value = false;
  }
}

function handleReset() {
  leftElementId.value = undefined;
  rightElementId.value = undefined;
  templateId.value = undefined;
  compareResult.value = [];
  showDiffOnly.value = false;
}

const filteredResult = computed(() => {
  if (!showDiffOnly.value) return compareResult.value;
  return compareResult.value.filter((item) => !item.is_same);
});

function getDiffType(isSame: boolean): 'success' | 'warning' {
  return isSame ? 'success' : 'warning';
}

function getDiffText(isSame: boolean): string {
  return isSame ? '一致' : '差异';
}
</script>

<template>
  <div class="param-compare-page">
    <!-- 对比条件 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true">
        <el-form-item label="对比类型">
          <el-radio-group v-model="compareType">
            <el-radio-button label="device">设备对比</el-radio-button>
            <el-radio-button label="template">设备与模板对比</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="设备 A ID">
          <el-input-number v-model="leftElementId" :min="1" placeholder="设备 ID" style="width: 160px" />
        </el-form-item>
        <el-form-item label="设备 B ID" v-if="compareType === 'device'">
          <el-input-number v-model="rightElementId" :min="1" placeholder="设备 ID" style="width: 160px" />
        </el-form-item>
        <el-form-item label="模板 ID" v-else>
          <el-input-number v-model="templateId" :min="1" placeholder="模板 ID" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="compareLoading" @click="handleCompare">对比</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果展示 -->
    <el-card shadow="never" :body-style="{ padding: '0' }" v-if="compareResult.length">
      <div class="result-toolbar">
        <el-checkbox v-model="showDiffOnly">仅显示差异</el-checkbox>
        <el-tag type="info">共 {{ compareResult.length }} 条参数，差异 {{ compareResult.filter((i) => !i.is_same).length }} 条</el-tag>
      </div>
      <el-table :data="filteredResult" stripe border style="width: 100%" row-key="parameter_name">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="parameter_name" label="参数名" min-width="200" />
        <el-table-column prop="left_value" label="左侧值" min-width="160">
          <template #default="{ row }">
            <span :class="{ 'diff-highlight': !row.is_same }">{{ row.left_value ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="right_value" label="右侧值" min-width="160">
          <template #default="{ row }">
            <span :class="{ 'diff-highlight': !row.is_same }">{{ row.right_value ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="对比结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDiffType(row.is_same)" size="small">{{ getDiffText(row.is_same) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-else description="请选择对比条件并点击对比" />
  </div>
</template>

<style lang="scss" scoped>
.param-compare-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.diff-highlight {
  color: #e6a23c;
  font-weight: bold;
}
</style>

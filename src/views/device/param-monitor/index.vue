<script setup lang="ts">
/**
 * 参数监控页面
 *
 * Tab1: 监控配置
 * Tab2: 阈值规则
 * Tab3: 实时监控
 */
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue';

const { t } = useI18n();

const activeTab = ref('config');

// ============ Tab1: 监控配置 ============
const configLoading = ref(false);
const configList = ref<any[]>([]);
const configTotal = ref(0);
const configQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const configDialogVisible = ref(false);
const configDialogTitle = ref(t('paramMonitor.addConfigTitle'));
const isEditConfig = ref(false);
const configForm = reactive({
  id: undefined as number | undefined,
  name: '',
  element_id: undefined as number | undefined,
  parameter_names: '',
  collection_interval: 60,
});

async function loadConfigs() {
  configLoading.value = true;
  try {
    configList.value = [];
    configTotal.value = 0;
  } catch (e) {
    console.error('[ParamMonitor] load configs failed:', e);
  } finally {
    configLoading.value = false;
  }
}

function handleConfigSearch() {
  configQuery.page = 1;
  loadConfigs();
}

function handleConfigReset() {
  configQuery.keyword = '';
  configQuery.page = 1;
  loadConfigs();
}

function handleAddConfig() {
  configDialogTitle.value = t('paramMonitor.addConfigTitle');
  isEditConfig.value = false;
  configForm.id = undefined;
  configForm.name = '';
  configForm.element_id = undefined;
  configForm.parameter_names = '';
  configForm.collection_interval = 60;
  configDialogVisible.value = true;
}

function handleEditConfig(row: any) {
  configDialogTitle.value = t('paramMonitor.editConfigTitle');
  isEditConfig.value = true;
  configForm.id = row.id;
  configForm.name = row.name ?? '';
  configForm.element_id = row.element_id;
  configForm.parameter_names = row.parameter_names ?? '';
  configForm.collection_interval = row.collection_interval ?? 60;
  configDialogVisible.value = true;
}

async function handleSaveConfig() {
  if (!configForm.name) {
    ElMessage.warning(t('paramMonitor.pleaseEnterConfigName'));
    return;
  }
  if (!configForm.element_id) {
    ElMessage.warning(t('paramMonitor.pleaseEnterDeviceId'));
    return;
  }
  try {
    if (isEditConfig.value) {
      ElMessage.success(t('paramMonitor.updateSuccess'));
    } else {
      ElMessage.success(t('paramMonitor.createSuccess'));
    }
    configDialogVisible.value = false;
    loadConfigs();
  } catch (e) {
    console.error('[ParamMonitor] save config failed:', e);
  }
}

async function handleDeleteConfig(row: any) {
  try {
    await ElMessageBox.confirm(t('paramMonitor.deleteConfigConfirm', { name: row.name }), t('paramMonitor.deleteConfirm'), { type: 'warning' });
    ElMessage.success(t('paramMonitor.deleteSuccess'));
    loadConfigs();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParamMonitor] delete config failed:', e);
  }
}

async function handleToggleConfigStatus(row: any) {
  try {
    const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled';
    row.status = newStatus;
    ElMessage.success(t('paramMonitor.statusUpdateSuccess'));
  } catch (e) {
    console.error('[ParamMonitor] toggle config status failed:', e);
  }
}

// ============ Tab2: 阈值规则 ============
const ruleLoading = ref(false);
const ruleList = ref<any[]>([]);
const ruleTotal = ref(0);
const ruleQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const ruleDialogVisible = ref(false);
const ruleDialogTitle = ref(t('paramMonitor.addRuleTitle'));
const isEditRule = ref(false);
const ruleForm = reactive({
  id: undefined as number | undefined,
  name: '',
  config_id: undefined as number | undefined,
  parameter_name: '',
  operator: '>' as string,
  threshold_value: '' as string,
  enabled: true,
});

async function loadRules() {
  ruleLoading.value = true;
  try {
    ruleList.value = [];
    ruleTotal.value = 0;
  } catch (e) {
    console.error('[ParamMonitor] load rules failed:', e);
  } finally {
    ruleLoading.value = false;
  }
}

function handleRuleSearch() {
  ruleQuery.page = 1;
  loadRules();
}

function handleRuleReset() {
  ruleQuery.keyword = '';
  ruleQuery.page = 1;
  loadRules();
}

function handleAddRule() {
  ruleDialogTitle.value = t('paramMonitor.addRuleTitle');
  isEditRule.value = false;
  ruleForm.id = undefined;
  ruleForm.name = '';
  ruleForm.config_id = undefined;
  ruleForm.parameter_name = '';
  ruleForm.operator = '>';
  ruleForm.threshold_value = '';
  ruleForm.enabled = true;
  ruleDialogVisible.value = true;
}

function handleEditRule(row: any) {
  ruleDialogTitle.value = t('paramMonitor.editRuleTitle');
  isEditRule.value = true;
  ruleForm.id = row.id;
  ruleForm.name = row.name ?? '';
  ruleForm.config_id = row.config_id;
  ruleForm.parameter_name = row.parameter_name ?? '';
  ruleForm.operator = row.operator ?? '>';
  ruleForm.threshold_value = row.threshold_value ?? '';
  ruleForm.enabled = row.enabled ?? true;
  ruleDialogVisible.value = true;
}

async function handleSaveRule() {
  if (!ruleForm.name) {
    ElMessage.warning(t('paramMonitor.pleaseEnterRuleName'));
    return;
  }
  try {
    if (isEditRule.value) {
      ElMessage.success(t('paramMonitor.updateSuccess'));
    } else {
      ElMessage.success(t('paramMonitor.createSuccess'));
    }
    ruleDialogVisible.value = false;
    loadRules();
  } catch (e) {
    console.error('[ParamMonitor] save rule failed:', e);
  }
}

async function handleDeleteRule(row: any) {
  try {
    await ElMessageBox.confirm(t('paramMonitor.deleteRuleConfirm', { name: row.name }), t('paramMonitor.deleteConfirm'), { type: 'warning' });
    ElMessage.success(t('paramMonitor.deleteSuccess'));
    loadRules();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParamMonitor] delete rule failed:', e);
  }
}

// ============ Tab3: 实时监控 ============
const realtimeLoading = ref(false);
const realtimeData = ref<any[]>([]);
const monitorInput = reactive({
  config_id: undefined as number | undefined,
  parameter_names: '',
});
const isMonitoring = ref(false);
let monitorTimer: ReturnType<typeof setInterval> | null = null;

function handleStartMonitor() {
  if (!monitorInput.config_id) {
    ElMessage.warning(t('paramMonitor.pleaseEnterConfigName'));
    return;
  }
  isMonitoring.value = true;
  realtimeData.value = [];
  monitorTimer = setInterval(() => {
    realtimeData.value = realtimeData.value.map((item) => ({
      ...item,
      current_value: Math.random().toFixed(2),
      timestamp: new Date().toISOString(),
    }));
  }, 3000);
}

function handleStopMonitor() {
  isMonitoring.value = false;
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
}

function handleRefreshRealtime() {
  realtimeLoading.value = true;
  setTimeout(() => {
    realtimeLoading.value = false;
  }, 500);
}

onUnmounted(() => {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
});

onMounted(() => {
  loadConfigs();
  loadRules();
});
</script>

<template>
  <div class="param-monitor-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab1: 监控配置 -->
      <el-tab-pane :label="t('paramMonitor.monitorConfig')" name="config">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleConfigSearch">
            <el-form-item :label="t('paramMonitor.keyword')">
              <el-input v-model="configQuery.keyword" :placeholder="t('paramMonitor.configNamePlaceholder')" clearable style="width: 200px" @keyup.enter="handleConfigSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleConfigSearch">{{ t('paramMonitor.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleConfigReset">{{ t('paramMonitor.reset') }}</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddConfig">{{ t('paramMonitor.addConfig') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="configLoading" :data="configList" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" :label="t('paramMonitor.configName')" min-width="160" />
            <el-table-column prop="element_id" :label="t('paramMonitor.deviceId')" width="120" />
            <el-table-column prop="parameter_names" :label="t('paramMonitor.parameterNames')" min-width="200" />
            <el-table-column prop="collection_interval" :label="t('paramMonitor.collectionInterval')" width="120" />
            <el-table-column prop="status" :label="t('paramMonitor.status')" width="100">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 'enabled'" :active-text="t('paramMonitor.enabled')" :inactive-text="t('paramMonitor.disabled')" @change="handleToggleConfigStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Edit" @click="handleEditConfig(row)">{{ t('paramMonitor.edit') }}</el-button>
                <el-button link type="danger" size="small" :icon="Delete" @click="handleDeleteConfig(row)">{{ t('paramMonitor.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="configQuery.page" v-model:page-size="configQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="configTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { configQuery.pageSize = s; configQuery.page = 1; loadConfigs(); }" @current-change="(p: number) => { configQuery.page = p; loadConfigs(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: 阈值规则 -->
      <el-tab-pane :label="t('paramMonitor.thresholdRule')" name="rule">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleRuleSearch">
            <el-form-item :label="t('paramMonitor.keyword')">
              <el-input v-model="ruleQuery.keyword" :placeholder="t('paramMonitor.ruleNameParamNamePlaceholder')" clearable style="width: 220px" @keyup.enter="handleRuleSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleRuleSearch">{{ t('paramMonitor.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleRuleReset">{{ t('paramMonitor.reset') }}</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddRule">{{ t('paramMonitor.addRuleTitle') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="ruleLoading" :data="ruleList" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" :label="t('paramMonitor.ruleName')" min-width="160" />
            <el-table-column prop="parameter_name" :label="t('paramMonitor.parameterName')" min-width="160" />
            <el-table-column prop="operator" :label="t('paramMonitor.operator')" width="100" />
            <el-table-column prop="threshold_value" :label="t('paramMonitor.thresholdValue')" width="120" />
            <el-table-column prop="enabled" :label="t('common.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? t('paramMonitor.enabled') : t('paramMonitor.disabled') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Edit" @click="handleEditRule(row)">{{ t('paramMonitor.edit') }}</el-button>
                <el-button link type="danger" size="small" :icon="Delete" @click="handleDeleteRule(row)">{{ t('paramMonitor.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="ruleQuery.page" v-model:page-size="ruleQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="ruleTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { ruleQuery.pageSize = s; ruleQuery.page = 1; loadRules(); }" @current-change="(p: number) => { ruleQuery.page = p; loadRules(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: 实时监控 -->
      <el-tab-pane :label="t('paramMonitor.realtimeData')" name="realtime">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true">
            <el-form-item :label="t('paramMonitor.configName')">
              <el-input-number v-model="monitorInput.config_id" :min="1" :placeholder="t('paramMonitor.configNamePlaceholder')" style="width: 180px" />
            </el-form-item>
            <el-form-item>
              <el-button v-if="!isMonitoring" type="primary" @click="handleStartMonitor">{{ t('paramMonitor.startMonitor') }}</el-button>
              <el-button v-else type="danger" @click="handleStopMonitor">{{ t('paramMonitor.stop') }}</el-button>
              <el-button :icon="Refresh" @click="handleRefreshRealtime">{{ t('paramMonitor.refresh') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="realtimeLoading" :data="realtimeData" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="parameter_name" :label="t('paramMonitor.parameterName')" min-width="160" />
            <el-table-column prop="current_value" :label="t('paramMonitor.currentValue')" min-width="120" />
            <el-table-column prop="unit" :label="t('paramMonitor.unit')" width="100" />
            <el-table-column prop="timestamp" :label="t('paramMonitor.timestamp')" min-width="180" />
          </el-table>
          <el-empty v-if="!isMonitoring && realtimeData.length === 0" :description="t('common.noData')" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 监控配置弹窗 -->
    <el-dialog v-model="configDialogVisible" :title="configDialogTitle" width="580px">
      <el-form :model="configForm" label-width="120px">
        <el-form-item :label="t('paramMonitor.configName')" required>
          <el-input v-model="configForm.name" :placeholder="t('paramMonitor.configNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('paramMonitor.deviceId')" required>
          <el-input-number v-model="configForm.element_id" :min="1" :placeholder="t('paramMonitor.deviceIdPlaceholder')" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('paramMonitor.parameterNames')">
          <el-input v-model="configForm.parameter_names" :placeholder="t('paramMonitor.parameterNamesPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('paramMonitor.collectionIntervalLabel')">
          <el-input-number v-model="configForm.collection_interval" :min="1" :max="3600" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">{{ t('paramMonitor.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveConfig">{{ t('paramMonitor.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 阈值规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleDialogTitle" width="580px">
      <el-form :model="ruleForm" label-width="120px">
        <el-form-item :label="t('paramMonitor.ruleName')" required>
          <el-input v-model="ruleForm.name" :placeholder="t('paramMonitor.ruleNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('paramMonitor.parameterName')">
          <el-input v-model="ruleForm.parameter_name" :placeholder="t('paramMonitor.parameterNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('paramMonitor.operator')">
          <el-select v-model="ruleForm.operator" :placeholder="t('paramMonitor.operatorPlaceholder')" style="width: 100%">
            <el-option label=">" value=">" />
            <el-option label=">=" value=">=" />
            <el-option label="<" value="<" />
            <el-option label="<=" value="<=" />
            <el-option label="=" value="=" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('paramMonitor.thresholdValue')">
          <el-input v-model="ruleForm.threshold_value" :placeholder="t('paramMonitor.thresholdValuePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">{{ t('paramMonitor.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveRule">{{ t('paramMonitor.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.param-monitor-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>
<script setup lang="ts">
/**
 * 参数监控页面
 *
 * Tab1: 监控配置
 * Tab2: 阈值告警
 * Tab3: 实时监控
 */
import { reactive, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

import {
  addMonitorConfig,
  getMonitorConfigs,
  updateMonitorConfig,
  deleteMonitorConfig,
  toggleMonitorConfig,
  getRealtimeMonitorData,
  createThresholdRule,
  updateThresholdRule,
  deleteThresholdRule,
  getThresholdRules,
  testThresholdRule,
} from '@/api/param-monitor';
import type { MonitorConfigVo, ParameterMonitorConfig, ThresholdRule, RealtimeMonitorDataVo } from '@/types/param-monitor';

const { t } = useI18n();

// ============ 通用状态 ============
const activeTab = ref('config');

// ============ Tab1: 监控配置 ============
const configLoading = ref(false);
const configList = ref<MonitorConfigVo[]>([]);
const configTotal = ref(0);
const configQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const configDialogVisible = ref(false);
const configDialogTitle = ref('新增监控配置');
const isEditConfig = ref(false);
const configForm = reactive<Partial<ParameterMonitorConfig>>({
  id: undefined,
  name: '',
  element_id: undefined,
  parameter_names: '',
  interval: 60,
  enabled: true,
});

async function loadConfigs() {
  configLoading.value = true;
  try {
    const res = await getMonitorConfigs({
      page: configQuery.page,
      pageSize: configQuery.pageSize,
      keyword: configQuery.keyword || undefined,
    });
    configList.value = res.list;
    configTotal.value = res.total;
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
  configDialogTitle.value = '新增监控配置';
  isEditConfig.value = false;
  configForm.id = undefined;
  configForm.name = '';
  configForm.element_id = undefined;
  configForm.parameter_names = '';
  configForm.interval = 60;
  configForm.enabled = true;
  configDialogVisible.value = true;
}

function handleEditConfig(row: MonitorConfigVo) {
  configDialogTitle.value = '编辑监控配置';
  isEditConfig.value = true;
  configForm.id = row.id;
  configForm.name = row.name ?? '';
  configForm.element_id = row.element_id ?? undefined;
  // 回填 parameter_names：优先用 row.parameter_names，其次用 parameterIds 数组转 JSON 字符串
  if (row.parameter_names) {
    configForm.parameter_names = row.parameter_names;
  } else if (row.parameterIds && row.parameterIds.length > 0) {
    configForm.parameter_names = JSON.stringify(row.parameterIds);
  } else {
    configForm.parameter_names = '';
  }
  configForm.interval = row.interval ?? 60;
  configForm.enabled = row.enabled ?? true;
  configDialogVisible.value = true;
}

async function handleSaveConfig() {
  if (!configForm.name) {
    ElMessage.warning('请输入配置名称');
    return;
  }
  if (!configForm.element_id) {
    ElMessage.warning('请输入设备 ID');
    return;
  }
  try {
    const data = { ...configForm };
    if (isEditConfig.value && configForm.id) {
      await updateMonitorConfig(data as ParameterMonitorConfig);
      ElMessage.success('更新成功');
    } else {
      await addMonitorConfig(data);
      ElMessage.success('创建成功');
    }
    configDialogVisible.value = false;
    loadConfigs();
  } catch (e) {
    console.error('[ParamMonitor] save config failed:', e);
  }
}

async function handleDeleteConfig(row: MonitorConfigVo) {
  try {
    await ElMessageBox.confirm(`确定删除监控配置 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteMonitorConfig({ ids: [row.id] });
    ElMessage.success('删除成功');
    loadConfigs();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParamMonitor] delete config failed:', e);
  }
}

async function handleToggleConfig(row: MonitorConfigVo) {
  try {
    await toggleMonitorConfig({ id: row.id, enabled: !(row.enabled ?? true) });
    ElMessage.success('状态更新成功');
    loadConfigs();
  } catch (e) {
    console.error('[ParamMonitor] toggle config failed:', e);
  }
}

// ============ Tab2: 阈值告警 ============
const ruleLoading = ref(false);
const ruleList = ref<ThresholdRule[]>([]);
const ruleTotal = ref(0);
const ruleQuery = reactive({ page: 1, pageSize: 20, keyword: '' });
const ruleDialogVisible = ref(false);
const ruleDialogTitle = ref('新增阈值规则');
const isEditRule = ref(false);
const ruleForm = reactive<Partial<ThresholdRule>>({
  id: undefined,
  name: '',
  element_id: undefined,
  parameter_name: '',
  operator: '>',
  threshold_value: 0,
  enabled: true,
});

const operators = [
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '等于', value: '=' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
];

async function loadRules() {
  ruleLoading.value = true;
  try {
    const res = await getThresholdRules({
      page: ruleQuery.page,
      pageSize: ruleQuery.pageSize,
      keyword: ruleQuery.keyword || undefined,
    });
    ruleList.value = res.list;
    ruleTotal.value = res.total;
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
  ruleDialogTitle.value = '新增阈值规则';
  isEditRule.value = false;
  ruleForm.id = undefined;
  ruleForm.name = '';
  ruleForm.element_id = undefined;
  ruleForm.parameter_name = '';
  ruleForm.operator = '>';
  ruleForm.threshold_value = 0;
  ruleForm.enabled = true;
  ruleDialogVisible.value = true;
}

function handleEditRule(row: ThresholdRule) {
  ruleDialogTitle.value = '编辑阈值规则';
  isEditRule.value = true;
  ruleForm.id = row.id;
  ruleForm.name = row.name ?? '';
  ruleForm.element_id = row.element_id ?? undefined;
  ruleForm.parameter_name = row.parameter_name ?? '';
  ruleForm.operator = row.operator ?? '>';
  ruleForm.threshold_value = row.threshold_value ?? 0;
  ruleForm.enabled = row.enabled ?? true;
  ruleDialogVisible.value = true;
}

async function handleSaveRule() {
  if (!ruleForm.name) {
    ElMessage.warning('请输入规则名称');
    return;
  }
  if (!ruleForm.parameter_name) {
    ElMessage.warning('请输入参数名称');
    return;
  }
  try {
    const data = { ...ruleForm };
    if (isEditRule.value && ruleForm.id) {
      await updateThresholdRule(ruleForm.id, data);
      ElMessage.success('更新成功');
    } else {
      await createThresholdRule(data);
      ElMessage.success('创建成功');
    }
    ruleDialogVisible.value = false;
    loadRules();
  } catch (e) {
    console.error('[ParamMonitor] save rule failed:', e);
  }
}

async function handleDeleteRule(row: ThresholdRule) {
  try {
    await ElMessageBox.confirm(`确定删除阈值规则 "${row.name}" 吗？`, '删除确认', { type: 'warning' });
    await deleteThresholdRule(row.id);
    ElMessage.success('删除成功');
    loadRules();
  } catch (e) {
    if (e !== 'cancel') console.error('[ParamMonitor] delete rule failed:', e);
  }
}

async function handleTestRule(row: ThresholdRule) {
  try {
    const res = await testThresholdRule({
      parameter_name: row.parameter_name,
      operator: row.operator,
      threshold_value: row.threshold_value,
    });
    ElMessage.info(res.triggered ? '阈值已触发: ' + (res.message || '') : '阈值未触发');
  } catch (e) {
    console.error('[ParamMonitor] test rule failed:', e);
  }
}

// ============ Tab3: 实时监控 ============
const realtimeElementId = ref<number | undefined>(undefined);
const realtimeParamNames = ref<string>('');
const realtimeData = ref<RealtimeMonitorDataVo[]>([]);
const realtimeLoading = ref(false);
let realtimeTimer: ReturnType<typeof setInterval> | null = null;

// ECharts 图表
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const chartData = ref<Map<string, { times: string[]; values: number[] }>>(new Map());

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) return;
  if (chartInstance) {
    chartInstance.dispose();
  }
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption({
    title: { text: '参数趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { top: 30, data: [] },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: [] },
    yAxis: { type: 'value' },
    series: [],
  });
}

/** 更新图表数据 */
function updateChart() {
  if (!chartInstance) return;
  const series: any[] = [];
  const legendData: string[] = [];
  let maxTimes: string[] = [];

  chartData.value.forEach((data, paramName) => {
    legendData.push(paramName);
    if (data.times.length > maxTimes.length) {
      maxTimes = data.times;
    }
    series.push({
      name: paramName,
      type: 'line',
      smooth: true,
      data: data.values,
    });
  });

  chartInstance.setOption({
    legend: { data: legendData },
    xAxis: { data: maxTimes },
    series,
  });
}

/** 追加实时数据到图表 */
function appendRealtimeData() {
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  realtimeData.value.forEach((item) => {
    const paramName = item.parameter_name || 'unknown';
    const value = parseFloat(item.value ?? '0') || 0;
    if (!chartData.value.has(paramName)) {
      chartData.value.set(paramName, { times: [], values: [] });
    }
    const data = chartData.value.get(paramName)!;
    data.times.push(now);
    data.values.push(value);
    // 保留最近 60 个数据点（约 5 分钟）
    if (data.times.length > 60) {
      data.times.shift();
      data.values.shift();
    }
  });
  updateChart();
}

async function loadRealtimeData() {
  if (!realtimeElementId.value) {
    ElMessage.warning('请输入设备 ID');
    return;
  }
  const names = realtimeParamNames.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!names.length) {
    ElMessage.warning('请输入参数名称，用逗号分隔');
    return;
  }
  realtimeLoading.value = true;
  try {
    const res = await getRealtimeMonitorData({
      element_id: realtimeElementId.value,
      parameter_names: names,
    });
    realtimeData.value = res;
    appendRealtimeData();
  } catch (e) {
    console.error('[ParamMonitor] load realtime data failed:', e);
  } finally {
    realtimeLoading.value = false;
  }
}

function startRealtime() {
  // 重置图表数据
  chartData.value.clear();
  if (!chartInstance) {
    nextTick(() => {
      initChart();
      loadRealtimeData();
    });
  } else {
    loadRealtimeData();
  }
  if (realtimeTimer) clearInterval(realtimeTimer);
  realtimeTimer = setInterval(() => {
    if (realtimeElementId.value && realtimeParamNames.value) {
      loadRealtimeData();
    }
  }, 5000);
}

function stopRealtime() {
  if (realtimeTimer) {
    clearInterval(realtimeTimer);
    realtimeTimer = null;
  }
}

// 监听 Tab 切换，初始化图表
watch(activeTab, (val) => {
  if (val === 'realtime') {
    nextTick(() => {
      initChart();
    });
  }
});

onUnmounted(() => {
  stopRealtime();
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

// ============ 通用方法 ============
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ 生命周期 ============
onMounted(() => {
  loadConfigs();
  loadRules();
});
</script>

<template>
  <div class="param-monitor-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab1: 监控配置 -->
      <el-tab-pane label="监控配置" name="config">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleConfigSearch">
            <el-form-item label="关键字">
              <el-input v-model="configQuery.keyword" placeholder="配置名称" clearable style="width: 200px" @keyup.enter="handleConfigSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleConfigSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleConfigReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddConfig">新增配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="configLoading" :data="configList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="element_id" label="设备 ID" width="100" />
            <el-table-column prop="interval" label="采集间隔(秒)" width="120" />
            <el-table-column prop="parameter_count" label="参数数量" width="100" />
            <el-table-column prop="enabled" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'paramMonitor.edit'" link type="primary" size="small" :icon="Edit" @click="handleEditConfig(row as MonitorConfigVo)">编辑</el-button>
                <el-button v-permission="'paramMonitor.toggle'" link :type="row.enabled ? 'warning' : 'success'" size="small" @click="handleToggleConfig(row as MonitorConfigVo)">
                  {{ row.enabled ? '禁用' : '启用' }}
                </el-button>
                <el-button v-permission="'paramMonitor.delete'" link type="danger" size="small" :icon="Delete" @click="handleDeleteConfig(row as MonitorConfigVo)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="configQuery.page" v-model:page-size="configQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="configTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { configQuery.pageSize = s; configQuery.page = 1; loadConfigs(); }" @current-change="(p: number) => { configQuery.page = p; loadConfigs(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: 阈值告警 -->
      <el-tab-pane label="阈值告警" name="threshold">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleRuleSearch">
            <el-form-item label="关键字">
              <el-input v-model="ruleQuery.keyword" placeholder="规则名称/参数名" clearable style="width: 200px" @keyup.enter="handleRuleSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleRuleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleRuleReset">重置</el-button>
              <el-button type="success" :icon="Plus" @click="handleAddRule">新增规则</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="ruleLoading" :data="ruleList" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="element_id" label="设备 ID" width="100" />
            <el-table-column prop="parameter_name" label="参数名" min-width="140" />
            <el-table-column prop="operator" label="运算符" width="80" />
            <el-table-column prop="threshold_value" label="阈值" width="100" />
            <el-table-column prop="enabled" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'paramMonitor.editRule'" link type="primary" size="small" :icon="Edit" @click="handleEditRule(row as ThresholdRule)">编辑</el-button>
                <el-button v-permission="'paramMonitor.testRule'" link type="info" size="small" @click="handleTestRule(row as ThresholdRule)">测试</el-button>
                <el-button v-permission="'paramMonitor.deleteRule'" link type="danger" size="small" :icon="Delete" @click="handleDeleteRule(row as ThresholdRule)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="ruleQuery.page" v-model:page-size="ruleQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="ruleTotal" layout="total, sizes, prev, pager, next, jumper" background @size-change="(s: number) => { ruleQuery.pageSize = s; ruleQuery.page = 1; loadRules(); }" @current-change="(p: number) => { ruleQuery.page = p; loadRules(); }" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab3: 实时监控 -->
      <el-tab-pane label="实时监控" name="realtime">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true">
            <el-form-item label="设备 ID">
              <el-input-number v-model="realtimeElementId" :min="1" placeholder="设备 ID" style="width: 160px" />
            </el-form-item>
            <el-form-item label="参数名称">
              <el-input v-model="realtimeParamNames" placeholder="多个参数用逗号分隔" clearable style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="VideoPlay" @click="startRealtime">开始监控</el-button>
              <el-button :icon="VideoPause" @click="stopRealtime">停止</el-button>
              <el-button @click="loadRealtimeData">刷新</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <!-- 趋势图 -->
          <div ref="chartRef" style="width: 100%; height: 300px; padding: 16px; box-sizing: border-box;"></div>
          <!-- 数据表格 -->
          <el-table v-loading="realtimeLoading" :data="realtimeData" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="parameter_name" label="参数名" min-width="180" />
            <el-table-column prop="value" label="当前值" min-width="120" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="timestamp" label="时间戳" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 监控配置弹窗 -->
    <el-dialog v-model="configDialogVisible" :title="configDialogTitle" width="600px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="configForm.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="设备 ID" required>
          <el-input-number v-model="configForm.element_id" :min="1" placeholder="设备 ID" style="width: 100%" />
        </el-form-item>
        <el-form-item label="参数名称">
          <el-input v-model="configForm.parameter_names" type="textarea" :rows="3" placeholder="JSON 格式，如 [&quot;param1&quot;,&quot;param2&quot;]" />
        </el-form-item>
        <el-form-item label="采集间隔">
          <el-input-number v-model="configForm.interval" :min="5" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="configForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 阈值规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleDialogTitle" width="600px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="设备 ID" required>
          <el-input-number v-model="ruleForm.element_id" :min="1" placeholder="设备 ID" style="width: 100%" />
        </el-form-item>
        <el-form-item label="参数名" required>
          <el-input v-model="ruleForm.parameter_name" placeholder="请输入参数名" />
        </el-form-item>
        <el-form-item label="运算符">
          <el-select v-model="ruleForm.operator" placeholder="请选择运算符" style="width: 100%">
            <el-option v-for="op in operators" :key="op.value" :label="op.label" :value="op.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number v-model="ruleForm.threshold_value" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule">确定</el-button>
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

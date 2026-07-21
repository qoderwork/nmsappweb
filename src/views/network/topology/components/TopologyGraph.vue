<script setup lang="ts">
/**
 * 拓扑图组件 - 支持树形和图形两种视图
 */
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface BbuDevice {
  deviceName: string | null;
  serialNumber: string | null;
  ports: PortDevice[];
}

interface PortDevice {
  portIndex: number;
  type: string;
  serialNumber: string;
  ip: string;
  softwareVersion: string;
  deviceType: string;
  connectStatus: number;
  route: string;
  nextLevelDevices: PortDevice[];
}

const props = defineProps<{
  bbu: BbuDevice;
}>();

const viewMode = ref<'tree' | 'graph'>('tree');

function renderGraph() {
  // 图形视图渲染逻辑 - 保留占位
}

function renderTree() {
  // 树形视图渲染逻辑 - 保留占位
}

watch(viewMode, () => {
  if (viewMode.value === 'tree') {
    renderTree();
  } else {
    renderGraph();
  }
});
onMounted(() => {
  renderTree();
});
</script>

<template>
  <div class="topology-graph">
    <div class="graph-toolbar">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button value="tree">{{ t('topology.treeView') }}</el-radio-button>
        <el-radio-button value="graph">{{ t('topology.graphView') }}</el-radio-button>
      </el-radio-group>
      <div class="legend">
        <span class="legend-item"><span class="legend-dot online"></span>{{ t('topology.online') }}</span>
        <span class="legend-item"><span class="legend-dot offline"></span>{{ t('topology.offline') }}</span>
      </div>
    </div>
    <div class="graph-container">
      <slot name="tree" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.topology-graph {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.online {
  background: #67c23a;
}

.legend-dot.offline {
  background: #909399;
}

.graph-container {
  flex: 1;
  min-height: 400px;
  position: relative;
}
</style>
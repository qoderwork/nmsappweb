<template>
  <div class="topology-graph">
    <div class="topology-graph__toolbar">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button value="tree">树形</el-radio-button>
        <el-radio-button value="graph">图形</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 树形视图 -->
    <div v-if="viewMode === 'tree'" class="topology-graph__tree">
      <slot name="tree" />
    </div>

    <!-- 图形视图 -->
    <div v-else class="topology-graph__canvas">
      <svg :width="svgWidth" :height="svgHeight" class="topology-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#909399" />
          </marker>
        </defs>

        <!-- 连线 -->
        <g class="links">
          <line
            v-for="(link, idx) in links"
            :key="`link-${idx}`"
            :x1="link.x1"
            :y1="link.y1"
            :x2="link.x2"
            :y2="link.y2"
            stroke="#909399"
            stroke-width="1.5"
            stroke-dasharray="4,2"
            :marker-end="link.arrow ? 'url(#arrowhead)' : ''"
          />
        </g>

        <!-- 节点 -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="topology-node"
            @click="$emit('nodeClick', node)"
          >
            <!-- 节点背景 -->
            <rect
              :x="-nodeWidth / 2"
              :y="-nodeHeight / 2"
              :width="nodeWidth"
              :height="nodeHeight"
              :rx="6"
              :ry="6"
              :fill="getNodeFill(node)"
              :stroke="getNodeStroke(node)"
              stroke-width="2"
            />
            <!-- 节点图标 -->
            <text
              :x="0"
              :y="-nodeHeight / 2 + 18"
              text-anchor="middle"
              :font-size="14"
              :fill="getNodeIconColor(node)"
            >
              {{ getNodeIcon(node) }}
            </text>
            <!-- 节点名称 -->
            <text
              :x="0"
              :y="-2"
              text-anchor="middle"
              font-size="12"
              font-weight="600"
              fill="#303133"
            >
              {{ truncateText(node.label, 14) }}
            </text>
            <!-- 序列号 -->
            <text
              :x="0"
              :y="12"
              text-anchor="middle"
              font-size="10"
              fill="#909399"
              font-family="monospace"
            >
              {{ truncateText(node.serialNumber || '', 16) }}
            </text>
            <!-- 连接状态 -->
            <text
              :x="0"
              :y="nodeHeight / 2 - 6"
              text-anchor="middle"
              font-size="10"
              :fill="node.connectStatus === 1 ? '#67c23a' : '#f56c6c'"
            >
              {{ node.connectStatus === 1 ? '● 在线' : '○ 离线' }}
            </text>
          </g>
        </g>
      </svg>
      <el-empty v-if="nodes.length === 0" description="暂无拓扑数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TopologyBBU, TopologyDevice } from '@/types/topology';

interface TopologyNode {
  id: string;
  label: string;
  serialNumber: string;
  deviceType: string;
  connectStatus: number;
  level: number;
  x: number;
  y: number;
  parent?: string;
}

interface TopologyLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrow: boolean;
}

const props = defineProps<{
  bbu: TopologyBBU | null;
}>();

defineEmits<{
  (e: 'nodeClick', node: TopologyNode): void;
}>();

const viewMode = ref<'tree' | 'graph'>('graph');
const nodeWidth = 140;
const nodeHeight = 70;
const levelHeight = 130;
const nodeSpacing = 170;

// 构建节点和连线
const nodes = ref<TopologyNode[]>([]);
const links = ref<TopologyLink[]>([]);

const svgWidth = computed(() => {
  const maxNodesAtLevel = Math.max(...getLevelCounts().values(), 1);
  return Math.max(800, maxNodesAtLevel * nodeSpacing + 100);
});

const svgHeight = computed(() => {
  const maxLevel = Math.max(...nodes.value.map((n) => n.level), 0);
  return (maxLevel + 1) * levelHeight + 80;
});

function getLevelCounts(): Map<number, number> {
  const counts = new Map<number, number>();
  nodes.value.forEach((n) => {
    counts.set(n.level, (counts.get(n.level) || 0) + 1);
  });
  return counts;
}

/** 递归遍历拓扑数据，构建节点和连线 */
function buildGraph() {
  nodes.value = [];
  links.value = [];
  if (!props.bbu) return;

  // 根节点（BBU）
  const rootId = 'bbu';
  nodes.value.push({
    id: rootId,
    label: props.bbu.deviceName || props.bbu.serialNumber || 'BBU',
    serialNumber: props.bbu.serialNumber || '',
    deviceType: 'BBU',
    connectStatus: 1,
    level: 0,
    x: 0,
    y: 40,
  });

  // 遍历端口和下级设备
  let portIndex = 0;
  props.bbu.ports?.forEach((port) => {
    const portId = `port-${portIndex}`;
    const portLevel = 1;
    const portX = portIndex * nodeSpacing;
    nodes.value.push({
      id: portId,
      label: `端口 ${port.portIndex}`,
      serialNumber: port.serialNumber || '',
      deviceType: port.type || 'PORT',
      connectStatus: port.connectStatus,
      level: portLevel,
      x: portX,
      y: 40 + portLevel * levelHeight,
      parent: rootId,
    });

    // 连线 BBU → 端口
    links.value.push({
      x1: 0,
      y1: 40 + nodeHeight / 2,
      x2: portX,
      y2: 40 + portLevel * levelHeight - nodeHeight / 2,
      arrow: true,
    });

    // 递归处理下级设备
    processDevices(port.nextLevelDevices || [], portId, portLevel + 1, portX);

    portIndex++;
  });

  // 居中根节点
  if (nodes.value.length > 1) {
    const allX = nodes.value.filter((n) => n.level === 1).map((n) => n.x);
    if (allX.length > 0) {
      const centerX = (Math.min(...allX) + Math.max(...allX)) / 2;
      const root = nodes.value.find((n) => n.level === 0);
      if (root) root.x = centerX;
      // 更新根节点的连线起点
      links.value.forEach((link) => {
        if (link.y1 === 40 + nodeHeight / 2) {
          link.x1 = centerX;
        }
      });
    }
  }
}

function processDevices(devices: TopologyDevice[], parentId: string, level: number, parentX: number) {
  let offset = 0;
  devices.forEach((device, idx) => {
    const nodeId = `${parentId}-${idx}`;
    const x = parentX + (offset - (devices.length - 1) / 2) * (nodeSpacing / 2);
    nodes.value.push({
      id: nodeId,
      label: device.serialNumber || device.deviceType || '设备',
      serialNumber: device.serialNumber || '',
      deviceType: device.deviceType || '',
      connectStatus: device.connectStatus,
      level,
      x,
      y: 40 + level * levelHeight,
      parent: parentId,
    });

    // 连线
    const parent = nodes.value.find((n) => n.id === parentId);
    if (parent) {
      links.value.push({
        x1: parent.x,
        y1: parent.y + nodeHeight / 2,
        x2: x,
        y2: 40 + level * levelHeight - nodeHeight / 2,
        arrow: true,
      });
    }

    // 递归处理下级
    if (device.nextLevelDevices && device.nextLevelDevices.length > 0) {
      processDevices(device.nextLevelDevices, nodeId, level + 1, x);
    }
    offset++;
  });
}

function getNodeFill(node: TopologyNode): string {
  if (node.level === 0) return '#e6f7ff';
  if (node.deviceType === 'PORT') return '#f0f9eb';
  return '#fafafa';
}

function getNodeStroke(node: TopologyNode): string {
  if (node.level === 0) return '#409eff';
  if (node.connectStatus === 1) return '#67c23a';
  return '#f56c6c';
}

function getNodeIconColor(node: TopologyNode): string {
  if (node.level === 0) return '#409eff';
  if (node.connectStatus === 1) return '#67c23a';
  return '#f56c6c';
}

function getNodeIcon(node: TopologyNode): string {
  if (node.level === 0) return '🖥';
  if (node.deviceType === 'PORT') return '🔌';
  return '📡';
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

watch(() => props.bbu, buildGraph, { immediate: true });
</script>

<style lang="scss" scoped>
.topology-graph {
  width: 100%;

  &__toolbar {
    display: flex;
    justify-content: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  &__tree {
    padding: 16px;
  }

  &__canvas {
    overflow: auto;
    padding: 16px;
    min-height: 400px;
  }
}

.topology-svg {
  display: block;
  margin: 0 auto;
}

.topology-node {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}
</style>

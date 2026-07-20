<script setup lang="ts">
/**
 * 拓扑树递归组件
 */
import type { TopologyDevice } from '@/types/topology';

interface Props {
  devices: TopologyDevice[];
  level?: number;
}

withDefaults(defineProps<Props>(), {
  level: 0,
});

function getStatusType(status: number): 'success' | 'danger' | 'info' {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  return 'info';
}

function getStatusText(status: number): string {
  if (status === 1) return '在线';
  if (status === 0) return '离线';
  return '未知';
}
</script>

<template>
  <div class="topology-tree">
    <div
      v-for="device in devices"
      :key="device.route"
      class="topology-node"
      :style="{ paddingLeft: `${level * 24}px` }"
    >
      <div class="topology-node__content">
        <div class="topology-node__icon">
          <el-icon v-if="device.nextLevelDevices && device.nextLevelDevices.length > 0"><Folder /></el-icon>
          <el-icon v-else><Document /></el-icon>
        </div>
        <div class="topology-node__info">
          <span class="topology-node__type">{{ device.type }}</span>
          <span class="topology-node__sn">{{ device.serialNumber }}</span>
          <span v-if="device.ip" class="topology-node__ip">{{ device.ip }}</span>
          <span class="topology-node__version">{{ device.softwareVersion }}</span>
          <el-tag :type="getStatusType(device.connectStatus)" size="small">
            {{ getStatusText(device.connectStatus) }}
          </el-tag>
        </div>
      </div>
      <TopologyTree
        v-if="device.nextLevelDevices && device.nextLevelDevices.length > 0"
        :devices="device.nextLevelDevices"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.topology-tree {
  width: 100%;
}

.topology-node {
  width: 100%;
}

.topology-node__content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-secondary);
  }
}

.topology-node__icon {
  color: var(--text-secondary);
  font-size: 16px;
}

.topology-node__info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.topology-node__type {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 60px;
}

.topology-node__sn {
  font-family: monospace;
  color: var(--text-secondary);
  font-size: 13px;
}

.topology-node__ip {
  color: var(--text-secondary);
  font-size: 13px;
}

.topology-node__version {
  color: var(--text-secondary);
  font-size: 12px;
}
</style>

<script setup lang="ts">
/**
 * 拓扑树组件 - 以树形控件展示拓扑结构
 */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue';

const { t } = useI18n();

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
  devices: PortDevice[];
  level: number;
}>();

const filterText = ref('');
const defaultExpandedKeys = ref<string[]>([]);
const treeRef = ref();

function buildTreeData(devices: PortDevice[]): any[] {
  return devices.map((d, i) => ({
    id: `${props.level}-${i}`,
    label: d.serialNumber || d.type || `Device ${i}`,
    children: d.nextLevelDevices ? buildTreeData(d.nextLevelDevices) : [],
    serialNumber: d.serialNumber,
    type: d.type,
    deviceType: d.deviceType,
    route: d.route,
    connectStatus: d.connectStatus,
  }));
}

const treeData = computed(() => buildTreeData(props.devices));

function handleNodeClick(data: any) {
  // 节点点击处理
}

function filterMethod(value: string, data: any) {
  if (!value) return true;
  return data.label?.toLowerCase().includes(value.toLowerCase());
}

function expandAll() {
  if (treeRef.value) {
    const keys = getAllKeys(treeData.value);
    treeRef.value.setExpandedKeys(keys);
  }
}

function collapseAll() {
  if (treeRef.value) {
    treeRef.value.setExpandedKeys([]);
  }
}

function getAllKeys(nodes: any[]): string[] {
  let keys: string[] = [];
  nodes.forEach((node) => {
    keys.push(node.id);
    if (node.children && node.children.length) {
      keys = keys.concat(getAllKeys(node.children));
    }
  });
  return keys;
}
</script>

<template>
  <div class="topology-tree">
    <div class="tree-toolbar">
      <el-input v-model="filterText" :placeholder="t('topology.enterDeviceId')" :prefix-icon="Search" clearable size="small" style="width: 200px" />
      <div class="toolbar-actions">
        <el-button :icon="ArrowDownBold" size="small" text @click="expandAll">{{ t('common.expand') }}</el-button>
        <el-button :icon="ArrowUpBold" size="small" text @click="collapseAll">{{ t('common.collapse') }}</el-button>
      </div>
    </div>
    <div class="tree-body">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :filter-node-method="filterMethod"
        :default-expanded-keys="defaultExpandedKeys"
        node-key="id"
        highlight-current
        :expand-on-click-node="true"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <span class="node-label">{{ data.label }}</span>
            <el-tag v-if="data.type" size="small" :type="data.type === 'BBU' ? 'primary' : 'success'">{{ data.type === 'BBU' ? t('topology.bbu') : data.type === 'gNB' ? t('topology.gnb') : data.type }}</el-tag>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.topology-tree {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
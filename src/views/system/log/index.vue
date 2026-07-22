<script setup lang="ts">
/**
 * 日志管理（Log）
 *
 * 对齐老版 nms-web System/Logs：单页内用 el-tabs 切换
 * Login Log / Operation Log / North Interface Log / Platform Log。
 *
 * North Interface Log 与 Platform Log 直接复用现有独立页面组件。
 * 使用 v-if 懒渲染：激活才挂载并触发加载。
 */
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTabs, ElTabPane } from 'element-plus';
import { usePermission } from '@/composables/usePermission';

import LoginLogs from './components/LoginLogs.vue';
import OperationLogs from './components/OperationLogs.vue';
import NorthInterfaceLogs from '../northinterfacelog/index.vue';
import PlatformLog from '../platform/index.vue';

const { t } = useI18n();
const { hasPermission, isAdmin } = usePermission();

interface TabDef {
  key: string;
  label: string;
  show: boolean;
  comp: unknown;
}

const tabs = computed<TabDef[]>(() => [
  {
    key: 'login',
    label: t('log.tab.login'),
    show: isAdmin.value || hasPermission('System.Log.ListLoginLog'),
    comp: LoginLogs,
  },
  {
    key: 'operation',
    label: t('log.tab.operation'),
    show: isAdmin.value || hasPermission('System.Log.ListOperationLog'),
    comp: OperationLogs,
  },
  {
    key: 'north',
    label: t('log.tab.north'),
    show: isAdmin.value || hasPermission('System.Logs'),
    comp: NorthInterfaceLogs,
  },
  {
    key: 'platform',
    label: t('log.tab.platform'),
    show: isAdmin.value || hasPermission('System.Log.UpdateLogConfig'),
    comp: PlatformLog,
  },
]);

const visibleTabs = computed(() => tabs.value.filter((x) => x.show));

const active = ref('');
onMounted(() => {
  active.value = visibleTabs.value[0]?.key ?? '';
});
</script>

<template>
  <div class="log-page">
    <ElTabs v-model="active" class="log-tabs">
      <ElTabPane v-for="tb in visibleTabs" :key="tb.key" :label="tb.label" :name="tb.key" />
    </ElTabs>
    <div class="log-content">
      <template v-for="tb in visibleTabs" :key="tb.key">
        <component :is="tb.comp" v-if="active === tb.key" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-page {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.log-content {
  margin-top: var(--spacing-xs);
}
</style>

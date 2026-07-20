<template>
  <div class="device-ops-page">
    <el-tabs v-model="activeTab" class="page-tabs" type="border-card">
      <!-- Reboot Tab -->
      <el-tab-pane :label="t('deviceOps.rebootTasks')" name="reboot">
        <RebootTab v-if="activeTab === 'reboot'" />
      </el-tab-pane>
      <!-- Reset Tab -->
      <el-tab-pane :label="t('deviceOps.resetTasks')" name="reset">
        <ResetTab v-if="activeTab === 'reset'" />
      </el-tab-pane>
      <!-- Shutdown Tab -->
      <el-tab-pane :label="t('deviceOps.shutdownTasks')" name="shutdown">
        <ShutdownTab v-if="activeTab === 'shutdown'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RebootTab from './RebootTab.vue';
import ResetTab from './ResetTab.vue';
import ShutdownTab from './ShutdownTab.vue';

const { t } = useI18n();
const activeTab = ref('reboot');
</script>

<style scoped>
.device-ops-page {
  padding: 16px;
}
.page-tabs {
  margin-bottom: 16px;
}
</style>

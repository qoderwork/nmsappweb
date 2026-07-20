<script setup lang="ts">
/**
 * 应用根组件
 *
 * 仅渲染路由出口，所有布局、样式、指令、全局状态由 main.ts 装配
 */
import { computed } from 'vue';
import { ElConfigProvider } from 'element-plus';
import { elementLocales } from '@/locales';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const appStore = useAppStore();
const settings = useSettingsStore();
const cachedViews = computed(() => appStore.cachedViews);
const elementLocale = computed(() => elementLocales[settings.locale]);
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </router-view>
  </el-config-provider>
</template>

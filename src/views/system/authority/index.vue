<script setup lang="ts">
/**
 * 权限管理（Authority）
 *
 * 对齐老版 nms-web System/Authority：单页内用 el-tabs 切换
 * User / Role / Tenant / License / Security Rule。
 *
 * 直接复用现有独立页面组件作为 Tab 内容（均为自包含 SFC，onMounted 自加载）。
 * 使用 v-if 懒渲染：激活才挂载并触发加载，切换重新加载（与老版行为一致）。
 */
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTabs, ElTabPane } from 'element-plus';
import { usePermission } from '@/composables/usePermission';

import UserPage from '../user/index.vue';
import RolePage from '../role/index.vue';
import TenancyPage from '../tenancy/index.vue';
import LicensePage from '../license/index.vue';
import SecurityRulePage from '../security/index.vue';

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
    key: 'user',
    label: t('authority.tab.user'),
    show: isAdmin.value || hasPermission('System.Authority.User.ListUser'),
    comp: UserPage,
  },
  {
    key: 'role',
    label: t('authority.tab.role'),
    show: isAdmin.value || hasPermission('System.Authority.Role.ListRole'),
    comp: RolePage,
  },
  {
    key: 'tenant',
    label: t('authority.tab.tenant'),
    show: isAdmin.value || hasPermission('System.Tenant.ListTenancy'),
    comp: TenancyPage,
  },
  {
    key: 'license',
    label: t('authority.tab.license'),
    show: isAdmin.value || hasPermission('System.License.GetLicenseInfo'),
    comp: LicensePage,
  },
  {
    key: 'rule',
    label: t('authority.tab.rule'),
    show: isAdmin.value || hasPermission('System.Authority.SecurityRule.GetSecurityRule'),
    comp: SecurityRulePage,
  },
]);

const visibleTabs = computed(() => tabs.value.filter((x) => x.show));

const active = ref('');
onMounted(() => {
  active.value = visibleTabs.value[0]?.key ?? '';
});
</script>

<template>
  <div class="authority-page">
    <ElTabs v-model="active" class="authority-tabs">
      <ElTabPane v-for="tb in visibleTabs" :key="tb.key" :label="tb.label" :name="tb.key" />
    </ElTabs>
    <div class="authority-content">
      <template v-for="tb in visibleTabs" :key="tb.key">
        <component :is="tb.comp" v-if="active === tb.key" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.authority-page {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.authority-content {
  margin-top: var(--spacing-xs);
}
</style>

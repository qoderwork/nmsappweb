<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, MoreFilled, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

import { getDeviceGroups, createDeviceGroup, updateDeviceGroup, deleteDeviceGroup } from '@/api/device';
import type { DeviceGroup } from '@/types/device';

const { t } = useI18n();

const groupList = ref<DeviceGroup[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const form = reactive({
  id: undefined as string | undefined,
  group_name: '',
  description: '',
});

async function loadGroups() {
  loading.value = true;
  try {
    groupList.value = await getDeviceGroups();
  } catch (e) {
    console.error('[DeviceGroup] load groups failed:', e);
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  dialogMode.value = 'add';
  form.id = undefined;
  form.group_name = '';
  form.description = '';
  dialogVisible.value = true;
}

function openEditDialog(group: DeviceGroup) {
  dialogMode.value = 'edit';
  form.id = group.id;
  form.group_name = group.group_name || '';
  form.description = group.description || '';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.group_name.trim()) {
    ElMessage.warning(t('device.groupNameRequired'));
    return;
  }

  try {
    if (dialogMode.value === 'add') {
      await createDeviceGroup({
        group_name: form.group_name,
        description: form.description || undefined,
      });
      ElMessage.success(t('common.addSuccess'));
    } else {
      await updateDeviceGroup(form.id!, {
        group_name: form.group_name,
        description: form.description || undefined,
      });
      ElMessage.success(t('common.editSuccess'));
    }
    dialogVisible.value = false;
    loadGroups();
  } catch (e) {
    console.error('[DeviceGroup] submit failed:', e);
    ElMessage.error(t('common.operateFailed'));
  }
}

async function handleDelete(group: DeviceGroup) {
  if (group.default_group) {
    ElMessage.warning(t('device.defaultGroupCannotDelete'));
    return;
  }

  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirm'), { type: 'warning' });
    await deleteDeviceGroup(group.id);
    ElMessage.success(t('common.deleteSuccess'));
    loadGroups();
  } catch (e) {
    if (e !== 'cancel') console.error('[DeviceGroup] delete failed:', e);
  }
}

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <div class="device-group-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <div class="toolbar">
        <el-form :inline="true" @submit.prevent="loadGroups">
          <el-form-item>
            <el-input
              v-model="form.group_name"
              :placeholder="t('device.groupNamePlaceholder')"
              clearable
              style="width: 200px"
              @keyup.enter="loadGroups"
            />
          </el-form-item>
        </el-form>
        <div class="toolbar__actions">
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            {{ t('common.add') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading="loading" :data="groupList" stripe border style="width: 100%">
        <el-table-column type="index" :label="'#'" width="60" />
        <el-table-column prop="group_name" :label="t('device.groupName')" min-width="150" />
        <el-table-column prop="description" :label="t('common.description')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="creation_time" :label="t('common.createTime')" min-width="160">
          <template #default="{ row }">
            {{ row.creation_time || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.default_group" type="success" size="small">
              {{ t('device.defaultGroup') }}
            </el-tag>
            <span v-else>{{ t('common.normal') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEditDialog(row as DeviceGroup)" :disabled="(row as DeviceGroup).default_group">
              {{ t('common.edit') }}
            </el-button>
            <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(row as DeviceGroup)" :disabled="(row as DeviceGroup).default_group">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogMode === 'add' ? t('common.add') : t('common.edit')" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="t('device.groupName')" :rules="[{ required: true, message: t('device.groupNameRequired') }]">
          <el-input v-model="form.group_name" :placeholder="t('device.groupNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('common.description')">
          <el-input v-model="form.description" type="textarea" :placeholder="t('device.groupDescPlaceholder')" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.device-group-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar__actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
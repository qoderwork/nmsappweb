<template>
  <el-select
    v-model="selectedIds"
    :multiple="multiple"
    :filterable="filterable"
    :remote="remote"
    :remote-method="handleSearch"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :style="{ width }"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    @change="handleChange"
  >
    <el-option
      v-for="device in deviceList"
      :key="device.ne_neid"
      :label="device.device_name || device.serial_number || `设备 ${device.ne_neid}`"
      :value="device.ne_neid"
    >
      <div class="device-option">
        <span class="device-option__name">
          {{ device.device_name || device.serial_number || `设备 ${device.ne_neid}` }}
        </span>
        <span class="device-option__info">
          <el-tag
            :type="device.status === 'online' ? 'success' : 'info'"
            size="small"
            effect="plain"
          >
            {{ device.status === 'online' ? '在线' : '离线' }}
          </el-tag>
          <span v-if="device.device_type" class="device-option__type">
            {{ device.device_type.toUpperCase() }}
          </span>
        </span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getDevices } from '@/api/device';
import type { Device, DeviceType } from '@/types/device';

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[] | null;
    multiple?: boolean;
    filterable?: boolean;
    remote?: boolean;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    width?: string;
    collapseTags?: boolean;
    collapseTagsTooltip?: boolean;
    /** 初始加载时是否获取数据 */
    loadOnMount?: boolean;
    /** 设备类型过滤 */
    deviceType?: DeviceType;
  }>(),
  {
    modelValue: null,
    multiple: false,
    filterable: true,
    remote: true,
    placeholder: '请选择设备',
    clearable: true,
    disabled: false,
    width: '100%',
    collapseTags: true,
    collapseTagsTooltip: true,
    loadOnMount: true,
    deviceType: undefined,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | null): void;
  (e: 'change', value: number | number[] | null, devices: Device[]): void;
}>();

const selectedIds = ref<number | number[] | null>(props.multiple ? [] : null) as any;
const deviceList = ref<Device[]>([]);
const loading = ref(false);

/** 搜索设备 */
async function handleSearch(query: string) {
  loading.value = true;
  try {
    const res = await getDevices({
      searchText: query || undefined,
      deviceType: props.deviceType,
      page: 1,
      pageSize: 50,
    });
    deviceList.value = res.list || [];
  } catch (e) {
    console.error('[DeviceSelector] search failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 处理选择变化 */
function handleChange(value: any) {
  emit('update:modelValue', value);
  const selectedDevices = props.multiple
    ? deviceList.value.filter((d) => (value as number[]).includes(d.ne_neid))
    : deviceList.value.find((d) => d.ne_neid === value);
  emit('change', value, Array.isArray(selectedDevices) ? selectedDevices : selectedDevices ? [selectedDevices] : []);
}

/** 重置选择 */
function reset() {
  selectedIds.value = props.multiple ? [] : null;
}

/** 刷新设备列表 */
function refresh() {
  handleSearch('');
}

// 监听外部值变化
watch(
  () => props.modelValue,
  (val) => {
    selectedIds.value = val ?? (props.multiple ? [] : null);
  },
  { immediate: true }
);

// 初始加载
onMounted(() => {
  if (props.loadOnMount) {
    handleSearch('');
  }
});

// 暴露方法
defineExpose({
  reset,
  refresh,
});
</script>

<style lang="scss" scoped>
.device-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  &__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
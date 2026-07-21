<script setup lang="ts">
/**
 * 站点管理页面
 *
 * 功能：
 * - 站点列表展示（分页）
 * - 关键字搜索
 * - 新增/编辑/删除站点
 * - 区域关联
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue';

import { getSites, createSite, updateSite, deleteSite } from '@/api/site';
import { getAreas } from '@/api/site';
import type { SiteInfoVo, SiteInfo, SysArea } from '@/types/site';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<SiteInfoVo[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  search: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  search: '',
});

// 弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref('新增站点');
const isEdit = ref(false);

// 表单数据
const formData = reactive<Partial<SiteInfo>>({
  id: '',
  site_name: '',
  description: '',
  area_id: undefined,
  latitude: '',
  longitude: '',
});

// 区域列表
const areaList = ref<SysArea[]>([]);

// ============ 方法 ============

/** 加载站点列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getSites({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      search: queryParams.search || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[SiteManagement] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 加载区域列表 */
async function loadAreas() {
  try {
    const result = await getAreas();
    areaList.value = result;
  } catch (e) {
    console.error('[SiteManagement] load areas failed:', e);
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  loadData();
}

/** 重置搜索 */
function handleReset() {
  queryParams.search = '';
  queryParams.page = 1;
  loadData();
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.page = page;
  loadData();
}

/** 每页条数变化 */
function handleSizeChange(size: number) {
  queryParams.pageSize = size;
  queryParams.page = 1;
  loadData();
}

/** 打开新增弹窗 */
function handleAdd() {
  dialogTitle.value = '新增站点';
  isEdit.value = false;
  formData.id = '';
  formData.site_name = '';
  formData.description = '';
  formData.area_id = undefined;
  formData.latitude = '';
  formData.longitude = '';
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: SiteInfoVo) {
  dialogTitle.value = '编辑站点';
  isEdit.value = true;
  formData.id = row.id;
  formData.site_name = row.site_name ?? '';
  formData.description = row.description ?? '';
  formData.area_id = row.area_id ?? undefined;
  formData.latitude = row.latitude ?? '';
  formData.longitude = row.longitude ?? '';
  dialogVisible.value = true;
}

/** 保存站点 */
async function handleSave() {
  if (!formData.site_name) {
    ElMessage.warning('请输入站点名称');
    return;
  }
  try {
    if (isEdit.value && formData.id) {
      await updateSite(formData.id, {
        site_name: formData.site_name,
        description: formData.description,
        area_id: formData.area_id,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      ElMessage.success('更新成功');
    } else {
      await createSite({
        site_name: formData.site_name,
        description: formData.description,
        area_id: formData.area_id,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[SiteManagement] save failed:', e);
  }
}

/** 删除站点 */
async function handleDelete(row: SiteInfoVo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除站点 "${row.site_name || row.id}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteSite(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[SiteManagement] delete failed:', e);
    }
  }
}

/** 获取区域名称 */
function getAreaName(areaId?: number | null): string {
  if (!areaId) return '-';
  const area = areaList.value.find((a) => a.id === areaId);
  return area?.area_name || '-';
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
  loadAreas();
});
</script>

<template>
  <div class="site-management-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.search"
            placeholder="站点名称/描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button v-permission="'site.create'" type="success" :icon="Plus" @click="handleAdd">新增站点</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="site_name" label="站点名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="area_path" label="区域路径" min-width="180">
          <template #default="{ row }">
            {{ row.area_path || getAreaName(row.area_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="latitude" label="纬度" width="120" />
        <el-table-column prop="longitude" label="经度" width="120" />
        <el-table-column prop="creation_time" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.creation_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'site.edit'" link type="primary" size="small" @click="handleEdit(row as SiteInfoVo)">
              <Edit />
              编辑
            </el-button>
            <el-button v-permission="'site.delete'" link type="danger" size="small" @click="handleDelete(row as SiteInfoVo)">
              <Delete />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 站点表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="dialogVisible = false">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="站点名称" prop="site_name">
          <el-input v-model="formData.site_name" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="formData.area_id" placeholder="请选择区域" clearable style="width: 100%">
            <el-option
              v-for="area in areaList"
              :key="area.id"
              :label="area.area_name || String(area.id)"
              :value="area.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model="formData.latitude" placeholder="请输入纬度" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model="formData.longitude" placeholder="请输入经度" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.site-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>

<script setup lang="ts">
/**
 * 租户管理页面
 *
 * 功能：
 * - 租户列表（分页）
 * - 新增/编辑弹窗
 * - 删除确认
 * - LogoBase64 使用文件上传转 base64
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View } from '@element-plus/icons-vue';

import { getTenancies, addTenancy, updateTenancy, deleteTenancy, viewTenancy } from '@/api/tenancy';
import type { TenancyVO, AddTenancyRequest, UpdateTenancyRequest } from '@/types/tenancy';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<TenancyVO[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
});

// 弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref('新增租户');
const isEdit = ref(false);
const saving = ref(false);

// 表单数据
const formData = reactive({
  id: 0,
  licenseName: '',
  expiryDate: '' as string,
  enbQuantity: null as number | null,
  userQuantity: null as number | null,
  provinceAbbreviation: '',
  vendorCode: '',
  omcName: '',
  timezone: '',
  logoBase64: '',
  gnbQuantity: null as number | null,
  cpeQuantity: null as number | null,
});

// 表单规则
const formRules = {
  licenseName: [{ required: true, message: '请输入 License 名称', trigger: 'blur' }],
  expiryDate: [{ required: true, message: '请选择过期时间', trigger: 'change' }],
};

// 详情弹窗
const detailDialogVisible = ref(false);
const detailData = ref<TenancyVO | null>(null);
const detailLoading = ref(false);

// Logo 上传
const logoInputRef = ref<HTMLInputElement | null>(null);

// ============ 方法 ============

/** 加载租户列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getTenancies({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
    });
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[TenancyManagement] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  loadData();
}

/** 重置搜索 */
function handleReset() {
  queryParams.keyword = '';
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
  dialogTitle.value = '新增租户';
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
async function handleEdit(row: TenancyVO) {
  dialogTitle.value = '编辑租户';
  isEdit.value = true;
  resetForm();
  try {
    const result = await viewTenancy({ id: row.id });
    formData.id = result.id;
    formData.licenseName = result.licenseName ?? '';
    formData.expiryDate = result.expiryDate ? formatDateForInput(result.expiryDate) : '';
    formData.enbQuantity = result.enbQuantity ?? null;
    formData.userQuantity = result.userQuantity ?? null;
    formData.provinceAbbreviation = result.provinceAbbreviation ?? '';
    formData.vendorCode = result.vendorCode ?? '';
    formData.omcName = result.omcName ?? '';
    formData.timezone = result.timezone ?? '';
    formData.logoBase64 = result.logoBase64 ?? '';
    formData.gnbQuantity = result.gnbQuantity ?? null;
    formData.cpeQuantity = result.cpeQuantity ?? null;
    dialogVisible.value = true;
  } catch (e) {
    console.error('[TenancyManagement] view tenancy failed:', e);
  }
}

/** 重置表单 */
function resetForm() {
  formData.id = 0;
  formData.licenseName = '';
  formData.expiryDate = '';
  formData.enbQuantity = null;
  formData.userQuantity = null;
  formData.provinceAbbreviation = '';
  formData.vendorCode = '';
  formData.omcName = '';
  formData.timezone = '';
  formData.logoBase64 = '';
  formData.gnbQuantity = null;
  formData.cpeQuantity = null;
}

/** 保存租户 */
async function handleSave() {
  if (!formData.licenseName) {
    ElMessage.warning('请输入 License 名称');
    return;
  }
  if (!formData.expiryDate) {
    ElMessage.warning('请选择过期时间');
    return;
  }

  const expiryTimestamp = new Date(formData.expiryDate).getTime();
  if (Number.isNaN(expiryTimestamp)) {
    ElMessage.warning('过期时间格式不正确');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      const payload: UpdateTenancyRequest = {
        id: formData.id,
        licenseName: formData.licenseName,
        expiryDate: expiryTimestamp,
        enbQuantity: formData.enbQuantity,
        userQuantity: formData.userQuantity,
        provinceAbbreviation: formData.provinceAbbreviation || null,
        vendorCode: formData.vendorCode || null,
        omcName: formData.omcName || null,
        timezone: formData.timezone || null,
        logoBase64: formData.logoBase64 || null,
        gnbQuantity: formData.gnbQuantity,
        cpeQuantity: formData.cpeQuantity,
      };
      await updateTenancy(payload);
      ElMessage.success('更新成功');
    } else {
      const payload: AddTenancyRequest = {
        licenseName: formData.licenseName,
        expiryDate: expiryTimestamp,
        enbQuantity: formData.enbQuantity,
        userQuantity: formData.userQuantity,
        provinceAbbreviation: formData.provinceAbbreviation || null,
        vendorCode: formData.vendorCode || null,
        omcName: formData.omcName || null,
        timezone: formData.timezone || null,
        logoBase64: formData.logoBase64 || null,
        gnbQuantity: formData.gnbQuantity,
        cpeQuantity: formData.cpeQuantity,
      };
      await addTenancy(payload);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[TenancyManagement] save failed:', e);
  } finally {
    saving.value = false;
  }
}

/** 删除租户 */
async function handleDelete(row: TenancyVO) {
  try {
    await ElMessageBox.confirm(
      `确定要删除租户 "${row.licenseName || row.id}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteTenancy({ id: row.id });
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[TenancyManagement] delete failed:', e);
    }
  }
}

/** 查看租户详情 */
async function handleView(row: TenancyVO) {
  detailDialogVisible.value = true;
  detailLoading.value = true;
  try {
    const result = await viewTenancy({ id: row.id });
    detailData.value = result;
  } catch (e) {
    console.error('[TenancyManagement] view failed:', e);
  } finally {
    detailLoading.value = false;
  }
}

/** 触发 Logo 上传 */
function handleLogoUploadClick() {
  logoInputRef.value?.click();
}

/** 处理 Logo 文件选择并转 base64 */
async function handleLogoFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    target.value = '';
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    formData.logoBase64 = base64;
    ElMessage.success('Logo 上传成功');
  } catch (err) {
    console.error('[TenancyManagement] logo upload failed:', err);
    ElMessage.error('Logo 上传失败');
  } finally {
    target.value = '';
  }
}

/** 文件转 base64 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 格式化时间戳为显示文本 */
function formatTimestamp(ts?: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

/** 将时间戳转为 datetime-local 输入格式 */
function formatDateForInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="tenancy-management-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="License 名称/ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增租户</el-button>
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
        <el-table-column prop="licenseName" label="License 名称" min-width="160" />
        <el-table-column prop="licenseId" label="License ID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="expiryDate" label="过期时间" min-width="160">
          <template #default="{ row }">
            {{ formatTimestamp(row.expiryDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="enbQuantity" label="eNB 数量" width="100" align="center" />
        <el-table-column prop="gnbQuantity" label="gNB 数量" width="100" align="center" />
        <el-table-column prop="cpeQuantity" label="CPE 数量" width="100" align="center" />
        <el-table-column prop="userQuantity" label="用户数量" width="100" align="center" />
        <el-table-column prop="provinceAbbreviation" label="省份" width="100" />
        <el-table-column prop="vendorCode" label="厂商代码" width="100" />
        <el-table-column prop="omcName" label="OMC 名称" min-width="120" />
        <el-table-column prop="timezone" label="时区" width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row as TenancyVO)">
              <View />
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row as TenancyVO)">
              <Edit />
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as TenancyVO)">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="License 名称" prop="licenseName">
          <el-input v-model="formData.licenseName" placeholder="请输入 License 名称" />
        </el-form-item>
        <el-form-item label="过期时间" prop="expiryDate">
          <el-date-picker
            v-model="formData.expiryDate"
            type="datetime"
            placeholder="选择过期时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="eNB 数量">
          <el-input-number v-model="formData.enbQuantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="gNB 数量">
          <el-input-number v-model="formData.gnbQuantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="CPE 数量">
          <el-input-number v-model="formData.cpeQuantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="用户数量">
          <el-input-number v-model="formData.userQuantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="formData.provinceAbbreviation" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="厂商代码">
          <el-input v-model="formData.vendorCode" placeholder="请输入厂商代码" />
        </el-form-item>
        <el-form-item label="OMC 名称">
          <el-input v-model="formData.omcName" placeholder="请输入 OMC 名称" />
        </el-form-item>
        <el-form-item label="时区">
          <el-input v-model="formData.timezone" placeholder="如: Asia/Shanghai" />
        </el-form-item>
        <el-form-item label="Logo">
          <div style="display: flex; align-items: center; gap: 12px;">
            <el-button type="primary" size="small" @click="handleLogoUploadClick">上传 Logo</el-button>
            <span v-if="formData.logoBase64" style="color: #67c23a; font-size: 12px;">已上传</span>
          </div>
          <img
            v-if="formData.logoBase64"
            :src="formData.logoBase64"
            alt="logo preview"
            style="margin-top: 8px; max-width: 120px; max-height: 120px; border: 1px solid #dcdfe6; border-radius: 4px;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="租户详情" width="600px">
      <el-descriptions v-loading="detailLoading" :column="2" border>
        <el-descriptions-item label="ID">{{ detailData?.id ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="License 名称">{{ detailData?.licenseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="License ID">{{ detailData?.licenseId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ formatTimestamp(detailData?.expiryDate) }}</el-descriptions-item>
        <el-descriptions-item label="eNB 数量">{{ detailData?.enbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="gNB 数量">{{ detailData?.gnbQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="CPE 数量">{{ detailData?.cpeQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户数量">{{ detailData?.userQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="省份">{{ detailData?.provinceAbbreviation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="厂商代码">{{ detailData?.vendorCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="OMC 名称">{{ detailData?.omcName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="时区">{{ detailData?.timezone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Logo" :span="2">
          <img
            v-if="detailData?.logoBase64"
            :src="detailData.logoBase64"
            alt="logo"
            style="max-width: 120px; max-height: 120px; border: 1px solid #dcdfe6; border-radius: 4px;"
          />
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 隐藏的文件上传 input -->
    <input
      ref="logoInputRef"
      type="file"
      style="display: none"
      accept="image/*"
      @change="handleLogoFileChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.tenancy-management-page {
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

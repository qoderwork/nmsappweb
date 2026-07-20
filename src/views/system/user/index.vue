<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 功能：
 * - 用户列表展示（分页）
 * - 关键字搜索
 * - 用户状态筛选
 * - 新增/编辑/删除用户
 * - 启用/禁用用户
 * - 重置密码
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElSwitch, ElButton, ElTable, ElTableColumn, ElTag, ElPagination } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Lock, Unlock, Key } from '@element-plus/icons-vue';

import { getUsers, createUser, updateUser, deleteUser, enableUser, disableUser, resetPassword } from '@/api/user';
import type { UserDTO, UserQueryParams, UserStatus } from '@/types/user';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<UserDTO[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
  status: UserStatus | null;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: null,
});

// 弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const isEdit = ref(false);

// 表单数据
const formData = reactive({
  id: 0,
  username: '',
  realName: '',
  email: '',
  phoneNumber: '',
  status: 1 as UserStatus,
  enable: true,
});

// 表单规则
const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
};

// ============ 方法 ============

/** 加载用户列表 */
async function loadData() {
  loading.value = true;
  try {
    const params: UserQueryParams = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
      status: queryParams.status ?? undefined,
    };
    const result = await getUsers(params);
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[UserManagement] load failed:', e);
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
  queryParams.status = null;
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
  dialogTitle.value = '新增用户';
  isEdit.value = false;
  formData.id = 0;
  formData.username = '';
  formData.realName = '';
  formData.email = '';
  formData.phoneNumber = '';
  formData.status = 1 as UserStatus;
  formData.enable = true;
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: UserDTO) {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  formData.id = row.id;
  formData.username = row.username ?? '';
  formData.realName = row.realName ?? '';
  formData.email = row.email ?? '';
  formData.phoneNumber = row.phoneNumber ?? '';
  formData.status = (row.status ?? 1) as UserStatus;
  formData.enable = row.enable ?? true;
  dialogVisible.value = true;
}

/** 保存用户 */
async function handleSave() {
  if (!formData.username || !formData.realName) {
    ElMessage.warning('请填写必填项');
    return;
  }
  try {
    if (isEdit.value) {
      await updateUser(formData.id, {
        username: formData.username,
        realName: formData.realName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        enable: formData.enable,
      });
      ElMessage.success('更新成功');
    } else {
      await createUser({
        username: formData.username,
        realName: formData.realName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        enable: formData.enable,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[UserManagement] save failed:', e);
  }
}

/** 删除用户 */
async function handleDelete(row: UserDTO) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.realName || row.username}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteUser(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UserManagement] delete failed:', e);
    }
  }
}

/** 启用用户 */
async function handleEnable(row: UserDTO) {
  try {
    await enableUser(row.id);
    ElMessage.success('启用成功');
    loadData();
  } catch (e) {
    console.error('[UserManagement] enable failed:', e);
  }
}

/** 禁用用户 */
async function handleDisable(row: UserDTO) {
  try {
    await disableUser(row.id);
    ElMessage.success('禁用成功');
    loadData();
  } catch (e) {
    console.error('[UserManagement] disable failed:', e);
  }
}

/** 重置密码 */
async function handleResetPassword(row: UserDTO) {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${row.realName || row.username}" 的密码吗？`,
      '重置密码',
      { type: 'warning' }
    );
    const result = await resetPassword(row.id);
    ElMessage.success(`密码重置成功，重置链接: ${result.resetKey}`);
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UserManagement] reset password failed:', e);
    }
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取状态标签类型 */
function getStatusType(status?: number | null): 'success' | 'danger' | 'info' {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  return 'info';
}

/** 获取状态文本 */
function getStatusText(status?: number | null): string {
  if (status === 1) return '正常';
  if (status === 0) return '锁定';
  return '未知';
}

/** 获取在线状态文本 */
function getLoginStateText(loginState: boolean): string {
  return loginState ? '在线' : '离线';
}

/** 获取在线状态类型 */
function getLoginStateType(loginState: boolean): 'success' | 'danger' {
  return loginState ? 'success' : 'danger';
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="user-management-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="用户名/姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" style="width: 120px">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="锁定" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增用户</el-button>
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
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="真实姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phoneNumber" label="手机号" min-width="120" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="loginState" label="在线状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getLoginStateType(row.loginState)" size="small">
              {{ getLoginStateText(row.loginState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row as UserDTO)">
              <Edit />
              编辑
            </el-button>
            <el-button link type="success" size="small" v-if="!(row.enable ?? true)" @click="handleEnable(row as UserDTO)">
              <Unlock />
              启用
            </el-button>
            <el-button link type="warning" size="small" v-else @click="handleDisable(row as UserDTO)">
              <Lock />
              禁用
            </el-button>
            <el-button link type="info" size="small" @click="handleResetPassword(row as UserDTO)">
              <Key />
              重置密码
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as UserDTO)">
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

    <!-- 用户表单弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="dialogVisible = false">
      <ElForm :model="formData" :rules="formRules" label-width="100px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="formData.username" :disabled="isEdit" />
        </ElFormItem>
        <ElFormItem label="真实姓名" prop="realName">
          <ElInput v-model="formData.realName" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="formData.email" type="email" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="formData.phoneNumber" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="formData.status" style="width: 100%">
            <ElOption :value="1" label="正常" />
            <ElOption :value="0" label="锁定" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="formData.enable" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management-page {
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
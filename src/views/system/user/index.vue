<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 对齐 Java SystemUserManagementServiceImpl.listUser
 * 字段：id, username, createUsername, enable, updateTime, createTime, tenancy, email, loginState
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElSwitch, ElButton, ElTable, ElTableColumn, ElTag, ElPagination } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Lock, Unlock, Key, CopyDocument } from '@element-plus/icons-vue';

import { getUsers, createUser, updateUser, deleteUser, enableUser, disableUser, resetPassword, unlockUser, kickOutUser, setTenancyForUser, getRoles } from '@/api/user';
import type { UserDTO } from '@/types/user';
import type { Role } from '@/types/user';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<UserDTO[]>([]);
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
const dialogTitle = ref('新增用户');
const isEdit = ref(false);

// 密码显示弹窗
const passwordDialogVisible = ref(false);
const generatedPassword = ref('');
const newUserId = ref(0);

// 表单数据
const formData = reactive({
  id: 0,
  username: '',
  email: '',
  enable: true,
});

// 表单规则
const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
};

// ============ 方法 ============

/** 加载用户列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getUsers({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
    });
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
  formData.email = '';
  formData.enable = true;
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: UserDTO) {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  formData.id = row.id;
  formData.username = row.username ?? '';
  formData.email = row.email ?? '';
  formData.enable = row.enable ?? true;
  dialogVisible.value = true;
}

/** 保存用户 */
async function handleSave() {
  if (!formData.username) {
    ElMessage.warning('请输入用户名');
    return;
  }
  try {
    if (isEdit.value) {
      await updateUser(formData.id, {
        username: formData.username,
        email: formData.email,
        enable: formData.enable,
      });
      ElMessage.success('更新成功');
      dialogVisible.value = false;
    } else {
      // 创建用户成功后显示生成的密码
      const result = await createUser({
        username: formData.username,
        email: formData.email,
        enable: formData.enable,
      });
      dialogVisible.value = false;

      // 显示密码弹窗
      newUserId.value = result.userId;
      generatedPassword.value = result.password;
      passwordDialogVisible.value = true;
    }
    loadData();
  } catch (e) {
    console.error('[UserManagement] save failed:', e);
  }
}

/** 复制密码 */
async function handleCopyPassword() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(generatedPassword.value);
      ElMessage.success('密码已复制到剪贴板');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = generatedPassword.value;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) {
        ElMessage.success('密码已复制到剪贴板');
      } else {
        ElMessage.error('复制失败，请手动复制');
      }
    }
  } catch (e) {
    console.error('[UserManagement] copy failed:', e);
    ElMessage.error('复制失败，请手动复制');
  }
}

/** 关闭密码弹窗 */
function handleClosePasswordDialog() {
  passwordDialogVisible.value = false;
  generatedPassword.value = '';
  newUserId.value = 0;
}

/** 删除用户 */
async function handleDelete(row: UserDTO) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
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

/** 解锁用户 */
async function handleUnlock(row: UserDTO) {
  try {
    await ElMessageBox.confirm(
      `确定要解锁用户 "${row.username}" 吗？`,
      '解锁确认',
      { type: 'warning' }
    );
    await unlockUser(row.id);
    ElMessage.success('解锁成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UserManagement] unlock failed:', e);
    }
  }
}

/** 踢出用户 */
async function handleKickOut(row: UserDTO) {
  try {
    await ElMessageBox.confirm(
      `确定要踢出用户 "${row.username}" 吗？该用户将被强制下线。`,
      '踢出确认',
      { type: 'warning' }
    );
    await kickOutUser(row.id);
    ElMessage.success('踢出成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[UserManagement] kick out failed:', e);
    }
  }
}

/** 分配角色 */
const roleDialogVisible = ref(false);
const roleForm = reactive({ userId: 0, roleIds: [] as number[] });
const availableRoles = ref<Role[]>([]);

async function handleAssignRole(row: UserDTO) {
  roleForm.userId = row.id;
  roleForm.roleIds = (row as any).roleIds || [];
  try {
    availableRoles.value = await getRoles();
  } catch (e) {
    console.error('[UserManagement] load roles failed:', e);
  }
  roleDialogVisible.value = true;
}

async function handleSaveRole() {
  try {
    await updateUser(roleForm.userId, { roleIds: roleForm.roleIds } as any);
    ElMessage.success('角色分配成功');
    roleDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[UserManagement] assign role failed:', e);
  }
}

/** 分配租户 */
const tenancyDialogVisible = ref(false);
const tenancyForm = reactive({ userId: 0, tenancyId: 0 });

function handleAssignTenancy(row: UserDTO) {
  tenancyForm.userId = row.id;
  tenancyForm.tenancyId = (row as any).tenancyId || 0;
  tenancyDialogVisible.value = true;
}

async function handleSaveTenancy() {
  try {
    await setTenancyForUser({ userId: tenancyForm.userId, licenseId: tenancyForm.tenancyId });
    ElMessage.success('租户分配成功');
    tenancyDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[UserManagement] assign tenancy failed:', e);
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
      `确定要重置用户 "${row.username}" 的密码吗？`,
      '重置密码',
      { type: 'warning' }
    );
    const result = await resetPassword(row.id);
    // 显示新密码弹窗
    newUserId.value = result.userId;
    generatedPassword.value = result.password;
    passwordDialogVisible.value = true;
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
            placeholder="用户名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
        <el-table-column prop="createUsername" label="创建者" min-width="120" />
        <el-table-column prop="tenancy" label="租户" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="enable" label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'danger'" size="small">
              {{ row.enable ? '是' : '否' }}
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
        <el-table-column prop="updateTime" label="更新时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
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
            <el-button link size="small" @click="handleUnlock(row as UserDTO)">
              <Unlock />
              解锁
            </el-button>
            <el-button link size="small" @click="handleKickOut(row as UserDTO)">
              踢出
            </el-button>
            <el-button link size="small" @click="handleAssignRole(row as UserDTO)">
              分配角色
            </el-button>
            <el-button link size="small" @click="handleAssignTenancy(row as UserDTO)">
              分配租户
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
        <ElFormItem label="邮箱">
          <ElInput v-model="formData.email" type="email" />
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

    <!-- 密码显示弹窗 -->
    <ElDialog
      v-model="passwordDialogVisible"
      title="用户创建成功"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleClosePasswordDialog"
    >
      <div style="padding: 20px 0;">
        <p style="margin-bottom: 16px; font-size: 14px;">
          用户创建成功！请保存以下初始密码，用户首次登录后需要修改密码：
        </p>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f5f7fa; border-radius: 4px;">
          <span style="font-size: 18px; font-weight: bold; color: #409eff; letter-spacing: 1px;">{{ generatedPassword }}</span>
          <el-button type="primary" :icon="CopyDocument" size="small" @click="handleCopyPassword">
            复制密码
          </el-button>
        </div>
        <p style="margin-top: 12px; color: #e6a23c; font-size: 12px;">
          注意：此密码只会显示一次，请务必保存！
        </p>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleClosePasswordDialog">我已保存</el-button>
      </template>
    </ElDialog>

    <!-- 分配角色弹窗 -->
    <ElDialog v-model="roleDialogVisible" title="分配角色" width="500px">
      <el-checkbox-group v-model="roleForm.roleIds">
        <el-checkbox
          v-for="role in availableRoles"
          :key="role.id"
          :label="role.id"
          :value="role.id"
          style="display: block; margin-bottom: 8px;"
        >
          {{ role.roleName || role.id }}
          <span v-if="role.description" style="color: #999; font-size: 12px; margin-left: 8px;">
            ({{ role.description }})
          </span>
        </el-checkbox>
      </el-checkbox-group>
      <el-empty v-if="availableRoles.length === 0" description="暂无可用角色" />
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">确定</el-button>
      </template>
    </ElDialog>

    <!-- 分配租户弹窗 -->
    <ElDialog v-model="tenancyDialogVisible" title="分配租户" width="400px">
      <ElForm label-width="80px">
        <ElFormItem label="租户 ID">
          <ElInput v-model.number="tenancyForm.tenancyId" type="number" placeholder="请输入租户 ID" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <el-button @click="tenancyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTenancy">确定</el-button>
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

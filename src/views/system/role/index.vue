<script setup lang="ts">
/**
 * 角色管理页面
 *
 * 功能：
 * - 角色列表展示
 * - 新增/编辑/删除角色
 * - 角色权限分配
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElTag, ElTree } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Lock } from '@element-plus/icons-vue';

import { getRoles, createRole, updateRole, deleteRole, getRolePermissions, updateRolePermissions } from '@/api/user';
import type { Role } from '@/types/user';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<Role[]>([]);

// 搜索参数
const keyword = ref('');

// 弹窗状态
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const isEdit = ref(false);

// 表单数据
const formData = reactive({
  id: '',
  roleName: '',
  description: '',
  useToSSO: false,
  defaultRole: false,
});

// 权限树数据
const permissionTreeRef = ref<any>(null);
const permissionTree = ref<any[]>([]);
const checkedPermissions = ref<string[]>([]);
const currentRoleId = ref('');

// ============ 方法 ============

/** 加载角色列表 */
async function loadData() {
  loading.value = true;
  try {
    const result = await getRoles();
    tableData.value = result;
  } catch (e) {
    console.error('[RoleManagement] load failed:', e);
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  loadData();
}

/** 重置搜索 */
function handleReset() {
  keyword.value = '';
  loadData();
}

/** 打开新增弹窗 */
function handleAdd() {
  dialogTitle.value = '新增角色';
  isEdit.value = false;
  formData.id = '';
  formData.roleName = '';
  formData.description = '';
  formData.useToSSO = false;
  formData.defaultRole = false;
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: Role) {
  dialogTitle.value = '编辑角色';
  isEdit.value = true;
  formData.id = row.id;
  formData.roleName = row.roleName ?? '';
  formData.description = row.description ?? '';
  formData.useToSSO = row.useToSSO ?? false;
  formData.defaultRole = row.defaultRole ?? false;
  dialogVisible.value = true;
}

/** 保存角色 */
async function handleSave() {
  if (!formData.roleName) {
    ElMessage.warning('请输入角色名称');
    return;
  }
  try {
    if (isEdit.value) {
      await updateRole(formData.id, {
        roleName: formData.roleName,
        description: formData.description,
        useToSSO: formData.useToSSO,
        defaultRole: formData.defaultRole,
      });
      ElMessage.success('更新成功');
    } else {
      await createRole({
        roleName: formData.roleName,
        description: formData.description,
        useToSSO: formData.useToSSO,
        defaultRole: formData.defaultRole,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[RoleManagement] save failed:', e);
  }
}

/** 删除角色 */
async function handleDelete(row: Role) {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.roleName}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteRole(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[RoleManagement] delete failed:', e);
    }
  }
}

/** 打开权限分配弹窗 */
async function handlePermissions(row: Role) {
  currentRoleId.value = row.id;
  permissionDialogVisible.value = true;
  try {
    const permissions = await getRolePermissions(row.id);
    checkedPermissions.value = permissions.map((p) => p.permissionId).filter((id): id is string => id !== null && id !== undefined);
    initPermissionTree();
  } catch (e) {
    console.error('[RoleManagement] get permissions failed:', e);
  }
}

/** 初始化权限树 */
function initPermissionTree() {
  permissionTree.value = [
    {
      id: 'System',
      label: '系统管理',
      children: [
        { id: 'System.Authority.User.ListUser', label: '用户列表' },
        { id: 'System.Authority.User.AddUser', label: '新增用户' },
        { id: 'System.Authority.User.ModifyUser', label: '编辑用户' },
        { id: 'System.Authority.User.DeleteUser', label: '删除用户' },
        { id: 'System.Authority.User.EnableUser', label: '启用用户' },
        { id: 'System.Authority.User.DisableUser', label: '禁用用户' },
        { id: 'System.Authority.User.ResetPassword', label: '重置密码' },
        { id: 'System.Authority.Role.ListRole', label: '角色列表' },
        { id: 'System.Authority.Role.AddRole', label: '新增角色' },
        { id: 'System.Authority.Role.UpdateRole', label: '编辑角色' },
        { id: 'System.Authority.Role.DeleteRole', label: '删除角色' },
        { id: 'System.Authority.Role.GetRolePermissions', label: '获取角色权限' },
        { id: 'System.Authority.Role.UpdateRolePermissions', label: '更新角色权限' },
      ],
    },
    {
      id: 'Alarm',
      label: '告警管理',
      children: [
        { id: 'Alarm.ListAlarm', label: '告警列表' },
        { id: 'Alarm.ConfirmAlarm', label: '确认告警' },
        { id: 'Alarm.ClearAlarm', label: '清除告警' },
        { id: 'Alarm.DeleteAlarm', label: '删除告警' },
      ],
    },
    {
      id: 'Device',
      label: '设备管理',
      children: [
        { id: 'Device.ListDevice', label: '设备列表' },
        { id: 'Device.DeleteDevice', label: '删除设备' },
        { id: 'Device.DetailDevice', label: '设备详情' },
      ],
    },
  ];
}

/** 保存权限分配 */
async function handleSavePermissions() {
  try {
    await updateRolePermissions(currentRoleId.value, checkedPermissions.value);
    ElMessage.success('权限分配成功');
    permissionDialogVisible.value = false;
  } catch (e) {
    console.error('[RoleManagement] save permissions failed:', e);
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取角色类型标签 */
function getRoleTypeTag(roleName?: string | null): { type: 'primary' | 'success' | 'warning' | 'info' | 'danger'; label: string } {
  if (!roleName) return { type: 'info', label: '自定义' };
  const name = roleName.toLowerCase();
  if (name === 'admin') return { type: 'danger', label: '管理员' };
  if (name === 'operator') return { type: 'warning', label: '操作员' };
  if (name === 'maintenance') return { type: 'success', label: '维护员' };
  if (name === 'monitoring') return { type: 'info', label: '监控员' };
  return { type: 'info', label: '自定义' };
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="role-management-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="keyword"
            placeholder="角色名称/描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增角色</el-button>
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
        <el-table-column prop="roleName" label="角色名称" min-width="140">
          <template #default="{ row }">
            <el-tag :type="getRoleTypeTag(row.roleName).type" size="small" style="margin-right: 8px">
              {{ getRoleTypeTag(row.roleName).label }}
            </el-tag>
            {{ row.roleName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column label="SSO" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.useToSSO ? 'success' : 'info'" size="small">
              {{ row.useToSSO ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.defaultRole ? 'success' : 'info'" size="small">
              {{ row.defaultRole ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row as Role)">
              <Edit />
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="handlePermissions(row as Role)">
              <Lock />
              权限
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as Role)">
              <Delete />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色表单弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="dialogVisible = false">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="角色名称" prop="roleName">
          <ElInput v-model="formData.roleName" />
        </ElFormItem>
        <ElFormItem label="角色描述">
          <ElInput v-model="formData.description" type="textarea" :rows="3" />
        </ElFormItem>
        <ElFormItem label="SSO">
          <el-switch v-model="formData.useToSSO" />
        </ElFormItem>
        <ElFormItem label="默认角色">
          <el-switch v-model="formData.defaultRole" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </ElDialog>

    <!-- 权限分配弹窗 -->
    <ElDialog v-model="permissionDialogVisible" title="权限分配" width="600px" @close="permissionDialogVisible = false">
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="{ label: 'label', children: 'children' }"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="checkedPermissions"
        @check-change="(data, checked) => {
          if (checked) {
            if (!checkedPermissions.includes(data.id)) checkedPermissions.push(data.id);
          } else {
            const index = checkedPermissions.indexOf(data.id);
            if (index > -1) checkedPermissions.splice(index, 1);
          }
        }"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions">确定</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.role-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}
</style>
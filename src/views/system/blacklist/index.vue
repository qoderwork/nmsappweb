<template>
  <div class="blacklist-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="黑名单列表" name="list">
        <div class="toolbar">
          <el-input
            v-model="searchSN"
            placeholder="搜索设备SN"
            style="width: 200px"
            clearable
            @keyup.enter="loadBlackList"
          />
          <el-button type="primary" @click="showAddDialog = true">添加设备</el-button>
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
            批量删除
          </el-button>
        </div>
        <el-table
          :data="blackList"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="sn" label="设备SN" min-width="150" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="deviceType" label="设备类型" width="120" />
          <el-table-column prop="tenancyName" label="租户" width="120" />
          <el-table-column prop="addTime" label="添加时间" width="180" />
          <el-table-column prop="reason" label="原因" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="handleDelete((row as ListDeviceBlackListVO).id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          layout="total, prev, pager, next, jumper"
          style="margin-top: 20px; text-align: right"
        />
      </el-tab-pane>
      <el-tab-pane label="操作日志" name="logs">
        <div class="toolbar">
          <el-input
            v-model="logSearchText"
            placeholder="搜索设备SN"
            style="width: 200px"
            clearable
          />
          <el-select v-model="logOperationType" placeholder="操作类型" style="width: 150px">
            <el-option label="添加" value="ADD" />
            <el-option label="移除" value="REMOVE" />
          </el-select>
        </div>
        <el-table :data="operationLogs" v-loading="logLoading" border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="deviceSn" label="设备SN" min-width="150" />
          <el-table-column prop="deviceType" label="设备类型" width="120" />
          <el-table-column prop="operationType" label="操作类型" width="100">
            <template #default="{ row }">
              <el-tag :type="(row as BlackListOperationLogVO).operationType === 'ADD' ? 'danger' : 'success'">
                {{ (row as BlackListOperationLogVO).operationType === 'ADD' ? '添加' : '移除' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorUsername" label="操作人" width="120" />
          <el-table-column prop="operationTime" label="操作时间" width="180" />
          <el-table-column prop="operationReason" label="操作原因" min-width="150" show-overflow-tooltip />
          <el-table-column prop="tenancyName" label="租户" width="120" />
        </el-table>
        <el-pagination
          :current-page="logPage"
          :page-size="logPageSize"
          :total="logTotal"
          @current-change="handleLogPageChange"
          @size-change="handleLogSizeChange"
          layout="total, prev, pager, next, jumper"
          style="margin-top: 20px; text-align: right"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAddDialog" title="添加设备到黑名单" width="400px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="设备SN" required>
          <el-input v-model="addForm.sn" />
        </el-form-item>
        <el-form-item label="设备类型" required>
          <el-input v-model="addForm.deviceType" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ListDeviceBlackListVO, BlackListOperationLogVO, AddDeviceToBlackListRequest } from '@/types/blacklist';
import {
  listDeviceBlackList,
  addDeviceToBlackList,
  deleteDeviceFromBlackList,
  batchDeleteDeviceFromBlackList,
  listBlackListOperationLog,
} from '@/api/blacklist';

const activeTab = ref('list');
const loading = ref(false);
const logLoading = ref(false);
const blackList = ref<ListDeviceBlackListVO[]>([]);
const operationLogs = ref<BlackListOperationLogVO[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const logPage = ref(1);
const logPageSize = ref(20);
const logTotal = ref(0);
const searchSN = ref('');
const logSearchText = ref('');
const logOperationType = ref('');
const selectedIds = ref<number[]>([]);
const showAddDialog = ref(false);

const addForm = reactive<AddDeviceToBlackListRequest>({
  sn: '',
  deviceType: '',
  reason: '',
});

async function loadBlackList() {
  loading.value = true;
  try {
    const res = await listDeviceBlackList({
      sn: searchSN.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    blackList.value = res.list || [];
    total.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadOperationLogs() {
  logLoading.value = true;
  try {
    const res = await listBlackListOperationLog({
      searchText: logSearchText.value || undefined,
      operationType: logOperationType.value || undefined,
      page: logPage.value,
      pageSize: logPageSize.value,
    });
    operationLogs.value = res.list || [];
    logTotal.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    logLoading.value = false;
  }
}

function handleSelectionChange(rows: unknown[]) {
  selectedIds.value = rows.map((r) => (r as ListDeviceBlackListVO).id);
}

async function handleAdd() {
  if (!addForm.sn || !addForm.deviceType) {
    ElMessage.warning('请填写设备SN和设备类型');
    return;
  }
  try {
    await addDeviceToBlackList(addForm);
    ElMessage.success('添加成功');
    showAddDialog.value = false;
    addForm.sn = '';
    addForm.deviceType = '';
    addForm.reason = '';
    await loadBlackList();
  } catch (e: unknown) {
    ElMessage.error('添加失败');
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    await deleteDeviceFromBlackList(id);
    ElMessage.success('删除成功');
    await loadBlackList();
  } catch (e: unknown) {
    // cancelled
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm('确定要批量删除吗？', '提示', { type: 'warning' });
    await batchDeleteDeviceFromBlackList({ ids: selectedIds.value });
    ElMessage.success('批量删除成功');
    selectedIds.value = [];
    await loadBlackList();
  } catch (e: unknown) {
    // cancelled
  }
}

function handlePageChange(p: number) {
  page.value = p;
  loadBlackList();
}

function handleSizeChange(s: number) {
  pageSize.value = s;
  loadBlackList();
}

function handleLogPageChange(p: number) {
  logPage.value = p;
  loadOperationLogs();
}

function handleLogSizeChange(s: number) {
  logPageSize.value = s;
  loadOperationLogs();
}

onMounted(() => {
  loadBlackList();
});
</script>

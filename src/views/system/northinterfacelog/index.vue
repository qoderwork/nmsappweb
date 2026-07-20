<template>
  <div class="northinterfacelog-container">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索消息内容"
          style="width: 200px"
          clearable
          @keyup.enter="loadLogs"
        />
        <el-select v-model="searchStatus" placeholder="状态" style="width: 120px">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILURE" />
        </el-select>
        <el-select v-model="searchType" placeholder="接口类型" style="width: 150px">
          <el-option label="RADIUS" value="RADIUS" />
          <el-option label="SFTP" value="SFTP" />
          <el-option label="HEC" value="HEC" />
        </el-select>
      </div>
      <el-table :data="logs" v-loading="loading" border style="margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="interfaceType" label="接口类型" width="120" />
        <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(row as NorthInterfaceLog).status === 'SUCCESS' ? 'success' : 'danger'">
              {{ (row as NorthInterfaceLog).status === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { NorthInterfaceLog } from '@/types/northinterfacelog';
import { listNorthInterfaceLogs } from '@/api/northinterfacelog';

const loading = ref(false);
const logs = ref<NorthInterfaceLog[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const searchText = ref('');
const searchStatus = ref('');
const searchType = ref('');

async function loadLogs() {
  loading.value = true;
  try {
    const res = await listNorthInterfaceLogs({
      interfaceType: searchType.value || undefined,
      status: searchStatus.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    logs.value = res.list || [];
    total.value = res.total || 0;
  } catch (e: unknown) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handlePageChange(p: number) {
  page.value = p;
  loadLogs();
}

function handleSizeChange(s: number) {
  pageSize.value = s;
  loadLogs();
}

onMounted(() => {
  loadLogs();
});
</script>

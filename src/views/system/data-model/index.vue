<script setup lang="ts">
/**
 * 数据模型管理 (TR069 参数)
 *
 * 使用 TR069 参数列表 API (GET /tr069-parameters)
 */
import { ref, reactive, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { http } from '@/utils/request';

const { t } = useI18n();
const queryParams = reactive({ keyword: '', page: 1, pageSize: 20 });
const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);

async function loadData() {
  loading.value = true;
  try {
    const res = await http.get<any>('/tr069-parameters', {
      params: { keyword: queryParams.keyword || undefined, page: queryParams.page, pageSize: queryParams.pageSize },
    });
    tableData.value = (res as any).list || [];
    total.value = (res as any).total || 0;
  } catch (e) { console.error('[DataModel] load failed:', e); }
  finally { loading.value = false; }
}

function handleSearch() { queryParams.page = 1; loadData(); }
function handlePageChange(p: number) { queryParams.page = p; loadData(); }
function handleSizeChange(s: number) { queryParams.pageSize = s; queryParams.page = 1; loadData(); }

onMounted(() => loadData());
</script>

<template>
  <div class="data-model-page">
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item>
          <el-input v-model="queryParams.keyword" placeholder="搜索参数名/路径" clearable style="width: 260px" @keyup.enter="handleSearch" @clear="handleSearch"><template #prefix><el-icon><Search /></el-icon></template></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="queryParams.keyword = ''; handleSearch()">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" row-key="id">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="param_name" label="参数名" min-width="160" />
        <el-table-column prop="tr069_name" label="TR069 路径" min-width="240" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column label="可写" width="80"><template #default="{ row: r }"><el-tag :type="r.writable ? 'success' : 'info'" size="small">{{ r.writable ? '是' : '否' }}</el-tag></template></el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.data-model-page { display: flex; flex-direction: column; gap: var(--spacing-base, 12px); width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px; }
</style>

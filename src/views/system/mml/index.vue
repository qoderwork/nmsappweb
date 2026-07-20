<script setup lang="ts">
import { reactive, ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElButton, ElTable, ElTableColumn, ElTabs, ElTabPane, ElTag, ElTree, ElUpload, ElInputNumber } from 'element-plus';
import { Search, Refresh, VideoPlay, View, Upload, Delete, List } from '@element-plus/icons-vue';

import {
  listMmlSets,
  listMmlCommands,
  getMmlCommandParams,
  executeMml,
  listMmlResults,
  getMmlResult,
  getMmlVersions,
  deleteMmlByVersion,
  importMML,
} from '@/api/mml';
import type {
  MmlCommand,
  MmlCommandParam,
  MmlSet,
  MmlExecuteResult,
} from '@/types/mml';

const activeTab = ref('command');

// --- MML命令列表 ---
const commandLoading = ref(false);
const mmlSets = ref<MmlSet[]>([]);
const selectedSetId = ref<number | null>(null);
const commandList = ref<MmlCommand[]>([]);
const selectedCommand = ref<MmlCommand | null>(null);
const commandParams = ref<MmlCommandParam[]>([]);

// --- 命令执行 ---
const executeLoading = ref(false);
const executeForm = reactive({
  elementId: 0,
  command: '',
  uid: '',
  params: {} as Record<string, any>,
});
const paramsJson = ref('');

// --- 执行结果 ---
const resultLoading = ref(false);
const resultList = ref<MmlExecuteResult[]>([]);
const resultTotal = ref(0);
const resultQuery = reactive({
  elementId: 0,
  page: 1,
  pageSize: 20,
});
const resultDetailDialogVisible = ref(false);
const resultDetail = ref<MmlExecuteResult | null>(null);

// --- MML版本管理 ---
const versionLoading = ref(false);
const versionList = ref<string[]>([]);
const versionTableData = computed(() => versionList.value.map(v => ({ version: v })));

watch(selectedSetId, () => {
  if (selectedSetId.value) {
    loadCommands();
  }
});

watch(selectedCommand, () => {
  if (selectedCommand.value) {
    loadCommandParams();
    executeForm.command = selectedCommand.value.command || '';
    executeForm.params = {};
    commandParams.value.forEach((p) => {
      if (p.default_value) {
        executeForm.params[p.name || ''] = p.default_value;
      }
    });
  }
});

function getStatusText(status: number): string {
  const map: Record<number, string> = {
    0: '待发送',
    1: '已发送',
    2: '已接收',
    3: '处理中',
    4: '已完成',
    5: '失败',
    6: '超时',
  };
  return map[status] || '未知';
}

function getStatusClass(status: number): 'info' | 'warning' | 'success' | 'danger' | undefined {
  const map: Record<number, 'info' | 'warning' | 'success' | 'danger'> = {
    0: 'info',
    1: 'warning',
    2: 'warning',
    3: 'warning',
    4: 'success',
    5: 'danger',
    6: 'danger',
  };
  return map[status];
}

function formatTime(time?: string): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// --- 命令列表方法 ---
async function loadSets() {
  commandLoading.value = true;
  try {
    const result = await listMmlSets();
    mmlSets.value = result;
    if (result.length > 0 && !selectedSetId.value) {
      selectedSetId.value = result[0].id;
    }
  } catch (e) {
    console.error('[MML] load sets failed:', e);
  } finally {
    commandLoading.value = false;
  }
}

async function loadCommands() {
  if (!selectedSetId.value) return;
  commandLoading.value = true;
  try {
    const result = await listMmlCommands(selectedSetId.value);
    commandList.value = result;
  } catch (e) {
    console.error('[MML] load commands failed:', e);
  } finally {
    commandLoading.value = false;
  }
}

async function loadCommandParams() {
  if (!selectedCommand.value) return;
  try {
    const result = await getMmlCommandParams(selectedCommand.value.id);
    commandParams.value = result;
  } catch (e) {
    console.error('[MML] load params failed:', e);
  }
}

// --- 命令执行方法 ---
async function handleExecute() {
  if (!executeForm.elementId || !executeForm.command) {
    ElMessage.warning('请选择设备并输入命令');
    return;
  }
  executeLoading.value = true;
  try {
    const params = paramsJson.value ? JSON.parse(paramsJson.value) : {};
    await executeMml({
      element_id: executeForm.elementId,
      command: executeForm.command,
      uid: executeForm.uid,
      params,
    });
    ElMessage.success('命令已提交');
    executeForm.elementId = 0;
    executeForm.command = '';
    executeForm.uid = '';
    executeForm.params = {};
    paramsJson.value = '';
  } catch (e) {
    console.error('[MML] execute failed:', e);
  } finally {
    executeLoading.value = false;
  }
}

// --- 执行结果方法 ---
async function loadResults() {
  if (!resultQuery.elementId) return;
  resultLoading.value = true;
  try {
    const result = await listMmlResults(resultQuery.elementId, resultQuery.page, resultQuery.pageSize);
    resultList.value = result.list || [];
    resultTotal.value = result.total || 0;
  } catch (e) {
    console.error('[MML] load results failed:', e);
  } finally {
    resultLoading.value = false;
  }
}

function handleResultPageChange(page: number) {
  resultQuery.page = page;
  loadResults();
}

function handleResultSizeChange(size: number) {
  resultQuery.pageSize = size;
  resultQuery.page = 1;
  loadResults();
}

async function viewResultDetail(row: MmlExecuteResult) {
  try {
    const result = await getMmlResult(row.id);
    resultDetail.value = result;
    resultDetailDialogVisible.value = true;
  } catch (e) {
    console.error('[MML] get result detail failed:', e);
  }
}

// --- 版本管理方法 ---
async function loadVersions() {
  versionLoading.value = true;
  try {
    const result = await getMmlVersions();
    versionList.value = result;
  } catch (e) {
    console.error('[MML] load versions failed:', e);
  } finally {
    versionLoading.value = false;
  }
}

async function handleDeleteVersion(version: string) {
  try {
    await ElMessageBox.confirm(`确定要删除版本 "${version}" 吗？`, '删除确认', { type: 'warning' });
    await deleteMmlByVersion(version);
    ElMessage.success('删除成功');
    loadVersions();
  } catch (e) {
    if (e !== 'cancel') console.error('[MML] delete version failed:', e);
  }
}

function handleFileUpload(file: any) {
  const formData = new FormData();
  formData.append('file', file.raw);
  importMML(formData).then(() => {
    ElMessage.success('导入成功');
    loadSets();
    loadVersions();
  }).catch(() => {
    ElMessage.error('导入失败');
  });
}

onMounted(() => {
  loadSets();
  loadVersions();
});
</script>

<template>
  <div class="mml-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- MML命令 -->
      <el-tab-pane label="MML命令" name="command">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="never" title="命令集">
              <el-tree
                :data="mmlSets"
                :props="{ label: 'name' }"
                :loading="commandLoading"
                node-key="id"
                highlight-current
                @node-click="(data) => selectedSetId = data.id"
              />
            </el-card>
          </el-col>
          <el-col :span="10">
            <el-card shadow="never" title="命令列表">
              <el-table :data="commandList" :loading="commandLoading" border size="small" highlight-current-row @current-change="(row) => selectedCommand = row as MmlCommand">
                <el-table-column prop="name" label="命令名称" />
                <el-table-column prop="command" label="命令" />
                <el-table-column prop="hint" label="提示" show-overflow-tooltip />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" title="命令参数">
              <div v-if="selectedCommand">
                <el-table :data="commandParams" border size="small">
                  <el-table-column prop="name" label="参数名" />
                  <el-table-column prop="type" label="类型" />
                  <el-table-column prop="default_value" label="默认值" />
                  <el-table-column prop="necessity" label="必填">
                    <template #default="{ row }">{{ row.necessity ? '是' : '否' }}</template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="empty-tip">请选择命令</div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 命令执行 -->
      <el-tab-pane label="命令执行" name="execute">
        <el-card shadow="never">
          <el-form :model="executeForm" label-width="100px">
            <el-form-item label="设备ID" required>
              <el-input-number v-model="executeForm.elementId" :min="1" />
            </el-form-item>
            <el-form-item label="命令" required>
              <el-input v-model="executeForm.command" placeholder="输入MML命令" />
            </el-form-item>
            <el-form-item label="UID">
              <el-input v-model="executeForm.uid" placeholder="可选" />
            </el-form-item>
            <el-form-item label="参数(JSON)">
              <el-input v-model="paramsJson" type="textarea" :rows="4" placeholder='{"param1": "value1"}' />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="VideoPlay" :loading="executeLoading" @click="handleExecute">执行命令</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 执行结果 -->
      <el-tab-pane label="执行结果" name="result">
        <el-card shadow="never">
          <div class="result-header">
            <el-form-item label="设备ID">
              <el-input-number v-model="resultQuery.elementId" :min="1" />
            </el-form-item>
            <el-button :icon="Search" @click="loadResults">查询</el-button>
            <el-button :icon="Refresh" @click="loadResults">刷新</el-button>
          </div>
          <el-table :data="resultList" :loading="resultLoading" border size="small">
            <el-table-column prop="command" label="命令" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusClass(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="has_fault" label="故障" width="80">
              <template #default="{ row }">
                <el-tag :type="row.has_fault ? 'danger' : 'success'">{{ row.has_fault ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operation_time" label="操作时间">
              <template #default="{ row }">{{ formatTime(row.operation_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" :icon="View" @click="viewResultDetail(row as MmlExecuteResult)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="resultQuery.page"
              v-model:page-size="resultQuery.pageSize"
              :total="resultTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleResultSizeChange"
              @current-change="handleResultPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 版本管理 -->
      <el-tab-pane label="版本管理" name="version">
        <el-card shadow="never">
          <div class="version-header">
            <el-upload
              class="upload-demo"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :on-change="(file) => handleFileUpload(file)"
            >
              <el-icon :size="48" class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            </el-upload>
          </div>
          <el-table :data="versionTableData" :loading="versionLoading" border size="small">
            <el-table-column prop="version" label="版本" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteVersion(row.version)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 结果详情对话框 -->
    <el-dialog title="执行结果详情" v-model="resultDetailDialogVisible" width="600px">
      <div v-if="resultDetail">
        <el-descriptions :column="1">
          <el-descriptions-item label="命令">{{ resultDetail.command || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusClass(resultDetail.status)">{{ getStatusText(resultDetail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障">
            <el-tag :type="resultDetail.has_fault ? 'danger' : 'success'">{{ resultDetail.has_fault ? '是' : '否' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障信息">{{ resultDetail.fault_string || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatTime(resultDetail.operation_time) }}</el-descriptions-item>
          <el-descriptions-item label="结果">
            <pre style="max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">{{ resultDetail.result || '-' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.mml-page {
  padding: 16px;
}

.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.version-header {
  margin-bottom: 16px;
}
</style>
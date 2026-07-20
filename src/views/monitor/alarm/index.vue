<script setup lang="ts">
/**
 * 告警列表页面
 *
 * 功能：
 * - 告警列表展示（分页）
 * - 关键字搜索
 * - 告警类型/状态/严重级别筛选
 * - 确认/取消确认告警
 * - 清除/删除告警
 * - 批量清除告警
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElTable, ElTableColumn, ElTag, ElPagination } from 'element-plus';
import { Search, Refresh, Warning, CircleCheck, CircleClose, Delete } from '@element-plus/icons-vue';

import { getAlarms, confirmAlarm, unconfirmAlarm, clearAlarm, deleteAlarm, batchClearAlarms, addCommentForAlarm } from '@/api/alarm';
import type { Alarm, AlarmQueryParams, AlarmSeverity } from '@/types/alarm';
import { AlarmStatus, AlarmType } from '@/types/alarm';

const { t } = useI18n();

// ============ 状态 ============
const loading = ref(false);
const tableData = ref<Alarm[]>([]);
const total = ref(0);

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
  alarmType: AlarmType | null;
  alarmStatus: AlarmStatus | null;
  severity: AlarmSeverity | null;
}
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
  alarmType: null,
  alarmStatus: null,
  severity: null,
});

// 弹窗状态
const commentDialogVisible = ref(false);
const commentForm = reactive({
  alarmId: 0,
  comment: '',
});

// 批量操作
const selectedIds = ref<(number | string)[]>([]);

// ============ 方法 ============

/** 加载告警列表 */
async function loadData() {
  loading.value = true;
  try {
    const params: AlarmQueryParams = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
      alarmType: queryParams.alarmType ?? undefined,
      alarmStatus: queryParams.alarmStatus ?? undefined,
      severity: queryParams.severity ?? undefined,
    };
    const result = await getAlarms(params);
    tableData.value = result.list;
    total.value = result.total;
  } catch (e) {
    console.error('[AlarmList] load failed:', e);
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
  queryParams.alarmType = null;
  queryParams.alarmStatus = null;
  queryParams.severity = null;
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

/** 确认告警 */
async function handleConfirm(row: Alarm) {
  try {
    await confirmAlarm(row.id);
    ElMessage.success('确认成功');
    loadData();
  } catch (e) {
    console.error('[AlarmList] confirm failed:', e);
  }
}

/** 取消确认告警 */
async function handleUnconfirm(row: Alarm) {
  try {
    await unconfirmAlarm(row.id);
    ElMessage.success('取消确认成功');
    loadData();
  } catch (e) {
    console.error('[AlarmList] unconfirm failed:', e);
  }
}

/** 清除告警 */
async function handleClear(row: Alarm) {
  try {
    await clearAlarm(row.id);
    ElMessage.success('清除成功');
    loadData();
  } catch (e) {
    console.error('[AlarmList] clear failed:', e);
  }
}

/** 删除告警 */
async function handleDelete(row: Alarm) {
  try {
    await ElMessageBox.confirm(
      '确定要删除此告警吗？',
      '删除确认',
      { type: 'warning' }
    );
    await deleteAlarm(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[AlarmList] delete failed:', e);
    }
  }
}

/** 批量清除告警 */
async function handleBatchClear() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要清除的告警');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要清除选中的 ${selectedIds.value.length} 条告警吗？`,
      '批量清除确认',
      { type: 'warning' }
    );
    await batchClearAlarms(selectedIds.value);
    ElMessage.success('批量清除成功');
    selectedIds.value = [];
    loadData();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[AlarmList] batch clear failed:', e);
    }
  }
}

/** 打开评论弹窗 */
function handleOpenComment(row: Alarm) {
  commentForm.alarmId = row.id;
  commentForm.comment = row.comment ?? '';
  commentDialogVisible.value = true;
}

/** 保存评论 */
async function handleSaveComment() {
  if (!commentForm.comment.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  try {
    await addCommentForAlarm(commentForm.alarmId, { comment: commentForm.comment });
    ElMessage.success('评论保存成功');
    commentDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error('[AlarmList] save comment failed:', e);
  }
}

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取严重级别标签类型 */
function getSeverityType(severity?: AlarmSeverity | null): 'danger' | 'warning' | 'info' | 'success' {
  if (!severity) return 'info';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'major') return 'danger';
  if (s === 'minor') return 'warning';
  if (s === 'warning') return 'info';
  return 'success';
}

/** 获取严重级别文本 */
function getSeverityText(severity?: AlarmSeverity | null): string {
  if (!severity) return '未知';
  const map: Record<string, string> = {
    Critical: '严重',
    Major: '主要',
    Minor: '次要',
    Warning: '警告',
    Info: '信息',
  };
  return map[severity] || severity;
}

/** 获取告警类型文本 */
function getAlarmTypeText(type?: AlarmType | null): string {
  if (type === AlarmType.Active) return '活动';
  if (type === AlarmType.History) return '历史';
  return '未知';
}

/** 获取告警状态文本 */
function getAlarmStatusText(status?: AlarmStatus | null): string {
  if (status === AlarmStatus.ActiveUnconfirmed) return '活动未确认';
  if (status === AlarmStatus.HistoryUnconfirmed) return '历史未确认';
  if (status === AlarmStatus.ActiveConfirmed) return '活动已确认';
  if (status === AlarmStatus.HistoryConfirmed) return '历史已确认';
  return '未知';
}

/** 获取告警状态标签类型 */
function getAlarmStatusType(status?: AlarmStatus | null): 'danger' | 'warning' | 'success' | 'info' {
  if (status === AlarmStatus.ActiveUnconfirmed) return 'danger';
  if (status === AlarmStatus.HistoryUnconfirmed) return 'warning';
  if (status === AlarmStatus.ActiveConfirmed) return 'warning';
  if (status === AlarmStatus.HistoryConfirmed) return 'success';
  return 'info';
}

/** 处理多选变化 */
function handleSelectionChange(selection: Alarm[]) {
  selectedIds.value = selection.map((alarm) => alarm.id);
}

// ============ 生命周期 ============
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="alarm-list-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" :body-style="{ padding: '16px' }">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="告警标识/设备名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="告警类型">
          <el-select v-model="queryParams.alarmType" placeholder="全部" style="width: 120px">
            <el-option :value="1" label="活动告警" />
            <el-option :value="2" label="历史告警" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警状态">
          <el-select v-model="queryParams.alarmStatus" placeholder="全部" style="width: 140px">
            <el-option :value="1" label="活动未确认" />
            <el-option :value="2" label="历史未确认" />
            <el-option :value="3" label="活动已确认" />
            <el-option :value="4" label="历史已确认" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重级别">
          <el-select v-model="queryParams.severity" placeholder="全部" style="width: 120px">
            <el-option value="Critical" label="严重" />
            <el-option value="Major" label="主要" />
            <el-option value="Minor" label="次要" />
            <el-option value="Warning" label="警告" />
            <el-option value="Info" label="信息" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <el-card shadow="never" :body-style="{ padding: '12px 16px' }" v-if="selectedIds.length > 0">
      <span>已选择 {{ selectedIds.length }} 条告警</span>
      <el-button type="success" size="small" style="margin-left: 16px" @click="handleBatchClear">
        批量清除
      </el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="severity" label="严重级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">
              {{ getSeverityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmIdentifier" label="告警标识" min-width="180" />
        <el-table-column prop="probableCause" label="可能原因" min-width="180" />
        <el-table-column prop="networkElement" label="网元" min-width="140" />
        <el-table-column prop="alarmSource" label="告警源" min-width="140" />
        <el-table-column prop="alarmType" label="告警类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.alarmType === AlarmType.Active ? 'danger' : 'info'" size="small">
              {{ getAlarmTypeText(row.alarmType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmStatus" label="告警状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmStatusType(row.alarmStatus)" size="small">
              {{ getAlarmStatusText(row.alarmStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="eventTime" label="事件时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.eventTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <template v-if="row.alarmStatus === AlarmStatus.ActiveUnconfirmed || row.alarmStatus === AlarmStatus.HistoryUnconfirmed">
              <el-button link type="success" size="small" @click="handleConfirm(row as Alarm)">
                <CircleCheck />
                确认
              </el-button>
            </template>
            <template v-else>
              <el-button link type="warning" size="small" @click="handleUnconfirm(row as Alarm)">
                <CircleClose />
                取消确认
              </el-button>
            </template>
            <el-button link type="primary" size="small" @click="handleClear(row as Alarm)">
              <Warning />
              清除
            </el-button>
            <el-button link type="info" size="small" @click="handleOpenComment(row as Alarm)">
              评论
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as Alarm)">
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

    <!-- 评论弹窗 -->
    <ElDialog v-model="commentDialogVisible" title="添加评论" width="400px" @close="commentDialogVisible = false">
      <ElForm :model="commentForm" label-width="60px">
        <ElFormItem label="评论">
          <ElInput v-model="commentForm.comment" type="textarea" :rows="4" placeholder="请输入告警评论" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveComment">确定</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.alarm-list-page {
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
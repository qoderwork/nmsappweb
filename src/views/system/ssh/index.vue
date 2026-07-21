<script setup lang="ts">
/**
 * SSH 管理页面
 *
 * 功能：
 * - WebSSH 终端（WebSocket 连接）
 * - SSH 标签管理
 * - SSH 访问定时器
 */
import { reactive, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Plus, Edit, Delete, Timer, Connection,
} from '@element-plus/icons-vue';

import {
  listSSHLabels,
  addSSHLabel,
  updateSSHLabel,
  deleteSSHLabel,
  listSSHAccessTimers,
  setSSHAccessTimer,
} from '@/api/ssh';
import type {
  SSHLabel,
  SSHAccessTimerVO,
} from '@/types/ssh';

const { t } = useI18n();

// ============ 状态 ============
const activeTab = ref('terminal');

// --- WebSSH 终端 ---
const terminalOutput = ref('');
const terminalInput = ref('');
const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);
const connectForm = reactive({
  host: '',
  port: 22,
  username: '',
  password: '',
});
const terminalRef = ref<HTMLPreElement | null>(null);

// --- SSH 标签 ---
const labelLoading = ref(false);
const labelList = ref<SSHLabel[]>([]);
const labelDialogVisible = ref(false);
const isEditLabel = ref(false);
const labelForm = reactive({
  id: 0,
  name: '',
  content: '',
});

// --- SSH 访问定时器 ---
const timerLoading = ref(false);
const timerList = ref<SSHAccessTimerVO[]>([]);
const timerQuery = reactive({
  page: 1,
  pageSize: 20,
  elementId: '',
});
const timerTotal = ref(0);
const timerDialogVisible = ref(false);
const timerForm = reactive({
  elementIds: '',
  deadline: 3600,
});

// ============ WebSSH 终端方法 ============

function connectWebSSH() {
  if (!connectForm.host || !connectForm.username) {
    ElMessage.warning(t('ssh.inputHostAndUsername'));
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/v1/webssh`;

  const socket = new WebSocket(wsUrl);
  ws.value = socket;

  socket.onopen = () => {
    isConnected.value = true;
    appendOutput(t('ssh.connected') + '\n');
    // 发送连接信息
    socket.send(JSON.stringify({
      type: 'connect',
      host: connectForm.host,
      port: connectForm.port || 22,
      username: connectForm.username,
      password: connectForm.password,
    }));
  };

  socket.onmessage = (event) => {
    appendOutput(event.data);
  };

  socket.onerror = (e) => {
    console.error('[WebSSH] error:', e);
    appendOutput(t('ssh.connectionError') + '\n');
  };

  socket.onclose = () => {
    isConnected.value = false;
    appendOutput(t('ssh.connectionClosed') + '\n');
    ws.value = null;
  };
}

function disconnectWebSSH() {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
}

function sendCommand() {
  if (!ws.value || !isConnected.value || !terminalInput.value) return;
  ws.value.send(terminalInput.value + '\n');
  appendOutput(`${terminalInput.value}\n`);
  terminalInput.value = '';
}

function appendOutput(text: string) {
  terminalOutput.value += text;
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
    }
  });
}

function insertLabel(content: string) {
  terminalInput.value += content;
}

function handleKeydown(e: Event | KeyboardEvent) {
  const ke = e as KeyboardEvent;
  if (ke.key === 'Enter') {
    ke.preventDefault();
    sendCommand();
  }
}

// ============ SSH 标签方法 ============

async function loadLabels() {
  labelLoading.value = true;
  try {
    const result = await listSSHLabels();
    labelList.value = result;
  } catch (e) {
    console.error('[SSH] load labels failed:', e);
  } finally {
    labelLoading.value = false;
  }
}

function openAddLabel() {
  isEditLabel.value = false;
  labelForm.id = 0;
  labelForm.name = '';
  labelForm.content = '';
  labelDialogVisible.value = true;
}

function openEditLabel(row: SSHLabel) {
  isEditLabel.value = true;
  labelForm.id = row.id;
  labelForm.name = row.name ?? '';
  labelForm.content = row.content ?? '';
  labelDialogVisible.value = true;
}

async function saveLabel() {
  if (!labelForm.name || !labelForm.content) {
    ElMessage.warning(t('ssh.inputNameAndContent'));
    return;
  }
  try {
    if (isEditLabel.value) {
      await updateSSHLabel({ id: labelForm.id, name: labelForm.name, content: labelForm.content });
      ElMessage.success(t('ssh.updateSuccess'));
    } else {
      await addSSHLabel({ name: labelForm.name, content: labelForm.content });
      ElMessage.success(t('ssh.addSuccess'));
    }
    labelDialogVisible.value = false;
    loadLabels();
  } catch (e) {
    console.error('[SSH] save label failed:', e);
  }
}

async function handleDeleteLabel(row: SSHLabel) {
  try {
    await ElMessageBox.confirm(t('ssh.deleteLabelConfirm', { name: row.name }), t('ssh.deleteConfirmTitle'), { type: 'warning' });
    await deleteSSHLabel({ id: row.id });
    ElMessage.success(t('common.deleteSuccess'));
    loadLabels();
  } catch (e) {
    if (e !== 'cancel') console.error('[SSH] delete label failed:', e);
  }
}

// ============ SSH 访问定时器方法 ============

async function loadTimers() {
  timerLoading.value = true;
  try {
    const result = await listSSHAccessTimers({
      page: timerQuery.page,
      pageSize: timerQuery.pageSize,
      elementId: timerQuery.elementId ? Number(timerQuery.elementId) : undefined,
    });
    timerList.value = result;
    timerTotal.value = result.length;
  } catch (e) {
    console.error('[SSH] load timers failed:', e);
  } finally {
    timerLoading.value = false;
  }
}

function handleTimerSearch() {
  timerQuery.page = 1;
  loadTimers();
}

function handleTimerReset() {
  timerQuery.elementId = '';
  timerQuery.page = 1;
  loadTimers();
}

function openTimerDialog() {
  timerForm.elementIds = '';
  timerForm.deadline = 3600;
  timerDialogVisible.value = true;
}

async function saveTimer() {
  if (!timerForm.elementIds) {
    ElMessage.warning(t('ssh.inputDeviceId'));
    return;
  }
  try {
    const ids = timerForm.elementIds.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
    await setSSHAccessTimer({
      elementIds: ids,
      deviceGroupIds: [],
      deadline: timerForm.deadline,
    });
    ElMessage.success(t('ssh.setSuccess'));
    timerDialogVisible.value = false;
    loadTimers();
  } catch (e) {
    console.error('[SSH] save timer failed:', e);
  }
}

function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

onMounted(() => {
  loadLabels();
  loadTimers();
});

onUnmounted(() => {
  disconnectWebSSH();
});
</script>

<template>
  <div class="ssh-management-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- WebSSH 终端 -->
      <el-tab-pane :label="t('ssh.websshTerminal')" name="terminal">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true">
            <el-form-item :label="t('ssh.host')">
              <el-input v-model="connectForm.host" :placeholder="t('ssh.hostPlaceholder')" style="width: 150px" :disabled="isConnected" />
            </el-form-item>
            <el-form-item :label="t('ssh.port')">
              <el-input-number v-model="connectForm.port" :min="1" :max="65535" style="width: 100px" :disabled="isConnected" />
            </el-form-item>
            <el-form-item :label="t('ssh.username')">
              <el-input v-model="connectForm.username" :placeholder="t('ssh.usernamePlaceholder')" style="width: 120px" :disabled="isConnected" />
            </el-form-item>
            <el-form-item :label="t('ssh.password')">
              <el-input v-model="connectForm.password" type="password" :placeholder="t('ssh.passwordPlaceholder')" style="width: 120px" :disabled="isConnected" show-password />
            </el-form-item>
            <el-form-item>
              <el-button v-if="!isConnected" type="primary" :icon="Connection" @click="connectWebSSH">{{ t('ssh.connect') }}</el-button>
              <el-button v-else type="danger" @click="disconnectWebSSH">{{ t('ssh.disconnect') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 终端输出 -->
        <el-card shadow="never" :body-style="{ padding: '0' }">
          <pre ref="terminalRef" class="terminal-output">{{ terminalOutput }}</pre>
          <div class="terminal-input-line">
            <span class="terminal-prompt">$</span>
            <el-input
              v-model="terminalInput"
              class="terminal-input"
              :placeholder="t('ssh.enterCommand')"
              :disabled="!isConnected"
              @keydown="handleKeydown"
            />
            <el-button :disabled="!isConnected" type="primary" size="small" @click="sendCommand">{{ t('ssh.send') }}</el-button>
          </div>
        </el-card>

        <!-- 快速标签 -->
        <el-card v-if="labelList.length > 0" shadow="never" :body-style="{ padding: '12px' }">
          <div class="label-tags">
            <span class="label-tags__title">{{ t('ssh.fastInsert') }}</span>
            <el-tag
              v-for="label in labelList"
              :key="label.id"
              class="label-tag"
              size="small"
              @click="insertLabel(label.content ?? '')"
            >
              {{ label.name }}
            </el-tag>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- SSH 标签 -->
      <el-tab-pane :label="t('ssh.sshLabels')" name="labels">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-button type="success" :icon="Plus" @click="openAddLabel">{{ t('ssh.addLabel') }}</el-button>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="labelLoading" :data="labelList" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" :label="t('ssh.name')" min-width="150" />
            <el-table-column prop="content" :label="t('ssh.content')" min-width="300" show-overflow-tooltip />
            <el-table-column :label="t('common.actions')" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditLabel(row as SSHLabel)">
                  <Edit /> {{ t('common.edit') }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteLabel(row as SSHLabel)">
                  <Delete /> {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- SSH 访问定时器 -->
      <el-tab-pane :label="t('ssh.sshAccessTimer')" name="timers">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleTimerSearch">
            <el-form-item :label="t('ssh.deviceId')">
              <el-input v-model="timerQuery.elementId" :placeholder="t('ssh.deviceIdPlaceholder')" clearable style="width: 120px" @keyup.enter="handleTimerSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleTimerSearch">{{ t('common.search') }}</el-button>
              <el-button :icon="Refresh" @click="handleTimerReset">{{ t('common.reset') }}</el-button>
              <el-button type="success" :icon="Timer" @click="openTimerDialog">{{ t('ssh.setTimer') }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="timerLoading" :data="timerList" stripe border style="width: 100%">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="deviceName" :label="t('ssh.deviceName')" min-width="140" />
            <el-table-column prop="serialNumber" :label="t('ssh.serialNumber')" min-width="140" />
            <el-table-column prop="sshStatus" :label="t('ssh.sshStatus')" width="100" />
            <el-table-column prop="deadline" :label="t('ssh.deadline')" min-width="160">
              <template #default="{ row }">{{ formatTime(row.deadline) }}</template>
            </el-table-column>
            <el-table-column prop="tenancyName" :label="t('ssh.tenancy')" width="120" />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="timerQuery.page"
              v-model:page-size="timerQuery.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="timerTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="timerQuery.pageSize = $event; timerQuery.page = 1; loadTimers()"
              @current-change="timerQuery.page = $event; loadTimers()"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 标签弹窗 -->
    <el-dialog v-model="labelDialogVisible" :title="isEditLabel ? t('ssh.editLabel') : t('ssh.addLabel')" width="400px">
      <el-form label-width="80px">
        <el-form-item :label="t('ssh.name')">
          <el-input v-model="labelForm.name" :placeholder="t('ssh.labelName')" />
        </el-form-item>
        <el-form-item :label="t('ssh.content')">
          <el-input v-model="labelForm.content" type="textarea" :rows="4" :placeholder="t('ssh.labelContent')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="labelDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveLabel">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 定时器弹窗 -->
    <el-dialog v-model="timerDialogVisible" :title="t('ssh.setAccessTimer')" width="400px">
      <el-form label-width="100px">
        <el-form-item :label="t('ssh.deviceId')">
          <el-input v-model="timerForm.elementIds" :placeholder="t('ssh.multipleIdsHint')" />
        </el-form-item>
        <el-form-item :label="t('ssh.duration')">
          <el-input-number v-model="timerForm.deadline" :min="60" :step="60" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="timerDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveTimer">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.ssh-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.terminal-output {
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 12px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
}

.terminal-prompt {
  color: #4caf50;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.terminal-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    background-color: #2d2d2d;
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    color: #d4d4d4;
    font-family: 'Courier New', monospace;
  }
}

.label-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.label-tags__title {
  font-size: 13px;
  color: var(--text-secondary);
}

.label-tag {
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>

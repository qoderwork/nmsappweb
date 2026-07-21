/**
 * WebSocket 消息处理 composable
 *
 * 用于在组件中监听 WebSocket 消息，处理各类业务推送
 */
import { watch, onUnmounted, type Ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useWebSocketStore } from '@/stores/websocket';
import type { WsMessage } from '@/types';

/** WebSocket topic 定义 */
export const WsTopics = {
  /** 告警推送 */
  ALARM: 'alarm',
  /** 设备状态变更 */
  DEVICE_STATUS: 'device_status',
  /** MML 命令结果 */
  MML_RESULT: 'mml_result',
  /** 诊断结果 */
  DIAGNOSTICS_RESULT: 'diagnostics_result',
  /** 文件下载 */
  DOWNLOAD_FILE: 'download_file',
  /** 系统通知 */
  SYSTEM_NOTICE: 'system_notice',
} as const;

type WsTopic = (typeof WsTopics)[keyof typeof WsTopics];

/** 告警推送消息 */
export interface AlarmPushMessage {
  id: number;
  alarmId: string;
  alarmName: string;
  alarmLevel: number;
  alarmStatus: number;
  deviceName: string;
  serialNumber: string;
  createTime: string;
}

/** 设备状态变更消息 */
export interface DeviceStatusMessage {
  deviceId: number;
  deviceName: string;
  serialNumber: string;
  status: 'online' | 'offline';
  previousStatus: 'online' | 'offline';
}

/** MML 结果消息 */
export interface MmlResultMessage {
  taskId: number;
  deviceName: string;
  command: string;
  result: string;
  success: boolean;
}

/** 诊断结果消息 */
export interface DiagnosticsResultMessage {
  taskId: number;
  deviceName: string;
  taskType: string;
  result: string;
  success: boolean;
}

/** 文件下载消息 */
export interface DownloadFileMessage {
  fileId: string;
  fileName: string;
  fileType: string;
  downloadUrl: string;
}

/**
 * 使用 WebSocket 消息监听
 * @param topics 要订阅的 topic 列表
 * @param handler 消息处理回调
 */
export function useWebSocketMessage(
  topics: WsTopic[],
  handler: (msg: WsMessage) => void
) {
  const wsStore = useWebSocketStore();

  // 订阅主题
  topics.forEach((topic) => {
    wsStore.subscribe(topic);
  });

  // 监听消息
  const stopWatch = watch(
    () => wsStore.lastMessage,
    (msg) => {
      if (!msg || !topics.includes(msg.topic as WsTopic)) return;
      handler(msg);
    }
  );

  // 取消订阅
  onUnmounted(() => {
    topics.forEach((topic) => {
      wsStore.unsubscribe(topic);
    });
    stopWatch();
  });

  return {
    connected: wsStore.isConnected,
  };
}

/**
 * 全局 WebSocket 消息处理器
 * 在 AppMain 或 AppLayout 中使用，处理全局消息
 */
export function useGlobalWebSocketHandler() {
  const wsStore = useWebSocketStore();

  // 监听所有消息
  const stopWatch = watch(
    () => wsStore.lastMessage,
    (msg) => {
      if (!msg) return;

      // 确认消息
      if (msg.messageId) {
        wsStore.confirmMessage(msg.messageId);
      }

      // 处理不同类型的消息
      switch (msg.topic) {
        case WsTopics.DOWNLOAD_FILE:
          handleDownloadFile(msg.data as DownloadFileMessage);
          break;
        case WsTopics.ALARM:
          handleAlarmPush(msg.data as AlarmPushMessage);
          break;
        case WsTopics.DEVICE_STATUS:
          handleDeviceStatus(msg.data as DeviceStatusMessage);
          break;
        case WsTopics.MML_RESULT:
          handleMmlResult(msg.data as MmlResultMessage);
          break;
        case WsTopics.DIAGNOSTICS_RESULT:
          handleDiagnosticsResult(msg.data as DiagnosticsResultMessage);
          break;
        case WsTopics.SYSTEM_NOTICE:
          handleSystemNotice(msg.data as { title: string; content: string; type: string });
          break;
      }
    }
  );

  onUnmounted(() => {
    stopWatch();
  });

  return {
    connected: wsStore.isConnected,
  };
}

/** 处理文件下载 */
function handleDownloadFile(data: DownloadFileMessage) {
  if (!data.downloadUrl) return;

  // 创建下载链接
  const link = document.createElement('a');
  link.href = data.downloadUrl;
  link.download = data.fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  ElNotification({
    title: '文件下载',
    message: `文件 ${data.fileName} 已开始下载`,
    type: 'success',
    duration: 3000,
  });
}

/** 处理告警推送 */
function handleAlarmPush(data: AlarmPushMessage) {
  const levelMap: Record<number, string> = {
    1: '紧急',
    2: '重要',
    3: '次要',
    4: '提示',
  };

  const typeMap: Record<number, 'error' | 'warning' | 'info' | 'success'> = {
    1: 'error',
    2: 'warning',
    3: 'info',
    4: 'success',
  };

  ElNotification({
    title: `新告警: ${data.alarmName}`,
    message: `设备 ${data.deviceName} - ${levelMap[data.alarmLevel] || '未知'} 告警`,
    type: typeMap[data.alarmLevel] || 'warning',
    duration: 5000,
    position: 'top-right',
  });
}

/** 处理设备状态变更 */
function handleDeviceStatus(data: DeviceStatusMessage) {
  ElNotification({
    title: '设备状态变更',
    message: `${data.deviceName} ${data.previousStatus === 'online' ? '离线' : '恢复在线'}`,
    type: data.status === 'online' ? 'success' : 'warning',
    duration: 3000,
  });
}

/** 处理 MML 命令结果 */
function handleMmlResult(data: MmlResultMessage) {
  ElNotification({
    title: 'MML 命令执行完成',
    message: `设备 ${data.deviceName} - 命令: ${data.command} - ${data.success ? '成功' : '失败'}`,
    type: data.success ? 'success' : 'error',
    duration: 5000,
  });
}

/** 处理诊断结果 */
function handleDiagnosticsResult(data: DiagnosticsResultMessage) {
  ElNotification({
    title: '诊断任务完成',
    message: `设备 ${data.deviceName} - 类型: ${data.taskType} - ${data.success ? '成功' : '失败'}`,
    type: data.success ? 'success' : 'warning',
    duration: 5000,
  });
}

/** 处理系统通知 */
function handleSystemNotice(data: { title: string; content: string; type: string }) {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
    success: 'success',
    warning: 'warning',
    info: 'info',
    error: 'error',
  };

  ElNotification({
    title: data.title || '系统通知',
    message: data.content,
    type: typeMap[data.type] || 'info',
    duration: 5000,
  });
}

/**
 * 在组件中监听告警推送
 */
export function useAlarmPush(onAlarm: (alarm: AlarmPushMessage) => void) {
  return useWebSocketMessage([WsTopics.ALARM], (msg) => {
    onAlarm(msg.data as AlarmPushMessage);
  });
}

/**
 * 在组件中监听设备状态变更
 */
export function useDeviceStatusPush(onChange: (data: DeviceStatusMessage) => void) {
  return useWebSocketMessage([WsTopics.DEVICE_STATUS], (msg) => {
    onChange(msg.data as DeviceStatusMessage);
  });
}

/**
 * 在组件中监听 MML 结果
 */
export function useMmlResultPush(onResult: (data: MmlResultMessage) => void) {
  return useWebSocketMessage([WsTopics.MML_RESULT], (msg) => {
    onResult(msg.data as MmlResultMessage);
  });
}

/**
 * 在组件中监听诊断结果
 */
export function useDiagnosticsResultPush(onResult: (data: DiagnosticsResultMessage) => void) {
  return useWebSocketMessage([WsTopics.DIAGNOSTICS_RESULT], (msg) => {
    onResult(msg.data as DiagnosticsResultMessage);
  });
}
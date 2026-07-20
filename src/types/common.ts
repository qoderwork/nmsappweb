/**
 * 通用业务类型定义
 */



/** WebSocket 消息载体 */
export interface WsMessage<T = unknown> {
  /** 消息类型：subscribe / unsubscribe / heartbeat / confirm / data */
  type: string;
  /** 消息 ID（用于确认机制） */
  messageId?: string;
  /** 主题（订阅/取消订阅时使用） */
  topic?: string;
  /** 业务数据 */
  data?: T;
  /** 时间戳（ms） */
  timestamp?: number;
}

/** WebSocket 订阅主题 */
export interface WsTopic {
  /** 主题名称 */
  name: string;
  /** 描述 */
  description?: string;
}

/** WebSocket 缓存消息 */
export interface WsCachedMessage<T = unknown> extends WsMessage<T> {
  /** 已重试次数 */
  retriedTimes: number;
  /** 生成时间（ms） */
  generatedTime: number;
  /** 上次发送时间（ms） */
  lastSendTime: number;
}

/** WebSSH 操作类型 */
export type WebSSHOperate = 'connect' | 'command' | 'resize' | 'disconnect';

/** WebSSH 消息 */
export interface WebSSHMessage {
  operate: WebSSHOperate;
  /** 终端 ID */
  sessionId?: string;
  /** 命令内容（operate=command 时使用） */
  command?: string;
  /** 列数（operate=resize/connect 时使用） */
  cols?: number;
  /** 行数（operate=resize/connect 时使用） */
  rows?: number;
  /** 主机信息（operate=connect 时使用） */
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  /** 输出内容（服务端响应时使用） */
  output?: string;
  /** 错误信息 */
  error?: string;
}

/** 系统设置项 */
export interface SystemSetting {
  key: string;
  value: string;
  label?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
}

/** 日志类型 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogItem {
  id: number;
  level: LogLevel;
  module?: string;
  message: string;
  operator?: string;
  ip?: string;
  createTime: string;
}

/** 字典项 */
export interface DictItem {
  dictType: string;
  dictLabel: string;
  dictValue: string;
  sort?: number;
  enabled: boolean;
}

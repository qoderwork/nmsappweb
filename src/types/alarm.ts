/**
 * 告警管理类型定义
 * 对齐 nmsappsrv 后端 internal/alarm/model.go
 */

/** 告警状态 */
export enum AlarmStatus {
  ActiveUnconfirmed = 1,
  HistoryUnconfirmed = 2,
  ActiveConfirmed = 3,
  HistoryConfirmed = 4,
}

/** 告警类型 */
export enum AlarmType {
  Active = 1,
  History = 2,
}

/** 告警严重级别 */
export type AlarmSeverity = 'Critical' | 'Major' | 'Minor' | 'Warning' | 'Info';

/** 告警实体（对齐 Alarm） */
export interface Alarm {
  id: number;
  severity?: AlarmSeverity | null;
  alarmIdentifier?: string | null;
  probableCause?: string | null;
  alarmSource?: string | null;
  networkElement?: string | null;
  eventType?: string | null;
  alarmStatus?: AlarmStatus | null;
  alarmType?: AlarmType | null;
  eventTime?: string | null;
  updateTime?: string | null;
  clearedTime?: string | null;
  specificProblem?: string | null;
  alarmId?: string | null;
  elementId?: number | null;
  tenantId?: number | null;
  createTime?: string | null;
  additionalInformation?: string | null;
  alarmTemplateId?: number | null;
  clearUser?: string | null;
  isSuppressed?: boolean | null;
  suppressionReason?: string | null;
  comment?: string | null;
  exported?: boolean | null;
  handleSuggestion?: string | null;
}

/** 告警查询参数 */
export interface AlarmQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  alarmType?: AlarmType;
  alarmStatus?: AlarmStatus;
  severity?: AlarmSeverity;
  startTime?: string;
  endTime?: string;
  networkElement?: string;
  alarmIdentifier?: string;
  [key: string]: unknown;
}

/** 告警统计结果 */
export interface AlarmStatisticResult {
  totalCount: number;
  activeCount: number;
  historyCount: number;
  bySeverity: Record<string, number>;
  byAlarmType: Record<string, number>;
  bySource: Record<string, number>;
}

/** 严重级别统计 */
export interface SeverityCount {
  severity: string;
  alarmCount: number;
}

/** 告警统计 TopN */
export interface AlarmStatisticTopN {
  alarmIdentifier: string;
  alarmCount: number;
}

/** 告警库 */
export interface AlarmLibrary {
  id: number;
  alarmIdentifier?: string | null;
  probableCause?: string | null;
  severity?: AlarmSeverity | null;
  eventType?: string | null;
  explanation?: string | null;
  specificProblem?: string | null;
  tenantId?: number | null;
  alarmSource?: string | null;
}

/** 告警模板 */
export interface AlarmTemplate {
  id: number;
  tenantId?: number | null;
  name?: string | null;
  description?: string | null;
  executeOnAllBaseStation?: boolean | null;
  executeOnAllCPE?: boolean | null;
  baseStationIds?: string | null;
  cpeIds?: string | null;
  baseStationDeviceGroupIds?: string | null;
  cpeDeviceGroupIds?: string | null;
  executeOnAllAlarm?: boolean | null;
  alarmIds?: string | null;
  enableEmailNotification?: boolean | null;
  toleranceDuration?: number | null;
  interval?: number | null;
  enableNotifyDefaultRecipients?: boolean | null;
  alarmSources?: string | null;
  emails?: string | null;
  lastSendEmailDate?: string | null;
}

/** 告警过滤器 */
export interface AlarmFilter {
  id: number;
  filterRuleName?: string | null;
  enable?: boolean | null;
  executionAction?: number | null;
  alarmSources?: string | null;
  executeOnAllBaseStation?: boolean | null;
  executeOnAllCPE?: boolean | null;
  executionOnAllAlarm?: boolean | null;
  startTime?: string | null;
  endTime?: string | null;
  tenantId?: number | null;
  user?: string | null;
  updateTime?: string | null;
  baseStationIds?: string | null;
  cpeIds?: string | null;
  baseStationDeviceGroupIds?: string | null;
  cpeDeviceGroupIds?: string | null;
  alarmIds?: string | null;
}

/** 告警同步配置 */
export interface AlarmSyncConfig {
  enabled?: boolean;
  syncInterval?: number;
  sourceAddress?: string;
  lastSyncTime?: string;
}

/** 邮件通知配置 */
export interface EmailNotificationConfig {
  enabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  recipients: string[];
}

/** 添加评论请求 */
export interface AddCommentRequest {
  comment: string;
}
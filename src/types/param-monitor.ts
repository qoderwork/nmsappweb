/**
 * 参数监控相关类型定义
 * 对齐 nmsappsrv 后端 parammonitor/model.go
 */

/** 参数监控配置 */
export interface ParameterMonitorConfig {
  id: number;
  name: string;
  element_id: number;
  parameter_names?: string;
  interval?: number | null;
  enabled?: boolean | undefined;
}

/** 监控配置列表项 */
export interface MonitorConfigVo {
  id: number;
  name: string;
  element_id: number;
  interval?: number | null;
  enabled?: boolean | undefined;
  parameter_count?: number | null;
}

/** 阈值规则 */
export interface ThresholdRule {
  id: number;
  name: string;
  element_id: number;
  parameter_name?: string | null;
  operator?: '>' | '<' | '=' | '>=' | '<=' | null;
  threshold_value?: number | null;
  enabled?: boolean | undefined;
}

/** 实时监控数据 */
export interface RealtimeMonitorDataVo {
  parameter_name: string;
  value?: string | null;
  unit?: string | null;
  timestamp?: string | null;
}

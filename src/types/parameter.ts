/**
 * 参数管理相关类型定义
 * 对齐 nmsappsrv 后端 parameter/model.go
 */

/** 参数模板 */
export interface ParameterTemplate {
  id: number;
  name: string;
  description?: string | null;
  scope: 'device' | 'deviceGroup';
  device_group_ids?: string;
  parameter_json?: string;
}

/** 参数集 */
export interface ParameterSet {
  id: number;
  name: string;
  description?: string | null;
  parameters?: string;
}

/** 参数日志 */
export interface ParameterLog {
  id: number;
  element_id: number;
  parameter_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  operation_type?: string | null;
  operation_time?: string | null;
  user?: string | null;
}

/** 参数备份日志 */
export interface ParameterBackupLog {
  id: number;
  element_id: number;
  backup_time?: string | null;
  file_path?: string | null;
  status?: string | null;
}

/** 批量配置任务 */
export interface BatchConfigTaskVo {
  id: number;
  name: string;
  status?: string | null;
  total_count?: number | null;
  success_count?: number | null;
  fail_count?: number | null;
  create_time?: string | null;
}

/** 批量配置详情项 */
export interface BatchConfigDetailItem {
  element_id: number;
  element_name?: string | null;
  status?: string | null;
  message?: string | null;
}

/** 模型树节点 */
export interface ModelTreeNode {
  path: string;
  name: string;
  type: string;
  value?: string | null;
  writable?: boolean | undefined;
  children?: ModelTreeNode[];
}

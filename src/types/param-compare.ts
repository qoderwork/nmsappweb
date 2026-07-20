/**
 * 参数对比相关类型定义
 */

/** 参数对比结果项 */
export interface ParamCompareResult {
  parameter_name: string;
  left_value?: string | null;
  right_value?: string | null;
  is_same: boolean;
}

/** 对比模板 */
export interface ParamCompareTemplate {
  id: number;
  name: string;
}

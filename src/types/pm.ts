/**
 * PM 性能管理类型定义
 * 对齐 nmsappsrv 后端 internal/pm/model.go
 */

/** PM KPI 实体 */
export interface PMKpi {
  id: number;
  name: string;
  description?: string | null;
  type?: string | null;
  formula?: string | null;
  unit?: string | null;
  granularity?: string | null;
  status?: boolean | undefined;
  createTime?: string | null;
  updateTime?: string | null;
}

/** PM 模板实体 */
export interface PMTemplate {
  id: number;
  name: string;
  description?: string | null;
  kpiIds?: number[] | null;
  granularity?: string | null;
  status?: boolean | undefined;
  createTime?: string | null;
  updateTime?: string | null;
}

/** PM 文件日志实体 */
export interface PMFileLog {
  id: number;
  elementId: number;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadTime?: string | null;
  status?: string | null;
}

/** PM KPI 查询参数 */
export interface PMKpiQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  status?: boolean;
  [key: string]: unknown;
}

/** PM 模板查询参数 */
export interface PMTemplateQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: boolean;
  [key: string]: unknown;
}

/** PM 文件日志查询参数 */
export interface PMFileLogQueryParams {
  page?: number;
  pageSize?: number;
  elementId?: number;
  status?: string;
  [key: string]: unknown;
}

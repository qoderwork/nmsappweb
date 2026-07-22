/**
 * ZTP (Zero Touch Provisioning) API
 *
 * 对齐 nmsappsrv 后端（重写自 Java nms-serv AOSManagementController）：
 *   - ZTP 结果查询 / 日志 / 配置 / 重试日志 / 历史文件 / 状态 / 批量重开 / 删除文件
 *   - TBG 管理（CRUD + 导入 + 模板下载）
 *   - PSAP-ID 管理（列表 + 同步 + 同步日志）
 *   - Spatial File（市场列表 + 市场坐标）
 *
 * 说明（与老前端/Java 的差异，以 Go 后端为准）：
 *   - 进度 progress 为整数枚举 0-7（参考 Java ZTP 进度）
 *   - 结果 result 为字符串（SUCCESS / FAILED ...），筛选时传整数 1=成功 2=失败
 *   - 状态 status 为字符串 enable / disable
 *   - serialNumbers 以逗号拼接的字符串传递
 *   - 分页响应体为 { list, total, page, pageSize }
 */

import { http } from '@/utils/request';

/* ============ 通用分页响应 ============ */
export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ============ ZTP 配置 ============ */
/** ZTP 配置（GET /ztp/setting / POST /ztp/setting），对齐 Go ZTPSetting */
export interface ZTPSetting {
  gnbIdStart?: number | null;
  gnbIdEnd?: number | null;
  tacStart?: number | null;
  tacEnd?: number | null;
  googleAPIKey?: string | null;
  radiusThreshold?: number | null;
  ztpTimeoutTime?: number | null;
  ptpEnable?: boolean | null;
  spectrumSpatialUrl?: string | null;
  msagUrl?: string | null;
  bmcUrl?: string | null;
  bmcNewApi?: boolean | null;
  lmfUrls?: string[] | null;
  gmlcUrl?: string | null;
  tPlatformUrl?: string | null;
  wifiPositioning?: boolean | null;
  sftpUsername?: string | null;
  sftpPassword?: string | null;
  [key: string]: unknown;
}

/* ============ ZTP 结果 ============ */
/** 查询请求（POST /ztp/results） */
export interface ZTPResultQuery {
  searchText?: string;
  /** 整数枚举 0-7，传 undefined 表示全部 */
  progress?: number;
  /** 1=成功 2=失败，传 undefined 表示全部 */
  result?: number;
  /** 逗号拼接的序列号 */
  serialNumbers?: string;
  /** null=全部, false=进行中, true=成功 */
  succeed?: boolean | null;
  deviceGroupId?: string;
  page: number;
  pageSize: number;
}

/** 结果行（Go ZTPResultVo） */
export interface ZTPResultVo {
  elementId: number;
  deviceName: string;
  serialNumber: string;
  /** 整数枚举 0-7 */
  progress: number | null;
  info: string;
  /** 字符串：SUCCESS / FAILED ... */
  result: string;
  ztpFileName: string;
  tenancyName: string;
  startTime: string;
  endTime: string;
  /** 字符串：enable / disable */
  status: string;
  currentProgress: number;
  mode: string;
  mac: string;
}

/** ZTP 日志（GET /ztp/logs） */
export interface ZTPLog {
  id: number;
  elementId: number | null;
  progress: number | null;
  done: boolean | null;
  info: string | null;
  start_time: string | null;
  end_time: string | null;
  has_fault: boolean | null;
}

/** ZTP 重试日志（POST /ztp/retry-logs） */
export interface ZTPRetryLogVo {
  operationDate: string;
  message: string;
}

/** ZTP 历史文件（POST /ztp/history-files） */
export interface HistoryZTPFileVo {
  id: number;
  elementId: number;
  neName: string;
  fileName: string;
  generateTime: string;
}

/* ============ ZTP 操作 ============ */
/** 设置状态（POST /ztp/status） */
export interface ZTPStatusRequest {
  elementIds: number[];
  /** enable / disable */
  status: string;
}

/** 批量重开（POST /ztp/batch-reztp） */
export interface ZTPBatchReztpRequest {
  scope: 'element' | 'deviceGroup' | 'market';
  elementIds?: number[];
  deviceGroupIds?: string[];
  markets?: string[];
}

/** 删除文件（POST /ztp/delete-files） */
export interface DeleteZTPFileRequest {
  elementIds: number[];
}

/* ============ TBG ============ */
export interface TBG {
  id: number;
  name: string | null;
  ip: string | null;
  port: number | null;
  tenantId?: number | null;
  createTime?: string | null;
  updateTime?: string | null;
}

export interface TBGListQuery {
  name?: string;
  page: number;
  pageSize: number;
}

export interface TBGAddRequest {
  name: string;
  ip: string;
  port: number;
}

export interface TBGModifyRequest {
  id: number;
  name?: string;
  ip?: string;
  port?: number;
}

export interface TBGDeleteRequest {
  ids: number[];
}

/* ============ PSAP-ID ============ */
export interface PSAPID {
  id: number;
  psap_id: string | null;
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  tenantId?: number | null;
  createTime?: string | null;
}

export interface PSAPIDListQuery {
  psapId?: string;
  page: number;
  pageSize: number;
}

export interface PSAPIDSyncRequest {
  tenantId: number;
}

export interface PSAPIDSyncLog {
  id: number;
  operator: string | null;
  status: number | null;
  detail: string | null;
  createTime: string | null;
}

/* ============ Spatial File ============ */
export interface SpatialFileMarket {
  id: number;
  name: string | null;
  code: string | null;
  tenantId?: number | null;
}

/* ============ ZTP 结果 API ============ */
export function getZTPResults(data: ZTPResultQuery) {
  return http.post<PageData<ZTPResultVo>, ZTPResultQuery>('/ztp/results', data);
}

export function getZTPLogs(elementId: number) {
  return http.get<ZTPLog[]>('/ztp/logs', { params: { element_id: elementId } });
}

export function getZTPRetryLogs(elementId: number) {
  return http.post<ZTPRetryLogVo[], { elementId: number }>('/ztp/retry-logs', { elementId });
}

export function getZTPHistoryFiles(data: { elementId: number; page: number; pageSize: number }) {
  return http.post<PageData<HistoryZTPFileVo>, typeof data>('/ztp/history-files', data);
}

export function getZTPSetting() {
  return http.get<ZTPSetting>('/ztp/setting');
}

export function saveZTPSetting(data: ZTPSetting) {
  return http.post<ZTPSetting, ZTPSetting>('/ztp/setting', data);
}

export function setZTPStatus(data: ZTPStatusRequest) {
  return http.post<void, ZTPStatusRequest>('/ztp/status', data);
}

export function batchReztp(data: ZTPBatchReztpRequest) {
  return http.post<void, ZTPBatchReztpRequest>('/ztp/batch-reztp', data);
}

export function deleteZTPFiles(elementIds: number[]) {
  return http.post<void, DeleteZTPFileRequest>('/ztp/delete-files', { elementIds });
}

/* ============ TBG API ============ */
export function getTBGList(data: TBGListQuery) {
  return http.post<PageData<TBG>, TBGListQuery>('/tbg/list', data);
}

export function addTBG(data: TBGAddRequest) {
  return http.post<TBG, TBGAddRequest>('/tbg/add', data);
}

export function modifyTBG(data: TBGModifyRequest) {
  return http.post<void, TBGModifyRequest>('/tbg/modify', data);
}

export function deleteTBG(ids: number[]) {
  return http.post<void, TBGDeleteRequest>('/tbg/delete', { ids });
}

export function importTBG(file: File) {
  return http.upload<{ count?: number }>('/tbg/import', file);
}

export function downloadTBGTemplate() {
  return http.download('/tbg/template', { filename: 'TBGTemplate.xlsx' });
}

/* ============ PSAP-ID API ============ */
export function getPSAPIDList(data: PSAPIDListQuery) {
  return http.post<PageData<PSAPID>, PSAPIDListQuery>('/psap-id/list', data);
}

export function syncPSAPID(data: PSAPIDSyncRequest) {
  return http.post<{ count?: number }, PSAPIDSyncRequest>('/psap-id/sync', data);
}

export function getPSAPIDSyncLogs(data: { page: number; pageSize: number }) {
  return http.post<PageData<PSAPIDSyncLog>, typeof data>('/psap-id/sync-logs', data);
}

/* ============ Spatial File API ============ */
export function getSpatialFileMarkets() {
  return http.get<SpatialFileMarket[]>('/spatial-file/markets');
}

export function getMarketCoordinates(marketId: number) {
  return http.post<unknown[], { marketId: number }>('/spatial-file/market-coordinates', { marketId });
}

/* ============ AOS Operations (nr aos import / download / geofence / progress) ============ */

/** AOS 任务进度 VO */
export interface AOSTaskProgressVO {
  complete: boolean;
  currentProgress: number;
  totalProgress: number;
  message: string;
  hasFault: boolean;
}

/** AOS import 返回 */
export interface AOSImportResult {
  taskId: string;
  count: number;
}

/** 下载 ZTP 模板（GET /aos/template） */
export function downloadZTPTemplate() {
  return http.download('/aos/template', { filename: 'ZTP_Template.xlsm' });
}

/** 导入 NR AOS 文件（POST /aos/import, multipart） */
export function importNrAOSFile(file: File) {
  return http.upload<AOSImportResult>('/aos/import', file);
}

/** 下载设备 AOS 文件（POST /aos/download, blob 响应） */
export function downloadAOSFile(elementId: number) {
  return http.post<Blob, { elementId: number }>('/aos/download', { elementId }, { responseType: 'blob' });
}

/** 下载历史 ZTP 文件（POST /aos/download-history, blob 响应） */
export function downloadHistoryZTPFile(id: number) {
  return http.post<Blob, { id: number }>('/aos/download-history', { id }, { responseType: 'blob' });
}

/** 查询 AOS 任务进度（POST /aos/generate-progress） */
export function getAOSTaskProgress(taskId: string) {
  return http.post<AOSTaskProgressVO, { id: string }>('/aos/generate-progress', { id: taskId });
}

/** 更新 TBG geofence 开关（POST /aos/update-geofence） */
export function updateEnableGeofence(tbgId: number, enableGeofence: number) {
  return http.post<void, { id: number; enableGeofence: number }>('/aos/update-geofence', { id: tbgId, enableGeofence });
}

/**
 * ZTP (Zero Touch Provisioning) API
 *
 * 对齐 nmsappsrv 后端：
 * - ZTP 开通、日志、配置、结果查询、重试、历史文件、状态管理、批量重开
 * - TBG 管理（CRUD + 导入 + 模板下载）
 * - PSAP-ID 管理（列表 + 同步 + 同步日志）
 * - Spatial File（市场列表 + 坐标查询）
 * - 北向报告（CRUD）
 * - RADIUS（CRUD）
 */

import { http } from '@/utils/request';

/* ============ ZTP 类型定义 ============ */

/** ZTP 开通请求 */
export interface ZTPProvisionRequest {
  elementIds: number[];
  operationUser?: string;
}

/** ZTP 开通响应 */
export interface ZTPProvisionResponse {
  enqueued: number;
  total: number;
}

/** ZTP 日志 */
export interface ZTPLog {
  id: number;
  elementId: number;
  step: string;
  status: string;
  message: string;
  timestamp: string;
}

/** ZTP 配置 */
export interface ZTPSetting {
  id?: number;
  enable: boolean;
  tbgServerId?: number;
  provisionTimeout?: number;
  retryCount?: number;
  retryInterval?: number;
  [key: string]: unknown;
}

/** ZTP 结果查询请求 */
export interface ZTPResultQuery {
  searchText?: string;
  progress?: string;
  result?: string;
  serialNumbers?: string[];
  succeed?: boolean;
  deviceGroupId?: number;
  page: number;
  pageSize: number;
}

/** ZTP 结果 VO */
export interface ZTPResultVo {
  id: number;
  elementId: number;
  elementName: string;
  serialNumber: string;
  progress: string;
  result: string;
  succeed: boolean;
  deviceGroupId?: number;
  deviceGroupName?: string;
  startTime: string;
  endTime?: string;
  message?: string;
}

/** ZTP 重试日志 VO */
export interface ZTPRetryLogVo {
  id: number;
  elementId: number;
  retryCount: number;
  status: string;
  message: string;
  timestamp: string;
}

/** ZTP 历史文件 VO */
export interface HistoryZTPFileVo {
  id: number;
  elementId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
}

/** ZTP 状态请求 */
export interface ZTPStatusRequest {
  elementIds: number[];
  status: 'enable' | 'disable';
}

/** ZTP 批量重开请求 */
export interface ZTPBatchReztpRequest {
  scope: 'element' | 'deviceGroup' | 'market';
  elementIds?: number[];
  deviceGroupIds?: number[];
  markets?: string[];
}

/* ============ TBG 类型定义 ============ */

/** TBG 服务器 */
export interface TBG {
  id: number;
  name: string;
  ip: string;
  port: number;
  createTime?: string;
  updateTime?: string;
}

/** TBG 列表查询 */
export interface TBGListQuery {
  name?: string;
  page: number;
  pageSize: number;
}

/** TBG 新增请求 */
export interface TBGAddRequest {
  name: string;
  ip: string;
  port: number;
}

/** TBG 修改请求 */
export interface TBGModifyRequest {
  id: number;
  name?: string;
  ip?: string;
  port?: number;
}

/* ============ PSAP-ID 类型定义 ============ */

/** PSAP-ID */
export interface PSAPID {
  id: number;
  psapId: string;
  latitude?: number;
  longitude?: number;
  marketId?: number;
  [key: string]: unknown;
}

/** PSAP-ID 列表查询 */
export interface PSAPIDListQuery {
  psapId?: string;
  page: number;
  pageSize: number;
}

/** PSAP-ID 同步请求 */
export interface PSAPIDSyncRequest {
  licenseId: number;
}

/** PSAP-ID 同步日志 */
export interface PSAPIDSyncLog {
  id: number;
  licenseId: number;
  count: number;
  status: string;
  message?: string;
  syncTime: string;
}

/* ============ Spatial File 类型定义 ============ */

/** Spatial File 市场 */
export interface SpatialFileMarket {
  id: number;
  name: string;
  region?: string;
  [key: string]: unknown;
}

/* ============ 北向报告类型定义 ============ */

/** 北向报告 */
export interface NorthReport {
  id?: number;
  name: string;
  type?: string;
  schedule?: string;
  enabled?: boolean;
  description?: string;
  [key: string]: unknown;
}

/* ============ RADIUS 类型定义 ============ */

/** RADIUS 服务器 */
export interface Radius {
  id?: number;
  name: string;
  ip: string;
  port: number;
  secret: string;
  [key: string]: unknown;
}

/* ============ 通用分页响应 ============ */

/** POST 分页响应（data 部分） */
export interface PostPageData<T> {
  total: number;
  list: T[];
}

/* ============ ZTP API ============ */

/** ZTP 开通 */
export function provisionZTP(data: ZTPProvisionRequest) {
  return http.post<ZTPProvisionResponse, ZTPProvisionRequest>('/ztp/provision', data);
}

/** 获取 ZTP 日志 */
export function getZTPLogs(elementId: number) {
  return http.get<ZTPLog[]>('/ztp/logs', { params: { element_id: elementId } });
}

/** 获取 ZTP 配置 */
export function getZTPSetting() {
  return http.get<ZTPSetting>('/ztp/setting');
}

/** 保存 ZTP 配置 */
export function saveZTPSetting(data: ZTPSetting) {
  return http.post<ZTPSetting, ZTPSetting>('/ztp/setting', data);
}

/** 查询 ZTP 结果（分页） */
export function getZTPResults(data: ZTPResultQuery) {
  return http.post<PostPageData<ZTPResultVo>, ZTPResultQuery>('/ztp/results', data);
}

/** 获取 ZTP 重试日志 */
export function getZTPRetryLogs(elementId: number) {
  return http.post<ZTPRetryLogVo[], { elementId: number }>('/ztp/retry-logs', { elementId });
}

/** 获取 ZTP 历史文件（分页） */
export function getZTPHistoryFiles(data: { elementId: number; page: number; pageSize: number }) {
  return http.post<PostPageData<HistoryZTPFileVo>, typeof data>('/ztp/history-files', data);
}

/** 设置 ZTP 状态 */
export function setZTPStatus(data: ZTPStatusRequest) {
  return http.post<void, ZTPStatusRequest>('/ztp/status', data);
}

/** 批量重开 ZTP */
export function batchReztp(data: ZTPBatchReztpRequest) {
  return http.post<void, ZTPBatchReztpRequest>('/ztp/batch-reztp', data);
}

/** 删除 ZTP 文件 */
export function deleteZTPFiles(elementIds: number[]) {
  return http.post<void, { elementIds: number[] }>('/ztp/delete-files', { elementIds });
}

/* ============ TBG API ============ */

/** 获取 TBG 列表（分页） */
export function getTBGList(data: TBGListQuery) {
  return http.post<PostPageData<TBG>, TBGListQuery>('/tbg/list', data);
}

/** 新增 TBG */
export function addTBG(data: TBGAddRequest) {
  return http.post<TBG, TBGAddRequest>('/tbg/add', data);
}

/** 修改 TBG */
export function modifyTBG(data: TBGModifyRequest) {
  return http.post<void, TBGModifyRequest>('/tbg/modify', data);
}

/** 删除 TBG */
export function deleteTBG(ids: number[]) {
  return http.post<void, { ids: number[] }>('/tbg/delete', { ids });
}

/** 导入 TBG */
export function importTBG(file: File) {
  return http.upload<{ count: number }>('/tbg/import', file);
}

/** 下载 TBG 模板 */
export function downloadTBGTemplate() {
  return http.download('/tbg/template', { filename: 'tbg_template.xlsx' });
}

/* ============ PSAP-ID API ============ */

/** 获取 PSAP-ID 列表（分页） */
export function getPSAPIDList(data: PSAPIDListQuery) {
  return http.post<PostPageData<PSAPID>, PSAPIDListQuery>('/psap-id/list', data);
}

/** 同步 PSAP-ID */
export function syncPSAPID(data: PSAPIDSyncRequest) {
  return http.post<{ count: number }, PSAPIDSyncRequest>('/psap-id/sync', data);
}

/** 获取 PSAP-ID 同步日志（分页） */
export function getPSAPIDSyncLogs(data: { page: number; pageSize: number }) {
  return http.post<PostPageData<PSAPIDSyncLog>, typeof data>('/psap-id/sync-logs', data);
}

/* ============ Spatial File API ============ */

/** 获取 Spatial File 市场列表 */
export function getSpatialFileMarkets() {
  return http.get<SpatialFileMarket[]>('/spatial-file/markets');
}

/** 获取市场坐标 */
export function getMarketCoordinates(marketId: number) {
  return http.post<PSAPID[], { marketId: number }>('/spatial-file/market-coordinates', { marketId });
}

/* ============ 北向报告 API ============ */

/** 获取北向报告列表 */
export function getNorthReports() {
  return http.get<NorthReport[]>('/north-reports');
}

/** 创建北向报告 */
export function createNorthReport(data: NorthReport) {
  return http.post<NorthReport, NorthReport>('/north-reports', data);
}

/** 更新北向报告 */
export function updateNorthReport(id: number, data: NorthReport) {
  return http.put<NorthReport, NorthReport>(`/north-reports/${id}`, data);
}

/** 删除北向报告 */
export function deleteNorthReport(id: number) {
  return http.delete<void>(`/north-reports/${id}`);
}

/* ============ RADIUS API ============ */

/** 获取 RADIUS 列表 */
export function getRadiusList() {
  return http.get<Radius[]>('/radius');
}

/** 创建 RADIUS */
export function createRadius(data: Radius) {
  return http.post<Radius, Radius>('/radius', data);
}

/** 删除 RADIUS */
export function deleteRadius(id: number) {
  return http.delete<void>(`/radius/${id}`);
}

/**
 * 拓扑管理 API
 * 对齐 nmsappsrv 后端 topology/routes.go
 */

import { http } from '@/utils/request';
import type {
  LteTopologyResponse,
  NrTopologyResponse,
  BatchUpgradeRequest,
  ListBatchUpgradeLogQuery,
  ListBatchUpgradeLogVO,
  LongIdRequest,
} from '@/types/topology';

/** 获取 LTE 拓扑 */
export function getLteTopology(data: LongIdRequest) {
  return http.post<LteTopologyResponse>('/topology/lte', data);
}

/** 获取 NR 拓扑 */
export function getNrTopology(data: LongIdRequest) {
  return http.post<NrTopologyResponse>('/topology/nr', data);
}

/** 批量升级 EU/RU 设备 */
export function batchUpgradeEUAndRU(data: BatchUpgradeRequest) {
  return http.post<void>('/topology/batch-upgrade', data);
}

/** 获取批量升级日志 */
export function listBatchUpgradeLogs(params: ListBatchUpgradeLogQuery) {
  return http.post<ListBatchUpgradeLogVO[]>('/topology/batch-upgrade/logs', params);
}

/** 重新加载 LTE 拓扑 */
export function reloadLteTopology(data: LongIdRequest) {
  return http.post<void>('/topology/lte/reload', data);
}

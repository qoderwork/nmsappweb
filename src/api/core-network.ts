import { http } from '@/utils/request';
import type {
  CoreNetwork,
  CoreNetworkOperationLog,
  CoreNetworkAlarmVo,
  UeInfo,
  UeListVo,
  UeNumberStatisticVo,
  CoreNetworkUserInfoVo,
  CoreNetworkUpfTrafficVo,
  KpiReportRow,
  GetCoreNetworkParametersQuery,
  SetCoreNetworkParametersDTO,
  QueryCoreNetworkParametersDTO,
  DeleteCoreNetworkParameterDTO,
  ChangeCoreNetworkSwitchRequest,
} from '@/types/core-network';

export function listCoreNetworks() {
  return http.get<CoreNetwork[]>('/core-networks');
}

export function getCoreNetwork(id: number) {
  return http.get<CoreNetwork>(`/core-networks/${id}`);
}

export function createCoreNetwork(data: Partial<CoreNetwork>) {
  return http.post<CoreNetwork>('/core-networks', data);
}

export function updateCoreNetwork(id: number, data: Partial<CoreNetwork>) {
  return http.put<CoreNetwork>(`/core-networks/${id}`, data);
}

export function deleteCoreNetwork(id: number) {
  return http.delete(`/core-networks/${id}`);
}

export function getCoreNetworkKpis(id: number, startTime: string, endTime: string) {
  return http.get(`/core-networks/${id}/kpis`, { params: { start_time: startTime, end_time: endTime } });
}

export function getStatisticData(id: number, startTime: string, endTime: string) {
  return http.get(`/core-networks/${id}/statistics`, { params: { start_time: startTime, end_time: endTime } });
}

export function listOperationLogs(id: number, page: number, pageSize: number) {
  return http.get<{ list: CoreNetworkOperationLog[]; total: number; page: number; pageSize: number }>(
    `/core-networks/${id}/logs`,
    { params: { page, pageSize } }
  );
}

export function getCoreNetworkAlarms(data: { coreNetworkId: number }) {
  return http.post<CoreNetworkAlarmVo[]>('/core-networks/alarms', data);
}

export function listUEList(data: { coreNetworkId: number }) {
  return http.post<UeListVo[]>('/core-networks/ue-list', data);
}

export function listUENumberStatistic(data: { coreNetworkId: number }) {
  return http.post<UeNumberStatisticVo>('/core-networks/ue-number-statistic', data);
}

export function getUeInfos(data: { coreNetworkId: number }) {
  return http.post<UeInfo[]>('/core-networks/ue-infos', data);
}

export function changeCoreNetworkSwitch(data: ChangeCoreNetworkSwitchRequest) {
  return http.post('/core-networks/switch', data);
}

export function getCoreNetworkUserInfo(data: { coreNetworkId: number }) {
  return http.post<CoreNetworkUserInfoVo>('/core-networks/kpi/user-info', data);
}

export function getCoreNetworkUpfTraffic(data: { coreNetworkId: number }) {
  return http.post<CoreNetworkUpfTrafficVo>('/core-networks/kpi/upf-traffic', data);
}

export function getKpiReport(data: { coreNetworkId: number; index: number; startTime: string; endTime: string }) {
  return http.post<KpiReportRow[]>('/core-networks/kpi/report', data);
}

export function getCoreNetworkParameters(data: GetCoreNetworkParametersQuery) {
  return http.post('/core-networks/parameters', data);
}

export function setCoreNetworkParameters(data: SetCoreNetworkParametersDTO) {
  return http.post('/core-networks/parameters/set', data);
}

export function queryCoreNetworkParameters(data: QueryCoreNetworkParametersDTO) {
  return http.post('/core-networks/parameters/query', data);
}

export function deleteCoreNetworkParameter(data: DeleteCoreNetworkParameterDTO) {
  return http.post('/core-networks/parameters/delete', data);
}

export function addCoreNetworkParameter(data: SetCoreNetworkParametersDTO) {
  return http.post('/core-networks/parameters/add', data);
}

export function getCoreNetworkElementSystemState(data: { coreNetworkId: number }) {
  return http.post('/core-networks/element-system-state', data);
}
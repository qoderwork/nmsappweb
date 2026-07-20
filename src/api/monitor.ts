import { http } from '@/utils/request';
import type {
  MonitorTask,
  MonitorData,
  MonitorStatistics,
  MonitorElements,
  MonitorParameters,
  SaveMonitorElementsRequest,
  SaveMonitorParametersRequest,
} from '@/types/monitor';

const BASE = '/api/v1';

// Monitor tasks
export function listMonitorTasks() {
  return http.get<MonitorTask[]>(`${BASE}/monitor-tasks`);
}

export function getMonitorTask(id: number) {
  return http.get<MonitorTask>(`${BASE}/monitor-tasks/${id}`);
}

export function createMonitorTask(data: MonitorTask) {
  return http.post<MonitorTask>(`${BASE}/monitor-tasks`, data);
}

export function updateMonitorTask(id: number, data: MonitorTask) {
  return http.put<MonitorTask>(`${BASE}/monitor-tasks/${id}`, data);
}

export function deleteMonitorTask(id: number) {
  return http.delete<void>(`${BASE}/monitor-tasks/${id}`);
}

// Monitor data
export function getMonitorData(elementId: number, parameterId: string, startTime: string, endTime: string) {
  return http.get<MonitorData[]>(`${BASE}/monitor-data`, {
    params: { element_id: elementId, parameter_id: parameterId, start_time: startTime, end_time: endTime },
  });
}

// Monitor statistics
export function getMonitorStatistics(parameterId: string, elementIds: number[], startTime: string, endTime: string) {
  return http.get<MonitorStatistics>(`${BASE}/monitor-statistics`, {
    params: { parameter_id: parameterId, element_ids: elementIds.join(','), start_time: startTime, end_time: endTime },
  });
}

// Monitor elements (bound to a task)
export function getMonitorElements(taskId: number) {
  return http.get<MonitorElements[]>(`${BASE}/monitor-elements/${taskId}`);
}

export function saveMonitorElements(taskId: number, data: SaveMonitorElementsRequest) {
  return http.put<void>(`${BASE}/monitor-elements/${taskId}`, data);
}

// Monitor parameters (bound to a task)
export function getMonitorParameters(taskId: number) {
  return http.get<MonitorParameters[]>(`${BASE}/monitor-parameters/${taskId}`);
}

export function saveMonitorParameters(taskId: number, data: SaveMonitorParametersRequest) {
  return http.put<void>(`${BASE}/monitor-parameters/${taskId}`, data);
}

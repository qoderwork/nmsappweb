import { http } from '@/utils/request';
import type {
  MmlCommand,
  MmlCommandParam,
  MmlSet,
  MmlExecuteResult,
  GetMMLResultByEventLogIdsVO,
  ExecuteMmlRequest,
  GetMMLResultByEventLogIdsRequest,
} from '@/types/mml';

export function listMmlSets() {
  return http.get<MmlSet[]>('/mml-sets');
}

export function listMmlCommands(mmlSetId: number) {
  return http.get<MmlCommand[]>('/mml-commands', { params: { mml_set_id: mmlSetId } });
}

export function getMmlCommandParams(commandId: number) {
  return http.get<MmlCommandParam[]>(`/mml-commands/${commandId}/params`);
}

export function executeMml(data: ExecuteMmlRequest) {
  return http.post('/mml-execute', data);
}

export function listMmlResults(elementId: number, page: number, pageSize: number) {
  return http.get<{ list: MmlExecuteResult[]; total: number; page: number; pageSize: number }>(
    '/mml-results',
    { params: { element_id: elementId, page, pageSize } }
  );
}

export function getMmlResult(id: number) {
  return http.get<MmlExecuteResult>(`/mml-results/${id}`);
}

export function getMMLResultByEventLogIds(data: GetMMLResultByEventLogIdsRequest) {
  return http.post<GetMMLResultByEventLogIdsVO[]>('/mml-results-by-event-log-ids', data);
}

export function getMmlVersions() {
  return http.get<string[]>('/mml/versions');
}

export function getMmlCommandsByVersion(version: string) {
  return http.get<MmlCommand[]>('/mml/commands-by-version', { params: { version } });
}

export function getMmlCommandTree() {
  return http.get('/mml/command-tree');
}

export function deleteMmlByVersion(version: string) {
  return http.delete('/mml/version', { params: { version } });
}

export function importMML(data: FormData) {
  return http.post('/mml/import', data);
}
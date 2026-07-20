/**
 * 租户管理 API
 *
 * 对齐 nmsappsrv 后端 internal/tenancy/routes.go
 */

import { http } from '@/utils/request';
import type {
  TenancyVO,
  AddTenancyRequest,
  UpdateTenancyRequest,
  DeleteTenancyRequest,
  ViewTenancyRequest,
  ViewTenancyResponse,
} from '@/types/tenancy';

/** 获取租户列表（分页） */
export function getTenancies(params: { page?: number; pageSize?: number; keyword?: string } = {}) {
  return http.getPage<TenancyVO>('/tenancies', params);
}

/** 添加租户 */
export function addTenancy(data: AddTenancyRequest) {
  return http.post<void, AddTenancyRequest>('/tenancies', data);
}

/** 更新租户 */
export function updateTenancy(data: UpdateTenancyRequest) {
  return http.put<void, UpdateTenancyRequest>('/tenancies', data);
}

/** 删除租户 */
export function deleteTenancy(data: DeleteTenancyRequest) {
  return http.delete<void>('/tenancies', { data });
}

/** 查看租户详情 */
export function viewTenancy(data: ViewTenancyRequest) {
  return http.post<ViewTenancyResponse, ViewTenancyRequest>('/tenancies/view', data);
}

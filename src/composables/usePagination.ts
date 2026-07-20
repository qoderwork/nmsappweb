/**
 * 分页 Composable
 *
 * 封装 Element Plus 分页交互：
 *  - 维护当前页 / 每页条数
 *  - 自动触发查询
 *  - 总数管理
 */

import { ref, reactive, computed, watch } from 'vue';
import type { PageQuery } from '@/types';

export interface UsePaginationOptions<T> {
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 默认页码 */
  defaultPage?: number;
  /** 分页选项 */
  pageSizes?: number[];
  /** 查询函数（接收分页参数，返回 { list, total }） */
  fetch: (params: PageQuery & Record<string, unknown>) => Promise<{ list: T[]; total: number }>;
  /** 额外查询参数（响应式，变化会自动刷新） */
  extraParams?: () => Record<string, unknown>;
  /** 是否立即加载 */
  immediate?: boolean;
}

export function usePagination<T = unknown>(options: UsePaginationOptions<T>) {
  const {
    defaultPageSize = 20,
    defaultPage = 1,
    pageSizes = [10, 20, 50, 100],
    fetch,
    extraParams,
    immediate = true,
  } = options;

  // ============ State ============
  const list = ref<T[]>([]) as { value: T[] };
  const total = ref(0);
  const loading = ref(false);
  const page = ref(defaultPage);
  const pageSize = ref(defaultPageSize);

  const query = reactive<PageQuery & Record<string, unknown>>({
    page: defaultPage,
    pageSize: defaultPageSize,
    keyword: '',
  });

  // ============ Computed ============
  const hasData = computed(() => list.value.length > 0);
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

  // ============ Actions ============

  /** 加载数据 */
  async function load() {
    loading.value = true;
    try {
      // 先展开 query，再覆盖 page/pageSize（确保优先使用响应式值）
      const params: PageQuery = {
        ...query,
        ...(extraParams?.() ?? {}),
        page: page.value,
        pageSize: pageSize.value,
      };
      // 删除空值
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] == null) delete params[k];
      });
      const result = await fetch(params);
      list.value = result.list;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  /** 跳转到指定页 */
  async function changePage(p: number) {
    page.value = p;
    await load();
  }

  /** 修改每页条数 */
  async function changePageSize(size: number) {
    pageSize.value = size;
    page.value = 1;
    await load();
  }

  /** 搜索（关键字变化） */
  async function search() {
    page.value = 1;
    await load();
  }

  /** 重置查询条件 */
  async function reset() {
    Object.keys(query).forEach((k) => {
      if (k !== 'page' && k !== 'pageSize') (query as Record<string, unknown>)[k] = '';
    });
    page.value = 1;
    await load();
  }

  /** 刷新当前页 */
  async function refresh() {
    await load();
  }

  // ============ 监听 ============
  if (immediate) {
    load();
  }

  // 监听额外参数变化
  if (extraParams) {
    watch(
      () => extraParams(),
      () => {
        if (immediate) load();
      },
      { deep: true }
    );
  }

  return {
    // state
    list,
    total,
    loading,
    page,
    pageSize,
    pageSizes,
    query,
    // getters
    hasData,
    totalPages,
    // actions
    load,
    changePage,
    changePageSize,
    search,
    reset,
    refresh,
  };
}

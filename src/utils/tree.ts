/**
 * 树形数据处理工具
 * 平铺 ↔ 树形互转、查找、遍历
 *
 * 设计哲学：buildTree 返回原始数据类型 + children，保留所有业务字段
 */

import type { TreeNode } from '@/types';

/** 选项配置 */
export interface BuildTreeOptions<T> {
  idKey?: keyof T;
  parentIdKey?: keyof T;
  childrenKey?: keyof T;
  rootParentId?: unknown;
}

/**
 * 平铺数据转树形
 * 返回原始类型 + children 字段的数组
 *
 * @param list 平铺数组
 * @param options 配置项
 */
export function buildTree<T extends Record<string, unknown>>(
  list: T[],
  options?: BuildTreeOptions<T>
): (T & { children: (T & { children: unknown[] })[] })[] {
  const idKey = options?.idKey ?? ('id' as keyof T);
  const parentIdKey = options?.parentIdKey ?? ('parentId' as keyof T);
  const childrenKey = options?.childrenKey ?? ('children' as keyof T);
  const rootParentId = options?.rootParentId ?? 0;

  // 建立索引：id → 处理后的节点（带 children）
  type Node = T & { children: Node[] };
  const map = new Map<unknown, Node>();
  const roots: Node[] = [];

  // 第一遍：建立索引
  list.forEach((item) => {
    const node: Node = { ...item, children: [] } as Node;
    map.set(item[idKey], node);
  });

  // 第二遍：构建父子关系
  map.forEach((node) => {
    const parentId = node[parentIdKey];
    if (parentId == null || parentId === rootParentId) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // 父节点不存在，作为根节点处理
        roots.push(node);
      }
    }
  });

  // 显式标记 childrenKey（兼容业务侧使用其他字段名作为 children）
  if (childrenKey !== 'children') {
    // 业务侧用了其他字段名作为 children，需要重命名（罕见场景）
    roots.forEach((n) => {
      const v = (n as Record<string, unknown>).children;
      delete (n as Record<string, unknown>).children;
      (n as Record<string, unknown>)[childrenKey as string] = v;
    });
  }

  return roots as (T & { children: (T & { children: unknown[] })[] })[];
}

/**
 * 树形数据转平铺
 * 兼容 childrenKey
 */
export function flattenTree<T extends Record<string, unknown>>(
  tree: T[],
  childrenKey = 'children'
): T[] {
  const result: T[] = [];
  const walk = (nodes: T[]) => {
    nodes.forEach((node) => {
      result.push(node);
      const children = node[childrenKey] as T[] | undefined;
      if (children?.length) walk(children);
    });
  };
  walk(tree);
  return result;
}

/**
 * 查找节点（递归）
 */
export function findNode<T extends Record<string, unknown>>(
  tree: T[],
  id: unknown,
  options?: { idKey?: keyof T; childrenKey?: keyof T }
): T | null {
  const idKey = options?.idKey ?? ('id' as keyof T);
  const childrenKey = options?.childrenKey ?? ('children' as keyof T);
  for (const node of tree) {
    if (node[idKey] === id) return node;
    const children = node[childrenKey] as T[] | undefined;
    if (children?.length) {
      const found = findNode(children, id, options);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 获取所有父节点 ID（用于级联选择器回显）
 */
export function getParentIds<T extends Record<string, unknown>>(
  tree: T[],
  id: unknown,
  options?: { idKey?: keyof T; parentIdKey?: keyof T; childrenKey?: keyof T }
): unknown[] {
  const idKey = options?.idKey ?? ('id' as keyof T);
  const childrenKey = options?.childrenKey ?? ('children' as keyof T);
  const path: unknown[] = [];
  const walk = (nodes: T[]): boolean => {
    for (const node of nodes) {
      if (node[idKey] === id) {
        path.push(node[idKey]);
        return true;
      }
      const children = node[childrenKey] as T[] | undefined;
      if (children?.length && walk(children)) {
        path.unshift(node[idKey]);
        return true;
      }
    }
    return false;
  };
  walk(tree);
  return path;
}

/**
 * 遍历树（深度优先）
 */
export function traverseTree<T extends Record<string, unknown>>(
  tree: T[],
  callback: (node: T, depth: number) => void,
  childrenKey = 'children'
): void {
  const walk = (nodes: T[], depth = 0) => {
    nodes.forEach((node) => {
      callback(node, depth);
      const children = node[childrenKey] as T[] | undefined;
      if (children?.length) walk(children, depth + 1);
    });
  };
  walk(tree);
}

/**
 * 过滤树（保留匹配节点及其父链路）
 */
export function filterTree<T extends Record<string, unknown>>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children'
): T[] {
  const walk = (nodes: T[]): T[] => {
    const result: T[] = [];
    nodes.forEach((node) => {
      const children = node[childrenKey] as T[] | undefined;
      const filteredChildren = children?.length ? walk(children) : [];
      if (predicate(node) || filteredChildren.length > 0) {
        result.push({ ...node, [childrenKey]: filteredChildren });
      }
    });
    return result;
  };
  return walk(tree);
}

/**
 * 排序树（按 sort 字段升序）
 */
export function sortTree<T extends Record<string, unknown>>(
  tree: T[],
  childrenKey = 'children'
): T[] {
  return tree
    .map((node) => {
      const children = node[childrenKey] as T[] | undefined;
      const sortedChildren = children?.length ? sortTree(children, childrenKey) : undefined;
      return { ...node, [childrenKey]: sortedChildren ?? [] };
    })
    .sort((a, b) => {
      const sa = Number(a.sort) || 0;
      const sb = Number(b.sort) || 0;
      return sa - sb;
    });
}

/**
 * 兼容旧版：基于 TreeNode<T> 类型
 * 新代码建议使用 buildTree，返回原始类型
 */
export function buildTreeNodeTree<T extends Record<string, unknown>>(
  list: T[],
  options?: BuildTreeOptions<T>
): TreeNode<T>[] {
  const idKey = options?.idKey ?? ('id' as keyof T);
  const parentIdKey = options?.parentIdKey ?? ('parentId' as keyof T);
  const rootParentId = options?.rootParentId ?? 0;

  const map = new Map<unknown, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  list.forEach((item) => {
    const node: TreeNode<T> = {
      id: item[idKey] as string | number,
      label: (item.name as string) ?? (item.title as string) ?? String(item[idKey]),
      parentId: (item[parentIdKey] as string | number) ?? null,
      raw: item,
      children: [],
    };
    map.set(item[idKey], node);
  });

  map.forEach((node) => {
    const parentId = node.parentId;
    if (parentId == null || parentId === rootParentId) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent) parent.children!.push(node);
      else roots.push(node);
    }
  });

  return roots;
}

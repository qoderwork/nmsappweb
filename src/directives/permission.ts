/**
 * 权限指令
 *
 * v-permission="'device.create'"        单个权限
 * v-permission="['device.create','device.edit']"  任一权限（OR）
 * v-permission.all="['a','b']"           全部权限（AND）
 * v-role="'admin'"                       单个角色
 * v-role="['admin','operator']"          任一角色
 *
 * 不满足权限时移除 DOM 元素
 */

import type { Directive, DirectiveBinding } from 'vue';
import { usePermissionStore } from '@/stores/permission';

/** 权限指令（任一满足） */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding, 'any');
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding, 'any');
  },
};

/** 权限指令（全部满足） */
export const permissionAll: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding, 'all');
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding, 'all');
  },
};

/** 角色指令 */
export const role: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
};

function checkPermission(
  el: HTMLElement,
  binding: DirectiveBinding,
  mode: 'any' | 'all'
) {
  const value = binding.value;
  if (!value) return;

  const required = Array.isArray(value) ? value : [value];
  const store = usePermissionStore();

  let ok: boolean;
  if (mode === 'all') {
    ok = required.every((p: string) => store.hasPermission(p));
  } else {
    ok = store.hasPermission(required);
  }

  if (!ok) {
    el.parentNode?.removeChild(el);
  }
}

function checkRole(el: HTMLElement, binding: DirectiveBinding) {
  const value = binding.value;
  if (!value) return;

  const required = Array.isArray(value) ? value : [value];
  const store = usePermissionStore();
  if (!store.hasRole(required)) {
    el.parentNode?.removeChild(el);
  }
}

/** 全部指令 */
export const directives = {
  permission,
  permissionAll,
  role,
};

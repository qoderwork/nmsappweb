/**
 * 自定义指令统一注册
 *
 * v-permission      权限校验（任一）
 * v-permission.all   权限校验（全部）
 * v-role             角色校验
 * v-debounce         防抖点击
 * v-copy             复制到剪贴板
 */

import type { App, Directive } from 'vue';
import { permission, permissionAll, role } from './permission';

/** 防抖指令：v-debounce="onClick" 或 v-debounce:500="onClick" */
const debounce: Directive<HTMLElement, () => void> = {
  mounted(el, binding) {
    const delay = Number(binding.arg) || 300;
    let timer: ReturnType<typeof setTimeout> | null = null;

    el.addEventListener('click', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        binding.value?.();
      }, delay);
    });
  },
};

/** 复制指令：v-copy="text" */
const copy: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(binding.value);
        // 可选：触发复制成功提示
        el.dispatchEvent(new CustomEvent('copied', { detail: binding.value }));
      } catch {
        console.warn('[v-copy] clipboard not available');
      }
    });
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.dataset.copyText = binding.value;
    }
  },
};

/** 全局注册 */
export function setupDirectives(app: App): void {
  app.directive('permission', permission);
  app.directive('permissionAll', permissionAll);
  app.directive('role', role);
  app.directive('debounce', debounce);
  app.directive('copy', copy);
}

export { permission, permissionAll, role, debounce, copy };

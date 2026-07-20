/**
 * i18n 国际化配置
 *
 * 语言：zh（中文）、en（英文）
 * 与 Element Plus locale 联动：切换语言时同步切换 EP 内置文案
 * 与 settings store 联动：语言持久化到 localStorage
 */

import { createI18n } from 'vue-i18n';
import enLocale from 'element-plus/es/locale/lang/en';
import zhLocale from 'element-plus/es/locale/lang/zh-cn';

import zh from './zh';
import en from './en';

export type Locale = 'zh' | 'en';

const messages = {
  zh: {
    ...zh,
    el: zhLocale.el,
  },
  en: {
    ...en,
    el: enLocale.el,
  },
};

/** 默认语言 */
const defaultLocale: Locale =
  (localStorage.getItem('NMS_LOCALE') as Locale) || 'zh';

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'zh',
  messages,
});

/** Element Plus locale 映射 */
export const elementLocales = {
  zh: zhLocale,
  en: enLocale,
} as const;

/** 切换语言（业务方法，供 settings store 调用） */
export function changeLocale(locale: Locale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem('NMS_LOCALE', locale);
  document.documentElement.setAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en');
}

export default i18n;

/**
 * 数据校验工具
 * 通用校验函数 + Element Plus 表单校验器
 */

import type { FormItemRule } from 'element-plus';

/** 是否为有效 URL */
export function isUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return !!u.protocol && ['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol);
  } catch {
    return false;
  }
}

/** 是否为有效 IP 地址 */
export function isIp(ip: string): boolean {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!v4.test(ip)) return false;
  return ip.split('.').every((p) => {
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

/** 是否为 IPv6 地址 */
export function isIpv6(ip: string): boolean {
  return /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':');
}

/** 是否为有效邮箱 */
export function isEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/** 是否为有效手机号（中国大陆） */
export function isPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 是否为有效 MAC 地址 */
export function isMac(mac: string): boolean {
  return /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(mac);
}

/** 是否为纯数字 */
export function isNumber(value: unknown): value is number {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return value.trim() !== '' && !isNaN(Number(value));
  return false;
}

/** 是否为空值（null/undefined/空字符串/空数组/空对象） */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/** 是否为有效 JSON 字符串 */
export function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/** 是否为有效经度 */
export function isLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}

/** 是否为有效纬度 */
export function isLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

/** 是否为有效端口号 */
export function isPort(value: number | string): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

/* ============ Element Plus 表单校验器 ============ */

type Validator = (rule: unknown, value: unknown, callback: (e?: Error) => void) => void;

/** 必填校验器 */
export const requiredValidator =
  (message = '该字段不能为空'): Validator =>
  (_rule, value, callback) => {
    if (isEmpty(value)) callback(new Error(message));
    else callback();
  };

/** 邮箱校验器 */
export const emailValidator =
  (message = '请输入有效的邮箱地址'): Validator =>
  (_rule, value, callback) => {
    if (!value || isEmail(String(value))) callback();
    else callback(new Error(message));
  };

/** 手机号校验器 */
export const phoneValidator =
  (message = '请输入有效的手机号'): Validator =>
  (_rule, value, callback) => {
    if (!value || isPhone(String(value))) callback();
    else callback(new Error(message));
  };

/** IP 地址校验器 */
export const ipValidator =
  (message = '请输入有效的 IP 地址'): Validator =>
  (_rule, value, callback) => {
    if (!value || isIp(String(value))) callback();
    else callback(new Error(message));
  };

/** 端口校验器 */
export const portValidator =
  (message = '请输入 1-65535 之间的端口'): Validator =>
  (_rule, value, callback) => {
    if (!value || isPort(Number(value))) callback();
    else callback(new Error(message));
  };

/** MAC 地址校验器 */
export const macValidator =
  (message = '请输入有效的 MAC 地址'): Validator =>
  (_rule, value, callback) => {
    if (!value || isMac(String(value))) callback();
    else callback(new Error(message));
  };

/** 经度校验器 */
export const longitudeValidator =
  (message = '请输入 -180 到 180 之间的经度'): Validator =>
  (_rule, value, callback) => {
    if (!value || isLongitude(Number(value))) callback();
    else callback(new Error(message));
  };

/** 纬度校验器 */
export const latitudeValidator =
  (message = '请输入 -90 到 90 之间的纬度'): Validator =>
  (_rule, value, callback) => {
    if (!value || isLatitude(Number(value))) callback();
    else callback(new Error(message));
  };

/** 密码强度校验器（最少 8 位，包含大小写字母和数字） */
export const passwordValidator =
  (message = '密码至少 8 位，需包含大小写字母和数字'): Validator =>
  (_rule, value, callback) => {
    const v = String(value ?? '');
    if (v.length < 8) {
      callback(new Error(message));
      return;
    }
    if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) {
      callback(new Error(message));
      return;
    }
    callback();
  };

/** 常用表单规则预设 */
export const FormRules = {
  required: (message = '该字段不能为空'): FormItemRule => ({
    required: true,
    message,
    trigger: 'blur',
  }),
  email: (message = '请输入有效的邮箱地址'): FormItemRule => ({
    validator: emailValidator(message),
    trigger: 'blur',
  }),
  phone: (message = '请输入有效的手机号'): FormItemRule => ({
    validator: phoneValidator(message),
    trigger: 'blur',
  }),
  ip: (message = '请输入有效的 IP 地址'): FormItemRule => ({
    validator: ipValidator(message),
    trigger: 'blur',
  }),
  port: (message = '请输入 1-65535 之间的端口'): FormItemRule => ({
    validator: portValidator(message),
    trigger: 'blur',
  }),
  mac: (message = '请输入有效的 MAC 地址'): FormItemRule => ({
    validator: macValidator(message),
    trigger: 'blur',
  }),
  password: (message = '密码至少 8 位，需包含大小写字母和数字'): FormItemRule => ({
    validator: passwordValidator(message),
    trigger: 'blur',
  }),
} as const;

/**
 * 文件上传 Composable
 *
 * 提供单文件上传和分片上传能力
 * 与 http.upload 配合
 */

import { ref, computed } from 'vue';
import SparkMD5 from 'spark-md5';
import { http } from '@/utils/request';

export interface UploadFileItem {
  file: File;
  /** 已上传百分比 */
  percent: number;
  /** 状态：pending | uploading | success | error */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** 错误信息 */
  error?: string;
  /** 上传后返回的 url 或文件 id */
  url?: string;
}

export interface UseUploadOptions {
  /** 上传地址 */
  url: string;
  /** 字段名 */
  fieldName?: string;
  /** 单个文件大小限制（字节） */
  maxSize?: number;
  /** 允许的文件类型 */
  accept?: string[];
  /** 是否启用分片上传 */
  enableChunk?: boolean;
  /** 分片大小（字节），默认 5MB */
  chunkSize?: number;
  /** 分片上传接口 */
  chunkUploadUrl?: string;
  /** 分片合并接口 */
  chunkMergeUrl?: string;
  /** 额外表单数据 */
  extraData?: () => Record<string, string>;
}

const MB = 1024 * 1024;

export function useUpload(options: UseUploadOptions) {
  const {
    url,
    fieldName = 'file',
    maxSize = 100 * MB,
    accept = [],
    enableChunk = false,
    chunkSize = 5 * MB,
    chunkUploadUrl,
    chunkMergeUrl,
    extraData,
  } = options;

  // ============ State ============
  const files = ref<UploadFileItem[]>([]);
  const uploading = ref(false);

  // ============ Computed ============
  const totalPercent = computed(() => {
    if (files.value.length === 0) return 0;
    const sum = files.value.reduce((acc, f) => acc + f.percent, 0);
    return Math.floor(sum / files.value.length);
  });

  const hasFiles = computed(() => files.value.length > 0);

  // ============ Actions ============

  /** 校验文件 */
  function validate(file: File): string | null {
    if (maxSize && file.size > maxSize) {
      return `文件大小超出限制（${Math.floor(maxSize / MB)}MB）`;
    }
    if (accept.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!accept.includes(`.${ext}`) && !accept.includes(file.type)) {
        return `不支持的文件类型`;
      }
    }
    return null;
  }

  /** 添加文件 */
  function add(file: File): UploadFileItem {
    const error = validate(file);
    const item: UploadFileItem = {
      file,
      percent: 0,
      status: error ? 'error' : 'pending',
      error: error ?? undefined,
    };
    files.value.push(item);
    return item;
  }

  /** 上传单个文件 */
  async function uploadOne(item: UploadFileItem): Promise<string | undefined> {
    if (item.status === 'error') return undefined;
    item.status = 'uploading';
    item.percent = 0;

    try {
      if (enableChunk && item.file.size > chunkSize && chunkUploadUrl && chunkMergeUrl) {
        return await chunkUpload(item);
      }
      const result = await http.upload<string>(url, item.file, {
        fieldName,
        extraData: extraData?.(),
        onProgress: (percent) => {
          item.percent = percent;
        },
      });
      item.status = 'success';
      item.percent = 100;
      item.url = result;
      return result;
    } catch (e) {
      item.status = 'error';
      item.error = e instanceof Error ? e.message : '上传失败';
      throw e;
    }
  }

  /** 分片上传 */
  async function chunkUpload(item: UploadFileItem): Promise<string | undefined> {
    if (!chunkUploadUrl || !chunkMergeUrl) return undefined;
    const file = item.file;
    const spark = new SparkMD5.ArrayBuffer();
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunks: Blob[] = [];

    // 切片
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }

    // 计算 MD5
    const arrayBuffer = await file.arrayBuffer();
    spark.append(arrayBuffer);
    const md5 = spark.end();

    // 上传分片
    for (let i = 0; i < totalChunks; i++) {
      await http.upload(`${chunkUploadUrl}?index=${i}&total=${totalChunks}&md5=${md5}`, chunks[i], {
        fieldName,
        extraData: extraData?.(),
      });
      item.percent = Math.floor(((i + 1) / totalChunks) * 100);
    }

    // 合并
    const result = await http.post<string, unknown>(chunkMergeUrl, {
      filename: file.name,
      md5,
      total: totalChunks,
    });
    item.status = 'success';
    item.percent = 100;
    item.url = result;
    return result;
  }

  /** 上传所有 */
  async function uploadAll(): Promise<void> {
    uploading.value = true;
    try {
      for (const item of files.value) {
        if (item.status === 'pending') {
          await uploadOne(item);
        }
      }
    } finally {
      uploading.value = false;
    }
  }

  /** 移除文件 */
  function remove(index: number) {
    files.value.splice(index, 1);
  }

  /** 清空文件列表 */
  function clear() {
    files.value = [];
  }

  /** 重试失败的 */
  async function retry() {
    for (const item of files.value) {
      if (item.status === 'error') {
        item.status = 'pending';
        item.error = undefined;
        await uploadOne(item);
      }
    }
  }

  return {
    files,
    uploading,
    totalPercent,
    hasFiles,
    add,
    uploadOne,
    uploadAll,
    remove,
    clear,
    retry,
    validate,
  };
}

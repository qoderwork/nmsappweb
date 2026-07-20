/**
 * WebSocket Store
 *
 * 管理连接状态、订阅主题、消息队列
 * 与 utils/websocket.ts 配合：utils 提供 WS 客户端类，store 提供业务状态
 */

import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';

import type { WsMessage, WsCachedMessage } from '@/types';
import { WebSocketClient } from '@/utils/websocket';
import { getToken } from '@/utils/auth';

export const useWebSocketStore = defineStore('websocket', () => {
  // ============ State ============
  const connected = ref(false);
  const connecting = ref(false);
  const error = ref<string | null>(null);
  /** 已订阅主题集合 */
  const subscribedTopics = ref<Set<string>>(new Set());
  /** 待发送的消息缓存 */
  const messageCache = ref<Map<string, WsCachedMessage>>(new Map());
  /** 最近接收到的消息（供组件 watch） */
  const lastMessage = shallowRef<WsMessage | null>(null);
  /** WebSocket 客户端实例 */
  const client = shallowRef<WebSocketClient | null>(null);

  // ============ Getters ============
  const isConnected = computed(() => connected.value);
  const cachedCount = computed(() => messageCache.value.size);

  // ============ Actions ============

  /**
   * 连接 WebSocket
   */
  async function connect(): Promise<void> {
    if (connected.value || connecting.value) return;
    const token = getToken();
    if (!token) {
      error.value = '未登录，无法连接 WebSocket';
      return;
    }

    connecting.value = true;
    error.value = null;

    try {
      const ws = new WebSocketClient({
        url: '/ws',
        token,
        onOpen: () => {
          connected.value = true;
          connecting.value = false;
          // 重连后重新订阅
          subscribedTopics.value.forEach((topic) => {
            ws.send({ type: 'subscribe', topic });
          });
        },
        onClose: () => {
          connected.value = false;
          connecting.value = false;
        },
        onError: (err) => {
          error.value = err;
          connecting.value = false;
        },
        onMessage: (msg) => {
          lastMessage.value = msg;
          // 处理确认消息
          if (msg.type === 'confirm' && msg.messageId) {
            messageCache.value.delete(msg.messageId);
          }
        },
        onReconnect: () => {
          console.log('[WS] reconnecting...');
        },
      });

      await ws.connect();
      client.value = ws;
    } catch (e) {
      connecting.value = false;
      error.value = e instanceof Error ? e.message : '连接失败';
    }
  }

  /** 断开连接 */
  function disconnect() {
    client.value?.close();
    client.value = null;
    connected.value = false;
    subscribedTopics.value.clear();
    messageCache.value.clear();
  }

  /** 订阅主题 */
  function subscribe(topic: string) {
    if (subscribedTopics.value.has(topic)) return;
    subscribedTopics.value.add(topic);
    client.value?.send({ type: 'subscribe', topic });
  }

  /** 取消订阅 */
  function unsubscribe(topic: string) {
    if (!subscribedTopics.value.has(topic)) return;
    subscribedTopics.value.delete(topic);
    client.value?.send({ type: 'unsubscribe', topic });
  }

  /**
   * 发送消息（带缓存和重试）
   * 由 dispatcher 轮询处理缓存消息
   */
  function sendToUser(msg: Omit<WsMessage, 'messageId' | 'generatedTime'>) {
    const cached: WsCachedMessage = {
      ...msg,
      messageId: generateMessageId(),
      generatedTime: Date.now(),
      retriedTimes: 0,
      lastSendTime: 0,
    };
    messageCache.value.set(cached.messageId!, cached);
    return cached.messageId!;
  }

  /** 直接发送（不缓存，用于即时通信） */
  function sendRaw(msg: WsMessage): boolean {
    if (!connected.value || !client.value) return false;
    client.value.send(msg);
    return true;
  }

  /** 确认消息已收到 */
  function confirmMessage(messageId: string) {
    client.value?.send({ type: 'confirm', messageId });
    messageCache.value.delete(messageId);
  }

  /** 清空缓存 */
  function clearCache() {
    messageCache.value.clear();
  }

  /** 重置 */
  function reset() {
    disconnect();
    lastMessage.value = null;
  }

  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  return {
    // state
    connected,
    connecting,
    error,
    subscribedTopics,
    messageCache,
    lastMessage,
    client,
    // getters
    isConnected,
    cachedCount,
    // actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendToUser,
    sendRaw,
    confirmMessage,
    clearCache,
    reset,
  };
});

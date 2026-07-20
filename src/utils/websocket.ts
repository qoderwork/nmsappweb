/**
 * WebSocket 客户端
 *
 * 对齐 nmsappsrv 后端 /ws?token=xxx 协议：
 * - 连接：/ws?token=<JWT>
 * - 心跳：客户端每 30s 发送 "heartbeat" 文本消息，服务端 120s 内有心跳判定在线
 * - 订阅：JSON { type:"subscribe", topic:"xxx" }
 * - 取消订阅：JSON { type:"unsubscribe", topic:"xxx" }
 * - 确认：JSON { type:"confirm", messageId:"xxx" }
 * - 业务消息：JSON { type:"data", topic:"xxx", data:{...} }
 *
 * 自动重连：基于指数退避（1s、2s、4s、8s、最多 30s）
 */

import type { WsMessage } from '@/types';

export interface WebSocketClientOptions {
  /** WebSocket 地址，不带 query */
  url: string;
  /** JWT Token */
  token: string;
  /** 心跳间隔（ms），默认 30s */
  heartbeatInterval?: number;
  /** 心跳超时阈值（ms），服务端超过此时间未收到心跳判定离线 */
  heartbeatTimeout?: number;
  /** 最大重连次数，默认 0 表示无限重连 */
  maxReconnectAttempts?: number;
  /** 是否自动重连，默认 true */
  autoReconnect?: boolean;
  /** 连接打开回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: (ev: CloseEvent) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 收到消息回调 */
  onMessage?: (message: WsMessage) => void;
  /** 重连中回调 */
  onReconnect?: (attempt: number) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<Omit<WebSocketClientOptions, 'onOpen' | 'onClose' | 'onError' | 'onMessage' | 'onReconnect'>> & Pick<WebSocketClientOptions, 'onOpen' | 'onClose' | 'onError' | 'onMessage' | 'onReconnect'>;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false; // 主动关闭标志，区分主动断开和意外掉线
  private messageQueue: string[] = []; // 待发送消息队列（连接断开时暂存）

  constructor(options: WebSocketClientOptions) {
    this.options = {
      heartbeatInterval: 30000,
      heartbeatTimeout: 120000,
      maxReconnectAttempts: 0,
      autoReconnect: true,
      onOpen: undefined,
      onClose: undefined,
      onError: undefined,
      onMessage: undefined,
      onReconnect: undefined,
      ...options,
    };
  }

  /** 建立 WebSocket 连接 */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }

      this.closed = false;
      const url = `${this.options.url}?token=${encodeURIComponent(this.options.token)}`;
      let resolved = false;

      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        reject(e);
        return;
      }

      this.ws.onopen = () => {
        resolved = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushQueue();
        this.options.onOpen?.();
        resolve();
      };

      this.ws.onclose = (ev) => {
        this.stopHeartbeat();
        this.options.onClose?.(ev);
        if (!this.closed && this.options.autoReconnect) {
          this.scheduleReconnect();
        }
        if (!resolved) {
          resolved = true;
          // 仅在初次连接失败时 reject
          if (this.reconnectAttempts === 0) {
            reject(new Error(`WebSocket 连接失败：${ev.code} ${ev.reason}`));
          } else {
            resolve(); // 重连场景不报错
          }
        }
      };

      this.ws.onerror = () => {
        const errorMsg = 'WebSocket 连接错误';
        this.options.onError?.(errorMsg);
      };

      this.ws.onmessage = (ev) => {
        this.handleMessage(ev.data);
      };
    });
  }

  /** 主动关闭连接 */
  close(code?: number, reason?: string): void {
    this.closed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(code ?? 1000, reason);
      } catch {
        // 忽略错误
      }
      this.ws = null;
    }
  }

  /**
   * 发送消息
   * - 字符串：直接发送（用于 heartbeat 文本消息）
   * - 对象：JSON 序列化后发送
   * - 连接断开时入队，连接恢复后自动重发
   */
  send(message: string | WsMessage | Record<string, unknown>): boolean {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
        return true;
      } catch (e) {
        console.error('[WS] send error:', e);
        this.messageQueue.push(data);
        return false;
      }
    } else {
      this.messageQueue.push(data);
      return false;
    }
  }

  /** 发送心跳 */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat');
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** 重连调度（指数退避） */
  private scheduleReconnect(): void {
    if (this.closed) return;
    if (this.reconnectTimer) return;

    const max = this.options.maxReconnectAttempts;
    if (max > 0 && this.reconnectAttempts >= max) {
      this.options.onError?.('重连次数已达上限');
      return;
    }

    this.reconnectAttempts += 1;
    this.options.onReconnect?.(this.reconnectAttempts);

    // 指数退避：1s, 2s, 4s, 8s, ..., 上限 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // connect 内部会触发下一次重连调度
      });
    }, delay);
  }

  /** 处理收到的消息 */
  private handleMessage(data: unknown): void {
    if (typeof data !== 'string') return;

    // 心跳响应（服务端可能返回 "pong" 或不响应）
    if (data === 'heartbeat' || data === 'pong' || data === 'ok') return;

    try {
      const msg = JSON.parse(data) as WsMessage;
      this.options.onMessage?.(msg);
    } catch (e) {
      console.warn('[WS] invalid message:', data, e);
    }
  }

  /** 重发队列中的消息 */
  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift()!;
      try {
        this.ws.send(msg);
      } catch (e) {
        // 失败重新入队
        this.messageQueue.unshift(msg);
        break;
      }
    }
  }

  /** 当前连接状态 */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /** 是否已连接 */
  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

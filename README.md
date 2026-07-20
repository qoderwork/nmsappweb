# NMS Web Next

基于 Vue 3.5 + TypeScript + Element Plus 的 NMS 网管系统前端，适配 [nmsappsrv](../nmsappsrv) Go 重写版后端。

## 技术栈

| 类别 | 技术 | 版本 |
|---|---|---|
| 框架 | Vue | ^3.5.13 |
| 语言 | TypeScript | ~5.6.3 (strict) |
| 构建 | Vite | ^6.2.5 |
| UI | Element Plus | ^2.11.7 |
| 状态 | Pinia | ^3.0.1 |
| 路由 | Vue Router | ^4.5.0 (Hash 模式) |
| 样式 | Tailwind CSS + SCSS | ^3.4.1 |
| 国际化 | vue-i18n | ^11.1.12 |
| HTTP | axios | ^1.8.4 |
| 工具 | @vueuse/core | ^13.1.0 |
| 自动导入 | unplugin-auto-import + unplugin-vue-components | - |

## 目录结构

```
nms-web-next/
├── public/                     # 静态资源（不参与构建）
├── src/
│   ├── api/                    # API 接口模块
│   │   ├── auth.ts             # 认证相关
│   │   ├── permission.ts       # 权限/角色
│   │   └── index.ts
│   ├── assets/
│   │   └── styles/             # 全局样式
│   │       ├── variables.scss  # CSS 变量（亮/暗主题、EP 主题覆盖）
│   │       ├── element.scss    # Element Plus 组件样式覆盖
│   │       ├── transitions.scss# 过渡动画
│   │       └── index.scss      # 样式入口
│   ├── components/             # 通用业务组件
│   ├── composables/            # Vue 3 组合式函数
│   │   ├── useTheme.ts         # 主题切换
│   │   ├── usePermission.ts    # 权限判断
│   │   ├── usePagination.ts    # 分页查询
│   │   ├── useUpload.ts        # 文件上传（含分片+MD5）
│   │   ├── useIdle.ts          # 空闲检测（自动锁屏）
│   │   └── index.ts
│   ├── directives/             # 自定义指令
│   │   ├── permission.ts       # v-permission / v-role
│   │   └── index.ts            # v-debounce / v-copy
│   ├── layouts/                # 布局组件
│   │   ├── AppLayout.vue       # 主布局
│   │   └── components/
│   │       ├── Sidebar.vue     # 侧边栏
│   │       ├── SidebarItem.vue # 递归菜单项
│   │       ├── Navbar.vue      # 顶部导航栏
│   │       ├── Breadcrumb.vue  # 面包屑
│   │       ├── Logo.vue        # Logo 区
│   │       └── TagsView.vue    # 标签页
│   ├── locales/                # i18n 语言包
│   │   ├── zh/                 # 中文
│   │   ├── en/                 # 英文
│   │   └── index.ts            # i18n 配置
│   ├── router/                 # 路由
│   │   ├── modules/
│   │   │   └── static.ts       # 静态路由
│   │   ├── guards.ts           # 路由守卫
│   │   └── index.ts
│   ├── stores/                 # Pinia 状态
│   │   ├── auth.ts             # 认证
│   │   ├── permission.ts       # 权限
│   │   ├── app.ts              # 应用（侧边栏/tagsView）
│   │   ├── settings.ts         # 偏好（主题/语言）
│   │   ├── websocket.ts        # WebSocket 状态
│   │   └── index.ts
│   ├── types/                  # TypeScript 类型定义
│   │   ├── api.ts              # API 响应/分页
│   │   ├── auth.ts             # 认证类型
│   │   ├── permission.ts       # 权限/菜单类型
│   │   ├── common.ts           # 通用业务类型
│   │   └── index.ts
│   ├── utils/                  # 工具函数
│   │   ├── storage.ts          # 本地存储封装
│   │   ├── auth.ts             # Token 管理
│   │   ├── request.ts          # HTTP 客户端（axios 封装）
│   │   ├── websocket.ts        # WebSocket 客户端
│   │   ├── format.ts           # 格式化（时间/字节/数字）
│   │   ├── validate.ts         # 校验（IP/MAC/邮箱/EP 表单校验器）
│   │   ├── tree.ts             # 树形数据处理
│   │   ├── error.ts            # 错误处理（BusinessError/TokenExpiredError）
│   │   ├── permission.ts       # 权限判断（角色+点号权限码）
│   │   └── index.ts
│   ├── views/                  # 业务页面
│   │   ├── login/index.vue     # 登录（自适应验证码）
│   │   ├── dashboard/index.vue # 仪表盘
│   │   ├── profile/index.vue   # 个人中心
│   │   └── error/
│   │       ├── 401.vue         # 无权限
│   │       └── 404.vue         # 页面不存在
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 应用入口
│   └── vite-env.d.ts
├── Dockerfile                  # 多阶段构建（builder + nginx）
├── nginx.conf                  # nginx 配置（含反向代理）
├── package.json
├── tsconfig.json               # strict 模式
├── vite.config.ts              # 代理+auto-import+components
├── tailwind.config.js          # 品牌色（#0068b6）
└── postcss.config.js
```

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 启动开发服务器

```bash
npm install
npm run dev
```

访问 http://localhost:5173

### 后端代理

`vite.config.ts` 中已配置代理，转发到 `http://localhost:8080`：

| 路径 | 协议 | 目标 |
|---|---|---|
| `/api/*` | HTTP | `nmsappsrv` REST API |
| `/ws` | WebSocket | 实时推送（设备告警、任务状态等） |
| `/webssh` | WebSocket | WebSSH（xterm.js） |
| `/acs-file-server/*` | HTTP | 文件服务（上传/下载） |

### 构建

```bash
npm run build       # 类型检查 + 生产构建
npm run check       # 仅类型检查
npm run preview     # 预览生产构建
```

构建产物位于 `dist/`。

## 部署

### Docker

```bash
docker build -t nms-web-next:latest .
docker run -d \
  -p 80:80 \
  -e BACKEND_HOST=nmsappsrv \
  -e BACKEND_PORT=8080 \
  --name nms-web \
  nms-web-next:latest
```

### Docker Compose

```yaml
services:
  nms-web:
    build: .
    ports:
      - "80:80"
    environment:
      BACKEND_HOST: nmsappsrv
      BACKEND_PORT: "8080"
    depends_on:
      - nmsappsrv
  nmsappsrv:
    image: your-registry/nmsappsrv:latest
    ports:
      - "8080:8080"
```

## 关键设计

### 1. HTTP 客户端

`src/utils/request.ts` 基于 axios 封装：

- **请求拦截**：自动注入 `Authorization: Bearer <token>` 和 `X-License-Id`（从 JWT 解析）
- **响应拦截**：业务码处理（401 自动跳登录、500 提示、网络异常处理）
- **静默模式**：`silent: true` 时不弹错误提示
- **取消请求**：基于 `AbortController`
- **分页**：`getPage()` 方法返回 `{ list, total, page, pageSize }`
- **上传/下载**：`upload()` 支持进度回调，`download()` 自动从 `Content-Disposition` 提取文件名

### 2. 权限系统

- **角色**：admin（超级）、operator（运维）、viewer（只读）
- **权限码**：点号分隔 `Module.Sub.Action`，如 `device.create`
- **通配**：admin/operator 或 `*` 拥有所有权限；`device.*` 匹配 `device.*` 所有动作
- **指令**：`v-permission="'device.create'"`、`v-permission.all="['a','b']"`、`v-role="'admin'"`
- **运行时路由**：登录后从 `/api/v2/getPermissionAll` 拉取菜单和权限，动态注入路由

### 3. 主题系统

- **三种模式**：light / dark / auto（跟随系统）
- **实现方式**：通过 CSS 变量覆盖（不重新生成 SCSS 主题），EP 主题通过 `--el-color-*` 变量直接生效
- **持久化**：自动保存到 localStorage，下次进入应用
- **EP locale 联动**：切换语言时 Element Plus 内置文案同步切换

### 4. WebSocket

`src/utils/websocket.ts` 实现：

- **心跳**：每 30s 发送 `heartbeat` 文本消息，服务端 120s 内有心跳判定在线
- **重连**：指数退避（1s → 2s → 4s → 8s → ... → 30s 上限）
- **消息队列**：连接断开时缓存待发送消息，重连后自动重发
- **协议**：JSON 格式，支持 `subscribe` / `unsubscribe` / `confirm` / `data` 四种类型

### 5. 安全

- JWT Token 存 localStorage，60 分钟有效期
- Token 失效（401）自动跳转登录页并携带 redirect 参数
- 修改密码后强制重新登录
- nginx 安全头：XSS/Frame-Options/CSP/Referrer-Policy

## 与 nms-web 的差异

| 项 | nms-web（旧） | nms-web-next（新） |
|---|---|---|
| 路由模式 | History | Hash（部署友好） |
| 状态管理 | Pinia 3 | Pinia 3 |
| 样式方案 | Tailwind + SCSS | Tailwind + SCSS + CSS 变量 |
| 主题 | 浅色固定 | 浅色/深色/自动 |
| 国际化 | 部分 | 完整 zh/en |
| 自动导入 | 无 | unplugin-auto-import |
| 权限指令 | 自实现 | 标准化 v-permission / v-role |
| HTTP 封装 | 分散 | 统一 HttpClient 类 |
| TypeScript | strict | strict + noImplicitAny |

## 许可证

私有项目，未授权不可使用。

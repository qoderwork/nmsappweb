# nms-web-next 菜单对齐分析报告

> 比较对象：新版 `nms-web-next/src/router/menus.ts` vs 老版 `smallcell_nms_v4_appweb/src/router/index.js`
> 后端参考：`nmsappsrv` (Go/Gin) 全面覆盖了老版功能 API

---

## 一、菜单结构对齐概览

| # | 老版菜单 | 新版菜单 | 结构对齐 | 页面状态 |
|---|---------|---------|---------|---------|
| 1 | Dashboard (仪表盘) | 仪表盘 (id:100) | ✅ 一致 | ✅ 已实现 |
| 2 | BaseStation (基站) | 基站 (id:200) | ✅ 一致 | ⚠️ 部分 placeholder |
| 3 | CPE | CPE (id:300) | ✅ 一致 | ❌ 全部 placeholder |
| 4 | Device Group (设备组) | 设备组 (id:400) | ✅ 一致 | ✅ 已实现 |
| 5 | Cluster (群组) | 群组 (id:500) | ✅ 一致 | ❌ placeholder |
| 6 | CoreNetwork (核心网) | 核心网 (id:600) | ✅ 一致 | ✅ 已实现 |
| 7 | GIS | GIS (id:700) | ✅ 一致 | ❌ placeholder |
| 8 | Site (站点) | 站点 (id:800) | ✅ 一致 | ✅ 已实现 |
| 9 | ZTP | ZTP (id:900) | ✅ 一致 | ✅ 已实现 |
| 10 | Alarm (告警) | 告警 (id:1000) | ✅ 一致 | ✅ 已实现 |
| 11 | Performance (性能) | 性能 (id:1100) | ✅ 一致 | ✅ 已实现 |
| 12 | Advance (高级→SAS) | 高级 (id:1200) | ✅ 一致 | ❌ SAS placeholder |
| 13 | BatchTasks (批量任务) | 批量任务 (id:1300) | ✅ 一致 | ⚠️ 添加实例 placeholder |
| 14 | MR Manage (MR管理) | MR 管理 (id:1400) | ✅ 一致 | ✅ 已实现 |
| 15 | Device Blacklist (设备黑名单) | 设备黑名单 (id:1500) | ✅ 一致 | ✅ 已实现 |
| 16 | System (系统) | 系统 (id:1600) | ✅ 一致 | ⚠️ 3项 placeholder |

**结论**: 16个顶级菜单结构完全对齐，二级/三级菜单层级也一致。

---

## 二、🔴 严重 Bug：路径冲突

### 2.1 BS 升级 与 系统升级使用相同路由

```typescript
// menus.ts: 基站维护→升级 (id:213)
{ path: '/system/upgrade', component: 'system/upgrade' }

// menus.ts: 系统→升级 (id:1624)
{ path: '/system/upgrade', component: 'system/upgrade' }
```

**两个完全不同的菜单项指向了完全相同的路由和组件！**

| 对比 | 老版 | 新版 Bug |
|------|------|---------|
| BS 升级 | `/BaseStation/Maintenance/upgrade` → gNB/Maintenance/Upgrade/index | `/system/upgrade` |
| 系统升级 | `/System/upgrade` → System/Upgrade/index.vue | `/system/upgrade` ← **相同** |

**影响**: 点击"基站→维护→升级"和"系统→升级"会打开同一个页面。

**建议**: 
- BS 升级应保持独立路径，如 `/base-station/upgrade` 或 `/device/upgrade`
- 系统升级保持在 `/system/upgrade` 但需要和 BS 升级分离

---

## 三、🔴 严重问题：权限控制缺失

### 3.1 新版菜单几乎没有任何权限控制

| 范围 | 老版权限 | 新版权限 |
|------|---------|---------|
| 基站→gNB监控 | `permissionsAnd: [GNB.Monitor.ListGNB]` | **无** |
| 基站→eNB监控 | `permissionsAnd: [ENB.Monitor.ListENB]` | **无** |
| 基站→MML | `permissionsOr: [MML.*]` | **无** |
| 基站→SSH访问计时器 | `permissionsOr: [SSH.Access.ListTimer]` | **无** |
| 基站→升级 | `permissionsOr: [Device.Upgrade.*]` | **无** |
| 基站→证书 | `permissionsAnd: [BaseStation.License.ListLicense]` | **无** |
| 基站→CA | `permissionsOr: [CaTask.List, CaFile.List]` | **无** |
| 基站→常规文件 | `permissionsOr: [DeviceMNormalFile.List]` | **无** |
| 基站→重启 | `permissionsOr: [Device.Reboot.ListRebootTask]` | **无** |
| 基站→重置 | `permissionsOr: [Device.Reset.ListResetTask]` | **无** |
| 基站→关机任务 | `permissionsOr: [ShutDown.ListShutdownTask]` | **无** |
| 基站→备份恢复 | `permissionsOr: [Maintenance.BackupAndRestore.*]` | **无** |
| 基站→相邻小区 | `permissionsOr: [ModelTree.ExportNeighbourCellInfo]` | **无** |
| 基站→日志 | `permissionsOr: [Device.Log.*, GNB.Logs.*]` | **无** |
| 基站→CBSD证书 | `permissionsAnd: [CBSDCertFile.ListDeviceCBSDCertFile]` | **无** |
| CPE→全部 | 全部有权限控制 | **全部无** |
| 设备组 | `permissionsAnd: [DeviceGroup.ListDeviceGroup]` | **无** |
| 群组 | `permissionsAnd: [Cluster.ListCluster]` | **无** |
| 核心网 | `permissionsAnd: [CoreNetwork.ListCoreNetwork]` | **无** |
| GIS | `permissionsAnd: [Map.*]` | **无** |
| 站点 | `permissionsAnd: [Site.ListSites]` | **无** |
| ZTP | `permissionsOr: [ZTP.*]` | **无** |
| 告警 | `permissionsOr: [Alarm.*]` | ✅ `permissionsOr: [Alarm.ListAlarm, Alarm.ListAlarmLibraries]` |
| 性能 | `permissionsOr: [Performance.*]` | **无** |
| 高级→SAS | `permissionsAnd: [SAS.ListCBSD]` | **无** |
| 批量任务 | 全部有权限控制 | **全部无** |
| MR管理 | `permissionsOr: [MR.*]` | **无** |
| 设备黑名单 | `permissionsOr: [DeviceBlackList.*]` | **无** |
| 系统 | `isAdmin` 区域 + 全部子权限 | ✅ `isAdmin: true` (但无子菜单权限) |

**nmsappsrv 后端** 已经有完整的 Casbin RBAC 权限控制（每个 API 都注册了权限），前端只需把对应的 permission_id 填回菜单配置即可。

**建议**: 
1. **最高优先级** —— 从老版路由中提取所有 `permissionsOr`/`permissionsAnd`，逐一对应填到 `menus.ts`
2. 基站/CPE/批量任务/性能等核心模块的权限控制缺失会导致非授权用户看到不该看的菜单
3. 可以写一个脚本辅助对比/生成

---

## 四、🟡 Placeholder 占位页面统计

新版有 **19 个页面** 使用了 `placeholder/index` 占位组件：

| 菜单路径 | 老版对应视图 | 状态 |
|---------|------------|------|
| 基站→eNB 监控 | `gNB/eNBMonitor/index.vue` | 待迁移 |
| 基站→维护→SSH 访问计时器 | `gNB/Maintenance/SSHAccess/index.vue` | 待迁移 |
| 基站→维护→证书 | `gNB/Maintenance/License/index.vue` | 待迁移 |
| 基站→维护→重启 | `gNB/Maintenance/Reboot/index` | 待迁移 |
| 基站→维护→重置 | `gNB/Maintenance/Reset/index` | 待迁移 |
| 基站→维护→关机任务 | `gNB/Maintenance/ShutdownTask/ShutdownTaskPage.vue` | 待迁移 |
| 基站→维护→相邻小区 | `gNB/Maintenance/NeighborCell/index.vue` | 待迁移 |
| CPE→监控 | `CPE/Monitor/index` | 待迁移 |
| CPE→维护→升级 | `CPE/Maintenance/Upgrade/index.vue` | 待迁移 |
| CPE→维护→重启 | `CPE/Maintenance/Reboot/index` | 待迁移 |
| CPE→维护→日志 | `CPE/Maintenance/Log/index` | 待迁移 |
| CPE→CBSD 证书 | `CPE/CBSDCertFile/index.vue` | 待迁移 |
| 群组(Cluster) | `Cluster/ClusterPage.vue` | 待迁移 |
| GIS | `Map/MapPage.vue` | 待迁移 |
| 高级→SAS | `Advance/SAS/index` | 待迁移 |
| 批量任务→添加实例 | `batchTask/object/index.vue` | 待迁移 |
| 系统→北向 | `System/NorthInterface/NorthInterfacePage.vue` | 待迁移 |
| 系统→数据模型 | `System/Parameter/index.vue` | 待迁移 |
| 系统→区域 | `System/Area/AreaPage.vue` | 待迁移 |

**后端覆盖情况**: nmsappsrv 已经提供了所有对应 API：
- CPE: 监控/升级/重启/日志/CBSD ✅ API 全覆盖
- Cluster: cluster 相关 API ✅
- GIS: map/location API ✅  
- SAS: cbsd API ✅
- 批量添加对象: batch-add-object API ✅
- 北向: north-reports API ✅
- 数据模型: tr069-parameters/model-tree API ✅
- 区域: system/areas API ✅

---

## 五、🟡 路由路径重构变化

新版做了大量路径重构（统一用小写/短横线），但需要确保：

| 功能 | 老版路径 | 新版路径 | 问题 |
|------|---------|---------|------|
| gNB 监控 | `/BaseStation/gNBMonitor` | `/device/list` | 路径语义变了 |
| MML 命令 | `/BaseStation/Maintenance/MML` | `/system/mml` | 移到 system 下 |
| BS 升级 | `/BaseStation/Maintenance/upgrade` | `/system/upgrade` | **与系统升级冲突** |
| BS CA | `/BaseStation/Maintenance/ca` | `/system/cacert` | OK |
| BS 常规文件 | `/BaseStation/Maintenance/normalFile` | `/system/normalfile` | OK |
| BS 备份恢复 | `/BaseStation/Maintenance/BackupRestore` | `/system/bsbackup` | OK |
| BS 日志 | `/BaseStation/Maintenance/Log` | `/monitor/device-log` | 移到 monitor |
| CBSD 证书 | `/BaseStation/CBSDCertFile` | `/network/cbsd` | 移到 network |
| ZTP | `/ztp` | `/system/ztp` | 移到 system |
| 黑名单 | `/blacklist` | `/system/blacklist` | 移到 system |
| 站点 | `/Site` | `/network/site` | 移到 network |
| 核心网 | `/CoreNetwork` | `/network/core-network` | 移到 network |

---

## 六、🟢 新版的改进/新增亮点

### 6.1 新增功能页面（老版菜单没有独立菜单项）
新版 `router/modules/static.ts` 中增加了以下路由，其中很多已经对接了 nmsappsrv API：

| 功能 | 路由 | 说明 |
|------|------|------|
| 设备运维 | `/device/ops` | 统一的重启/重置/关机管理入口 |
| 拓扑管理 | `/network/topology` | LTE/NR 拓扑 |
| 事件日志 | `/monitor/event-log` | 独立的事件日志页面 |
| 监控任务 | `/monitor/monitor-task` | 统一监控任务管理 |
| 参数对比 | `/device/param-compare` | 参数对比（新功能） |
| 用户管理 | `/system/user` | 独立用户管理页 |
| 角色管理 | `/system/role` | 独立角色管理页 |
| 安全策略 | `/system/security` | 安全规则/密码策略 |
| 邮件配置 | `/system/mail` | SMTP 配置 |
| 平台设置 | `/system/platform` | 日志/时区/Logo 等 |
| 健康检查 | `/system/health` | MySQL/Redis/队列状态 |
| 心跳管理 | `/system/heartbeat` | 设备心跳状态 |
| 设备认证 | `/system/deviceauth` | 设备认证配置 |
| 北向日志 | `/system/northinterfacelog` | 北向接口审计日志 |
| 租户管理 | `/system/tenancy` | 多租户管理 |

### 6.2 架构改进
- typescript 全面替代 javascript
- 菜单配置与路由配置分离（menus.ts 专门管可见性/权限，static.ts 专门管路由此匹配）
- `resolveMenuItems()` 统一处理 i18n 翻译回退
- Element Plus 图标改用组件名 (`Odometer`) 而非 CSS class (`el-icon-menu-dashboard`)

---

## 七、修复建议（按优先级排序）

### P0 - 立即修复

1. **修复路径冲突 bug**
   ```diff
   // menus.ts id:213 (BS升级)
   - path: '/system/upgrade',
   - component: 'system/upgrade',
   + path: '/base-station/upgrade',
   + component: 'base-station/upgrade',
   ```

2. **补全权限控制**
   从老版路由 `meta.permissionsOr`/`meta.permissionsAnd` 提取所有权限配置，填到 `menus.ts` 的对应菜单项。重点关注：
   - 基站子树 (id:200-230)
   - CPE 子树 (id:300-320)
   - 设备组/群组/核心网/GIS/站点/ZTP (id:400-900)
   - 批量任务子树 (id:1300-1303)
   - 系统子树 (id:1600-1628)

### P1 - 尽快处理

3. **CPE 模块全部是 placeholder**，但 nmsappsrv 后端 API 已就绪，应优先迁移

4. **菜单树中缺失的新页面没有挂在菜单上**
   - `device/ops`（设备运维）应该考虑是否放入基站维护树下
   - `network/topology`（拓扑管理）是否有对应菜单位置
   - `monitor/event-log`（事件日志）是否在告警下
   - `monitor/monitor-task`（监控任务）是否在性能下
   - 系统管理子页面的菜单归属（user/role/security/mail/platform/health 等）

### P2 - 后续优化

5. **逐步迁移其他 placeholder 页面**（SAS、GIS、Cluster、北向、数据模型、区域 等）
6. **确认路径重构方案**后，更新所有页面内的硬编码跳转路径
7. **i18n 完整性检查**：新版 `locales/zh/index.ts` 中 `menu.*` 条目与 `menus.ts` 中的 `i18nKey` 是否完全对应

---

## 八、附录：权限配置对照速查表

### 基站 (BaseStation) 子树

| ID | 菜单 | 老版权限配置 |
|----|------|------------|
| 201 | gNB 监控 | `permissionsAnd: ['GNB.Monitor.ListGNB']` |
| 202 | eNB 监控 | `permissionsAnd: ['ENB.Monitor.ListENB']` |
| 211 | MML | `permissionsOr: [['MML.BatchExecuteMML','MML.ImportMMLAndParameter'],'MML.Script.ListBatchProcessFileLog','MML.Script.ListBatchProcessFile','MML.Script.ListExecuteResultFileLog']` |
| 212 | SSH 访问计时器 | `permissionsOr: ['SSH.Access.ListTimer']` |
| 213 | 升级 | `permissionsOr: ['Device.Upgrade.ListUpgradeTask','Device.Upgrade.ListUpgradeResult','Device.Upgrade.ListRollbackTask','listRollbackResult','Device.Upgrade.ListUpgradeFile','Manual.Upgrade.ListManualUpgradeTask']` |
| 214 | 证书 | `permissionsAnd: ['BaseStation.License.ListLicense']` |
| 215 | CA | `permissionsOr: ['CaTask.List','CaFile.List']` |
| 216 | 常规文件 | `permissionsOr: ['DeviceMNormalFile.List']` |
| 217 | 重启 | `permissionsOr: ['Device.Reboot.ListRebootTask']` |
| 218 | 重置 | `permissionsOr: ['Device.Reset.ListResetTask']` |
| 219 | 关机任务 | `permissionsOr: ['ShutDown.ListShutdownTask']` |
| 220 | 备份/恢复 | `permissionsOr: ['Maintenance.BackupAndRestore.ListBaseStationBackupLatestFileInfo']` |
| 221 | 相邻小区 | `permissionsOr: ['ModelTree.ExportNeighbourCellInfo']` |
| 222 | 日志 | `permissionsOr: ['Device.Log.ListGNBDeviceLogCollectionResult','GNB.Logs.ListGNBEventLog','GNB.Logs.ListBaseStationValueChangeLog']` |
| 230 | CBSD 证书 | `permissionsAnd: ['CBSDCertFile.ListDeviceCBSDCertFile']` |

### CPE 子树

| ID | 菜单 | 老版权限配置 |
|----|------|------------|
| 301 | CPE 监控 | `permissionsOr: ['CPE.Monitor.ListCPE']` |
| 311 | CPE 升级 | `permissionsOr: ['CPE.Upgrade.ListUpgradeTask','CPE.Upgrade.ListUpgradeResult','CPE.Upgrade.ListUpgradeFile']` |
| 312 | CPE 重启 | `permissionsOr: ['CPE.Reboot.ListRebootTask']` |
| 313 | CPE 日志 | `permissionsOr: ['Device.Log.ListCPEDeviceLogCollectionResult','CPE.Log.ListCpeEventLog','CPE.Log.ListCPEValueChangeLog']` |
| 320 | CPE CBSD 证书 | `permissionsAnd: ['CBSDCertFile.ListDeviceCBSDCertFile']` |

### 其他一级菜单

| ID | 菜单 | 老版权限配置 |
|----|------|------------|
| 400 | 设备组 | `permissionsAnd: ['DeviceGroup.ListDeviceGroup']` |
| 500 | 群组 | `permissionsAnd: ['Cluster.ListCluster']` |
| 600 | 核心网 | `permissionsAnd: ['CoreNetwork.ListCoreNetwork']` |
| 700 | GIS | `permissionsAnd: ['Map.ListDeviceWithLocationInfoInDeviceGroup']` |
| 800 | 站点 | `permissionsAnd: ['Site.ListSites']` |
| 900 | ZTP | `permissionsOr: ['ZTP.ListZTPResults','ZTP.ListTBG']` |
| 1000 | 告警 | `permissionsOr: ['Alarm.ListAlarm','Alarm.ListAlarmLibraries']` (✅ 已配置) |
| 1100 | 性能 | `permissionsOr: ['Performance.KPITemplate.ListKPITemplate','Performance.KPIMeas.ListKPIMeas','Performance.ListKPIAlarmTemplate','Performance.KPISet.ListKPISet','Performance.Replenish.List']` |
| 1201 | SAS | `permissionsAnd: ['SAS.ListCBSD']` |
| 1301 | 批量任务→监控 | `permissionsAnd: ['ValueMonitor.ListMonitorTask']` |
| 1302 | 批量任务→配置 | `permissionsOr: ['Configuration.ListBatchConfiguration','ParameterTemplate.List','ParameterMonitor.List','BatchTask.ParameterDeploy.List']` |
| 1303 | 批量任务→添加实例 | `permissionsAnd: ['Configuration.ListBatchAddObjectTask']` |
| 1400 | MR 管理 | `permissionsOr: ['MR.ListMRUploadTask','MR.ListMRUploadLatestTime']` |
| 1500 | 设备黑名单 | `permissionsOr: ['DeviceBlackList.ListDeviceBlackList','DeviceBlackList.ListBlackListOperationLog']` |

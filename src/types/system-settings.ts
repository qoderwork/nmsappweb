/**
 * 系统配置类型定义
 * 对齐 nmsappsrv 后端 systemsettings/model.go
 */

/** 设备配置 */
export interface DeviceConfig {
  deviceInformPeriod?: number | null;
  cpeSignalWeakThreshold?: number | null;
  cpeSignalStrongThreshold?: number | null;
  autoRegistrationEnable?: boolean | undefined;
  pmFileSaveTime?: number | null;
  deviceLogFileSaveTime?: number | null;
  alarmSaveTime?: number | null;
  deviceAuthentication?: boolean | undefined;
  authenticationAlgorithm?: string | null;
  acsUsername?: string | null;
  acsPassword?: string | null;
  maxDeviceCount?: number | null;
}

/** ACS 配置 */
export interface ACSConfig {
  fileServer?: string | null;
  nmsIP?: string | null;
  stunServer?: string | null;
  stunPort?: number | null;
  stunUsername?: string | null;
  stunPassword?: string | null;
  stunMaximumKeepAlivePeriod?: number | null;
  stunMinimumKeepAlivePeriod?: number | null;
  udpConnectionRequestAddressNotificationLimit?: number | null;
  connectionRequestUsername?: string | null;
  connectionRequestPassword?: string | null;
  fileServerUsername?: string | null;
  fileServerPassword?: string | null;
  connectionRequestPasswordChange?: boolean | undefined;
  fileServerPasswordChange?: boolean | undefined;
  stunPasswordChange?: boolean | undefined;
  haAlarmProxyIP?: string | null;
  parameterSyncPeriod?: number | null;
  passwordEncryption?: boolean | undefined;
  logUploadPeriod?: number | null;
  vip?: string | null;
}

/** 日志配置 */
export interface LogConfig {
  pmAndMrSaveTime?: number | null;
  deviceLogSaveTime?: number | null;
  nmsLogSaveTime?: number | null;
  alarmSaveTime?: number | null;
  northboundFileSaveTime?: number | null;
}

/** 北向配置 */
export interface NorthBoundConfig {
  enterpriseOid?: number | null;
  useDefaultOid?: boolean | undefined;
  ip?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  path?: string | null;
  passwordChange?: boolean | undefined;
  privateKey?: string | null;
  type?: number | null;
  enable?: boolean | undefined;
  fileName?: string | null;
}

export type UserStatus = "active" | "disabled" | "frozen";
export type AppProtocol = "OIDC" | "SAML" | "CAS" | "OAuth2";
export type AppStatus = "enabled" | "disabled";
export type RoleType = "system" | "custom";
export type PermissionType = "menu" | "button" | "data";
export type DeviceType = "desktop" | "mobile" | "tablet";
export type LoginStatus = "success" | "fail";
export type RiskLevel = "high" | "medium" | "low";
export type RiskType =
  | "异地登录"
  | "暴力破解"
  | "异常时段"
  | "异常设备"
  | "高频失败";
export type RiskStatus = "pending" | "resolved" | "ignored";
export type RequestStatus = "pending" | "approved" | "rejected";
export type HandleAction = "freeze" | "logout" | "release";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  roleIds: string[];
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  createdBy: string;
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  code: string;
  leaderId?: string;
  leaderName?: string;
  sort: number;
  memberCount: number;
  children?: Department[];
}

export interface Position {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  roleIds: string[];
  memberCount: number;
  quota?: number;
}

export interface LastTestResult {
  success: boolean;
  reason?: string;
  testedAt: string;
  duration: number;
}

export interface Application {
  id: string;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  protocol: AppProtocol;
  clientId?: string;
  clientSecret?: string;
  callbackUrls: string[];
  logoutUrls: string[];
  ipWhitelist: string[];
  mfaRequired: boolean;
  accessHours?: { start: string; end: string };
  status: AppStatus;
  sort: number;
  createdAt: string;
  category: string;
  lastTest?: LastTestResult;
}

export interface AppUsageStat {
  appId: string;
  appName: string;
  date: string;
  loginCount: number;
  uniqueUsers: number;
  failCount: number;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  type: RoleType;
  description?: string;
  permissionCount: number;
  memberCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  type: PermissionType;
  parentId: string | null;
  sort: number;
}

export interface PermissionRequest {
  id: string;
  userId: string;
  userName: string;
  userDept: string;
  roleId: string;
  roleName: string;
  reason: string;
  status: RequestStatus;
  submitAt: string;
  approverId?: string;
  approverName?: string;
  approveAt?: string;
  approveRemark?: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  appId: string;
  appName: string;
  ip: string;
  location: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  deviceFingerprint: string;
  status: LoginStatus;
  failReason?: string;
  loginAt: string;
  sessionId?: string;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  appId: string;
  appName: string;
  ip: string;
  location: string;
  loginAt: string;
  lastActiveAt: string;
  userAgent: string;
  isOnline: boolean;
}

export interface RiskEvent {
  id: string;
  type: RiskType;
  level: RiskLevel;
  userId: string;
  userName: string;
  userDept: string;
  ip: string;
  description: string;
  detectedAt: string;
  status: RiskStatus;
  handlerId?: string;
  handlerName?: string;
  handleAt?: string;
  handleRemark?: string;
  handleAction?: HandleAction;
}

export interface RiskRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  threshold: Record<string, number>;
  level: RiskLevel;
  description: string;
}

export interface AuditLog {
  id: string;
  operatorId: string;
  operatorName: string;
  module: string;
  action: string;
  targetId: string;
  targetName: string;
  beforeValue?: string;
  afterValue?: string;
  ip: string;
  operateAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersTrend: number;
  onlineSessions: number;
  onlineSessionsTrend: number;
  totalApps: number;
  totalAppsTrend: number;
  pendingApprovals: number;
  pendingApprovalsTrend: number;
  riskAlerts: number;
  riskAlertsTrend: number;
  loginSuccessRate: number;
}

export interface TrendPoint {
  date: string;
  active: number;
  login: number;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

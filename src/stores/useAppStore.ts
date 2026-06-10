import { create } from "zustand";
import {
  User,
  Application,
  PermissionRequest,
  Session,
  RiskEvent,
  AuditLog,
  UserStatus,
  RequestStatus,
  RiskStatus,
  HandleAction,
} from "@/types";
import {
  mockUsers,
  mockApplications,
  mockPermissionRequests,
  mockSessions,
  mockRiskEvents,
  mockAuditLogs,
} from "@/mock";

interface TempAccessCode {
  id: string;
  userId: string;
  userName: string;
  code: string;
  expireAt: string;
  purpose: string;
  createdAt: string;
  createdBy: string;
}

const CURRENT_ADMIN = { id: "u001", name: "张三", ip: "10.0.1.23" };

const genId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const now = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface AppState {
  users: User[];
  applications: Application[];
  permissionRequests: PermissionRequest[];
  sessions: Session[];
  riskEvents: RiskEvent[];
  auditLogs: AuditLog[];
  tempCodes: TempAccessCode[];
  departedUsers: {
    userId: string;
    userName: string;
    dept: string;
    position: string;
    roleIds: string[];
    departDate: string;
    riskLevel: "high" | "medium" | "low";
    recycled: boolean;
    recycledAt?: string;
    recycledBy?: string;
  }[];

  addAuditLog: (log: Partial<AuditLog>) => void;

  updateUserStatus: (userId: string, status: UserStatus) => void;
  toggleUserStatus: (userId: string) => void;
  resetUserPassword: (userId: string) => void;
  createUser: (data: Partial<User> & { name: string; username: string }) => User;
  generateTempCode: (
    userId: string,
    purpose: string,
    hours: number
  ) => TempAccessCode;
  batchImportUsers: (
    count: number,
    departmentId: string,
    departmentName: string
  ) => { count: number; sample: User[] };

  processPermissionRequest: (
    requestId: string,
    approved: boolean,
    remark: string
  ) => void;
  recycleDepartedUser: (userId: string) => void;

  logoutSession: (sessionId: string) => void;
  batchLogoutSessions: (sessionIds: string[]) => void;

  handleRiskEvent: (
    eventId: string,
    action: HandleAction,
    remark: string
  ) => void;
  batchHandleRiskEvents: (
    eventIds: string[],
    action: HandleAction,
    remark: string
  ) => void;
  freezeUserFromRisk: (userId: string, remark: string) => void;

  updateApplication: (appId: string, patch: Partial<Application>) => void;
  toggleAppStatus: (appId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [...mockUsers],
  applications: [...mockApplications],
  permissionRequests: [...mockPermissionRequests],
  sessions: [...mockSessions],
  riskEvents: [...mockRiskEvents],
  auditLogs: [...mockAuditLogs],
  tempCodes: [],
  departedUsers: [
    {
      userId: "u006",
      userName: "周八",
      dept: "后端开发组",
      position: "高级开发工程师",
      roleIds: ["r004"],
      departDate: "2026-06-05",
      riskLevel: "medium",
      recycled: false,
    },
    {
      userId: "u-depart-2",
      userName: "钱七",
      dept: "测试运维组",
      position: "运维工程师",
      roleIds: ["r004", "r007"],
      departDate: "2026-06-08",
      riskLevel: "high",
      recycled: false,
    },
    {
      userId: "u-depart-3",
      userName: "孙九",
      dept: "市场营销部",
      position: "市场专员",
      roleIds: ["r004"],
      departDate: "2026-05-28",
      riskLevel: "low",
      recycled: true,
      recycledAt: "2026-05-30 10:20:00",
      recycledBy: "张三",
    },
  ],

  addAuditLog: (log) => {
    const entry: AuditLog = {
      id: genId("al"),
      operatorId: CURRENT_ADMIN.id,
      operatorName: CURRENT_ADMIN.name,
      module: log.module || "系统",
      action: log.action || "操作",
      targetId: log.targetId || "-",
      targetName: log.targetName || "-",
      beforeValue: log.beforeValue,
      afterValue: log.afterValue,
      ip: CURRENT_ADMIN.ip,
      operateAt: now(),
    };
    set((s) => ({ auditLogs: [entry, ...s.auditLogs].slice(0, 1000) }));
  },

  updateUserStatus: (userId, status) => {
    const before = get().users.find((u) => u.id === userId);
    if (!before) return;
    if (before.status === status) return;
    set((s) => ({
      users: s.users.map((u) =>
        u.id === userId ? { ...u, status } : u
      ),
    }));
    const statusLabel = { active: "启用", disabled: "停用", frozen: "冻结" };
    get().addAuditLog({
      module: "用户目录",
      action: `${statusLabel[status]}账号`,
      targetId: userId,
      targetName: before.name,
      beforeValue: statusLabel[before.status],
      afterValue: statusLabel[status],
    });
  },

  toggleUserStatus: (userId) => {
    const u = get().users.find((x) => x.id === userId);
    if (!u) return;
    if (u.status === "frozen") {
      get().updateUserStatus(userId, "active");
      return;
    }
    get().updateUserStatus(userId, u.status === "active" ? "disabled" : "active");
  },

  resetUserPassword: (userId) => {
    const u = get().users.find((x) => x.id === userId);
    if (!u) return;
    get().addAuditLog({
      module: "用户目录",
      action: "重置密码",
      targetId: userId,
      targetName: u.name,
      beforeValue: "-",
      afterValue: "临时密码已发送至邮箱",
    });
  },

  createUser: (data) => {
    const newUser: User = {
      id: genId("u"),
      username: data.username || `user_${Math.random().toString(36).slice(2, 6)}`,
      name: data.name,
      email: data.email || `${data.username || "new"}@group.com`,
      phone: data.phone || "13800000000",
      departmentId: data.departmentId || "d001",
      departmentName: data.departmentName || "技术研发中心",
      positionId: data.positionId || "p002",
      positionName: data.positionName || "高级开发工程师",
      roleIds: data.roleIds || ["r004"],
      status: "active",
      mfaEnabled: false,
      createdAt: now(),
      createdBy: CURRENT_ADMIN.id,
    };
    set((s) => ({ users: [newUser, ...s.users] }));
    get().addAuditLog({
      module: "用户目录",
      action: "新增账号",
      targetId: newUser.id,
      targetName: newUser.name,
      beforeValue: "-",
      afterValue: `{dept: ${newUser.departmentName}, role: ${newUser.roleIds.join(",")}}`,
    });
    return newUser;
  },

  generateTempCode: (userId, purpose, hours) => {
    const u = get().users.find((x) => x.id === userId);
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expireD = new Date();
    expireD.setHours(expireD.getHours() + hours);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const expireAt = `${expireD.getFullYear()}-${pad(expireD.getMonth() + 1)}-${pad(
      expireD.getDate()
    )} ${pad(expireD.getHours())}:${pad(expireD.getMinutes())}:${pad(expireD.getSeconds())}`;
    const tc: TempAccessCode = {
      id: genId("tc"),
      userId,
      userName: u?.name || "-",
      code,
      expireAt,
      purpose,
      createdAt: now(),
      createdBy: CURRENT_ADMIN.name,
    };
    set((s) => ({ tempCodes: [tc, ...s.tempCodes] }));
    get().addAuditLog({
      module: "用户目录",
      action: "发放临时访问码",
      targetId: userId,
      targetName: u?.name || "-",
      beforeValue: "-",
      afterValue: `有效期${hours}小时，用途：${purpose || "未填写"}`,
    });
    return tc;
  },

  batchImportUsers: (count, departmentId, departmentName) => {
    const surnames = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈"];
    const givenNames = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "洋", "艳"];
    const newUsers: User[] = [];
    for (let i = 0; i < count; i++) {
      const name = `${surnames[i % surnames.length]}${givenNames[(i + 3) % givenNames.length]}${
        i + 1
      }`;
      newUsers.push({
        id: genId("u"),
        username: `import_${Date.now().toString(36)}_${i}`,
        name,
        email: `import_${i}_${Date.now()}@group.com`,
        phone: `139${(10000000 + Math.floor(Math.random() * 89999999)).toString().slice(0, 9)}`,
        departmentId,
        departmentName,
        positionId: "p002",
        positionName: "高级开发工程师",
        roleIds: ["r004"],
        status: "active",
        mfaEnabled: false,
        createdAt: now(),
        createdBy: CURRENT_ADMIN.id,
      });
    }
    set((s) => ({ users: [...newUsers, ...s.users] }));
    get().addAuditLog({
      module: "用户目录",
      action: "批量导入人员",
      targetId: departmentId,
      targetName: departmentName,
      beforeValue: "-",
      afterValue: `成功导入 ${count} 人`,
    });
    return { count, sample: newUsers.slice(0, 3) };
  },

  processPermissionRequest: (requestId, approved, remark) => {
    const req = get().permissionRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "pending") return;
    const newStatus: RequestStatus = approved ? "approved" : "rejected";
    set((s) => ({
      permissionRequests: s.permissionRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              approverId: CURRENT_ADMIN.id,
              approverName: CURRENT_ADMIN.name,
              approveAt: now(),
              approveRemark: remark || (approved ? "同意" : "驳回"),
            }
          : r
      ),
    }));
    if (approved) {
      const old = get().users.find((u) => u.id === req.userId);
      if (old && !old.roleIds.includes(req.roleId)) {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === req.userId
              ? { ...u, roleIds: [...u.roleIds, req.roleId] }
              : u
          ),
        }));
      }
    }
    get().addAuditLog({
      module: "权限角色",
      action: approved ? "审批通过" : "审批驳回",
      targetId: requestId,
      targetName: `${req.userName} → ${req.roleName}`,
      beforeValue: "pending",
      afterValue: `${newStatus}${remark ? `，备注：${remark}` : ""}`,
    });
  },

  recycleDepartedUser: (userId) => {
    const d = get().departedUsers.find((x) => x.userId === userId);
    if (!d) return;
    set((s) => ({
      departedUsers: s.departedUsers.map((x) =>
        x.userId === userId
          ? { ...x, recycled: true, recycledAt: now(), recycledBy: CURRENT_ADMIN.name }
          : x
      ),
    }));
    get().updateUserStatus(userId, "disabled");
    const oldSessions = get().sessions.filter((s) => s.userId === userId);
    if (oldSessions.length > 0) {
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.userId === userId ? { ...x, isOnline: false } : x
        ),
      }));
    }
    get().addAuditLog({
      module: "权限角色",
      action: "离职权限回收",
      targetId: userId,
      targetName: d.userName,
      beforeValue: "待回收",
      afterValue: `已回收，撤销角色 ${d.roleIds.join(",")}，强制下线 ${oldSessions.length} 个会话`,
    });
  },

  logoutSession: (sessionId) => {
    const ss = get().sessions.find((s) => s.id === sessionId);
    if (!ss || !ss.isOnline) return;
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === sessionId ? { ...x, isOnline: false } : x
      ),
    }));
    get().addAuditLog({
      module: "登录审计",
      action: "强制下线会话",
      targetId: sessionId,
      targetName: `${ss.userName} - ${ss.appName}`,
      beforeValue: "在线",
      afterValue: "已下线",
    });
  },

  batchLogoutSessions: (sessionIds) => {
    const validIds = sessionIds.filter((id) => {
      const ss = get().sessions.find((s) => s.id === id);
      return ss && ss.isOnline;
    });
    if (!validIds.length) return;
    set((s) => ({
      sessions: s.sessions.map((x) =>
        validIds.includes(x.id) ? { ...x, isOnline: false } : x
      ),
    }));
    const targets = validIds
      .map((id) => {
        const ss = get().sessions.find((s) => s.id === id);
        return ss ? `${ss.userName}@${ss.appName}` : "";
      })
      .filter(Boolean)
      .join("；");
    get().addAuditLog({
      module: "登录审计",
      action: "批量强制下线",
      targetId: validIds.join(","),
      targetName: targets,
      beforeValue: `${validIds.length} 个会话在线`,
      afterValue: "全部已下线",
    });
  },

  handleRiskEvent: (eventId, action, remark) => {
    const ev = get().riskEvents.find((r) => r.id === eventId);
    if (!ev) return;
    set((s) => ({
      riskEvents: s.riskEvents.map((r) =>
        r.id === eventId
          ? {
              ...r,
              status: "resolved",
              handlerId: CURRENT_ADMIN.id,
              handlerName: CURRENT_ADMIN.name,
              handleAt: now(),
              handleRemark: remark,
              handleAction: action,
            }
          : r
      ),
    }));
    if (action === "freeze") {
      get().updateUserStatus(ev.userId, "frozen");
    }
    if (action === "logout") {
      const us = get().sessions.filter((s) => s.userId === ev.userId && s.isOnline);
      us.forEach((s) => get().logoutSession(s.id));
    }
    const actionLabel = { freeze: "冻结账号", logout: "强制下线", release: "标记放行" };
    get().addAuditLog({
      module: "风险处置",
      action: `处置风险-${actionLabel[action]}`,
      targetId: eventId,
      targetName: `${ev.type} / ${ev.userName}`,
      beforeValue: "待处置",
      afterValue: `已处置${remark ? `，备注：${remark}` : ""}`,
    });
  },

  batchHandleRiskEvents: (eventIds, action, remark) => {
    eventIds.forEach((id) => get().handleRiskEvent(id, action, remark));
  },

  freezeUserFromRisk: (userId, remark) => {
    const u = get().users.find((x) => x.id === userId);
    if (!u) return;
    get().updateUserStatus(userId, "frozen");
    get().addAuditLog({
      module: "风险处置",
      action: "异常账号冻结",
      targetId: userId,
      targetName: u.name,
      beforeValue: u.status,
      afterValue: `frozen${remark ? `，备注：${remark}` : ""}`,
    });
  },

  updateApplication: (appId, patch) => {
    const before = get().applications.find((a) => a.id === appId);
    if (!before) return;
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? { ...a, ...patch } : a
      ),
    }));
    const keysChanged = Object.keys(patch)
      .map((k) => `${k}`)
      .join(",");
    get().addAuditLog({
      module: "应用接入",
      action: "保存应用配置",
      targetId: appId,
      targetName: before.name,
      beforeValue: `-`,
      afterValue: `更新字段: ${keysChanged}`,
    });
  },

  toggleAppStatus: (appId) => {
    const a = get().applications.find((x) => x.id === appId);
    if (!a) return;
    const next = a.status === "enabled" ? "disabled" : "enabled";
    get().updateApplication(appId, { status: next });
    get().addAuditLog({
      module: "应用接入",
      action: next === "enabled" ? "启用应用" : "停用应用",
      targetId: appId,
      targetName: a.name,
      beforeValue: a.status,
      afterValue: next,
    });
  },
}));

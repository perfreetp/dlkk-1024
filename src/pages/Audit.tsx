import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { Modal, toast } from "@/components/ui/Modal";
import {
  Download,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Table,
  History,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Users,
  AppWindow,
  ShieldAlert,
  ClipboardCheck,
  FileWarning,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  mockLoginLogs,
  mockSessions,
  mockAuditLogs,
  mockApplications,
  generateTrendData,
} from "@/mock";
import type {
  LoginLog,
  Session,
  DeviceType,
  LoginStatus,
  AuditLog,
} from "@/types";

type AuditTab = "loginLogs" | "sessions" | "reports";
type LoginLogView = "table" | "timeline";
type ReportType =
  | "trend"
  | "userActive"
  | "appAccess"
  | "abnormal"
  | "operation"
  | "risk"
  | "compliance";

const tabs: { key: AuditTab; label: string }[] = [
  { key: "loginLogs", label: "登录日志" },
  { key: "sessions", label: "在线会话" },
  { key: "reports", label: "审计报表" },
];

const reportTypes: {
  key: ReportType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    key: "trend",
    label: "登录趋势分析报表",
    icon: FileBarChart,
    description: "展示一段时间内系统登录次数、活跃用户数的变化趋势",
  },
  {
    key: "userActive",
    label: "用户活跃统计报表",
    icon: Users,
    description: "统计用户登录频次、在线时长等活跃度指标",
  },
  {
    key: "appAccess",
    label: "应用访问统计报表",
    icon: AppWindow,
    description: "各应用系统的访问量、独立用户数统计",
  },
  {
    key: "abnormal",
    label: "异常登录分析报表",
    icon: ShieldAlert,
    description: "登录失败、异地登录、暴力破解等异常行为分析",
  },
  {
    key: "operation",
    label: "操作审计报表",
    icon: ClipboardCheck,
    description: "管理员操作日志记录与审计",
  },
  {
    key: "risk",
    label: "风险事件处置报表",
    icon: FileWarning,
    description: "风险事件的识别、处置与统计",
  },
  {
    key: "compliance",
    label: "月度合规报表",
    icon: Calendar,
    description: "符合等保、ISO27001等合规要求的月度汇总报表",
  },
];

const deviceIconMap: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const deviceLabelMap: Record<DeviceType, string> = {
  desktop: "桌面",
  mobile: "移动",
  tablet: "平板",
};

const avatarColors = [
  "bg-brand-100 text-brand-700",
  "bg-safe-100 text-safe-700",
  "bg-warn-100 text-warn-700",
  "bg-danger-100 text-danger-700",
];

function formatTimeAgo(lastActiveAt: string): {
  label: string;
  level: "active" | "normal" | "idle";
  minutes: number;
} {
  const now = new Date("2026-06-10 09:50:00").getTime();
  const last = new Date(lastActiveAt).getTime();
  const diffMin = Math.floor((now - last) / 60000);
  if (diffMin <= 5) return { label: `${diffMin}分钟前`, level: "active", minutes: diffMin };
  if (diffMin <= 10) return { label: `${diffMin}分钟前`, level: "normal", minutes: diffMin };
  return { label: `${diffMin}分钟前`, level: "idle", minutes: diffMin };
}

export default function Audit() {
  const [activeTab, setActiveTab] = useState<AuditTab>("loginLogs");

  return (
    <div className="space-y-5">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">
            登录审计
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            全面追踪所有系统访问行为，满足合规审计与安全追溯需求
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            <span>导出报表</span>
          </button>
        </div>
      </section>

      <section className="flex gap-4 animate-fade-in-up stagger-1">
        <div className="flex gap-1 p-1 bg-ink-100/70 rounded-md">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={
                  isActive
                    ? "inline-flex items-center px-4 py-1.5 rounded-md text-sm font-medium bg-white text-brand-700 shadow-sm"
                    : "inline-flex items-center px-4 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:text-ink-800 transition-colors"
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "loginLogs" && <LoginLogsTab />}
      {activeTab === "sessions" && <SessionsTab />}
      {activeTab === "reports" && <ReportsTab />}
    </div>
  );
}

function LoginLogsTab() {
  const [view, setView] = useState<LoginLogView>("table");
  const [searchText, setSearchText] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState<"all" | LoginStatus>("all");
  const [appFilter, setAppFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | DeviceType>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return mockLoginLogs.filter((log) => {
      if (searchText) {
        const kw = searchText.toLowerCase();
        if (
          !log.userName.toLowerCase().includes(kw) &&
          !log.ip.includes(kw) &&
          !log.appName.toLowerCase().includes(kw)
        )
          return false;
      }
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (appFilter && log.appId !== appFilter) return false;
      if (deviceFilter !== "all" && log.deviceType !== deviceFilter)
        return false;
      return true;
    });
  }, [searchText, statusFilter, appFilter, deviceFilter]);

  const resetFilters = () => {
    setSearchText("");
    setTimeRange("7d");
    setStatusFilter("all");
    setAppFilter("");
    setDeviceFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <section className="card-base p-4 mb-4 animate-fade-in-up stagger-2">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              className="input-base !pl-9"
              placeholder="用户名 / IP / 应用搜索"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="input-base appearance-none pr-8 w-36"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="today">今日</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="custom">自定义</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="input-base appearance-none pr-8 w-28"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | LoginStatus)
              }
            >
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="fail">失败</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="input-base appearance-none pr-8 w-44"
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
            >
              <option value="">全部应用</option>
              {mockApplications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="input-base appearance-none pr-8 w-28"
              value={deviceFilter}
              onChange={(e) =>
                setDeviceFilter(e.target.value as "all" | DeviceType)
              }
            >
              <option value="all">全部设备</option>
              <option value="desktop">桌面</option>
              <option value="mobile">移动</option>
              <option value="tablet">平板</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-ghost">
              <SlidersHorizontal className="w-4 h-4" />
              <span>高级筛选</span>
            </button>
            <button className="btn-ghost" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4" />
              <span>重置</span>
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-ink-100 flex justify-end gap-1">
          <button
            onClick={() => setView("table")}
            className={
              view === "table"
                ? "inline-flex items-center justify-center w-8 h-8 rounded-md bg-brand-50 text-brand-600"
                : "inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-600"
            }
            title="表格视图"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("timeline")}
            className={
              view === "timeline"
                ? "inline-flex items-center justify-center w-8 h-8 rounded-md bg-brand-50 text-brand-600"
                : "inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-600"
            }
            title="时间线视图"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </section>

      {view === "table" ? (
        <LoginLogsTable logs={filteredLogs} />
      ) : (
        <LoginLogsTimeline logs={filteredLogs} />
      )}

      <PaginationBar
        total={filteredLogs.length}
        currentPage={currentPage}
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

function LoginLogsTable({ logs }: { logs: LoginLog[] }) {
  const navigate = useNavigate();

  const handleInitiateRisk = (log: LoginLog) => {
    toast.info(`已从登录日志发起风险处置：用户 ${log.userName}，IP ${log.ip}`);
    navigate("/risk");
  };

  return (
    <section className="card-base overflow-auto scrollbar-thin animate-fade-in-up stagger-3">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-th w-40">时间</th>
            <th className="table-th w-44">用户</th>
            <th className="table-th w-48">应用</th>
            <th className="table-th w-44">IP / 地点</th>
            <th className="table-th w-48">设备</th>
            <th className="table-th w-24">状态</th>
            <th className="table-th w-36 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const DeviceIcon = deviceIconMap[log.deviceType];
            const initial = log.userName.charAt(0);
            const avatarCls = avatarColors[idx % avatarColors.length];
            const isFail = log.status === "fail";
            return (
              <tr
                key={log.id}
                className={`table-row ${isFail ? "bg-danger-50/30" : ""}`}
              >
                <td className="table-td font-mono text-xs text-ink-600 whitespace-nowrap">
                  {log.loginAt}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${avatarCls}`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-800">
                        {log.userName}
                      </div>
                      <span className="badge-neutral text-[10px] mt-0.5">
                        技术中心
                      </span>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <div className="text-sm text-ink-800">{log.appName}</div>
                  <span className="badge-info text-[10px] mt-0.5">
                    {getAppProtocol(log.appId)}
                  </span>
                </td>
                <td className="table-td">
                  <div className="font-mono text-xs text-ink-700">{log.ip}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{log.location}</span>
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-ink-50 flex items-center justify-center text-ink-500">
                      <DeviceIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm text-ink-800">{log.os}</div>
                      <div className="text-xs text-ink-500">{log.browser}</div>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  {isFail ? (
                    <div className="group relative inline-block">
                      <span className="badge-danger">失败</span>
                      {log.failReason && (
                        <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-ink-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          {log.failReason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="badge-safe">成功</span>
                  )}
                </td>
                <td className="table-td text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                      title="详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isFail && (
                      <button
                        onClick={() => handleInitiateRisk(log)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-danger-600 hover:bg-danger-50 border border-danger-200 transition-colors"
                        title="发起风险处置"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>风险处置</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="table-td text-center text-ink-400 py-12"
              >
                暂无匹配的登录日志
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function LoginLogsTimeline({ logs }: { logs: LoginLog[] }) {
  const navigate = useNavigate();

  const handleInitiateRisk = (log: LoginLog) => {
    toast.info(`已从登录日志发起风险处置：用户 ${log.userName}，IP ${log.ip}`);
    navigate("/risk");
  };

  return (
    <section className="card-base p-6 animate-fade-in-up stagger-3">
      <ol className="relative border-l-2 border-ink-200 ml-3 space-y-6">
        {logs.map((log, idx) => {
          const DeviceIcon = deviceIconMap[log.deviceType];
          const initial = log.userName.charAt(0);
          const avatarCls = avatarColors[idx % avatarColors.length];
          const isFail = log.status === "fail";
          return (
            <li key={log.id} className="ml-6">
              <span
                className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                  isFail ? "bg-danger-500" : "bg-safe-500"
                }`}
              />
              <div className="flex flex-wrap items-start gap-4">
                <div className="w-36 shrink-0">
                  <div className="font-mono text-xs text-ink-600">
                    {log.loginAt.slice(5, 16)}
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {log.loginAt.slice(0, 10)}
                  </div>
                </div>
                <div className={`flex-1 card-base p-4 ${isFail ? "border-danger-200 bg-danger-50/20" : ""}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${avatarCls}`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-800">
                          {log.userName}
                        </span>
                        <span className="badge-info text-[10px]">
                          {log.appName}
                        </span>
                        {isFail ? (
                          <span className="badge-danger">失败</span>
                        ) : (
                          <span className="badge-safe">成功</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span className="font-mono">{log.ip}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {log.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DeviceIcon className="w-3 h-3" />
                          {deviceLabelMap[log.deviceType]} · {log.os} · {log.browser}
                        </span>
                      </div>
                      {isFail && log.failReason && (
                        <div className="mt-2 text-xs text-danger-600 bg-danger-50 rounded px-2 py-1">
                          失败原因：{log.failReason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                        title="详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isFail && (
                        <button
                          onClick={() => handleInitiateRisk(log)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-danger-600 hover:bg-danger-50 border border-danger-200 transition-colors"
                          title="发起风险处置"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>风险处置</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {logs.length === 0 && (
          <li className="ml-6 py-12 text-center text-ink-400">暂无数据</li>
        )}
      </ol>
    </section>
  );
}

function SessionsTab() {
  const sessions = useAppStore((s) => s.sessions);
  const logoutSession = useAppStore((s) => s.logoutSession);
  const batchLogoutSessions = useAppStore((s) => s.batchLogoutSessions);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [targetSession, setTargetSession] = useState<Session | null>(null);

  const onlineSessions = useMemo(
    () => sessions.filter((s) => s.isOnline),
    [sessions]
  );

  const abnormalCount = useMemo(() => {
    return onlineSessions.filter((s) => {
      const ua = s.userAgent.toLowerCase();
      return ua.includes("bot") || ua.includes("curl") || ua.includes("scrapy");
    }).length || 2;
  }, [onlineSessions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === onlineSessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(onlineSessions.map((s) => s.id));
    }
  };

  const handleSingleLogoutClick = (s: Session) => {
    setTargetSession(s);
    setSingleModalOpen(true);
  };

  const confirmSingleLogout = () => {
    if (!targetSession) return;
    logoutSession(targetSession.id);
    toast.success("已强制下线该会话");
    setSelectedIds((prev) => prev.filter((id) => id !== targetSession.id));
    setSingleModalOpen(false);
    setTargetSession(null);
  };

  const confirmBatchLogout = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    batchLogoutSessions([...selectedIds]);
    toast.success(`已强制下线 ${count} 个会话`);
    setSelectedIds([]);
    setBatchModalOpen(false);
  };

  const selectedSessionsForPreview = useMemo(() => {
    return onlineSessions.filter((s) => selectedIds.includes(s.id));
  }, [onlineSessions, selectedIds]);

  const totalPages = Math.max(1, Math.ceil(onlineSessions.length / 12));

  return (
    <div className="space-y-4">
      <div className="text-xs text-ink-400 flex items-center gap-1 animate-fade-in-up stagger-1">
        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-safe-500">
          <span className="absolute inline-flex h-full w-full rounded-full bg-safe-400 opacity-75 animate-ping" />
        </span>
        当前在线会话数将实时更新
      </div>

      <section className="flex gap-4 mb-4 animate-fade-in-up stagger-2">
        <div className="flex-1 card-base p-4">
          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-xs text-ink-500">当前在线</div>
              <div className="mt-1 text-2xl font-bold font-display text-safe-600 tabular-nums">
                {onlineSessions.length}
              </div>
            </div>
            <div className="w-px h-10 bg-ink-200" />
            <div>
              <div className="text-xs text-ink-500">今日峰值</div>
              <div className="mt-1 text-2xl font-bold font-display text-ink-800 tabular-nums">
                87
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 card-base p-4">
          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-xs text-ink-500">平均时长</div>
              <div className="mt-1 text-2xl font-bold font-display text-brand-600 tabular-nums">
                2h43m
              </div>
            </div>
            <div className="w-px h-10 bg-ink-200" />
            <div>
              <div className="text-xs text-ink-500">异常会话</div>
              <div className="mt-1 text-2xl font-bold font-display text-danger-600 tabular-nums">
                {abnormalCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="card-base p-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink-600">
              已选中 <span className="font-semibold text-ink-800">{selectedIds.length}</span> 项
            </div>
            <button
              className="btn-danger !py-1.5"
              onClick={() => setBatchModalOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              <span>批量强制下线</span>
            </button>
          </div>
        </section>
      )}

      <section className="card-base overflow-auto scrollbar-thin animate-fade-in-up stagger-3">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
          <div className="text-sm text-ink-600">
            共 <span className="font-semibold text-ink-800">{onlineSessions.length}</span> 个在线会话
          </div>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === onlineSessions.length &&
                    onlineSessions.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/20"
                />
              </th>
              <th className="table-th w-44">用户</th>
              <th className="table-th w-44">访问应用</th>
              <th className="table-th w-32">登录IP</th>
              <th className="table-th w-36">登录地点</th>
              <th className="table-th w-40">登录时间</th>
              <th className="table-th w-32">最近活动</th>
              <th className="table-th w-44">设备 UA</th>
              <th className="table-th w-24">状态</th>
              <th className="table-th w-44 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {onlineSessions.map((s, idx) => {
              const initial = s.userName.charAt(0);
              const avatarCls = avatarColors[idx % avatarColors.length];
              const activity = formatTimeAgo(s.lastActiveAt);
              return (
                <tr key={s.id} className="table-row">
                  <td className="table-td">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/20"
                    />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${avatarCls}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-800">
                          {s.userName}
                        </div>
                        <div className="text-xs text-ink-500">技术中心</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-ink-800">{s.appName}</span>
                  </td>
                  <td className="table-td font-mono text-xs text-ink-700">
                    {s.ip}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1 text-xs text-ink-600">
                      <MapPin className="w-3 h-3 text-ink-400" />
                      {s.location}
                    </div>
                  </td>
                  <td className="table-td text-xs text-ink-600 whitespace-nowrap font-mono">
                    {s.loginAt}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`relative inline-flex w-2 h-2 rounded-full ${
                          activity.level === "active"
                            ? "bg-safe-500"
                            : activity.level === "normal"
                            ? "bg-brand-500"
                            : "bg-ink-300"
                        }`}
                      >
                        {activity.level === "active" && (
                          <span className="absolute inline-flex h-full w-full rounded-full bg-safe-400 opacity-75 animate-ping" />
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          activity.level === "active"
                            ? "text-safe-600 font-medium"
                            : activity.level === "normal"
                            ? "text-ink-600"
                            : "text-ink-400"
                        }`}
                      >
                        {activity.label}
                      </span>
                    </div>
                  </td>
                  <td className="table-td text-xs text-ink-500">
                    {s.userAgent}
                  </td>
                  <td className="table-td">
                    <span className="badge-safe">
                      <span className="relative flex w-1.5 h-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-safe-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-safe-500" />
                      </span>
                      Online
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSingleLogoutClick(s)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-danger-600 hover:bg-danger-50 border border-danger-200 transition-colors"
                        title="强制下线"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>下线</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {onlineSessions.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="table-td text-center text-ink-400 py-12"
                >
                  暂无在线会话
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <PaginationBar
        total={onlineSessions.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal
        open={singleModalOpen}
        onClose={() => setSingleModalOpen(false)}
        title="确认强制下线此会话？"
        icon={<AlertTriangle className="w-5 h-5 text-danger-600" />}
        width="max-w-md"
        footer={
          <>
            <button
              className="btn-ghost"
              onClick={() => setSingleModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-danger" onClick={confirmSingleLogout}>
              确认下线
            </button>
          </>
        }
      >
        {targetSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <div className="text-xs text-ink-400 mb-0.5">用户</div>
                <div className="text-ink-800 font-medium">{targetSession.userName}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5">应用</div>
                <div className="text-ink-800 font-medium">{targetSession.appName}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5">登录 IP</div>
                <div className="text-ink-800 font-mono text-xs">{targetSession.ip}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5">登录地点</div>
                <div className="text-ink-800">{targetSession.location}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5">登录时间</div>
                <div className="text-ink-800 font-mono text-xs">{targetSession.loginAt}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5">最近活动</div>
                <div className="text-ink-800 font-mono text-xs">{targetSession.lastActiveAt}</div>
              </div>
            </div>
            <div className="rounded-md bg-warn-50 border border-warn-200 px-3 py-2.5 text-xs text-warn-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>提示：用户将立即被退出当前系统，需要重新登录才能继续访问。</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="确认批量强制下线？"
        icon={<AlertTriangle className="w-5 h-5 text-danger-600" />}
        width="max-w-md"
        footer={
          <>
            <button
              className="btn-ghost"
              onClick={() => setBatchModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-danger" onClick={confirmBatchLogout}>
              确认批量下线
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-ink-600">
            即将强制下线选中的 <span className="font-semibold text-danger-600">{selectedIds.length}</span> 个会话，所有相关用户将被系统登出。
          </div>
          <div className="rounded-md border border-ink-200 divide-y divide-ink-100 max-h-56 overflow-y-auto scrollbar-thin">
            {selectedSessionsForPreview.slice(0, 5).map((s) => (
              <div key={s.id} className="px-3 py-2 text-sm text-ink-700 flex items-center justify-between">
                <span>{s.userName}</span>
                <span className="text-xs text-ink-400">- {s.appName}</span>
              </div>
            ))}
            {selectedSessionsForPreview.length > 5 && (
              <div className="px-3 py-2 text-xs text-ink-400">
                等 {selectedSessionsForPreview.length} 个会话
              </div>
            )}
          </div>
          <div className="rounded-md bg-warn-50 border border-warn-200 px-3 py-2.5 text-xs text-warn-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>提示：此操作不可撤销，所有选中用户将立即被系统登出。</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportType>("trend");
  const activeReportDef = reportTypes.find((r) => r.key === activeReport)!;

  return (
    <div className="flex gap-4 animate-fade-in-up stagger-2">
      <div className="w-72 card-base p-0 overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-ink-200 bg-ink-50/50">
          <h3 className="text-sm font-semibold text-ink-800">报表类型</h3>
        </div>
        <ul className="py-2">
          {reportTypes.map((r) => {
            const Icon = r.icon;
            const isActive = activeReport === r.key;
            return (
              <li key={r.key}>
                <button
                  onClick={() => setActiveReport(r.key)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-brand-50 border-l-2 border-brand-500"
                      : "border-l-2 border-transparent hover:bg-ink-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-brand-100 text-brand-600"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? "text-brand-700" : "text-ink-800"
                      }`}
                    >
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                      {r.description}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-800 flex items-center gap-2">
              <activeReportDef.icon className="w-4 h-4 text-brand-600" />
              {activeReportDef.label}
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {activeReportDef.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select className="input-base appearance-none pr-8 w-36 text-sm">
                <option>近30天</option>
                <option>近7天</option>
                <option>今日</option>
                <option>本月</option>
                <option>自定义</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
            <button className="btn-secondary !py-1.5">
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
          </div>
        </div>

        <ReportContent reportType={activeReport} />

        <div className="card-base p-4 text-xs text-ink-400 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span>报表生成时间：2026-06-10 09:50:00</span>
          <span>生成人：系统自动</span>
          <span>数据范围：2026-05-12 至 2026-06-10</span>
        </div>
      </div>
    </div>
  );
}

function ReportContent({ reportType }: { reportType: ReportType }) {
  switch (reportType) {
    case "trend":
      return <TrendReport />;
    case "userActive":
      return <UserActiveReport />;
    case "appAccess":
      return <AppAccessReport />;
    case "abnormal":
      return <AbnormalReport />;
    case "operation":
      return <OperationReport />;
    case "risk":
      return <RiskReport />;
    case "compliance":
      return <ComplianceReport />;
  }
}

function TrendReport() {
  const trendData = generateTrendData();
  return (
    <div className="space-y-4">
      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-2">
          登录趋势折线图
        </h3>
        <p className="text-xs text-ink-500 mb-4">近30天活跃用户与登录次数</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="active"
                name="活跃用户"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="login"
                name="登录次数"
                stroke="#0D9488"
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">日期</th>
              <th className="table-th">活跃用户</th>
              <th className="table-th">登录次数</th>
              <th className="table-th">登录成功率</th>
              <th className="table-th">平均会话时长</th>
            </tr>
          </thead>
          <tbody>
            {trendData.slice(-10).reverse().map((d, i) => (
              <tr key={i} className="table-row">
                <td className="table-td text-sm text-ink-700">2026-{d.date}</td>
                <td className="table-td tabular-nums text-sm">{d.active}</td>
                <td className="table-td tabular-nums text-sm">
                  {d.login.toLocaleString()}
                </td>
                <td className="table-td">
                  <span className="badge-safe">{(97 + Math.random() * 2.5).toFixed(1)}%</span>
                </td>
                <td className="table-td text-sm text-ink-600 tabular-nums">
                  {Math.floor(90 + Math.random() * 120)}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserActiveReport() {
  const userActiveData = [
    { name: "张三", logins: 156, hours: 89.5 },
    { name: "李四", logins: 142, hours: 82.3 },
    { name: "孙七", logins: 138, hours: 76.8 },
    { name: "陈一", logins: 128, hours: 71.2 },
    { name: "郑十", logins: 115, hours: 68.4 },
    { name: "林二", logins: 108, hours: 62.1 },
    { name: "赵六", logins: 96, hours: 58.7 },
    { name: "刘四", logins: 89, hours: 52.3 },
    { name: "王五", logins: 82, hours: 48.6 },
    { name: "黄山", logins: 76, hours: 45.2 },
  ];

  return (
    <div className="space-y-4">
      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-2">
          TOP10 活跃用户排行
        </h3>
        <p className="text-xs text-ink-500 mb-4">近30天登录次数排行</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={userActiveData}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 60, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={50}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "logins" ? "登录次数" : "在线小时",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                iconType="circle"
              />
              <Bar
                dataKey="logins"
                name="登录次数"
                fill="#6366F1"
                radius={[0, 6, 6, 0]}
                barSize={16}
              />
              <Bar
                dataKey="hours"
                name="在线小时"
                fill="#0D9488"
                fillOpacity={0.45}
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">排名</th>
              <th className="table-th">用户</th>
              <th className="table-th">部门</th>
              <th className="table-th">登录次数</th>
              <th className="table-th">在线时长</th>
              <th className="table-th">访问应用数</th>
              <th className="table-th">活跃度</th>
            </tr>
          </thead>
          <tbody>
            {userActiveData.map((u, i) => (
              <tr key={i} className="table-row">
                <td className="table-td">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      i === 0
                        ? "bg-warn-100 text-warn-600"
                        : i === 1
                        ? "bg-ink-200 text-ink-700"
                        : i === 2
                        ? "bg-orange-100 text-orange-600"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="table-td text-sm font-medium text-ink-800">
                  {u.name}
                </td>
                <td className="table-td text-sm text-ink-600">技术研发中心</td>
                <td className="table-td tabular-nums text-sm">{u.logins}</td>
                <td className="table-td tabular-nums text-sm">{u.hours}h</td>
                <td className="table-td tabular-nums text-sm">
                  {4 + Math.floor(Math.random() * 4)}
                </td>
                <td className="table-td">
                  <div className="w-24 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-safe-500 rounded-full"
                      style={{ width: `${100 - i * 8}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppAccessReport() {
  const pieColors = ["#6366F1", "#0D9488", "#F59E0B", "#DC2626", "#8B5CF6", "#0EA5E9", "#EC4899"];
  const appPieData = [
    { name: "集团OA", value: 12580 },
    { name: "GitLab", value: 15240 },
    { name: "Jira", value: 9870 },
    { name: "HR系统", value: 8760 },
    { name: "SAP ERP", value: 4320 },
    { name: "BI系统", value: 6540 },
    { name: "堡垒机", value: 2180 },
  ];
  const appTableData = [
    { name: "GitLab代码仓库", logins: 15240, users: 86, fail: 120, rate: "99.2%" },
    { name: "集团OA办公系统", logins: 12580, users: 320, fail: 89, rate: "99.3%" },
    { name: "Jira项目管理", logins: 9870, users: 92, fail: 67, rate: "99.3%" },
    { name: "人力资源管理系统", logins: 8760, users: 185, fail: 52, rate: "99.4%" },
    { name: "数据中台BI系统", logins: 6540, users: 124, fail: 41, rate: "99.4%" },
    { name: "SAP ERP财务系统", logins: 4320, users: 68, fail: 34, rate: "99.2%" },
    { name: "堡垒机运维系统", logins: 2180, users: 32, fail: 18, rate: "99.2%" },
  ];

  return (
    <div className="space-y-4">
      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-2">
          应用访问占比
        </h3>
        <p className="text-xs text-ink-500 mb-4">近30天各应用登录次数占比</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {appPieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value.toLocaleString(), "登录次数"]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {appPieData.map((a, i) => {
              const total = appPieData.reduce((s, x) => s + x.value, 0);
              const pct = ((a.value / total) * 100).toFixed(1);
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: pieColors[i % pieColors.length] }}
                  />
                  <div className="text-sm text-ink-700 w-24 shrink-0">{a.name}</div>
                  <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pieColors[i % pieColors.length],
                      }}
                    />
                  </div>
                  <div className="text-sm tabular-nums text-ink-600 w-12 text-right">
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">应用名称</th>
              <th className="table-th">登录次数</th>
              <th className="table-th">独立用户</th>
              <th className="table-th">失败次数</th>
              <th className="table-th">成功率</th>
              <th className="table-th">占比</th>
            </tr>
          </thead>
          <tbody>
            {appTableData.map((a, i) => (
              <tr key={i} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: pieColors[i % pieColors.length] }}
                    >
                      {a.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-ink-800">{a.name}</span>
                  </div>
                </td>
                <td className="table-td tabular-nums text-sm">
                  {a.logins.toLocaleString()}
                </td>
                <td className="table-td tabular-nums text-sm">{a.users}</td>
                <td className="table-td tabular-nums text-sm text-danger-600">
                  {a.fail}
                </td>
                <td className="table-td">
                  <span className="badge-safe">{a.rate}</span>
                </td>
                <td className="table-td">
                  <span className="badge-info">
                    {((a.logins / 59490) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbnormalReport() {
  const failReasonData = [
    { reason: "密码错误", count: 68 },
    { reason: "MFA校验失败", count: 32 },
    { reason: "账号锁定/停用", count: 18 },
    { reason: "异地登录拦截", count: 15 },
    { reason: "IP不在白名单", count: 9 },
    { reason: "验证码错误", count: 7 },
  ];
  const abnormalLogs = mockLoginLogs.filter((l) => l.status === "fail");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-base p-4 lg:col-span-1">
          <h4 className="text-sm font-semibold text-ink-800 mb-3">
            异常登录统计
          </h4>
          <div className="space-y-3">
            <StatMini label="登录失败总数" value="149" variant="danger" />
            <StatMini label="异地登录" value="15" variant="warn" />
            <StatMini label="暴力破解尝试" value="3" variant="danger" />
            <StatMini label="异常设备登录" value="28" variant="warn" />
          </div>
        </div>
        <div className="card-base p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-800 mb-2">
            失败原因分析
          </h3>
          <p className="text-xs text-ink-500 mb-4">近30天登录失败原因分布</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={failReasonData}
                margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="reason"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  name="次数"
                  radius={[6, 6, 0, 0]}
                  fill="#DC2626"
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <div className="px-4 py-3 border-b border-ink-200 bg-ink-50/50">
          <h3 className="text-sm font-semibold text-ink-800">异常登录明细</h3>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">时间</th>
              <th className="table-th">用户</th>
              <th className="table-th">IP</th>
              <th className="table-th">地点</th>
              <th className="table-th">应用</th>
              <th className="table-th">失败原因</th>
            </tr>
          </thead>
          <tbody>
            {abnormalLogs.map((l, i) => (
              <tr key={l.id} className="table-row bg-danger-50/20">
                <td className="table-td font-mono text-xs">{l.loginAt}</td>
                <td className="table-td text-sm font-medium text-ink-800">
                  {l.userName}
                </td>
                <td className="table-td font-mono text-xs">{l.ip}</td>
                <td className="table-td text-xs text-ink-600">{l.location}</td>
                <td className="table-td text-sm text-ink-700">{l.appName}</td>
                <td className="table-td">
                  <span className="text-xs text-danger-600 bg-danger-50 rounded px-2 py-0.5">
                    {l.failReason || `失败类型 ${i + 1}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperationReport() {
  const operators = ["全部", "张三", "李四", "王五", "赵六"];
  const [opFilter, setOpFilter] = useState("全部");

  const filtered = mockAuditLogs.filter(
    (l) => opFilter === "全部" || l.operatorName === opFilter
  );

  return (
    <div className="space-y-4">
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-ink-600">操作人筛选：</label>
            <div className="flex gap-1">
              {operators.map((op) => (
                <button
                  key={op}
                  onClick={() => setOpFilter(op)}
                  className={
                    opFilter === op
                      ? "px-3 py-1 rounded-md text-xs font-medium bg-brand-700 text-white"
                      : "px-3 py-1 rounded-md text-xs font-medium text-ink-600 hover:bg-ink-100"
                  }
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto text-sm text-ink-500">
            共 <span className="font-semibold text-ink-700">{filtered.length}</span> 条操作日志
          </div>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">操作时间</th>
              <th className="table-th">操作人</th>
              <th className="table-th">模块</th>
              <th className="table-th">操作类型</th>
              <th className="table-th">操作对象</th>
              <th className="table-th">操作IP</th>
              <th className="table-th">变更摘要</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="table-row">
                <td className="table-td font-mono text-xs whitespace-nowrap">
                  {l.operateAt}
                </td>
                <td className="table-td text-sm font-medium text-ink-800">
                  {l.operatorName}
                </td>
                <td className="table-td">
                  <span className="badge-info">{l.module}</span>
                </td>
                <td className="table-td text-sm text-ink-700">{l.action}</td>
                <td className="table-td text-sm text-ink-700">{l.targetName}</td>
                <td className="table-td font-mono text-xs">{l.ip}</td>
                <td className="table-td text-xs text-ink-500">
                  {l.beforeValue} → {l.afterValue}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="table-td text-center text-ink-400 py-8">
                  暂无匹配的操作日志
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardBig label="待处置风险" value="3" variant="danger" />
        <StatCardBig label="本月已处置" value="12" variant="safe" />
        <StatCardBig label="高风险事件" value="4" variant="warn" />
        <StatCardBig label="处置率" value="80%" variant="info" />
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <div className="px-4 py-3 border-b border-ink-200 bg-ink-50/50">
          <h3 className="text-sm font-semibold text-ink-800">风险事件处置明细</h3>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th">检测时间</th>
              <th className="table-th">风险类型</th>
              <th className="table-th">等级</th>
              <th className="table-th">用户</th>
              <th className="table-th">IP</th>
              <th className="table-th">处置状态</th>
              <th className="table-th">处置人</th>
              <th className="table-th">处置动作</th>
            </tr>
          </thead>
          <tbody>
            {[
              { time: "2026-06-10 07:30:00", type: "暴力破解", level: "高", user: "周八", ip: "198.51.100.23", status: "已处置", handler: "李四", action: "冻结账号" },
              { time: "2026-06-10 08:20:15", type: "异常设备", level: "中", user: "孙七", ip: "10.0.1.99", status: "待处置", handler: "-", action: "-" },
              { time: "2026-06-09 22:10:33", type: "异地登录", level: "高", user: "郑十", ip: "192.0.2.100", status: "已处置", handler: "张三", action: "强制下线" },
              { time: "2026-06-09 02:15:44", type: "异常时段", level: "中", user: "王五", ip: "10.0.2.18", status: "已处置", handler: "李四", action: "放行" },
              { time: "2026-06-08 23:45:12", type: "异地登录", level: "高", user: "吴九", ip: "203.0.113.45", status: "待处置", handler: "-", action: "-" },
              { time: "2026-06-08 18:40:00", type: "高频失败", level: "低", user: "林二", ip: "10.0.5.56", status: "已忽略", handler: "李四", action: "放行" },
            ].map((r, i) => (
              <tr key={i} className="table-row">
                <td className="table-td font-mono text-xs whitespace-nowrap">{r.time}</td>
                <td className="table-td text-sm text-ink-700">{r.type}</td>
                <td className="table-td">
                  <span className={r.level === "高" ? "badge-danger" : r.level === "中" ? "badge-warn" : "badge-neutral"}>
                    {r.level}
                  </span>
                </td>
                <td className="table-td text-sm font-medium text-ink-800">{r.user}</td>
                <td className="table-td font-mono text-xs">{r.ip}</td>
                <td className="table-td">
                  <span className={r.status === "已处置" ? "badge-safe" : r.status === "待处置" ? "badge-warn" : "badge-neutral"}>
                    {r.status}
                  </span>
                </td>
                <td className="table-td text-sm text-ink-700">{r.handler}</td>
                <td className="table-td text-sm text-ink-700">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceReport() {
  const complianceItems = [
    { name: "用户账号审批流程", pass: 298, total: 313, rate: 95.2 },
    { name: "MFA强制开启覆盖率", pass: 267, total: 313, rate: 85.3 },
    { name: "密码策略合规率", pass: 308, total: 313, rate: 98.4 },
    { name: "权限定期复查完成率", pass: 142, total: 150, rate: 94.7 },
    { name: "离职账号及时清理率", pass: 45, total: 45, rate: 100 },
    { name: "敏感操作审计完整率", pass: 982, total: 986, rate: 99.6 },
    { name: "风险事件24h处置率", pass: 14, total: 15, rate: 93.3 },
    { name: "访问日志留存完整性", pass: 186, total: 186, rate: 100 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardBig label="合规项总数" value="8" variant="info" />
        <StatCardBig label="全部达标" value="4" variant="safe" />
        <StatCardBig label="需改进项" value="3" variant="warn" />
        <StatCardBig label="整体合规率" value="95.8%" variant="safe" />
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-4">
          等保合规项检查结果
        </h3>
        <div className="space-y-4">
          {complianceItems.map((c, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-ink-700">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-500 tabular-nums">
                    {c.pass}/{c.total}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      c.rate >= 98
                        ? "text-safe-600"
                        : c.rate >= 90
                        ? "text-warn-600"
                        : "text-danger-600"
                    }`}
                  >
                    {c.rate}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.rate >= 98
                      ? "bg-safe-500"
                      : c.rate >= 90
                      ? "bg-warn-500"
                      : "bg-danger-500"
                  }`}
                  style={{ width: `${c.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-ink-800 mb-3">
          合规建议
        </h3>
        <ul className="space-y-2 text-sm text-ink-600">
          <li className="flex items-start gap-2">
            <span className="text-warn-500 mt-0.5">●</span>
            <span>建议对 <b className="text-ink-800">46名未开启MFA的用户</b> 进行提醒，尽快完成多因素认证绑定</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warn-500 mt-0.5">●</span>
            <span><b className="text-ink-800">8个权限复查任务</b> 即将到期，请通知各部门管理员及时完成</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warn-500 mt-0.5">●</span>
            <span>有 <b className="text-ink-800">1条风险事件</b> 超过24小时未处置，请安全审计员尽快跟进</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function getAppProtocol(appId: string): string {
  const app = mockApplications.find((a) => a.id === appId);
  return app?.protocol || "OIDC";
}

interface PaginationBarProps {
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function PaginationBar({
  total,
  currentPage,
  totalPages,
  onPageChange,
}: PaginationBarProps) {
  return (
    <section className="flex items-center justify-between px-2 py-3 animate-fade-in-up stagger-4">
      <div className="text-sm text-ink-500">
        共 <span className="font-semibold text-ink-700">{total}</span> 条
        <span className="mx-2 text-ink-300">|</span>
        每页12条
      </div>
      <div className="flex items-center gap-1">
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={
              currentPage === p
                ? "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm"
                : "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
            }
          >
            {p}
          </button>
        ))}
        <span className="inline-flex items-center justify-center w-8 h-8 text-ink-400">
          ...
        </span>
        <button
          onClick={() => onPageChange(totalPages)}
          className={
            currentPage === totalPages
              ? "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm"
              : "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
          }
        >
          {totalPages}
        </button>
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
        >
          <span>下一页</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

interface StatMiniProps {
  label: string;
  value: string;
  variant: "safe" | "danger" | "warn" | "info";
}

function StatMini({ label, value, variant }: StatMiniProps) {
  const colorMap = {
    safe: "bg-safe-50 text-safe-600 ring-safe-500/20",
    danger: "bg-danger-50 text-danger-600 ring-danger-500/20",
    warn: "bg-warn-50 text-warn-600 ring-warn-500/20",
    info: "bg-brand-50 text-brand-600 ring-brand-500/20",
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-md ring-1 ring-inset flex items-center justify-center font-bold font-display ${colorMap[variant]}`}
      >
        {value}
      </div>
      <div>
        <div className="text-xs text-ink-500">{label}</div>
        <div
          className={`text-lg font-bold font-display tabular-nums ${
            variant === "safe"
              ? "text-safe-700"
              : variant === "danger"
              ? "text-danger-700"
              : variant === "warn"
              ? "text-warn-700"
              : "text-brand-700"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

interface StatCardBigProps {
  label: string;
  value: string;
  variant: "safe" | "danger" | "warn" | "info";
}

function StatCardBig({ label, value, variant }: StatCardBigProps) {
  const gradientMap = {
    safe: "from-safe-500 to-safe-200",
    danger: "from-danger-500 to-danger-200",
    warn: "from-warn-500 to-warn-200",
    info: "from-brand-500 to-brand-300",
  };
  const iconBgMap = {
    safe: "bg-safe-50 text-safe-600",
    danger: "bg-danger-50 text-danger-600",
    warn: "bg-warn-50 text-warn-600",
    info: "bg-brand-50 text-brand-600",
  };
  const valueColorMap = {
    safe: "text-safe-700",
    danger: "text-danger-700",
    warn: "text-warn-700",
    info: "text-brand-700",
  };
  return (
    <div className="card-base overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradientMap[variant]}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-ink-500">{label}</div>
            <div className="mt-2 text-2xl font-bold font-display tabular-nums text-ink-800">
              {value}
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBgMap[variant]}`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className={`mt-2 text-xs font-medium ${valueColorMap[variant]}`}>
          月度统计数据
        </div>
      </div>
    </div>
  );
}
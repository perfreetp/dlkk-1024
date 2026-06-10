import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  SquarePlus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  ShieldAlert,
  ChevronDown,
  X,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Users,
  BarChart3,
  Settings2,
  KeyRound,
  ShieldCheck,
  Activity,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
  TestTube,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { mockAppUsageStats } from "@/mock";
import type { Application, AppProtocol, AppStatus, AuditLog, LastTestResult } from "@/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { Drawer, Modal, toast } from "@/components/ui/Modal";

const CATEGORIES = [
  "全部",
  "办公协作",
  "经营管理",
  "研发工具",
  "数据分析",
  "安全运维",
] as const;

const STATUS_FILTERS = ["全部", "已启用", "已停用"] as const;

const TIME_RANGES = ["本月", "上月", "本季度"] as const;

const PROTOCOLS = ["OIDC", "SAML", "CAS", "OAuth2"] as const;

const SESSION_DURATION_OPTIONS = [
  { value: "30m", label: "30分钟", minutes: 30 },
  { value: "2h", label: "2小时", minutes: 120 },
  { value: "8h", label: "8小时", minutes: 480 },
  { value: "24h", label: "24小时", minutes: 1440 },
  { value: "forever", label: "永久", minutes: 0 },
];

const categoryGradientMap: Record<string, string> = {
  办公协作: "from-brand-500 to-brand-700",
  经营管理: "from-safe-500 to-safe-700",
  研发工具: "from-brand-500 to-brand-700",
  数据分析: "from-warn-500 to-warn-700",
  安全运维: "from-danger-500 to-danger-700",
};

const categoryColorMap: Record<string, string> = {
  办公协作: "#6366F1",
  经营管理: "#0D9488",
  研发工具: "#6366F1",
  数据分析: "#F59E0B",
  安全运维: "#DC2626",
};

const protocolBadgeMap: Record<AppProtocol, string> = {
  OIDC: "badge-info",
  SAML: "badge-safe",
  CAS: "badge-warn",
  OAuth2: "badge-neutral",
};

const statusLabelMap: Record<AppStatus, string> = {
  enabled: "已启用",
  disabled: "已停用",
};

const DRAWER_TABS = [
  { key: "basic", label: "基础配置", icon: Settings2 },
  { key: "protocol", label: "协议配置", icon: KeyRound },
  { key: "policy", label: "访问策略", icon: ShieldCheck },
  { key: "stats", label: "使用统计", icon: Activity },
  { key: "test", label: "SSO测试", icon: TestTube },
] as const;

type DrawerTabKey = (typeof DRAWER_TABS)[number]["key"];

interface AppFormState {
  name: string;
  code: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  status: AppStatus;
  protocol: AppProtocol;
  clientId: string;
  clientSecret: string;
  callbackUrlsText: string;
  logoutUrlsText: string;
  ipWhitelistText: string;
  mfaRequired: boolean;
  accessHoursStart: string;
  accessHoursEnd: string;
  sessionDuration: string;
}

const genRandomClientId = () =>
  `client-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;

const genRandomSecret = () =>
  `sk-live-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function initFormFromApp(app: Application | undefined): AppFormState {
  return {
    name: app?.name || "",
    code: app?.code || "",
    description: app?.description || "",
    category: (app?.category as (typeof CATEGORIES)[number]) || "办公协作",
    status: app?.status || "enabled",
    protocol: app?.protocol || "OIDC",
    clientId: app?.clientId || genRandomClientId(),
    clientSecret: app?.clientSecret || genRandomSecret(),
    callbackUrlsText: app?.callbackUrls?.join("\n") || "",
    logoutUrlsText: app?.logoutUrls?.join("\n") || "",
    ipWhitelistText: app?.ipWhitelist?.join("\n") || "",
    mfaRequired: app?.mfaRequired || false,
    accessHoursStart: app?.accessHours?.start || "",
    accessHoursEnd: app?.accessHours?.end || "",
    sessionDuration: "8h",
  };
}

export default function Applications() {
  const applications = useAppStore((s) => s.applications);
  const updateApplication = useAppStore((s) => s.updateApplication);
  const toggleAppStatus = useAppStore((s) => s.toggleAppStatus);
  const addAuditLog = useAppStore((s) => s.addAuditLog);
  const auditLogs = useAppStore((s) => s.auditLogs);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORIES)[number]>("全部");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("本月");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTabKey>("basic");
  const [patchForm, setPatchForm] = useState<AppFormState>(initFormFromApp(undefined));
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const [newAppOpen, setNewAppOpen] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    name: "",
    code: "",
    description: "",
    category: "办公协作" as (typeof CATEGORIES)[number],
    protocol: "OIDC" as AppProtocol,
  });

  const currentApp = useMemo(
    () => applications.find((a) => a.id === editingAppId),
    [applications, editingAppId]
  );

  const appAuditLogs = useMemo(() => {
    if (!editingAppId) return [];
    return auditLogs.filter((l) => l.targetId === editingAppId).slice(0, 5);
  }, [auditLogs, editingAppId]);

  useEffect(() => {
    if (drawerOpen && currentApp) {
      setPatchForm(initFormFromApp(currentApp));
    }
  }, [drawerOpen, currentApp?.id]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !searchQuery ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        categoryFilter === "全部" || app.category === categoryFilter;
      const matchStatus =
        statusFilter === "全部" ||
        (statusFilter === "已启用" && app.status === "enabled") ||
        (statusFilter === "已停用" && app.status === "disabled");
      return matchSearch && matchCategory && matchStatus;
    });
  }, [applications, searchQuery, categoryFilter, statusFilter]);

  const appLoginStats = useMemo(() => {
    const map = new Map<string, { loginCount: number; uniqueUsers: number }>();
    mockAppUsageStats.forEach((s) => {
      map.set(s.appId, { loginCount: s.loginCount, uniqueUsers: s.uniqueUsers });
    });
    return map;
  }, []);

  const usageChartData = useMemo(() => {
    return mockAppUsageStats.map((s) => {
      const app = applications.find((a) => a.id === s.appId);
      const failRate =
        s.loginCount > 0
          ? ((s.failCount / s.loginCount) * 100).toFixed(1) + "%"
          : "0%";
      return {
        ...s,
        category: app?.category || "办公协作",
        failRate,
        label: `${s.loginCount.toLocaleString()} (${failRate})`,
      };
    });
  }, [applications]);

  const handleToggleStatus = (id: string) => {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    if (app.status === "enabled") {
      setPendingToggleId(id);
      setConfirmDisableOpen(true);
    } else {
      toggleAppStatus(id);
      toast.success("应用已启用");
    }
  };

  const confirmDisable = () => {
    if (pendingToggleId) {
      toggleAppStatus(pendingToggleId);
      toast.success("应用已停用");
    }
    setConfirmDisableOpen(false);
    setPendingToggleId(null);
  };

  const handleOpenDrawer = (appId: string) => {
    setEditingAppId(appId);
    setDrawerTab("basic");
    setDrawerOpen(true);
    setShowAuditLogs(false);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditingAppId(null);
      setPatchForm(initFormFromApp(undefined));
    }, 300);
  };

  const handleSaveConfig = () => {
    if (!editingAppId) return;
    updateApplication(editingAppId, {
      name: patchForm.name,
      code: patchForm.code,
      description: patchForm.description,
      category: patchForm.category,
      status: patchForm.status,
      protocol: patchForm.protocol,
      clientId: patchForm.clientId,
      callbackUrls: patchForm.callbackUrlsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      logoutUrls: patchForm.logoutUrlsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      ipWhitelist: patchForm.ipWhitelistText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      mfaRequired: patchForm.mfaRequired,
      accessHours:
        patchForm.accessHoursStart && patchForm.accessHoursEnd
          ? { start: patchForm.accessHoursStart, end: patchForm.accessHoursEnd }
          : undefined,
    });
    toast.success("应用配置已保存");
    handleCloseDrawer();
  };

  const setField = <K extends keyof AppFormState>(key: K, value: AppFormState[K]) => {
    setPatchForm((p) => ({ ...p, [key]: value }));
  };

  const handleRegenerateClientId = () => {
    const newId = genRandomClientId();
    setField("clientId", newId);
    toast.success("ClientID 已重新生成");
    if (editingAppId) {
      addAuditLog({
        module: "应用接入",
        action: "重新生成ClientID",
        targetId: editingAppId,
        targetName: currentApp?.name,
        beforeValue: patchForm.clientId,
        afterValue: newId,
      });
    }
  };

  const handleRegenerateSecret = () => {
    const newSecret = genRandomSecret();
    setField("clientSecret", newSecret);
    toast.success("ClientSecret 已重新生成");
    if (editingAppId) {
      addAuditLog({
        module: "应用接入",
        action: "重新生成ClientSecret",
        targetId: editingAppId,
        targetName: currentApp?.name,
        beforeValue: "******",
        afterValue: "******",
      });
    }
  };

  const handleCreateApp = () => {
    if (!newAppForm.name || !newAppForm.code) {
      toast.warn("请填写应用名称和编码");
      return;
    }
    addAuditLog({
      module: "应用接入",
      action: "提交新增应用",
      targetId: `new-${Date.now()}`,
      targetName: newAppForm.name,
      beforeValue: "-",
      afterValue: `{code: ${newAppForm.code}, category: ${newAppForm.category}, protocol: ${newAppForm.protocol}}`,
    });
    toast.success("应用创建请求已提交，预计5分钟内完成接入");
    setNewAppOpen(false);
    setNewAppForm({ name: "", code: "", description: "", category: "办公协作", protocol: "OIDC" });
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">
            应用接入
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            配置企业应用单点登录协议与访问策略
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary">
            <BookOpen className="w-4 h-4" />
            <span>接入文档</span>
          </button>
          <button className="btn-primary" onClick={() => setNewAppOpen(true)}>
            <SquarePlus className="w-4 h-4" />
            <span>新增应用</span>
          </button>
        </div>
      </section>

      <section className="card-base p-4 mb-4 animate-fade-in-up stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="搜索应用名称或编码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                    categoryFilter === cat
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 whitespace-nowrap">状态：</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])
                }
                className="input-base !w-auto !py-1.5 text-xs"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center rounded-md border border-ink-200 overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-2 transition-colors duration-200",
                  view === "grid"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-500 hover:bg-ink-50"
                )}
                title="卡片视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 transition-colors duration-200 border-l border-ink-200",
                  view === "list"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-500 hover:bg-ink-50"
                )}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {view === "grid" ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApps.map((app, idx) => (
            <AppCard
              key={app.id}
              app={app}
              stats={appLoginStats.get(app.id)}
              index={idx}
              onToggleStatus={handleToggleStatus}
              onConfigure={() => handleOpenDrawer(app.id)}
            />
          ))}
          {filteredApps.length === 0 && (
            <div className="col-span-full card-base p-12 text-center">
              <div className="text-ink-400 text-sm">暂无匹配的应用</div>
            </div>
          )}
        </section>
      ) : (
        <section className="card-base animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">应用</th>
                  <th className="table-th">协议</th>
                  <th className="table-th">分类</th>
                  <th className="table-th">MFA</th>
                  <th className="table-th">IP白名单</th>
                  <th className="table-th">状态</th>
                  <th className="table-th">访问量</th>
                  <th className="table-th text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br",
                            categoryGradientMap[app.category] || categoryGradientMap["办公协作"]
                          )}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-800 truncate max-w-[180px]">
                            {app.name}
                          </div>
                          <div className="font-mono text-xs text-ink-400">
                            {app.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={protocolBadgeMap[app.protocol]}>
                        {app.protocol}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="badge-neutral">{app.category}</span>
                    </td>
                    <td className="table-td">
                      {app.mfaRequired ? (
                        <span className="badge-warn">
                          <ShieldAlert className="w-3 h-3" />
                          需MFA
                        </span>
                      ) : (
                        <span className="text-ink-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span
                        className={cn(
                          "text-xs font-mono",
                          app.ipWhitelist.length > 0
                            ? "text-safe-600"
                            : "text-ink-400"
                        )}
                      >
                        {app.ipWhitelist.length > 0
                          ? `${app.ipWhitelist.length} 条`
                          : "未限制"}
                      </span>
                    </td>
                    <td className="table-td">
                      <Switch
                        checked={app.status === "enabled"}
                        onChange={() => handleToggleStatus(app.id)}
                        label={statusLabelMap[app.status]}
                      />
                    </td>
                    <td className="table-td tabular-nums text-ink-700">
                      {appLoginStats
                        .get(app.id)
                        ?.loginCount.toLocaleString() || "0"}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => handleOpenDrawer(app.id)}
                        className="btn-ghost !py-1 !px-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <span>配置</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="table-td text-center text-ink-400 py-8"
                    >
                      暂无匹配的应用
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card-base p-5 animate-fade-in-up">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink-800">
              月度应用使用热度
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              登录次数统计及失败率标注
            </p>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as (typeof TIME_RANGES)[number])
              }
              className="input-base !w-auto pl-9 pr-8 !py-1.5 text-xs appearance-none cursor-pointer"
            >
              {TIME_RANGES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={usageChartData}
              margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="appName"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={72}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === "loginCount")
                    return [value.toLocaleString(), "登录次数"];
                  if (name === "failCount")
                    return [value.toLocaleString(), "失败次数"];
                  return [value, name];
                }}
              />
              <Bar
                dataKey="loginCount"
                name="登录次数"
                radius={[6, 6, 0, 0]}
                barSize={44}
              >
                {usageChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColorMap[entry.category] || "#6366F1"}
                  />
                ))}
                <LabelList
                  dataKey="label"
                  position="top"
                  style={{ fontSize: 11, fill: "#475569" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={currentApp?.name || "应用配置"}
        description={currentApp?.code || ""}
        width="w-[680px]"
        footer={
          <>
            <button onClick={handleCloseDrawer} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSaveConfig} className="btn-primary">
              保存配置
            </button>
          </>
        }
      >
        {currentApp && (
          <AppDetailContent
            app={currentApp}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            patchForm={patchForm}
            setField={setField}
            onRegenerateClientId={handleRegenerateClientId}
            onRegenerateSecret={handleRegenerateSecret}
            usageStats={mockAppUsageStats.find((s) => s.appId === currentApp.id)}
            updateApplication={updateApplication}
            addAuditLog={addAuditLog}
          />
        )}

        <div className="mt-6 pt-4 border-t border-ink-200">
          <button
            onClick={() => setShowAuditLogs((v) => !v)}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-ink-600 hover:text-ink-800 py-2"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              最近 {appAuditLogs.length} 条变更记录
            </span>
            {showAuditLogs ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {showAuditLogs && (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {appAuditLogs.length === 0 ? (
                <div className="text-xs text-ink-400 py-4 text-center">
                  暂无变更记录
                </div>
              ) : (
                appAuditLogs.map((log) => (
                  <AuditLogItem key={log.id} log={log} />
                ))
              )}
            </div>
          )}
        </div>
      </Drawer>

      <Modal
        open={confirmDisableOpen}
        onClose={() => {
          setConfirmDisableOpen(false);
          setPendingToggleId(null);
        }}
        title="确认停用应用"
        description="停用后用户将无法通过SSO访问该应用"
        icon={<AlertTriangle className="w-5 h-5 text-warn-600" />}
        footer={
          <>
            <button
              onClick={() => {
                setConfirmDisableOpen(false);
                setPendingToggleId(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={confirmDisable} className="btn-danger">
              确认停用
            </button>
          </>
        }
      >
        <div className="text-sm text-ink-600">
          确定要停用该应用吗？停用后所有用户将无法通过单点登录访问此应用，直到重新启用。
        </div>
      </Modal>

      <Modal
        open={newAppOpen}
        onClose={() => setNewAppOpen(false)}
        title="新增应用"
        description="填写应用基础信息，提交后由系统管理员完成接入"
        icon={<SquarePlus className="w-5 h-5 text-brand-600" />}
        footer={
          <>
            <button onClick={() => setNewAppOpen(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleCreateApp} className="btn-primary">
              提交申请
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="应用名称" required>
              <input
                type="text"
                placeholder="例如：销售管理系统"
                value={newAppForm.name}
                onChange={(e) =>
                  setNewAppForm((p) => ({ ...p, name: e.target.value }))
                }
                className="input-base"
              />
            </FormField>
            <FormField label="应用编码" required>
              <input
                type="text"
                placeholder="例如：SALE-SYS"
                value={newAppForm.code}
                onChange={(e) =>
                  setNewAppForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                className="input-base font-mono"
              />
            </FormField>
          </div>
          <FormField label="应用描述">
            <textarea
              placeholder="简要说明应用用途和接入范围"
              rows={3}
              value={newAppForm.description}
              onChange={(e) =>
                setNewAppForm((p) => ({ ...p, description: e.target.value }))
              }
              className="input-base resize-none"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="应用分类" required>
              <select
                value={newAppForm.category}
                onChange={(e) =>
                  setNewAppForm((p) => ({
                    ...p,
                    category: e.target.value as (typeof CATEGORIES)[number],
                  }))
                }
                className="input-base"
              >
                {CATEGORIES.slice(1).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="SSO协议" required>
              <select
                value={newAppForm.protocol}
                onChange={(e) =>
                  setNewAppForm((p) => ({
                    ...p,
                    protocol: e.target.value as AppProtocol,
                  }))
                }
                className="input-base"
              >
                {PROTOCOLS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLog }) {
  return (
    <div className="p-3 rounded-md bg-ink-50 border border-ink-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-700 shrink-0">
            {log.action}
          </span>
          <span className="text-xs font-medium text-ink-700 truncate">
            {log.operatorName}
          </span>
        </div>
        <span className="text-[10px] text-ink-400 font-mono shrink-0">
          {log.operateAt.slice(5)}
        </span>
      </div>
      {log.afterValue && log.afterValue !== "-" && (
        <div className="mt-1.5 text-[11px] text-ink-500 break-all">
          {log.afterValue}
        </div>
      )}
    </div>
  );
}

interface AppCardProps {
  app: Application;
  stats?: { loginCount: number; uniqueUsers: number };
  index: number;
  onToggleStatus: (id: string) => void;
  onConfigure: () => void;
}

function AppCard({
  app,
  stats,
  index,
  onToggleStatus,
  onConfigure,
}: AppCardProps) {
  const staggerClass = `stagger-${(index % 6) + 1}` as const;
  return (
    <div
      className={cn(
        "card-base card-hover p-5 animate-fade-in-up",
        staggerClass,
        "group hover:border-brand-400"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br shadow-sm",
              categoryGradientMap[app.category] || categoryGradientMap["办公协作"]
            )}
          >
            {app.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-lg text-ink-800 truncate">
              {app.name}
            </h3>
            <div className="font-mono text-xs text-ink-400 mt-0.5">
              {app.code}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={app.status === "enabled"}
            onChange={() => onToggleStatus(app.id)}
          />
          <button
            className="p-1.5 rounded-md text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
            title="更多操作"
            onClick={onConfigure}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-ink-500 line-clamp-2 mb-4 min-h-[2.5rem]">
        {app.description || "暂无描述"}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className={protocolBadgeMap[app.protocol]}>{app.protocol}</span>
        <span className="badge-neutral">{app.category}</span>
        {app.mfaRequired && (
          <span className="badge-warn">
            <ShieldAlert className="w-3 h-3" />
            需MFA
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-ink-100">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-ink-500">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-semibold text-ink-700 tabular-nums">
              {stats?.loginCount.toLocaleString() || "0"}
            </span>
            <span>访问</span>
          </div>
          <div className="flex items-center gap-1 text-ink-500">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-ink-700 tabular-nums">
              {stats?.uniqueUsers || "0"}
            </span>
            <span>人</span>
          </div>
        </div>
        <button
          onClick={onConfigure}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>配置</span>
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </div>
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <span
          className={cn(
            "block w-9 h-5 rounded-full transition-colors duration-200",
            checked ? "bg-brand-600" : "bg-ink-300"
          )}
        />
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </span>
      {label && (
        <span
          className={cn(
            "text-xs font-medium",
            checked ? "text-safe-600" : "text-ink-500"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}

interface AppDetailContentProps {
  app: Application;
  activeTab: DrawerTabKey;
  onTabChange: (tab: DrawerTabKey) => void;
  patchForm: AppFormState;
  setField: <K extends keyof AppFormState>(key: K, value: AppFormState[K]) => void;
  onRegenerateClientId: () => void;
  onRegenerateSecret: () => void;
  usageStats?: {
    loginCount: number;
    uniqueUsers: number;
    failCount: number;
  };
  updateApplication: (appId: string, patch: Partial<Application>) => void;
  addAuditLog: (log: Partial<AuditLog>) => void;
}

function AppDetailContent({
  app,
  activeTab,
  onTabChange,
  patchForm,
  setField,
  onRegenerateClientId,
  onRegenerateSecret,
  usageStats,
  updateApplication,
  addAuditLog,
}: AppDetailContentProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const failRate =
    usageStats && usageStats.loginCount > 0
      ? ((usageStats.failCount / usageStats.loginCount) * 100).toFixed(1) + "%"
      : "0%";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br",
            categoryGradientMap[app.category] || categoryGradientMap["办公协作"]
          )}
        >
          {app.name.charAt(0)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "badge",
              patchForm.status === "enabled" ? "badge-safe" : "badge-neutral"
            )}
          >
            {statusLabelMap[patchForm.status]}
          </span>
          <span className={protocolBadgeMap[patchForm.protocol]}>
            {patchForm.protocol}
          </span>
        </div>
      </div>

      <div className="flex border-b border-ink-200 -mx-6 px-6 mb-4 overflow-x-auto">
        {DRAWER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                isActive
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
        {activeTab === "basic" && (
          <BasicConfigTab app={app} patchForm={patchForm} setField={setField} />
        )}
        {activeTab === "protocol" && (
          <ProtocolConfigTab
            app={app}
            patchForm={patchForm}
            setField={setField}
            showSecret={showSecret}
            onToggleSecret={() => setShowSecret((v) => !v)}
            copiedField={copiedField}
            onCopy={handleCopy}
            onRegenerateClientId={onRegenerateClientId}
            onRegenerateSecret={onRegenerateSecret}
          />
        )}
        {activeTab === "policy" && (
          <AccessPolicyTab app={app!} patchForm={patchForm} setField={setField} />
        )}
        {activeTab === "stats" && (
          <StatsTab app={app} usageStats={usageStats} failRate={failRate} />
        )}
        {activeTab === "test" && (
          <SsoTestTab
            app={app}
            updateApplication={updateApplication}
            addAuditLog={addAuditLog}
          />
        )}
      </div>
    </div>
  );
}

function BasicConfigTab({
  patchForm,
  setField,
}: {
  app: Application;
  patchForm: AppFormState;
  setField: <K extends keyof AppFormState>(key: K, value: AppFormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle title="基础信息" desc="应用的基本标识信息" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="应用名称" required>
          <input
            type="text"
            value={patchForm.name}
            onChange={(e) => setField("name", e.target.value)}
            className="input-base"
          />
        </FormField>
        <FormField label="应用编码" required>
          <input
            type="text"
            value={patchForm.code}
            onChange={(e) => setField("code", e.target.value)}
            className="input-base font-mono"
          />
        </FormField>
      </div>
      <FormField label="应用描述">
        <textarea
          value={patchForm.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          className="input-base resize-none"
        />
      </FormField>
      <FormField label="应用分类" required>
        <select
          value={patchForm.category}
          onChange={(e) =>
            setField("category", e.target.value as (typeof CATEGORIES)[number])
          }
          className="input-base"
        >
          {CATEGORIES.slice(1).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="应用状态">
        <div className="flex items-center gap-3 p-3 rounded-md bg-ink-50 border border-ink-200">
          <div className="flex-1">
            <div className="text-sm font-medium text-ink-800">启用应用</div>
            <div className="text-xs text-ink-500 mt-0.5">
              停用后用户将无法通过SSO访问此应用
            </div>
          </div>
          <Switch
            checked={patchForm.status === "enabled"}
            onChange={() =>
              setField("status", patchForm.status === "enabled" ? "disabled" : "enabled")
            }
          />
        </div>
      </FormField>
    </div>
  );
}

interface ProtocolConfigProps {
  app: Application;
  patchForm: AppFormState;
  setField: <K extends keyof AppFormState>(key: K, value: AppFormState[K]) => void;
  showSecret: boolean;
  onToggleSecret: () => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onRegenerateClientId: () => void;
  onRegenerateSecret: () => void;
}

function ProtocolConfigTab({
  patchForm,
  setField,
  showSecret,
  onToggleSecret,
  copiedField,
  onCopy,
  onRegenerateClientId,
  onRegenerateSecret,
}: ProtocolConfigProps) {
  const showClientFields =
    patchForm.protocol === "OIDC" || patchForm.protocol === "OAuth2";

  return (
    <div className="space-y-5">
      <SectionTitle title="协议类型" desc="选择与应用对接的单点登录协议" />
      <FormField label="SSO协议" required>
        <div className="grid grid-cols-4 gap-2">
          {PROTOCOLS.map((p) => (
            <label
              key={p}
              className={cn(
                "flex items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all",
                patchForm.protocol === p
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:border-ink-300"
              )}
            >
              <input
                type="radio"
                name="protocol"
                checked={patchForm.protocol === p}
                onChange={() => setField("protocol", p)}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  patchForm.protocol === p ? "text-brand-700" : "text-ink-600"
                )}
              >
                {p}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {showClientFields && (
        <>
          <SectionTitle title="客户端凭证" desc="用于应用身份认证的密钥信息" />
          <FormField label="Client ID">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={patchForm.clientId}
                  className="input-base font-mono text-xs pr-28"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => onCopy(patchForm.clientId, "clientId")}
                    className="px-2 py-1 rounded text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    {copiedField === "clientId" ? "已复制" : "复制"}
                  </button>
                  <button
                    onClick={onRegenerateClientId}
                    className="p-1 rounded text-warn-500 hover:text-warn-600 hover:bg-warn-50 transition-colors"
                    title="重新生成"
                  >
                    <RefreshCw
                      className={cn(
                        "w-3.5 h-3.5",
                        copiedField === "regen-clientId" && "animate-spin"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </FormField>

          <FormField label="Client Secret">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type={showSecret ? "text" : "password"}
                  readOnly
                  value={patchForm.clientSecret}
                  className="input-base font-mono text-xs pr-28"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={onToggleSecret}
                    className="p-1 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
                    title={showSecret ? "隐藏" : "显示"}
                  >
                    {showSecret ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onCopy(patchForm.clientSecret, "secret")}
                    className="p-1 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
                    title="复制"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onRegenerateSecret}
                    className="p-1 rounded text-warn-500 hover:text-warn-600 hover:bg-warn-50 transition-colors"
                    title="重新生成"
                  >
                    <RefreshCw
                      className={cn(
                        "w-3.5 h-3.5",
                        copiedField === "regen-secret" && "animate-spin"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
            {copiedField === "secret" && (
              <div className="mt-1 text-xs text-safe-600">已复制到剪贴板</div>
            )}
          </FormField>
        </>
      )}

      {patchForm.protocol === "SAML" && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200">
          <SectionTitle
            title="SAML 证书配置"
            desc="上传 SAML 协议所需的身份提供者证书"
          />
          <div className="mt-3 border-2 border-dashed border-amber-300 rounded-md p-8 text-center">
            <KeyRound className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-sm text-amber-700 font-medium">上传证书文件</div>
            <div className="text-xs text-amber-500 mt-1">支持 .pem / .cer / .crt 格式</div>
            <button className="mt-3 px-4 py-1.5 text-xs font-medium rounded-md bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors">
              选择文件
            </button>
          </div>
        </div>
      )}

      <SectionTitle title="回调地址" desc="用户登录成功后的跳转地址" />
      <FormField label="回调 URL（每行一个）">
        <textarea
          value={patchForm.callbackUrlsText}
          onChange={(e) => setField("callbackUrlsText", e.target.value)}
          rows={3}
          placeholder="https://app.example.com/callback"
          className="input-base font-mono text-xs resize-none"
        />
      </FormField>

      <SectionTitle title="登出地址" desc="用户登出后的跳转地址（可选）" />
      <FormField label="登出 URL（每行一个）">
        <textarea
          value={patchForm.logoutUrlsText}
          onChange={(e) => setField("logoutUrlsText", e.target.value)}
          rows={3}
          placeholder="https://app.example.com/logout"
          className="input-base font-mono text-xs resize-none"
        />
      </FormField>
    </div>
  );
}

function AccessPolicyTab({
  patchForm,
  setField,
}: {
  app: Application;
  patchForm: AppFormState;
  setField: <K extends keyof AppFormState>(key: K, value: AppFormState[K]) => void;
}) {
  const ipCount = patchForm.ipWhitelistText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean).length;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="IP白名单"
        desc="仅允许列表内的IP网段访问（留空表示不限制）"
      />
      <FormField label="允许的IP/网段">
        <textarea
          value={patchForm.ipWhitelistText}
          onChange={(e) => setField("ipWhitelistText", e.target.value)}
          rows={4}
          placeholder="每行一个，支持单IP或CIDR格式，如：&#10;10.0.0.0/8&#10;192.168.1.100"
          className="input-base font-mono text-xs resize-none"
        />
      </FormField>
      <div className="text-xs text-ink-400 -mt-3">
        当前已配置 {ipCount} 条白名单规则
      </div>

      <SectionTitle title="访问时段" desc="限制用户允许登录的时间范围" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="开始时间">
          <input
            type="time"
            value={patchForm.accessHoursStart}
            onChange={(e) => setField("accessHoursStart", e.target.value)}
            className="input-base"
          />
        </FormField>
        <FormField label="结束时间">
          <input
            type="time"
            value={patchForm.accessHoursEnd}
            onChange={(e) => setField("accessHoursEnd", e.target.value)}
            className="input-base"
          />
        </FormField>
      </div>
      {!patchForm.accessHoursStart && !patchForm.accessHoursEnd && (
        <div className="text-xs text-ink-400 -mt-3">未设置时段，默认全天允许访问</div>
      )}

      <SectionTitle title="安全策略" desc="增强访问安全的配置项" />
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-md bg-ink-50 border border-ink-200">
          <div>
            <div className="text-sm font-medium text-ink-800">
              强制多因素认证
            </div>
            <div className="text-xs text-ink-500 mt-0.5">
              访问该应用必须通过 MFA 二次验证
            </div>
          </div>
          <Switch
            checked={patchForm.mfaRequired}
            onChange={() => setField("mfaRequired", !patchForm.mfaRequired)}
          />
        </div>

        <FormField label="会话有效期">
          <select
            value={patchForm.sessionDuration}
            onChange={(e) => setField("sessionDuration", e.target.value)}
            className="input-base"
          >
            {SESSION_DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}

interface StatsTabProps {
  app: Application;
  usageStats?: {
    loginCount: number;
    uniqueUsers: number;
    failCount: number;
  };
  failRate: string;
}

function StatsTab({ app, usageStats, failRate }: StatsTabProps) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const base = usageStats?.loginCount
        ? Math.floor(usageStats.loginCount / 30)
        : 200;
      const count = Math.floor(base * (0.6 + Math.random() * 0.8));
      const fail = Math.floor(count * (0.01 + Math.random() * 0.02));
      return { day: dayStr, login: count, fail };
    });
    return days;
  }, [app.id, usageStats?.loginCount]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <StatMini
          label="登录次数"
          value={usageStats?.loginCount.toLocaleString() || "0"}
          color="brand"
        />
        <StatMini
          label="独立用户"
          value={usageStats?.uniqueUsers.toLocaleString() || "0"}
          color="safe"
        />
        <StatMini
          label="失败次数"
          value={usageStats?.failCount.toLocaleString() || "0"}
          color="danger"
        />
        <StatMini label="失败率" value={failRate} color="warn" />
      </div>

      <SectionTitle title="近14天登录趋势" desc="每日登录次数与失败情况" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
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
              dataKey="login"
              name="成功"
              stackId="a"
              fill="#6366F1"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="fail"
              name="失败"
              stackId="a"
              fill="#DC2626"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface SsoTestTabProps {
  app: Application;
  updateApplication: (appId: string, patch: Partial<Application>) => void;
  addAuditLog: (log: Partial<AuditLog>) => void;
}

const FAILURE_REASONS = [
  "ClientID 或 ClientSecret 不匹配",
  "回调 URL 未在白名单中",
  "签名验证失败，请检查证书配置",
  "响应超时，应用服务不可达",
  "用户信息端点返回非 200 状态码",
  "Token 签名算法不一致",
  "SAML Assertion 过期或无效",
  "IP 地址不在白名单范围内",
];

const nowDateTime = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

function SsoTestTab({ app, updateApplication, addAuditLog }: SsoTestTabProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [localResult, setLocalResult] = useState<LastTestResult | undefined>(app.lastTest);

  useEffect(() => {
    setLocalResult(app.lastTest);
  }, [app.lastTest, app.id]);

  const handleRunTest = async () => {
    if (isTesting) return;
    setIsTesting(true);

    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
    const duration = Date.now() - startTime;

    const success = Math.random() >= 0.5;
    const reason = success
      ? undefined
      : FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];

    const result: LastTestResult = {
      success,
      reason,
      testedAt: nowDateTime(),
      duration,
    };

    setLocalResult(result);
    updateApplication(app.id, { lastTest: result });
    addAuditLog({
      module: "应用接入",
      action: "SSO连通性测试",
      targetId: app.id,
      targetName: app.name,
      beforeValue: "-",
      afterValue: success ? "测试通过" : `测试失败: ${reason}`,
    });

    if (success) {
      toast.success("SSO 测试通过！");
    } else {
      toast.error(`SSO 测试失败：${reason}`);
    }

    setIsTesting(false);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="连通性测试"
        desc="模拟发起一次完整的 SSO 登录流程，验证协议配置是否正确"
      />

      <div className="p-5 rounded-lg bg-gradient-to-br from-ink-50 to-ink-100 border border-ink-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <div className="text-sm font-semibold text-ink-800">
              {app.protocol} 协议测试
            </div>
            <div className="text-xs text-ink-500 mt-1">
              测试端点：认证请求 → 身份验证 → Token/Assertion 校验 → 用户信息拉取
            </div>
          </div>
          <button
            onClick={handleRunTest}
            disabled={isTesting || app.status === "disabled"}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200",
              isTesting || app.status === "disabled"
                ? "bg-ink-200 text-ink-400 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>测试中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>开始测试</span>
              </>
            )}
          </button>
        </div>

        {app.status === "disabled" && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>应用当前已停用，请先在「基础配置」中启用后再进行测试</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-md bg-white border border-ink-200">
            <div className="text-[11px] text-ink-400 mb-1">测试步骤</div>
            <div className="text-sm font-bold text-ink-700 tabular-nums">4</div>
          </div>
          <div className="p-3 rounded-md bg-white border border-ink-200">
            <div className="text-[11px] text-ink-400 mb-1">协议类型</div>
            <div className="text-sm font-bold text-ink-700">{app.protocol}</div>
          </div>
          <div className="p-3 rounded-md bg-white border border-ink-200">
            <div className="text-[11px] text-ink-400 mb-1">回调地址</div>
            <div className="text-sm font-bold text-ink-700 tabular-nums">
              {app.callbackUrls.length}
            </div>
          </div>
          <div className="p-3 rounded-md bg-white border border-ink-200">
            <div className="text-[11px] text-ink-400 mb-1">MFA</div>
            <div className="text-sm font-bold text-ink-700">
              {app.mfaRequired ? "开启" : "关闭"}
            </div>
          </div>
        </div>
      </div>

      <SectionTitle title="测试结果" desc="最近一次 SSO 连通性测试的详细信息" />

      {!localResult ? (
        <div className="p-8 rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 text-center">
          <TestTube className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <div className="text-sm font-medium text-ink-500">尚未进行测试</div>
          <div className="text-xs text-ink-400 mt-1">
            点击上方「开始测试」按钮验证 SSO 配置
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "p-5 rounded-lg border-2",
            localResult.success
              ? "bg-safe-50/50 border-safe-200"
              : "bg-danger-50/50 border-danger-200"
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            {localResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-safe-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-danger-600 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-base font-bold",
                  localResult.success ? "text-safe-800" : "text-danger-800"
                )}
              >
                {localResult.success ? "测试通过 ✓" : "测试失败 ✗"}
              </div>
              <div
                className={cn(
                  "text-xs mt-0.5",
                  localResult.success ? "text-safe-600" : "text-danger-600"
                )}
              >
                {localResult.success
                  ? `${app.protocol} 协议配置正确，SSO 登录流程可正常完成`
                  : localResult.reason}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-ink-200/60">
            <div className="flex items-center gap-2 text-xs text-ink-600">
              <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="text-ink-400 shrink-0">测试时间：</span>
              <span className="font-mono font-medium text-ink-700">
                {localResult.testedAt}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-600">
              <Activity className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="text-ink-400 shrink-0">耗时：</span>
              <span className="font-mono font-medium text-ink-700 tabular-nums">
                {localResult.duration} ms
              </span>
            </div>
          </div>

          {!localResult.success && localResult.reason && (
            <div className="mt-4 p-3 rounded-md bg-white/60 border border-danger-200/60">
              <div className="text-[11px] font-semibold text-danger-700 mb-1.5">
                排查建议
              </div>
              <ul className="space-y-1 text-[11px] text-ink-600">
                <li>• 请检查「协议配置」中的 ClientID / ClientSecret 是否与应用侧一致</li>
                <li>• 确认回调地址已正确添加到应用的白名单中</li>
                <li>• SAML 协议请验证证书文件和签名算法是否匹配</li>
                <li>• 检查「访问策略」中的 IP 白名单和时段限制是否影响测试</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-md bg-brand-50/50 border border-brand-200/60">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-brand-800 mb-1">
              测试说明
            </div>
            <ul className="space-y-1 text-[11px] text-brand-700/80 leading-relaxed">
              <li>• 本测试为模拟演练，不会创建真实会话或写入登录日志</li>
              <li>• 测试结果仅反映协议层面的连通性，不代表真实用户体验</li>
              <li>• 建议每次修改协议配置后重新执行测试</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "brand" | "safe" | "danger" | "warn";
}) {
  const colorMap = {
    brand: "from-brand-50 to-brand-100 text-brand-700 border-brand-200",
    safe: "from-safe-50 to-safe-100 text-safe-700 border-safe-200",
    danger: "from-danger-50 to-danger-100 text-danger-700 border-danger-200",
    warn: "from-warn-50 to-warn-100 text-warn-700 border-warn-200",
  };
  return (
    <div
      className={cn(
        "p-3 rounded-md border bg-gradient-to-br",
        colorMap[color]
      )}
    >
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-lg font-bold font-display tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="border-l-4 border-brand-500 pl-3">
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-ink-500">{desc}</p>}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-600 mb-1.5">
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

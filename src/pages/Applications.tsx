import { useMemo, useState } from "react";
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
import { mockApplications, mockAppUsageStats } from "@/mock";
import type { Application, AppProtocol, AppStatus } from "@/types";
import { cn } from "@/lib/utils";

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
] as const;

type DrawerTabKey = (typeof DRAWER_TABS)[number]["key"];

export default function Applications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORIES)[number]>("全部");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("本月");
  const [apps, setApps] = useState<Application[]>(mockApplications);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTabKey>("basic");

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
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
  }, [apps, searchQuery, categoryFilter, statusFilter]);

  const appLoginStats = useMemo(() => {
    const map = new Map<string, { loginCount: number; uniqueUsers: number }>();
    mockAppUsageStats.forEach((s) => {
      map.set(s.appId, { loginCount: s.loginCount, uniqueUsers: s.uniqueUsers });
    });
    return map;
  }, []);

  const usageChartData = useMemo(() => {
    return mockAppUsageStats.map((s) => {
      const app = apps.find((a) => a.id === s.appId);
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
  }, [apps]);

  const handleToggleStatus = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, status: app.status === "enabled" ? "disabled" : "enabled" }
          : app
      )
    );
  };

  const handleOpenDrawer = (app: Application) => {
    setSelectedApp(app);
    setDrawerTab("basic");
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedApp(null), 300);
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
          <button className="btn-primary">
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
              onConfigure={() => handleOpenDrawer(app)}
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
                        onClick={() => handleOpenDrawer(app)}
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

      {drawerOpen && selectedApp && (
        <AppDetailDrawer
          app={selectedApp}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={handleCloseDrawer}
          usageStats={mockAppUsageStats.find((s) => s.appId === selectedApp.id)}
        />
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

interface AppDetailDrawerProps {
  app: Application;
  activeTab: DrawerTabKey;
  onTabChange: (tab: DrawerTabKey) => void;
  onClose: () => void;
  usageStats?: {
    loginCount: number;
    uniqueUsers: number;
    failCount: number;
  };
}

function AppDetailDrawer({
  app,
  activeTab,
  onTabChange,
  onClose,
  usageStats,
}: AppDetailDrawerProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerate = (field: string) => {
    setCopiedField(`regen-${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const failRate =
    usageStats && usageStats.loginCount > 0
      ? ((usageStats.failCount / usageStats.loginCount) * 100).toFixed(1) + "%"
      : "0%";

  return (
    <>
      <div
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-soft z-40 transition-opacity animate-fade-in-up"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl border-l border-ink-200 flex flex-col animate-slide-in-right">
        <div className="flex items-start justify-between p-5 border-b border-ink-200">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br",
                categoryGradientMap[app.category] || categoryGradientMap["办公协作"]
              )}
            >
              {app.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-800">
                {app.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-ink-400">
                  {app.code}
                </span>
                <span className={protocolBadgeMap[app.protocol]}>
                  {app.protocol}
                </span>
                <span
                  className={cn(
                    "badge",
                    app.status === "enabled"
                      ? "badge-safe"
                      : "badge-neutral"
                  )}
                >
                  {statusLabelMap[app.status]}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-ink-200 px-3">
          {DRAWER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
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

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {activeTab === "basic" && <BasicConfigTab app={app} />}
          {activeTab === "protocol" && (
            <ProtocolConfigTab
              app={app}
              showSecret={showSecret}
              onToggleSecret={() => setShowSecret((v) => !v)}
              copiedField={copiedField}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
            />
          )}
          {activeTab === "policy" && <AccessPolicyTab app={app} />}
          {activeTab === "stats" && (
            <StatsTab app={app} usageStats={usageStats} failRate={failRate} />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-ink-200 bg-ink-50/50">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button className="btn-primary">保存配置</button>
        </div>
      </div>
    </>
  );
}

function BasicConfigTab({ app }: { app: Application }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="基础信息" desc="应用的基本标识信息" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="应用名称" required>
          <input type="text" defaultValue={app.name} className="input-base" />
        </FormField>
        <FormField label="应用编码" required>
          <input
            type="text"
            defaultValue={app.code}
            className="input-base font-mono"
          />
        </FormField>
      </div>
      <FormField label="应用描述">
        <textarea
          defaultValue={app.description}
          rows={3}
          className="input-base resize-none"
        />
      </FormField>
      <FormField label="应用Logo">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br",
              categoryGradientMap[app.category] || categoryGradientMap["办公协作"]
            )}
          >
            {app.name.charAt(0)}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary">上传Logo</button>
            <button className="btn-ghost">移除</button>
          </div>
        </div>
      </FormField>
      <FormField label="应用分类" required>
        <select defaultValue={app.category} className="input-base">
          {CATEGORIES.slice(1).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <div className="pt-2">
        <div className="text-xs text-ink-400">
          创建时间：{app.createdAt}
        </div>
      </div>
    </div>
  );
}

interface ProtocolConfigProps {
  app: Application;
  showSecret: boolean;
  onToggleSecret: () => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onRegenerate: (field: string) => void;
}

function ProtocolConfigTab({
  app,
  showSecret,
  onToggleSecret,
  copiedField,
  onCopy,
  onRegenerate,
}: ProtocolConfigProps) {
  return (
    <div className="space-y-5">
      <SectionTitle title="协议类型" desc="选择与应用对接的单点登录协议" />
      <FormField label="SSO协议" required>
        <div className="grid grid-cols-4 gap-2">
          {(["OIDC", "SAML", "CAS", "OAuth2"] as AppProtocol[]).map((p) => (
            <label
              key={p}
              className={cn(
                "flex items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all",
                app.protocol === p
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:border-ink-300"
              )}
            >
              <input
                type="radio"
                name="protocol"
                defaultChecked={app.protocol === p}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  app.protocol === p ? "text-brand-700" : "text-ink-600"
                )}
              >
                {p}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {(app.protocol === "OIDC" || app.protocol === "OAuth2") && (
        <>
          <SectionTitle title="客户端凭证" desc="用于应用身份认证的密钥信息" />
          <FormField label="Client ID">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  defaultValue={app.clientId}
                  className="input-base font-mono text-xs pr-20"
                />
                <button
                  onClick={() =>
                    onCopy(app.clientId || "", "clientId")
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === "clientId" ? "已复制" : "复制"}
                </button>
              </div>
            </div>
          </FormField>

          <FormField label="Client Secret">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type={showSecret ? "text" : "password"}
                  readOnly
                  defaultValue="sk-live-8f3d2a9c1e7b4f5a8d2c6e9b0a1f3d5e"
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
                    onClick={() =>
                      onCopy("sk-live-8f3d2a9c1e7b4f5a8d2c6e9b0a1f3d5e", "secret")
                    }
                    className="p-1 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
                    title="复制"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRegenerate("secret")}
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

      <SectionTitle title="回调地址" desc="用户登录成功后的跳转地址" />
      <UrlList
        label="回调 URL"
        urls={app.callbackUrls}
        placeholder="https://app.example.com/callback"
      />

      <SectionTitle title="登出地址" desc="用户登出后的跳转地址（可选）" />
      <UrlList
        label="登出 URL"
        urls={app.logoutUrls}
        placeholder="https://app.example.com/logout"
      />
    </div>
  );
}

function AccessPolicyTab({ app }: { app: Application }) {
  const [forceMfa, setForceMfa] = useState(app.mfaRequired);
  const [startHour, setStartHour] = useState(app.accessHours?.start || "09:00");
  const [endHour, setEndHour] = useState(app.accessHours?.end || "18:00");

  return (
    <div className="space-y-5">
      <SectionTitle title="IP白名单" desc="仅允许列表内的IP网段访问（留空表示不限制）" />
      <FormField label="允许的IP/网段">
        <textarea
          defaultValue={app.ipWhitelist.join("\n")}
          rows={4}
          placeholder="每行一个，支持单IP或CIDR格式，如：&#10;10.0.0.0/8&#10;192.168.1.100"
          className="input-base font-mono text-xs resize-none"
        />
      </FormField>
      <div className="text-xs text-ink-400 -mt-3">
        当前已配置 {app.ipWhitelist.length} 条白名单规则
      </div>

      <SectionTitle title="访问时段" desc="限制用户允许登录的时间范围" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="开始时间">
          <input
            type="time"
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="input-base"
          />
        </FormField>
        <FormField label="结束时间">
          <input
            type="time"
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="input-base"
          />
        </FormField>
      </div>

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
            checked={forceMfa}
            onChange={() => setForceMfa((v) => !v)}
          />
        </div>

        <FormField label="会话有效期（分钟）">
          <input
            type="number"
            defaultValue={480}
            min={5}
            max={1440}
            className="input-base"
          />
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

function UrlList({
  label,
  urls,
  placeholder,
}: {
  label: string;
  urls: string[];
  placeholder: string;
}) {
  const [items, setItems] = useState<string[]>(urls.length > 0 ? urls : [""]);

  return (
    <div className="space-y-2">
      {items.map((url, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="url"
            defaultValue={url}
            placeholder={placeholder}
            className="input-base font-mono text-xs"
          />
          <button
            onClick={() =>
              setItems((prev) =>
                prev.length > 1
                  ? prev.filter((_, i) => i !== idx)
                  : [""]
              )
            }
            className="p-2 rounded-md text-ink-400 hover:text-danger-500 hover:bg-danger-50 transition-colors shrink-0"
            title="移除"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => setItems((prev) => [...prev, ""])}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
      >
        <SquarePlus className="w-3.5 h-3.5" />
        添加{label}
      </button>
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  MapPin,
  Clock,
  Monitor,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Eye,
  LogOut,
  CheckCircle2,
  Search,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Play,
  X,
  Users,
  FileDown,
  Snowflake,
  UserCheck,
  Shield,
  ShieldAlert,
  Activity,
  Ban,
  Filter,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { mockRiskEvents, mockRiskRules, mockAuditLogs, mockUsers } from "@/mock";
import type { RiskLevel, RiskType, RiskStatus, HandleAction } from "@/types";

type TabKey = "overview" | "accounts" | "rules" | "records";

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "风险概览", icon: Activity },
  { key: "accounts", label: "异常账号", icon: ShieldAlert },
  { key: "rules", label: "风险规则", icon: Shield },
  { key: "records", label: "处置记录", icon: FileDown },
];

const levelBadgeMap: Record<RiskLevel, string> = {
  high: "badge-danger",
  medium: "badge-warn",
  low: "badge-info",
};

const levelLabelMap: Record<RiskLevel, string> = {
  high: "高危",
  medium: "中危",
  low: "低危",
};

const statusBadgeMap: Record<RiskStatus, string> = {
  pending: "badge-warn animate-pulse-soft",
  resolved: "badge-safe",
  ignored: "badge-neutral",
};

const statusLabelMap: Record<RiskStatus, string> = {
  pending: "待处置",
  resolved: "已处置",
  ignored: "已忽略",
};

const riskTypeIconMap: Record<RiskType, React.ComponentType<{ className?: string }>> = {
  异地登录: MapPin,
  暴力破解: ShieldX,
  异常时段: Clock,
  异常设备: Monitor,
  高频失败: AlertOctagon,
};

const avatarColors = [
  "bg-brand-100 text-brand-700",
  "bg-safe-100 text-safe-700",
  "bg-warn-100 text-warn-700",
  "bg-danger-100 text-danger-700",
];

function generate14DayTrend() {
  const data: {
    date: string;
    异地登录: number;
    暴力破解: number;
    异常时段: number;
    异常设备: number;
    高频失败: number;
  }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      异地登录: Math.floor(Math.random() * 3),
      暴力破解: Math.floor(Math.random() * 2),
      异常时段: Math.floor(Math.random() * 4),
      异常设备: Math.floor(Math.random() * 3),
      高频失败: Math.floor(Math.random() * 5),
    });
  }
  return data;
}

export default function Risk() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-5">
      <section className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-ink-800">风险处置</h1>
        <p className="mt-1 text-sm text-ink-500">
          智能识别访问异常，闭环处置安全风险事件，保障账号安全
        </p>
      </section>

      <section className="card-base p-1.5 inline-flex gap-1 animate-fade-in-up stagger-1">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={
                isActive
                  ? "inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm transition-all duration-200"
                  : "inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-all duration-200"
              }
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </section>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "rules" && <RulesTab />}
      {activeTab === "records" && <RecordsTab />}
    </div>
  );
}

function OverviewTab() {
  const pieData = [
    { name: "高危", value: 25, color: "#DC2626" },
    { name: "中危", value: 45, color: "#F59E0B" },
    { name: "低危", value: 30, color: "#6366F1" },
  ];

  const trendData = useMemo(() => generate14DayTrend(), []);
  const recentEvents = useMemo(() => mockRiskEvents.slice(0, 6), []);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-base p-5 animate-fade-in-up stagger-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danger-500 to-warn-300" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-500" />
                <span className="text-sm font-medium text-ink-600">待处置风险事件</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger-500"></span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ink-800 font-display tabular-nums">3</span>
                <div className="flex items-center gap-0.5 text-xs text-danger-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>50%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-danger-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">高危</div>
              <div className="mt-0.5 text-lg font-semibold text-danger-600 tabular-nums">2</div>
            </div>
            <div className="rounded-md bg-warn-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">中危</div>
              <div className="mt-0.5 text-lg font-semibold text-warn-600 tabular-nums">1</div>
            </div>
            <div className="rounded-md bg-brand-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">低危</div>
              <div className="mt-0.5 text-lg font-semibold text-brand-600 tabular-nums">0</div>
            </div>
          </div>
        </div>

        <div className="card-base p-5 animate-fade-in-up stagger-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-safe-500 to-brand-300" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-safe-600" />
                <span className="text-sm font-medium text-ink-600">本月已处置</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ink-800 font-display tabular-nums">12</span>
                <span className="text-xs text-safe-600 font-medium">处置率 80%</span>
                <div className="flex items-center gap-0.5 text-xs text-safe-600 ml-auto">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>处置时长↓</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-danger-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">账号冻结</div>
              <div className="mt-0.5 text-lg font-semibold text-danger-600 tabular-nums">5</div>
            </div>
            <div className="rounded-md bg-warn-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">强制下线</div>
              <div className="mt-0.5 text-lg font-semibold text-warn-600 tabular-nums">4</div>
            </div>
            <div className="rounded-md bg-safe-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">放行</div>
              <div className="mt-0.5 text-lg font-semibold text-safe-600 tabular-nums">3</div>
            </div>
          </div>
        </div>

        <div className="card-base p-5 animate-fade-in-up stagger-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-safe-300" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <span className="text-sm font-medium text-ink-600">账号健康分</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-ink-800 font-display tabular-nums">92.4</span>
                <span className="text-sm text-ink-400 font-medium">/100</span>
              </div>
            </div>
            <HealthGauge value={92.4} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">已绑定MFA</span>
              <span className="font-semibold text-safe-600 tabular-nums">68%</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-safe-500 rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink-500">强密码用户</span>
              <span className="font-semibold text-brand-600 tabular-nums">94%</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: "94%" }} />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink-500">异常账号</span>
              <span className="font-semibold text-danger-600 tabular-nums">1.3%</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-danger-500 rounded-full" style={{ width: "13%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-base p-5 animate-fade-in-up">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-800">风险等级分布</h2>
            <p className="mt-0.5 text-xs text-ink-500">各等级风险事件占比统计</p>
          </div>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, "占比"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-ink-600">{item.name}</span>
                <span className="font-semibold text-ink-800 tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base p-5 animate-fade-in-up stagger-1">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-800">风险类型趋势</h2>
            <p className="mt-0.5 text-xs text-ink-500">近14天各类风险事件数量</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
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
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                />
                <Bar dataKey="异地登录" stackId="a" fill="#DC2626" radius={[0, 0, 0, 0]} />
                <Bar dataKey="暴力破解" stackId="a" fill="#B91C1C" radius={[0, 0, 0, 0]} />
                <Bar dataKey="异常时段" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="异常设备" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="高频失败" stackId="a" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card-base p-5 animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-800">近期风险事件</h2>
            <p className="mt-0.5 text-xs text-ink-500">最近检测到的风险事件时间线</p>
          </div>
          <button className="btn-ghost">
            <span>查看全部</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <ol className="relative border-l border-ink-200 ml-2 space-y-4">
          {recentEvents.map((event, idx) => {
            const dotColor =
              event.level === "high"
                ? "bg-danger-500"
                : event.level === "medium"
                ? "bg-warn-500"
                : "bg-brand-500";
            const TypeIcon = riskTypeIconMap[event.type];
            return (
              <li key={event.id} className="ml-6">
                <span
                  className={`absolute -left-[17px] flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white ${dotColor}`}
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-ink-400">
                        {event.detectedAt.slice(5, 16)}
                      </span>
                      <span className={levelBadgeMap[event.level]}>
                        {levelLabelMap[event.level]}
                      </span>
                      <span className="badge-info inline-flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" />
                        {event.type}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm text-ink-700">
                      <span className="font-medium text-ink-800">{event.userName}</span>
                      <span className="text-ink-500">（{event.userDept}）</span>
                      <span className="mx-1">-</span>
                      <span>{event.description}</span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500 font-mono">
                      IP: {event.ip}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={statusBadgeMap[event.status]}>
                      {statusLabelMap[event.status]}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function HealthGauge({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

type AccountStatus = "frozen" | "pending" | "recovered";

interface RiskAccount {
  id: string;
  name: string;
  dept: string;
  position: string;
  level: RiskLevel;
  reason: RiskType;
  eventCount: number;
  lastTime: string;
  status: AccountStatus;
}

const mockRiskAccounts: RiskAccount[] = [
  { id: "u007", name: "吴九", dept: "信息安全部", position: "安全审计员", level: "high", reason: "异地登录", eventCount: 3, lastTime: "2026-06-08 23:45:12", status: "frozen" },
  { id: "u006", name: "周八", dept: "后端开发组", position: "高级开发工程师", level: "high", reason: "暴力破解", eventCount: 1, lastTime: "2026-06-10 07:30:00", status: "frozen" },
  { id: "u005", name: "孙七", dept: "前端开发组", position: "高级开发工程师", level: "medium", reason: "异常设备", eventCount: 2, lastTime: "2026-06-10 08:20:15", status: "pending" },
  { id: "u003", name: "王五", dept: "人力资源部", position: "HRBP", level: "medium", reason: "异常时段", eventCount: 4, lastTime: "2026-06-09 02:15:44", status: "recovered" },
  { id: "u010", name: "林二", dept: "运营管理部", position: "运营专员", level: "low", reason: "高频失败", eventCount: 2, lastTime: "2026-06-10 08:40:00", status: "recovered" },
  { id: "u008", name: "郑十", dept: "市场营销部", position: "市场总监", level: "high", reason: "异地登录", eventCount: 1, lastTime: "2026-06-09 22:10:33", status: "pending" },
];

const accountStatusBadgeMap: Record<AccountStatus, string> = {
  frozen: "badge-danger",
  pending: "badge-warn animate-pulse-soft",
  recovered: "badge-safe",
};

const accountStatusLabelMap: Record<AccountStatus, string> = {
  frozen: "冻结中",
  pending: "待处置",
  recovered: "已恢复",
};

function AccountsTab() {
  const [statusTab, setStatusTab] = useState<"frozen" | "pending" | "recovered" | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<RiskType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailAccount, setDetailAccount] = useState<RiskAccount | null>(null);

  const filteredAccounts = useMemo(() => {
    return mockRiskAccounts.filter((a) => {
      if (statusTab !== "all" && a.status !== statusTab) return false;
      if (levelFilter !== "all" && a.level !== levelFilter) return false;
      if (typeFilter !== "all" && a.reason !== typeFilter) return false;
      if (searchText) {
        const kw = searchText.toLowerCase();
        if (
          !a.name.toLowerCase().includes(kw) &&
          !a.dept.toLowerCase().includes(kw) &&
          !a.id.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [statusTab, levelFilter, typeFilter, searchText]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccounts.map((a) => a.id));
    }
  };

  return (
    <div className="space-y-4">
      <section className="card-base p-4 animate-fade-in-up">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {(["frozen", "pending", "recovered", "all"] as const).map((s) => {
              const count =
                s === "all"
                  ? mockRiskAccounts.length
                  : mockRiskAccounts.filter((a) => a.status === s).length;
              const isActive = statusTab === s;
              const label =
                s === "frozen" ? "冻结中" : s === "pending" ? "待处置" : s === "recovered" ? "已恢复" : "全部";
              return (
                <button
                  key={s}
                  onClick={() => setStatusTab(s)}
                  className={
                    isActive
                      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm"
                      : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
                  }
                >
                  <span>{label}</span>
                  <span className={isActive ? "bg-white/20 px-1.5 rounded-full text-xs" : "bg-ink-100 px-1.5 rounded-full text-xs text-ink-500"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                className="input-base !pl-9"
                placeholder="搜索用户名 / 部门 / IP"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-ink-400" />
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-28"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as RiskLevel | "all")}
                >
                  <option value="all">全部等级</option>
                  <option value="high">高危</option>
                  <option value="medium">中危</option>
                  <option value="low">低危</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-36"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as RiskType | "all")}
                >
                  <option value="all">风险类型</option>
                  <option value="异地登录">异地登录</option>
                  <option value="暴力破解">暴力破解</option>
                  <option value="异常时段">异常时段</option>
                  <option value="异常设备">异常设备</option>
                  <option value="高频失败">高频失败</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="card-base p-3 flex items-center justify-between animate-fade-in-up bg-brand-50/50">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span className="text-ink-700">
              已选中 <span className="font-semibold text-brand-700">{selectedIds.length}</span> 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-danger !py-1.5 !px-3 text-xs">
              <Snowflake className="w-3.5 h-3.5" />
              <span>批量冻结</span>
            </button>
            <button className="btn-secondary !py-1.5 !px-3 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              <span>批量强制下线</span>
            </button>
            <button className="btn-secondary !py-1.5 !px-3 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>批量放行</span>
            </button>
            <button className="btn-ghost !py-1.5 !px-3 text-xs">
              <FileDown className="w-3.5 h-3.5" />
              <span>导出</span>
            </button>
          </div>
        </section>
      )}

      <section className="card-base overflow-auto scrollbar-thin animate-fade-in-up">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
              </th>
              <th className="table-th w-52">账号信息</th>
              <th className="table-th w-24">风险等级</th>
              <th className="table-th w-36">风险原因</th>
              <th className="table-th w-28">关联事件</th>
              <th className="table-th w-40">最近异常时间</th>
              <th className="table-th w-28">状态</th>
              <th className="table-th w-64 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((a, idx) => {
              const initial = a.name.charAt(0);
              const avatarCls = avatarColors[idx % avatarColors.length];
              const ReasonIcon = riskTypeIconMap[a.reason];
              return (
                <tr key={a.id} className="table-row">
                  <td className="table-td">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${avatarCls}`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-800">{a.name}</div>
                        <div className="text-xs text-ink-500 truncate">
                          {a.dept} · {a.position}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={levelBadgeMap[a.level]}>{levelLabelMap[a.level]}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-ink-700 text-sm">
                      <ReasonIcon className="w-4 h-4 text-ink-500" />
                      <span>{a.reason}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="badge-info tabular-nums">{a.eventCount} 条</span>
                  </td>
                  <td className="table-td">
                    <div className="text-xs font-mono text-ink-600 whitespace-nowrap">
                      {a.lastTime.slice(5, 16)}
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={accountStatusBadgeMap[a.status]}>
                      {accountStatusLabelMap[a.status]}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailAccount(a)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {a.status === "frozen" ? (
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-safe-600 hover:bg-safe-50 transition-colors"
                          title="解冻账号"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-danger-600 hover:bg-danger-50 transition-colors"
                          title="冻结账号"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-warn-600 hover:bg-warn-50 transition-colors"
                        title="强制下线"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-safe-600 hover:bg-safe-50 transition-colors"
                        title="标记放行"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={8} className="table-td text-center text-ink-400 py-12">
                  暂无匹配的异常账号
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedIds.length > 0 && (
        <section className="card-base p-3 flex items-center justify-between animate-fade-in-up bg-brand-50/50">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span className="text-ink-700">
              已选中 <span className="font-semibold text-brand-700">{selectedIds.length}</span> 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-danger !py-1.5 !px-3 text-xs">
              <Snowflake className="w-3.5 h-3.5" />
              <span>批量冻结</span>
            </button>
            <button className="btn-secondary !py-1.5 !px-3 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              <span>批量强制下线</span>
            </button>
            <button className="btn-secondary !py-1.5 !px-3 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>批量放行</span>
            </button>
            <button className="btn-ghost !py-1.5 !px-3 text-xs">
              <FileDown className="w-3.5 h-3.5" />
              <span>导出</span>
            </button>
          </div>
        </section>
      )}

      {detailAccount && (
        <AccountDetailDrawer account={detailAccount} onClose={() => setDetailAccount(null)} />
      )}
    </div>
  );
}

function AccountDetailDrawer({ account, onClose }: { account: RiskAccount; onClose: () => void }) {
  const [detailTab, setDetailTab] = useState<"basic" | "login" | "risk" | "history">("basic");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-soft" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-xl animate-slide-in-right overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 z-10 bg-white border-b border-ink-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
              {account.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-ink-800">{account.name}</h3>
              <p className="text-xs text-ink-500">{account.dept} · {account.position}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-ink-100 flex gap-1">
          {(
            [
              { key: "basic", label: "基本信息" },
              { key: "login", label: "登录轨迹" },
              { key: "risk", label: "风险分析" },
              { key: "history", label: "处置历史" },
            ] as const
          ).map((t) => {
            const isActive = detailTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setDetailTab(t.key)}
                className={
                  isActive
                    ? "px-3 py-1.5 rounded-md text-sm font-medium text-brand-700 bg-brand-50"
                    : "px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 transition-colors"
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {detailTab === "basic" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="账号ID" value={account.id} mono />
                <DetailItem label="姓名" value={account.name} />
                <DetailItem label="部门" value={account.dept} />
                <DetailItem label="岗位" value={account.position} />
                <DetailItem label="风险等级" value={levelLabelMap[account.level]} badgeClass={levelBadgeMap[account.level]} />
                <DetailItem label="当前状态" value={accountStatusLabelMap[account.status]} badgeClass={accountStatusBadgeMap[account.status]} />
                <DetailItem label="MFA绑定" value="已绑定" badgeClass="badge-safe" />
                <DetailItem label="上次登录IP" value="10.0.1.45" mono />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <h4 className="text-sm font-semibold text-ink-800 mb-3">账号画像标签</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge-info">技术岗</span>
                  <span className="badge-info">高级权限</span>
                  <span className="badge-warn">近期异常</span>
                  <span className="badge-safe">MFA已启用</span>
                  <span className="badge-neutral">常用设备: MacBook</span>
                </div>
              </div>
            </div>
          )}

          {detailTab === "login" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="h-40 rounded-md bg-gradient-to-br from-brand-50 to-safe-50 border border-ink-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm text-ink-600">登录地理分布（迷你地图占位）</p>
                  <p className="text-xs text-ink-400 mt-1">北京 · 上海 · 广州（异常）</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-ink-800">最近登录记录</h4>
                {[
                  { time: "2026-06-08 23:45", ip: "203.0.113.45", loc: "上海（异常）", status: "fail", device: "Mac/Safari" },
                  { time: "2026-06-08 09:12", ip: "10.0.1.45", loc: "北京总部", status: "success", device: "Mac/Firefox" },
                  { time: "2026-06-07 18:30", ip: "10.0.1.45", loc: "北京总部", status: "success", device: "Mac/Firefox" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-ink-50/60">
                    <span className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-safe-500" : "bg-danger-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-ink-500">{log.time}</span>
                        <span className={log.status === "success" ? "badge-safe" : "badge-danger"}>
                          {log.status === "success" ? "成功" : "失败"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-ink-600 flex gap-3 flex-wrap">
                        <span className="font-mono">IP {log.ip}</span>
                        <span>{log.loc}</span>
                        <span>{log.device}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailTab === "risk" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-3 gap-3">
                <div className="card-base p-3 text-center">
                  <div className="text-2xl font-bold text-danger-600 tabular-nums font-display">{account.eventCount}</div>
                  <div className="text-xs text-ink-500 mt-1">风险事件</div>
                </div>
                <div className="card-base p-3 text-center">
                  <div className="text-2xl font-bold text-warn-600 tabular-nums font-display">78</div>
                  <div className="text-xs text-ink-500 mt-1">风险评分</div>
                </div>
                <div className="card-base p-3 text-center">
                  <div className="text-2xl font-bold text-brand-600 tabular-nums font-display">高</div>
                  <div className="text-xs text-ink-500 mt-1">处置优先级</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink-800 mb-2">触发风险原因</h4>
                <div className="p-3 rounded-md bg-danger-50 border border-danger-200/60">
                  <div className="flex items-start gap-2">
                    {(() => {
                      const Icon = riskTypeIconMap[account.reason];
                      return <Icon className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />;
                    })()}
                    <div>
                      <div className="text-sm font-medium text-danger-700">{account.reason}</div>
                      <div className="text-xs text-danger-600/80 mt-0.5">
                        {mockRiskEvents.find((e) => e.userId === account.id)?.description || "检测到异常行为模式"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink-800 mb-2">建议处置措施</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="w-4 h-4 text-safe-600" />
                    <span>立即冻结账号，防止未授权访问</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="w-4 h-4 text-safe-600" />
                    <span>强制下线所有活跃会话</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="w-4 h-4 text-safe-600" />
                    <span>通知用户修改密码</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === "history" && (
            <div className="space-y-3 animate-fade-in-up">
              <h4 className="text-sm font-semibold text-ink-800">历史处置记录</h4>
              <ol className="relative border-l border-ink-200 ml-2 space-y-4">
                {[
                  { time: "2026-06-08 23:50", action: "自动冻结", operator: "系统", remark: "异地登录触发规则自动冻结" },
                  { time: "2026-06-05 14:20", action: "人工核查", operator: "李四", remark: "确认为用户本人操作，解除告警" },
                  { time: "2026-05-28 09:10", action: "强制下线", operator: "李四", remark: "异常时段登录，强制下线会话" },
                ].map((h, i) => (
                  <li key={i} className="ml-5">
                    <span className="absolute -left-[15px] w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-ink-400">{h.time}</span>
                      <span className="badge-info">{h.action}</span>
                      <span className="text-ink-600">处置人：{h.operator}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">{h.remark}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  badgeClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badgeClass?: string;
}) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      {badgeClass ? (
        <span className={badgeClass}>{value}</span>
      ) : (
        <div className={`text-sm text-ink-800 font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
      )}
    </div>
  );
}

type RuleDetectionType = "geo_detection" | "brute_force" | "time_anomaly" | "device_anomaly" | "behavior_anomaly";

const ruleTypeLabelMap: Record<string, string> = {
  geo_detection: "地理异常",
  brute_force: "频率异常",
  time_anomaly: "时间异常",
  device_anomaly: "设备异常",
  behavior_anomaly: "行为异常",
};

const ruleTypeOptions: { key: RuleDetectionType; label: string }[] = [
  { key: "geo_detection", label: "地理异常" },
  { key: "brute_force", label: "频率异常" },
  { key: "time_anomaly", label: "时间异常" },
  { key: "device_anomaly", label: "设备异常" },
  { key: "behavior_anomaly", label: "行为异常" },
];

const responseActionOptions = [
  { key: "alert", label: "仅告警" },
  { key: "logout", label: "强制下线" },
  { key: "freeze", label: "自动冻结" },
];

function RulesTab() {
  const [rules, setRules] = useState(mockRiskRules);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<(typeof mockRiskRules)[number] | null>(null);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const openNewRule = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const openEditRule = (rule: (typeof mockRiskRules)[number]) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const formatThreshold = (rule: (typeof mockRiskRules)[number]): string => {
    const t = rule.threshold;
    switch (rule.type) {
      case "geo_detection":
        return `距离阈值: ${t.distanceKm}km / ${t.withinHours}小时内`;
      case "brute_force":
        return `触发阈值: ${t.failCount}次失败 / ${t.withinMinutes}分钟`;
      case "time_anomaly":
        return `异常时段: ${t.startHour}:00 - ${t.endHour}:00`;
      case "device_anomaly":
        return `信任周期: ${t.trustedDays}天内设备`;
      case "high_fail_rate":
        return `触发阈值: ${t.failCount}次失败 / ${t.withinHours}小时`;
      default:
        return "无特殊阈值";
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between animate-fade-in-up">
        <div className="text-sm text-ink-500">
          共 <span className="font-semibold text-ink-700 tabular-nums">{rules.length}</span> 条规则，
          已启用 <span className="font-semibold text-safe-600 tabular-nums">{rules.filter((r) => r.enabled).length}</span> 条
        </div>
        <button className="btn-primary" onClick={openNewRule}>
          <Plus className="w-4 h-4" />
          <span>新增规则</span>
        </button>
      </section>

      <section className="space-y-3">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className={`card-base card-hover p-5 animate-fade-in-up stagger-${(idx % 6) + 1}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-ink-800">{rule.name}</h3>
                  <span className="font-mono text-xs text-ink-400">{rule.id.toUpperCase()}</span>
                  <span className={levelBadgeMap[rule.level]}>{levelLabelMap[rule.level]}</span>
                  <span className="badge-neutral">{ruleTypeLabelMap[rule.type] || "行为异常"}</span>
                </div>
                <p className="mt-2 text-sm text-ink-500">{rule.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    {formatThreshold(rule)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                <div className="flex items-center gap-0.5 border-l border-ink-200 pl-2 ml-1">
                  <button
                    onClick={() => openEditRule(rule)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-brand-600 transition-colors"
                    title="编辑规则"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                    title="克隆规则"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-safe-600 transition-colors"
                    title="测试规则"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {showForm && (
        <RuleFormDrawer
          rule={editingRule}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function RuleFormDrawer({
  rule,
  onClose,
}: {
  rule: (typeof mockRiskRules)[number] | null;
  onClose: () => void;
}) {
  const [formName, setFormName] = useState(rule?.name || "");
  const [formDesc, setFormDesc] = useState(rule?.description || "");
  const [formType, setFormType] = useState<RuleDetectionType>(
    (rule?.type as RuleDetectionType) || "brute_force"
  );
  const [formLevel, setFormLevel] = useState<RiskLevel>(rule?.level || "medium");
  const [formAction, setFormAction] = useState("alert");
  const [thresholds, setThresholds] = useState<Record<string, number>>(rule?.threshold || {});

  const updateThreshold = (key: string, val: number) => {
    setThresholds((prev) => ({ ...prev, [key]: val }));
  };

  const renderThresholdFields = () => {
    switch (formType) {
      case "geo_detection":
        return (
          <div className="grid grid-cols-2 gap-3">
            <FormNumberField
              label="距离阈值 (km)"
              value={thresholds.distanceKm || 500}
              onChange={(v) => updateThreshold("distanceKm", v)}
            />
            <FormNumberField
              label="时间窗口 (小时)"
              value={thresholds.withinHours || 2}
              onChange={(v) => updateThreshold("withinHours", v)}
            />
          </div>
        );
      case "brute_force":
        return (
          <div className="grid grid-cols-2 gap-3">
            <FormNumberField
              label="失败次数阈值"
              value={thresholds.failCount || 10}
              onChange={(v) => updateThreshold("failCount", v)}
            />
            <FormNumberField
              label="时间窗口 (分钟)"
              value={thresholds.withinMinutes || 30}
              onChange={(v) => updateThreshold("withinMinutes", v)}
            />
          </div>
        );
      case "time_anomaly":
        return (
          <div className="grid grid-cols-2 gap-3">
            <FormNumberField
              label="异常起始时段 (0-23)"
              value={thresholds.startHour ?? 0}
              onChange={(v) => updateThreshold("startHour", v)}
              min={0}
              max={23}
            />
            <FormNumberField
              label="异常结束时段 (0-23)"
              value={thresholds.endHour ?? 6}
              onChange={(v) => updateThreshold("endHour", v)}
              min={0}
              max={23}
            />
          </div>
        );
      case "device_anomaly":
        return (
          <FormNumberField
            label="设备信任周期 (天)"
            value={thresholds.trustedDays || 30}
            onChange={(v) => updateThreshold("trustedDays", v)}
          />
        );
      case "behavior_anomaly":
        return (
          <div className="grid grid-cols-2 gap-3">
            <FormNumberField
              label="操作次数阈值"
              value={thresholds.opCount || 100}
              onChange={(v) => updateThreshold("opCount", v)}
            />
            <FormNumberField
              label="时间窗口 (分钟)"
              value={thresholds.withinMinutes || 10}
              onChange={(v) => updateThreshold("withinMinutes", v)}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-soft" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl animate-slide-in-right overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 z-10 bg-white border-b border-ink-200 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-ink-800 text-lg">
            {rule ? "编辑风险规则" : "新增风险规则"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">规则名称</label>
            <input
              type="text"
              className="input-base"
              placeholder="如：异地登录检测"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">规则描述</label>
            <textarea
              className="input-base min-h-[72px] resize-y"
              placeholder="描述规则的检测场景和目的"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">检测类型</label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {ruleTypeOptions.map((t) => {
                const isActive = formType === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFormType(t.key)}
                    className={
                      isActive
                        ? "px-3 py-2 rounded-md text-sm font-medium border-2 border-brand-500 bg-brand-50 text-brand-700 transition-all"
                        : "px-3 py-2 rounded-md text-sm font-medium border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/50 transition-all"
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">阈值参数配置</label>
            <div className="p-3 rounded-md bg-ink-50/60 border border-ink-200/60">
              {renderThresholdFields()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">风险等级</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((l) => {
                const isActive = formLevel === l;
                return (
                  <button
                    key={l}
                    onClick={() => setFormLevel(l)}
                    className={
                      isActive
                        ? `flex-1 px-3 py-2 rounded-md text-sm font-medium border-2 ${
                            l === "high"
                              ? "border-danger-500 bg-danger-50 text-danger-700"
                              : l === "medium"
                              ? "border-warn-500 bg-warn-50 text-warn-700"
                              : "border-brand-500 bg-brand-50 text-brand-700"
                          }`
                        : `flex-1 px-3 py-2 rounded-md text-sm font-medium border border-ink-200 bg-white text-ink-600 hover:border-ink-300 transition-all`
                    }
                  >
                    {levelLabelMap[l]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">响应动作</label>
            <div className="flex gap-2">
              {responseActionOptions.map((a) => {
                const isActive = formAction === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setFormAction(a.key)}
                    className={
                      isActive
                        ? "flex-1 px-3 py-2 rounded-md text-sm font-medium border-2 border-brand-500 bg-brand-50 text-brand-700 transition-all"
                        : "flex-1 px-3 py-2 rounded-md text-sm font-medium border border-ink-200 bg-white text-ink-600 hover:border-ink-300 transition-all"
                    }
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 bg-white border-t border-ink-200 px-5 py-3 flex items-center justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary">
            {rule ? "保存修改" : "创建规则"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormNumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-600 mb-1">{label}</label>
      <input
        type="number"
        className="input-base !py-1.5 text-sm"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <div
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        checked ? "bg-brand-500" : "bg-ink-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </div>
  );
}

type DisposeType = "freeze" | "logout" | "release" | "reject";

const disposeTypeBadgeMap: Record<DisposeType, string> = {
  freeze: "badge-danger",
  logout: "badge-warn",
  release: "badge-safe",
  reject: "badge-neutral",
};

const disposeTypeLabelMap: Record<DisposeType, string> = {
  freeze: "冻结账号",
  logout: "强制下线",
  release: "标记放行",
  reject: "驳回申请",
};

interface DisposeRecord {
  id: string;
  time: string;
  operatorName: string;
  operatorAvatar?: string;
  type: DisposeType;
  targetName: string;
  targetDept: string;
  eventId: string;
  remark: string;
  ip: string;
}

const mockDisposeRecords: DisposeRecord[] = [
  {
    id: "dr001",
    time: "2026-06-10 07:45:30",
    operatorName: "李四",
    type: "freeze",
    targetName: "周八",
    targetDept: "后端开发组",
    eventId: "re002",
    remark: "检测到暴力破解攻击，已冻结账号并通过邮件通知用户本人重置密码",
    ip: "10.0.1.45",
  },
  {
    id: "dr002",
    time: "2026-06-10 09:05:00",
    operatorName: "李四",
    type: "release",
    targetName: "林二",
    targetDept: "运营管理部",
    eventId: "re005",
    remark: "用户本人确认是密码记忆混淆导致的多次失败，放行处理",
    ip: "10.0.1.45",
  },
  {
    id: "dr003",
    time: "2026-06-09 22:30:00",
    operatorName: "张三",
    type: "logout",
    targetName: "郑十",
    targetDept: "市场营销部",
    eventId: "re006",
    remark: "广州地区异常登录，强制下线所有活跃会话并联系用户核实，用户确认本人未出差",
    ip: "10.0.1.23",
  },
  {
    id: "dr004",
    time: "2026-06-09 09:00:00",
    operatorName: "李四",
    type: "release",
    targetName: "王五",
    targetDept: "人力资源部",
    eventId: "re003",
    remark: "用户加班处理紧急招聘事项，确认为本人操作，予以放行",
    ip: "10.0.1.45",
  },
  {
    id: "dr005",
    time: "2026-06-08 23:50:12",
    operatorName: "系统",
    type: "freeze",
    targetName: "吴九",
    targetDept: "信息安全部",
    eventId: "re001",
    remark: "异地登录规则自动触发：上海IP登录+MFA校验失败，系统自动冻结账号",
    ip: "-",
  },
  {
    id: "dr006",
    time: "2026-06-07 14:20:00",
    operatorName: "李四",
    type: "reject",
    targetName: "吴九",
    targetDept: "信息安全部",
    eventId: "re000",
    remark: "风险告警经核查为误报，用户使用VPN连接导致IP归属地判断异常，驳回该告警",
    ip: "10.0.1.45",
  },
];

function RecordsTab() {
  const [timeRange, setTimeRange] = useState("14d");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<DisposeType | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return mockDisposeRecords.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (operatorFilter && !r.operatorName.includes(operatorFilter)) return false;
      if (searchText) {
        const kw = searchText.toLowerCase();
        if (
          !r.targetName.toLowerCase().includes(kw) &&
          !r.targetDept.toLowerCase().includes(kw) &&
          !r.remark.toLowerCase().includes(kw) &&
          !r.eventId.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [typeFilter, operatorFilter, searchText]);

  return (
    <div className="space-y-4">
      <section className="card-base p-4 animate-fade-in-up">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { key: "1d", label: "今天" },
                { key: "7d", label: "近7天" },
                { key: "14d", label: "近14天" },
                { key: "30d", label: "近30天" },
                { key: "custom", label: "自定义" },
              ] as const
            ).map((t) => {
              const isActive = timeRange === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTimeRange(t.key)}
                  className={
                    isActive
                      ? "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm"
                      : "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
                  }
                >
                  {t.key === "custom" ? <Calendar className="w-3.5 h-3.5" /> : null}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative lg:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                className="input-base !pl-9"
                placeholder="搜索用户/部门/备注/事件ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  className="input-base !pl-8 w-32"
                  placeholder="处置人"
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-32"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as DisposeType | "all")}
                >
                  <option value="all">处置类型</option>
                  <option value="freeze">账号冻结</option>
                  <option value="logout">强制下线</option>
                  <option value="release">标记放行</option>
                  <option value="reject">驳回</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-28"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as RiskLevel | "all")}
                >
                  <option value="all">风险等级</option>
                  <option value="high">高危</option>
                  <option value="medium">中危</option>
                  <option value="low">低危</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>

              <button className="btn-ghost">
                <FileDown className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card-base overflow-auto scrollbar-thin animate-fade-in-up">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th w-40">处置时间</th>
              <th className="table-th w-32">处置人</th>
              <th className="table-th w-28">处置类型</th>
              <th className="table-th w-48">处置对象</th>
              <th className="table-th w-36">关联风险事件</th>
              <th className="table-th w-80">处置备注</th>
              <th className="table-th w-36">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r, idx) => {
              const initial = r.operatorName.charAt(0);
              const avatarCls = avatarColors[idx % avatarColors.length];
              const event = mockRiskEvents.find((e) => e.id === r.eventId);
              return (
                <tr key={r.id} className="table-row">
                  <td className="table-td">
                    <div className="font-mono text-xs text-ink-600 whitespace-nowrap leading-relaxed">
                      <div>{r.time.slice(0, 10)}</div>
                      <div className="text-ink-400">{r.time.slice(11, 19)}</div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${avatarCls}`}>
                        {initial}
                      </div>
                      <span className="text-sm text-ink-800 font-medium">{r.operatorName}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={disposeTypeBadgeMap[r.type]}>
                      {disposeTypeLabelMap[r.type]}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="text-sm text-ink-800 font-medium">{r.targetName}</div>
                    <div className="text-xs text-ink-500">{r.targetDept}</div>
                  </td>
                  <td className="table-td">
                    <button className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 hover:underline font-mono">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{r.eventId.toUpperCase()}</span>
                    </button>
                    {event && (
                      <div className="mt-0.5">
                        <span className={levelBadgeMap[event.level]}>
                          {levelLabelMap[event.level]}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="table-td">
                    <div className="relative">
                      <div
                        className="text-sm text-ink-700 line-clamp-2 cursor-help"
                        onMouseEnter={() => setTooltipId(r.id)}
                        onMouseLeave={() => setTooltipId(null)}
                      >
                        {r.remark}
                      </div>
                      {tooltipId === r.id && (
                        <div className="absolute z-20 left-0 bottom-full mb-2 w-72 p-3 rounded-md bg-ink-900 text-white text-xs shadow-xl animate-fade-in-up">
                          {r.remark}
                          <div className="absolute left-4 -bottom-1 w-2 h-2 bg-ink-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs text-ink-600">{r.ip}</span>
                  </td>
                </tr>
              );
            })}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="table-td text-center text-ink-400 py-12">
                  暂无匹配的处置记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="flex items-center justify-between px-2 py-2 text-sm text-ink-500">
        <div>
          共 <span className="font-semibold text-ink-700 tabular-nums">{filteredRecords.length}</span> 条记录
        </div>
        <div className="flex items-center gap-1">
          <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm">
            1
          </button>
          <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors">
            2
          </button>
          <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors">
            3
          </button>
        </div>
      </section>
    </div>
  );
}
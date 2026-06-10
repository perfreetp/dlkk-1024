import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  History,
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
import { useAppStore } from "@/stores/useAppStore";
import { Modal, toast } from "@/components/ui/Modal";
import { mockRiskRules, mockLoginLogs } from "@/mock";
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
  const riskEvents = useAppStore((s) => s.riskEvents);

  const pendingCount = riskEvents.filter((r) => r.status === "pending").length;
  const resolvedCount = riskEvents.filter((r) => r.status === "resolved").length;

  const levelCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    riskEvents.forEach((r) => {
      counts[r.level] = (counts[r.level] || 0) + 1;
    });
    return counts;
  }, [riskEvents]);

  const totalLevel = levelCounts.high + levelCounts.medium + levelCounts.low || 1;
  const pieData = [
    { name: "高危", value: Math.round((levelCounts.high / totalLevel) * 100) || 0, color: "#DC2626" },
    { name: "中危", value: Math.round((levelCounts.medium / totalLevel) * 100) || 0, color: "#F59E0B" },
    { name: "低危", value: Math.round((levelCounts.low / totalLevel) * 100) || 0, color: "#6366F1" },
  ];

  const trendData = useMemo(() => generate14DayTrend(), []);
  const recentEvents = useMemo(() => riskEvents.slice(0, 6), [riskEvents]);

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
                <span className="text-3xl font-bold text-ink-800 font-display tabular-nums">{pendingCount}</span>
                <div className="flex items-center gap-0.5 text-xs text-danger-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>实时</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-danger-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">高危</div>
              <div className="mt-0.5 text-lg font-semibold text-danger-600 tabular-nums">{levelCounts.high}</div>
            </div>
            <div className="rounded-md bg-warn-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">中危</div>
              <div className="mt-0.5 text-lg font-semibold text-warn-600 tabular-nums">{levelCounts.medium}</div>
            </div>
            <div className="rounded-md bg-brand-50 p-2.5 text-center">
              <div className="text-xs text-ink-500">低危</div>
              <div className="mt-0.5 text-lg font-semibold text-brand-600 tabular-nums">{levelCounts.low}</div>
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
                <span className="text-3xl font-bold text-ink-800 font-display tabular-nums">{resolvedCount}</span>
                <span className="text-xs text-safe-600 font-medium">已处置</span>
                <div className="flex items-center gap-0.5 text-xs text-safe-600 ml-auto">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>实时统计</span>
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

type AccountStatus = "frozen" | "pending" | "recovered" | "offline";

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

const accountStatusBadgeMap: Record<AccountStatus, string> = {
  frozen: "badge-danger",
  pending: "badge-warn animate-pulse-soft",
  recovered: "badge-safe",
  offline: "badge-info",
};

const accountStatusLabelMap: Record<AccountStatus, string> = {
  frozen: "冻结中",
  pending: "待处置",
  recovered: "已恢复",
  offline: "已下线",
};

function AccountsTab() {
  const riskEvents = useAppStore((s) => s.riskEvents);
  const users = useAppStore((s) => s.users);
  const sessions = useAppStore((s) => s.sessions);
  const batchHandleRiskEvents = useAppStore((s) => s.batchHandleRiskEvents);
  const freezeUserFromRisk = useAppStore((s) => s.freezeUserFromRisk);
  const updateUserStatus = useAppStore((s) => s.updateUserStatus);
  const batchLogoutSessions = useAppStore((s) => s.batchLogoutSessions);
  const addAuditLog = useAppStore((s) => s.addAuditLog);
  const store = useAppStore;

  const [statusTab, setStatusTab] = useState<
    "frozen" | "pending" | "recovered" | "offline" | "all"
  >("all");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<RiskType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailAccount, setDetailAccount] = useState<RiskAccount | null>(null);

  const [freezeModal, setFreezeModal] = useState<{ account: RiskAccount } | null>(null);
  const [unfreezeModal, setUnfreezeModal] = useState<{ account: RiskAccount } | null>(null);
  const [logoutModal, setLogoutModal] = useState<{ account: RiskAccount } | null>(null);
  const [releaseModal, setReleaseModal] = useState<{ account: RiskAccount } | null>(null);
  const [releaseRemark, setReleaseRemark] = useState("");

  const [batchFreezeOpen, setBatchFreezeOpen] = useState(false);
  const [batchLogoutOpen, setBatchLogoutOpen] = useState(false);
  const [batchReleaseOpen, setBatchReleaseOpen] = useState(false);
  const [batchReleaseRemark, setBatchReleaseRemark] = useState("");

  const accounts = useMemo<RiskAccount[]>(() => {
    const userEvents = new Map<string, typeof riskEvents>();
    riskEvents.forEach((ev) => {
      if (!userEvents.has(ev.userId)) userEvents.set(ev.userId, []);
      userEvents.get(ev.userId)!.push(ev);
    });

    const list: RiskAccount[] = [];
    userEvents.forEach((evts, uid) => {
      const user = users.find((u) => u.id === uid);
      if (!user) return;
      const sorted = [...evts].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
      const latest = sorted[0];
      const levelRank = { high: 3, medium: 2, low: 1 } as const;
      const maxLevel = sorted.reduce(
        (acc, e) => (levelRank[e.level] > levelRank[acc] ? e.level : acc),
        "low" as RiskLevel
      );
      let status: AccountStatus;
      if (user.status === "frozen") status = "frozen";
      else if (evts.some((e) => e.status === "pending")) status = "pending";
      else if (
        evts.every((e) => e.status === "resolved") &&
        evts.some((e) => e.handleAction === "logout")
      )
        status = "offline";
      else status = "recovered";
      list.push({
        id: uid,
        name: user.name,
        dept: user.departmentName,
        position: user.positionName,
        level: maxLevel,
        reason: latest.type,
        eventCount: evts.length,
        lastTime: latest.detectedAt,
        status,
      });
    });
    return list.sort((a, b) => {
      const rankS = { frozen: 0, pending: 1, recovered: 2 } as const;
      if (rankS[a.status] !== rankS[b.status]) return rankS[a.status] - rankS[b.status];
      const rankL = { high: 0, medium: 1, low: 2 } as const;
      if (rankL[a.level] !== rankL[b.level]) return rankL[a.level] - rankL[b.level];
      return b.lastTime.localeCompare(a.lastTime);
    });
  }, [riskEvents, users]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
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
  }, [accounts, statusTab, levelFilter, typeFilter, searchText]);

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

  const getPendingEventIds = (userId: string): string[] => {
    return riskEvents.filter((r) => r.userId === userId && r.status === "pending").map((r) => r.id);
  };

  const handleFreeze = (account: RiskAccount) => {
    const evIds = getPendingEventIds(account.id);
    if (evIds.length > 0) {
      batchHandleRiskEvents(evIds, "freeze", "风险页面批量冻结处置");
    } else {
      freezeUserFromRisk(account.id, "风险页面异常账号冻结");
    }
    toast.success("账号已冻结，用户无法登录系统");
    setFreezeModal(null);
  };

  const handleUnfreeze = (account: RiskAccount) => {
    updateUserStatus(account.id, "active");
    toast.success("账号已恢复正常状态");
    setUnfreezeModal(null);
  };

  const handleLogout = (account: RiskAccount) => {
    const userSessionIds = sessions.filter((s) => s.userId === account.id && s.isOnline).map((s) => s.id);
    if (userSessionIds.length > 0) {
      batchLogoutSessions(userSessionIds);
    }
    const evIds = getPendingEventIds(account.id);
    if (evIds.length > 0) {
      batchHandleRiskEvents(evIds, "logout", "风险页面强制下线处置");
    } else {
      addAuditLog({
        module: "风险处置",
        action: "强制下线",
        targetId: account.id,
        targetName: `${account.name} / ${account.dept}`,
        beforeValue: `账号状态:${accountStatusLabelMap[account.status]} | 在线会话:${userSessionIds.length}`,
        afterValue: `处置动作:强制下线，备注：风险页面强制下线处置`,
      });
      const now = () => {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      const genId = (prefix: string) =>
        `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const syntheticEvent = {
        id: genId("re"),
        type: account.reason,
        level: account.level,
        userId: account.id,
        userName: account.name,
        userDept: account.dept,
        ip: "-",
        description: "风险处置：强制下线操作（合成记录）",
        detectedAt: now(),
        status: "resolved" as const,
        handlerId: "u001",
        handlerName: "张三",
        handleAt: now(),
        handleRemark: "风险页面强制下线处置",
        handleAction: "logout" as const,
      };
      store.setState((s) => ({ riskEvents: [syntheticEvent, ...s.riskEvents] }));
    }
    toast.success("用户所有在线会话已下线");
    setLogoutModal(null);
  };

  const handleRelease = (account: RiskAccount) => {
    if (account.level === "low") {
      const evIds = getPendingEventIds(account.id);
      if (evIds.length > 0) batchHandleRiskEvents(evIds, "release", releaseRemark || "低风险放行");
      toast.success("已标记放行，已记录操作留痕");
      setReleaseModal(null);
      setReleaseRemark("");
      return;
    }
    const evIds = getPendingEventIds(account.id);
    if (evIds.length > 0) batchHandleRiskEvents(evIds, "release", releaseRemark || "人工核查放行");
    toast.success("已标记放行，已记录操作留痕");
    setReleaseModal(null);
    setReleaseRemark("");
  };

  const handleBatchFreeze = () => {
    if (selectedIds.length === 0) {
      toast.warn("请先选择要操作的账号");
      return;
    }
    const ids = [...selectedIds];
    const allEventIds: string[] = [];
    ids.forEach((uid) => allEventIds.push(...getPendingEventIds(uid)));
    if (allEventIds.length > 0) {
      batchHandleRiskEvents(allEventIds, "freeze", "批量冻结处置");
    } else {
      ids.forEach((uid) => freezeUserFromRisk(uid, "风险页面批量冻结"));
    }
    toast.success(`已批量冻结 ${ids.length} 个账号`);
    setBatchFreezeOpen(false);
    setSelectedIds([]);
  };

  const handleBatchLogout = () => {
    if (selectedIds.length === 0) {
      toast.warn("请先选择要操作的账号");
      return;
    }
    const ids = [...selectedIds];
    const allSessionIds: string[] = [];
    ids.forEach((uid) => {
      sessions
        .filter((s) => s.userId === uid && s.isOnline)
        .forEach((s) => allSessionIds.push(s.id));
    });
    if (allSessionIds.length > 0) batchLogoutSessions(allSessionIds);
    const allEventIds: string[] = [];
    ids.forEach((uid) => allEventIds.push(...getPendingEventIds(uid)));
    if (allEventIds.length > 0) {
      batchHandleRiskEvents(allEventIds, "logout", "批量强制下线处置");
    }
    const now = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const genId = (prefix: string) =>
      `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const syntheticEvents: typeof riskEvents = [];
    ids.forEach((uid) => {
      const userPendingIds = getPendingEventIds(uid);
      if (userPendingIds.length === 0) {
        const acc = accounts.find((a) => a.id === uid);
        if (!acc) return;
        const sessionCount = sessions.filter((s) => s.userId === uid && s.isOnline).length;
        addAuditLog({
          module: "风险处置",
          action: "强制下线",
          targetId: uid,
          targetName: `${acc.name} / ${acc.dept}`,
          beforeValue: `账号状态:${accountStatusLabelMap[acc.status]} | 在线会话:${sessionCount}`,
          afterValue: `处置动作:强制下线，备注：批量强制下线处置`,
        });
        syntheticEvents.push({
          id: genId("re"),
          type: acc.reason,
          level: acc.level,
          userId: uid,
          userName: acc.name,
          userDept: acc.dept,
          ip: "-",
          description: "风险处置：批量强制下线操作（合成记录）",
          detectedAt: now(),
          status: "resolved",
          handlerId: "u001",
          handlerName: "张三",
          handleAt: now(),
          handleRemark: "批量强制下线处置",
          handleAction: "logout",
        });
      }
    });
    if (syntheticEvents.length > 0) {
      store.setState((s) => ({ riskEvents: [...syntheticEvents, ...s.riskEvents] }));
    }
    toast.success(`已对 ${ids.length} 个账号执行强制下线`);
    setBatchLogoutOpen(false);
    setSelectedIds([]);
  };

  const handleBatchRelease = () => {
    if (selectedIds.length === 0) {
      toast.warn("请先选择要操作的账号");
      return;
    }
    const ids = [...selectedIds];
    const allEventIds: string[] = [];
    ids.forEach((uid) => allEventIds.push(...getPendingEventIds(uid)));
    if (allEventIds.length > 0) {
      batchHandleRiskEvents(allEventIds, "release", batchReleaseRemark || "批量放行处置");
    }
    toast.success(`已批量放行 ${ids.length} 个账号`);
    setBatchReleaseOpen(false);
    setBatchReleaseRemark("");
    setSelectedIds([]);
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      toast.warn("请先选择要操作的账号");
      return;
    }
    toast.success(`已导出 ${selectedIds.length} 条账号数据`);
  };

  const BatchActionBar = () => (
    <section className="card-base p-3 flex items-center justify-between animate-fade-in-up bg-brand-50/50">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="w-4 h-4 text-brand-600" />
        <span className="text-ink-700">
          已选中 <span className="font-semibold text-brand-700">{selectedIds.length}</span> 项
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-danger !py-1.5 !px-3 text-xs" onClick={() => setBatchFreezeOpen(true)}>
          <Snowflake className="w-3.5 h-3.5" />
          <span>批量冻结</span>
        </button>
        <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setBatchLogoutOpen(true)}>
          <LogOut className="w-3.5 h-3.5" />
          <span>批量强制下线</span>
        </button>
        <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setBatchReleaseOpen(true)}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>批量放行</span>
        </button>
        <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={handleExport}>
          <FileDown className="w-3.5 h-3.5" />
          <span>导出</span>
        </button>
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <section className="card-base p-4 animate-fade-in-up">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {(["frozen", "pending", "offline", "recovered", "all"] as const).map((s) => {
              const count =
                s === "all"
                  ? accounts.length
                  : accounts.filter((a) => a.status === s).length;
              const isActive = statusTab === s;
              const label =
                s === "frozen"
                  ? "冻结中"
                  : s === "pending"
                  ? "待处置"
                  : s === "offline"
                  ? "已下线"
                  : s === "recovered"
                  ? "已恢复"
                  : "全部";
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

      {selectedIds.length > 0 && <BatchActionBar />}

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
                          onClick={() => setUnfreezeModal({ account: a })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-safe-600 hover:bg-safe-50 transition-colors"
                          title="解冻账号"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setFreezeModal({ account: a })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-danger-600 hover:bg-danger-50 transition-colors"
                          title="冻结账号"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setLogoutModal({ account: a })}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-warn-600 hover:bg-warn-50 transition-colors"
                        title="强制下线"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (a.level === "low") {
                            const evIds = getPendingEventIds(a.id);
                            if (evIds.length > 0) batchHandleRiskEvents(evIds, "release", "低风险快速放行");
                            toast.success("已标记放行，已记录操作留痕");
                          } else {
                            setReleaseModal({ account: a });
                            setReleaseRemark("");
                          }
                        }}
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

      {selectedIds.length > 0 && <BatchActionBar />}

      {detailAccount && (
        <AccountDetailDrawer account={detailAccount} onClose={() => setDetailAccount(null)} />
      )}

      <Modal
        open={!!freezeModal}
        onClose={() => setFreezeModal(null)}
        title="确认冻结异常账号？"
        icon={<Ban className="w-5 h-5 text-danger-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFreezeModal(null)}>取消</button>
            <button className="btn-danger" onClick={() => freezeModal && handleFreeze(freezeModal.account)}>
              确认冻结
            </button>
          </>
        }
      >
        {freezeModal && (
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-md bg-ink-50/60 border border-ink-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-ink-500" />
                <span className="font-medium text-ink-800">{freezeModal.account.name}</span>
                <span className="text-ink-500">/</span>
                <span className="text-ink-600">{freezeModal.account.dept}</span>
                <span className="text-ink-500">/</span>
                <span className="text-ink-600">{freezeModal.account.position}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-ink-600 mb-1">风险原因：</div>
              <div className="p-2.5 rounded-md bg-danger-50 border border-danger-200/60 text-danger-700">
                {(() => {
                  const ev = riskEvents.find((e) => e.userId === freezeModal!.account.id);
                  return ev?.description || `${freezeModal.account.reason} - 检测到异常行为模式`;
                })()}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md bg-warn-50 border border-warn-200/60 text-warn-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>冻结后用户无法登录任何系统，需人工审核后才能解冻。</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!unfreezeModal}
        onClose={() => setUnfreezeModal(null)}
        title="确认解冻该账号？"
        icon={<UserCheck className="w-5 h-5 text-safe-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setUnfreezeModal(null)}>取消</button>
            <button className="btn-primary" onClick={() => unfreezeModal && handleUnfreeze(unfreezeModal.account)}>
              确认解冻
            </button>
          </>
        }
      >
        {unfreezeModal && (
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-md bg-ink-50/60 border border-ink-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-ink-500" />
                <span className="font-medium text-ink-800">{unfreezeModal.account.name}</span>
                <span className="text-ink-500">/</span>
                <span className="text-ink-600">{unfreezeModal.account.dept}</span>
              </div>
            </div>
            <p className="text-ink-600">解冻后账号将恢复正常状态，用户可重新登录系统。</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!logoutModal}
        onClose={() => setLogoutModal(null)}
        title="强制下线该用户所有会话？"
        icon={<LogOut className="w-5 h-5 text-warn-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setLogoutModal(null)}>取消</button>
            <button className="btn-primary" onClick={() => logoutModal && handleLogout(logoutModal.account)}>
              确认下线
            </button>
          </>
        }
      >
        {logoutModal && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-700">
              将下线用户 <span className="font-semibold text-ink-800">{logoutModal.account.name}</span> 的所有系统会话。
            </p>
            <p className="text-ink-500">用户当前所有登录状态将被立即清除，需重新登录才能继续使用。</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!releaseModal}
        onClose={() => { setReleaseModal(null); setReleaseRemark(""); }}
        title="确认放行该异常？"
        icon={<CheckCircle2 className="w-5 h-5 text-safe-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setReleaseModal(null); setReleaseRemark(""); }}>取消</button>
            <button className="btn-primary" onClick={() => releaseModal && handleRelease(releaseModal.account)}>
              确认放行
            </button>
          </>
        }
      >
        {releaseModal && (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-ink-50/60 border border-ink-200 text-sm">
              <span className="font-medium text-ink-800">{releaseModal.account.name}</span>
              <span className="text-ink-500 mx-1">/</span>
              <span className="text-ink-600">{releaseModal.account.dept}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">放行原因（必填）</label>
              <textarea
                className="input-base min-h-[80px] resize-y text-sm"
                placeholder="请填写人工核查结果或放行说明..."
                value={releaseRemark}
                onChange={(e) => setReleaseRemark(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={batchFreezeOpen}
        onClose={() => setBatchFreezeOpen(false)}
        title={`确认批量冻结 ${selectedIds.length} 个账号？`}
        icon={<Snowflake className="w-5 h-5 text-danger-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBatchFreezeOpen(false)}>取消</button>
            <button className="btn-danger" onClick={handleBatchFreeze}>确认批量冻结</button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-ink-700">
            将对已选中的 <span className="font-semibold text-danger-600">{selectedIds.length}</span> 个账号执行冻结操作。
          </p>
          <div className="flex items-start gap-2 p-3 rounded-md bg-warn-50 border border-warn-200/60 text-warn-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>冻结后所有选中用户均无法登录任何系统，需人工审核后才能解冻。</span>
          </div>
        </div>
      </Modal>

      <Modal
        open={batchLogoutOpen}
        onClose={() => setBatchLogoutOpen(false)}
        title={`确认对 ${selectedIds.length} 个账号执行强制下线？`}
        icon={<LogOut className="w-5 h-5 text-warn-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBatchLogoutOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleBatchLogout}>确认批量下线</button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-ink-700">
            将下线 <span className="font-semibold text-ink-800">{selectedIds.length}</span> 个账号的所有系统会话。
          </p>
          <p className="text-ink-500">用户当前所有登录状态将被立即清除，需重新登录才能继续使用。</p>
        </div>
      </Modal>

      <Modal
        open={batchReleaseOpen}
        onClose={() => { setBatchReleaseOpen(false); setBatchReleaseRemark(""); }}
        title={`确认批量放行 ${selectedIds.length} 个账号？`}
        icon={<CheckCircle2 className="w-5 h-5 text-safe-600" />}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setBatchReleaseOpen(false); setBatchReleaseRemark(""); }}>取消</button>
            <button className="btn-primary" onClick={handleBatchRelease}>确认批量放行</button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-700">
            将对已选中的 <span className="font-semibold text-ink-800">{selectedIds.length}</span> 个账号执行批量放行。
          </p>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">放行原因（必填）</label>
            <textarea
              className="input-base min-h-[80px] resize-y text-sm"
              placeholder="请填写批量放行的统一说明..."
              value={batchReleaseRemark}
              onChange={(e) => setBatchReleaseRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AccountDetailDrawer({ account, onClose }: { account: RiskAccount; onClose: () => void }) {
  const users = useAppStore((s) => s.users);
  const riskEvents = useAppStore((s) => s.riskEvents);
  const auditLogs = useAppStore((s) => s.auditLogs);
  const sessions = useAppStore((s) => s.sessions);
  const logoutSession = useAppStore((s) => s.logoutSession);
  const handleRiskEvent = useAppStore((s) => s.handleRiskEvent);
  const [detailTab, setDetailTab] = useState<"basic" | "login" | "risk" | "history">("basic");
  const [logoutSingleModal, setLogoutSingleModal] = useState<{ sessionId: string; appName: string } | null>(null);
  const [handleSingleModal, setHandleSingleModal] = useState<{ eventId: string; action: HandleAction; actionLabel: string } | null>(null);
  const [singleRemark, setSingleRemark] = useState("");

  const latestUser = users.find((u) => u.id === account.id);
  const currentStatus: AccountStatus = latestUser?.status === "frozen" ? "frozen" : account.status;

  const userRiskEvents = useMemo(
    () => riskEvents.filter((e) => e.userId === account.id),
    [riskEvents, account.id]
  );

  const userSessions = useMemo(
    () => sessions.filter((s) => s.userId === account.id),
    [sessions, account.id]
  );

  const userLoginLogs = useMemo(() => {
    const logs = mockLoginLogs.filter((l) => l.userId === account.id);
    const eventLogs = userRiskEvents.map((e) => ({
      id: `ev-${e.id}`,
      userId: e.userId,
      userName: e.userName,
      appId: "",
      appName: "风险检测系统",
      ip: e.ip,
      location: "未知·风险IP",
      deviceType: "desktop" as const,
      os: "未知系统",
      browser: "未知浏览器",
      deviceFingerprint: "",
      status: "fail" as const,
      failReason: e.type + " - " + e.description,
      loginAt: e.detectedAt,
      sessionId: undefined,
    }));
    return [...logs, ...eventLogs].sort((a, b) => b.loginAt.localeCompare(a.loginAt));
  }, [account.id, userRiskEvents]);

  const userHistory = useMemo(() => {
    const auditHistory = auditLogs
      .filter((l) => l.module === "风险处置" && (l.targetId === account.id || l.targetName.includes(account.name)))
      .map((l) => ({
        id: l.id,
        time: l.operateAt,
        action: l.action,
        operatorName: l.operatorName,
        detail: l.afterValue || l.beforeValue || "无详细备注",
        source: "audit" as const,
      }));
    const riskHistory = userRiskEvents
      .filter((e) => e.status !== "pending" && e.handleAt)
      .map((e) => {
        const actionLabel = { freeze: "冻结账号", logout: "强制下线", release: "标记放行" } as const;
        return {
          id: `rh-${e.id}`,
          time: e.handleAt!,
          action: `处置风险-${actionLabel[e.handleAction!]}`,
          operatorName: e.handlerName || "系统",
          detail: `风险类型:${e.type} | 等级:${levelLabelMap[e.level]}${e.handleRemark ? `，备注：${e.handleRemark}` : ""}`,
          source: "risk" as const,
        };
      });
    const loginAudit = auditLogs
      .filter((l) => l.module === "登录审计" && l.targetName.includes(account.name))
      .map((l) => ({
        id: l.id,
        time: l.operateAt,
        action: l.action,
        operatorName: l.operatorName,
        detail: l.afterValue || l.beforeValue || "无详细备注",
        source: "audit" as const,
      }));
    return [...auditHistory, ...riskHistory, ...loginAudit].sort((a, b) => b.time.localeCompare(a.time));
  }, [auditLogs, account.id, account.name, userRiskEvents]);

  const handleLogoutSingle = () => {
    if (!logoutSingleModal) return;
    logoutSession(logoutSingleModal.sessionId);
    toast.success(`已下线 ${logoutSingleModal.appName} 会话`);
    setLogoutSingleModal(null);
  };

  const handleSingleEvent = () => {
    if (!handleSingleModal) return;
    handleRiskEvent(handleSingleModal.eventId, handleSingleModal.action, singleRemark || `${handleSingleModal.actionLabel}处置`);
    toast.success(`已${handleSingleModal.actionLabel}`);
    setHandleSingleModal(null);
    setSingleRemark("");
  };

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
                <DetailItem label="当前状态" value={accountStatusLabelMap[currentStatus]} badgeClass={accountStatusBadgeMap[currentStatus]} />
                <DetailItem label="MFA绑定" value={latestUser?.mfaEnabled ? "已绑定" : "未绑定"} badgeClass={latestUser?.mfaEnabled ? "badge-safe" : "badge-warn"} />
                <DetailItem label="上次登录IP" value={userRiskEvents[0]?.ip || "-"} mono />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <h4 className="text-sm font-semibold text-ink-800 mb-3">账号画像标签</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge-info">{account.position.includes("高级") || account.position.includes("总监") ? "高级权限" : "普通权限"}</span>
                  <span className="badge-warn">近期异常</span>
                  {latestUser?.mfaEnabled && <span className="badge-safe">MFA已启用</span>}
                  <span className="badge-neutral">部门: {account.dept}</span>
                </div>
              </div>
            </div>
          )}

          {detailTab === "login" && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h4 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-brand-600" />
                  在线会话
                  <span className="badge-info tabular-nums">{userSessions.filter((s) => s.isOnline).length} 个活跃</span>
                </h4>
                {userSessions.length === 0 ? (
                  <div className="p-6 rounded-md border border-dashed border-ink-200 text-center">
                    <Monitor className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-400">暂无活跃会话</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userSessions.map((ss) => (
                      <div
                        key={ss.id}
                        className={`p-3 rounded-md border ${
                          ss.isOnline ? "bg-safe-50/50 border-safe-200/60" : "bg-ink-50/60 border-ink-200/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-ink-800">{ss.appName}</span>
                              {ss.isOnline ? (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-safe-500"></span>
                                </span>
                              ) : null}
                              <span className={ss.isOnline ? "badge-safe" : "badge-neutral"}>
                                {ss.isOnline ? "在线" : "已下线"}
                              </span>
                            </div>
                            <div className="mt-1.5 text-xs text-ink-500 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {ss.location}
                              </span>
                              <span className="font-mono">IP {ss.ip}</span>
                            </div>
                            <div className="mt-1 text-xs text-ink-500 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                登录 {ss.loginAt.slice(5, 16)}
                              </span>
                              <span>活跃 {ss.lastActiveAt.slice(5, 16)}</span>
                            </div>
                            <div className="mt-1 text-xs text-ink-500 truncate" title={ss.userAgent}>
                              {ss.userAgent}
                            </div>
                          </div>
                          {ss.isOnline && (
                            <button
                              onClick={() => setLogoutSingleModal({ sessionId: ss.id, appName: ss.appName })}
                              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-warn-700 bg-warn-50 hover:bg-warn-100 border border-warn-200/60 transition-colors"
                            >
                              <LogOut className="w-3 h-3" />
                              下线
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  登录日志
                  <span className="badge-neutral tabular-nums">{userLoginLogs.length} 条</span>
                </h4>
                {userLoginLogs.length === 0 ? (
                  <div className="p-6 rounded-md border border-dashed border-ink-200 text-center">
                    <Activity className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-400">暂无登录日志</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userLoginLogs.map((log) => {
                      const TypeIcon = log.status === "success" ? ShieldCheck : ShieldX;
                      const statusBadge = log.status === "success" ? "badge-safe" : "badge-danger";
                      const statusText = log.status === "success" ? "成功" : "失败";
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-md bg-ink-50/60 border border-ink-100"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              log.status === "success" ? "bg-safe-100 text-safe-600" : "bg-danger-100 text-danger-600"
                            }`}
                          >
                            <TypeIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-ink-500">{log.loginAt.slice(5, 16)}</span>
                              <span className={statusBadge}>{statusText}</span>
                              <span className="text-xs font-medium text-ink-700">{log.appName}</span>
                            </div>
                            <div className="mt-1 text-xs text-ink-600 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-ink-400" />
                                {log.location}
                              </span>
                              <span className="font-mono">IP {log.ip}</span>
                            </div>
                            <div className="mt-1 text-xs text-ink-500 flex flex-wrap gap-x-3 gap-y-1">
                              <span>{log.os}</span>
                              <span>·</span>
                              <span>{log.browser}</span>
                              <span>·</span>
                              <span className="capitalize">{log.deviceType}</span>
                            </div>
                            {log.failReason && (
                              <div className="mt-1 text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded inline-block">
                                {log.failReason}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === "risk" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-3 gap-3">
                <div className="card-base p-3 text-center">
                  <div className="text-2xl font-bold text-danger-600 tabular-nums font-display">
                    {userRiskEvents.length}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">风险事件</div>
                </div>
                <div className="card-base p-3 text-center">
                  <div className="text-2xl font-bold text-warn-600 tabular-nums font-display">
                    {userRiskEvents.filter((e) => e.status === "pending").length}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">待处置</div>
                </div>
                <div className="card-base p-3 text-center">
                  <div className={`text-2xl font-bold tabular-nums font-display ${
                    account.level === "high" ? "text-danger-600" : account.level === "medium" ? "text-warn-600" : "text-brand-600"
                  }`}>
                    {account.level === "high" ? "高" : account.level === "medium" ? "中" : "低"}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">最高等级</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger-600" />
                  全量风险事件
                  <span className="badge-neutral tabular-nums">{userRiskEvents.length} 条</span>
                </h4>
                {userRiskEvents.length === 0 ? (
                  <div className="p-6 rounded-md border border-dashed border-ink-200 text-center">
                    <ShieldCheck className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-400">暂无风险事件</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userRiskEvents.map((ev) => {
                      const TypeIcon = riskTypeIconMap[ev.type];
                      return (
                        <div
                          key={ev.id}
                          className={`p-3 rounded-md border ${
                            ev.status === "pending"
                              ? "bg-warn-50/50 border-warn-200/60"
                              : ev.status === "resolved"
                              ? "bg-safe-50/50 border-safe-200/60"
                              : "bg-ink-50/60 border-ink-200/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 ${levelBadgeMap[ev.level]}`}>
                                  <TypeIcon className="w-3 h-3" />
                                  {levelLabelMap[ev.level]}
                                </span>
                                <span className="badge-info">{ev.type}</span>
                                <span className={statusBadgeMap[ev.status]}>
                                  {statusLabelMap[ev.status]}
                                </span>
                                <span className="font-mono text-xs text-ink-500">
                                  {ev.detectedAt.slice(5, 16)}
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-ink-700">{ev.description}</div>
                              <div className="mt-1.5 text-xs text-ink-500 flex flex-wrap gap-x-3 gap-y-1">
                                <span className="font-mono">IP: {ev.ip}</span>
                                <span>ID: {ev.id.toUpperCase()}</span>
                              </div>
                              {ev.status !== "pending" && (
                                <div className="mt-2 pt-2 border-t border-ink-200/60 space-y-1">
                                  <div className="text-xs text-ink-600 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>
                                      处置动作:{" "}
                                      <span className="font-medium text-ink-800">
                                        {ev.handleAction === "freeze"
                                          ? "冻结账号"
                                          : ev.handleAction === "logout"
                                          ? "强制下线"
                                          : "标记放行"}
                                      </span>
                                    </span>
                                    <span>
                                      处置人:{" "}
                                      <span className="font-medium text-ink-800">
                                        {ev.handlerName || "-"}
                                      </span>
                                    </span>
                                    <span className="font-mono">
                                      {ev.handleAt?.slice(5, 16) || "-"}
                                    </span>
                                  </div>
                                  {ev.handleRemark && (
                                    <div className="text-xs text-ink-500">
                                      备注: {ev.handleRemark}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {ev.status === "pending" && (
                              <div className="flex-shrink-0 flex flex-col gap-1.5">
                                <button
                                  onClick={() =>
                                    setHandleSingleModal({
                                      eventId: ev.id,
                                      action: "freeze",
                                      actionLabel: "冻结",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-danger-700 bg-danger-50 hover:bg-danger-100 border border-danger-200/60 transition-colors"
                                >
                                  <Ban className="w-3 h-3" />
                                  冻结
                                </button>
                                <button
                                  onClick={() =>
                                    setHandleSingleModal({
                                      eventId: ev.id,
                                      action: "logout",
                                      actionLabel: "下线",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-warn-700 bg-warn-50 hover:bg-warn-100 border border-warn-200/60 transition-colors"
                                >
                                  <LogOut className="w-3 h-3" />
                                  下线
                                </button>
                                <button
                                  onClick={() => {
                                    setSingleRemark("");
                                    setHandleSingleModal({
                                      eventId: ev.id,
                                      action: "release",
                                      actionLabel: "放行",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-safe-700 bg-safe-50 hover:bg-safe-100 border border-safe-200/60 transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  放行
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <h4 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-brand-600" />
                处置记录
                <span className="badge-neutral tabular-nums">{userHistory.length} 条</span>
              </h4>
              {userHistory.length === 0 ? (
                <div className="p-6 rounded-md border border-dashed border-ink-200 text-center">
                  <FileDown className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">暂无处置历史记录</p>
                </div>
              ) : (
                <ol className="relative border-l border-ink-200 ml-2 space-y-4">
                  {userHistory.map((h) => {
                    const isRisk = h.source === "risk";
                    const dotColor = isRisk ? "bg-danger-500" : "bg-brand-500";
                    return (
                      <li key={h.id} className="ml-5">
                        <span
                          className={`absolute -left-[15px] w-3 h-3 rounded-full ring-4 ring-white ${dotColor}`}
                        />
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-mono text-ink-400">{h.time.slice(5, 16)}</span>
                          <span className={isRisk ? "badge-danger" : "badge-info"}>{h.action}</span>
                          <span className="text-ink-600">操作人：{h.operatorName}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-700 break-words">{h.detail}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>

        <Modal
          open={!!logoutSingleModal}
          onClose={() => setLogoutSingleModal(null)}
          title="确认下线该会话？"
          icon={<LogOut className="w-5 h-5 text-warn-600" />}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setLogoutSingleModal(null)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleLogoutSingle}>
                确认下线
              </button>
            </>
          }
        >
          {logoutSingleModal && (
            <div className="space-y-3 text-sm">
              <p className="text-ink-700">
                将下线应用{" "}
                <span className="font-semibold text-ink-800">{logoutSingleModal.appName}</span>{" "}
                的当前会话。
              </p>
              <p className="text-ink-500">用户需重新登录该应用才能继续使用。</p>
            </div>
          )}
        </Modal>

        <Modal
          open={!!handleSingleModal}
          onClose={() => {
            setHandleSingleModal(null);
            setSingleRemark("");
          }}
          title={`确认${handleSingleModal?.actionLabel || ""}该风险事件？`}
          icon={
            handleSingleModal?.action === "freeze" ? (
              <Ban className="w-5 h-5 text-danger-600" />
            ) : handleSingleModal?.action === "logout" ? (
              <LogOut className="w-5 h-5 text-warn-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-safe-600" />
            )
          }
          footer={
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  setHandleSingleModal(null);
                  setSingleRemark("");
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleSingleEvent}>
                确认{handleSingleModal?.actionLabel}
              </button>
            </>
          }
        >
          {handleSingleModal && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-ink-50/60 border border-ink-200 text-sm">
                <span className="font-medium text-ink-800">风险事件ID</span>
                <span className="text-ink-500 mx-1">/</span>
                <span className="font-mono text-xs text-ink-600">
                  {handleSingleModal.eventId.toUpperCase()}
                </span>
              </div>
              {handleSingleModal.action === "release" && (
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">
                    放行原因（必填）
                  </label>
                  <textarea
                    className="input-base min-h-[72px] resize-y text-sm"
                    placeholder="请填写人工核查结果或放行说明..."
                    value={singleRemark}
                    onChange={(e) => setSingleRemark(e.target.value)}
                  />
                </div>
              )}
              {handleSingleModal.action === "freeze" && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-warn-50 border border-warn-200/60 text-warn-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">冻结后用户将无法登录任何系统，需人工审核后才能解冻。</span>
                </div>
              )}
              {handleSingleModal.action === "logout" && (
                <p className="text-sm text-ink-500">
                  将下线该用户所有在线会话，风险事件状态变更为已处置。
                </p>
              )}
            </div>
          )}
        </Modal>
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

function RecordsTab() {
  const auditLogs = useAppStore((s) => s.auditLogs);
  const riskEvents = useAppStore((s) => s.riskEvents);
  const users = useAppStore((s) => s.users);
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState("14d");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<DisposeType | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  const disposalLogs = useMemo(
    () => auditLogs.filter((l) => l.module === "风险处置").reverse(),
    [auditLogs]
  );

  const parseDisposeType = (action: string): DisposeType => {
    if (action.includes("冻结")) return "freeze";
    if (action.includes("下线")) return "logout";
    if (action.includes("放行")) return "release";
    if (action.includes("驳回")) return "reject";
    return "release";
  };

  const handleJumpAuditByUser = (userName: string) => {
    toast.info(`已跳转至审计页面，筛选用户：${userName}`);
    navigate("/audit");
  };

  const handleJumpAuditByIp = (ip: string) => {
    toast.info(`已跳转至审计页面，筛选 IP：${ip}`);
    navigate("/audit");
  };

  const handleJumpAuditByApp = (appName: string) => {
    toast.info(`已跳转至审计页面，筛选应用：${appName}`);
    navigate("/audit");
  };

  const filteredRecords = useMemo(() => {
    return disposalLogs.filter((l) => {
      const dtype = parseDisposeType(l.action);
      if (typeFilter !== "all" && dtype !== typeFilter) return false;
      if (operatorFilter && !l.operatorName.includes(operatorFilter)) return false;
      if (searchText) {
        const kw = searchText.toLowerCase();
        const remark = l.afterValue || l.beforeValue || "";
        if (
          !l.targetName.toLowerCase().includes(kw) &&
          !remark.toLowerCase().includes(kw) &&
          !l.targetId.toLowerCase().includes(kw) &&
          !l.operatorName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [disposalLogs, typeFilter, operatorFilter, searchText]);

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
              const dtype = parseDisposeType(r.action);
              const remark = r.afterValue || r.beforeValue || "-";
              const ev = riskEvents.find((e) => e.id === r.targetId);
              const u = users.find((x) => x.name === r.targetName.split(" / ")[0]);
              const targetDept = u?.departmentName || (r.targetName.includes(" / ") ? r.targetName.split(" / ")[1] || "" : "");
              const dispTargetName = r.targetName.split(" / ")[0];
              const riskIp = ev?.ip;
              return (
                <tr key={r.id} className="table-row">
                  <td className="table-td">
                    <div className="font-mono text-xs text-ink-600 whitespace-nowrap leading-relaxed">
                      <div>{r.operateAt.slice(0, 10)}</div>
                      <div className="text-ink-400">{r.operateAt.slice(11, 19)}</div>
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
                    <span className={disposeTypeBadgeMap[dtype]}>
                      {disposeTypeLabelMap[dtype]}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div className="text-sm text-ink-800 font-medium">{dispTargetName}</div>
                        <div className="text-xs text-ink-500">{targetDept}</div>
                      </div>
                      <button
                        onClick={() => handleJumpAuditByUser(dispTargetName)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-brand-500 hover:bg-brand-50 hover:text-brand-600 transition-colors shrink-0"
                        title={`查看用户 ${dispTargetName} 的审计会话日志`}
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="space-y-1">
                      <button className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 hover:underline font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{(r.targetId || "-").toUpperCase().slice(0, 8)}</span>
                      </button>
                      {ev && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={levelBadgeMap[ev.level]}>
                            {levelLabelMap[ev.level]}
                          </span>
                          {riskIp && (
                            <button
                              onClick={() => handleJumpAuditByIp(riskIp)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-ink-600 hover:bg-brand-50 hover:text-brand-600 border border-ink-200 hover:border-brand-200 transition-colors"
                              title={`查看 IP ${riskIp} 的审计会话日志`}
                            >
                              <History className="w-2.5 h-2.5" />
                              {riskIp}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="relative">
                      <div
                        className="text-sm text-ink-700 line-clamp-2 cursor-help"
                        onMouseEnter={() => setTooltipId(r.id)}
                        onMouseLeave={() => setTooltipId(null)}
                      >
                        {remark}
                      </div>
                      {tooltipId === r.id && (
                        <div className="absolute z-20 left-0 bottom-full mb-2 w-72 p-3 rounded-md bg-ink-900 text-white text-xs shadow-xl animate-fade-in-up">
                          {remark}
                          <div className="absolute left-4 -bottom-1 w-2 h-2 bg-ink-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-ink-600">{r.ip || "-"}</span>
                      {r.ip && (
                        <button
                          onClick={() => handleJumpAuditByIp(r.ip)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-brand-500 hover:bg-brand-50 hover:text-brand-600 transition-colors shrink-0"
                          title={`查看 IP ${r.ip} 的审计会话日志`}
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
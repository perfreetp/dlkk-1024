import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Upload,
  SquarePlus,
  FileCheck,
  Users,
  Activity,
  Monitor,
  AppWindow,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { mockAppUsageStats, generateTrendData } from "@/mock";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "@/components/ui/Modal";
import type { RiskLevel } from "@/types";

const levelBadgeMap: Record<RiskLevel, string> = {
  high: "badge-danger",
  medium: "badge-warn",
  low: "badge-warn",
};

const levelLabelMap: Record<RiskLevel, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const users = useAppStore((s) => s.users);
  const applications = useAppStore((s) => s.applications);
  const sessions = useAppStore((s) => s.sessions);
  const permissionRequests = useAppStore((s) => s.permissionRequests);
  const riskEvents = useAppStore((s) => s.riskEvents);
  const auditLogs = useAppStore((s) => s.auditLogs);
  const handleRiskEvent = useAppStore((s) => s.handleRiskEvent);

  const trendData = useMemo(() => generateTrendData(), []);
  const topAppUsage = useMemo(
    () =>
      [...mockAppUsageStats]
        .sort((a, b) => b.loginCount - a.loginCount)
        .slice(0, 5),
    []
  );
  const pendingRisks = useMemo(
    () => riskEvents.filter((r) => r.status === "pending"),
    [riskEvents]
  );
  const recentAudits = useMemo(() => auditLogs.slice(0, 6), [auditLogs]);

  const onlineSessionCount = useMemo(
    () => sessions.filter((s) => s.isOnline).length,
    [sessions]
  );
  const activeUsersToday = useMemo(
    () => users.filter((u) => u.status === "active").length,
    [users]
  );
  const enabledApps = useMemo(
    () => applications.filter((a) => a.status === "enabled").length,
    [applications]
  );
  const pendingApprovalCount = useMemo(
    () => permissionRequests.filter((r) => r.status === "pending").length,
    [permissionRequests]
  );

  const gaugeData = [
    { name: "成功", value: 7842, color: "#0D9488" },
    { name: "失败", value: 109, color: "#DC2626" },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">
            租户总览
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            集团身份与访问管理实时数据看板
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              navigate("/users");
              toast.success("已跳转用户目录，可点击右上角「新增用户」");
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>新增用户</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              navigate("/users");
              toast.success("已跳转用户目录，可使用「批量导入」功能");
            }}
          >
            <Upload className="w-4 h-4" />
            <span>批量导入</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              navigate("/applications");
              toast.success("已跳转应用接入，可新建应用接入");
            }}
          >
            <SquarePlus className="w-4 h-4" />
            <span>创建应用</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              navigate("/permissions");
              toast.success("已跳转审批中心");
            }}
          >
            <FileCheck className="w-4 h-4" />
            <span>审批中心</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          className="animate-fade-in-up stagger-1 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-brand-500 to-brand-300"
          icon={Users}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          label="总用户数"
          value={users.length.toString()}
          trend={12.5}
          trendLabel="较昨日"
          onClick={() => navigate("/users")}
        />
        <StatCard
          className="animate-fade-in-up stagger-2 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-safe-500 to-safe-200"
          icon={Activity}
          iconColor="text-safe-600"
          iconBg="bg-safe-50"
          label="今日活跃"
          value={activeUsersToday.toString()}
          trend={8.3}
          trendLabel="较昨日"
          onClick={() => navigate("/users")}
        />
        <StatCard
          className="animate-fade-in-up stagger-3 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-brand-500 to-brand-300"
          icon={Monitor}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          label="在线会话"
          value={onlineSessionCount.toString()}
          trend={8.3}
          trendLabel="较昨日"
          onClick={() => navigate("/audit")}
        />
        <StatCard
          className="animate-fade-in-up stagger-4 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-safe-500 to-safe-200"
          icon={AppWindow}
          iconColor="text-safe-600"
          iconBg="bg-safe-50"
          label="接入应用"
          value={`${enabledApps}/${applications.length}`}
          trend={0}
          trendLabel="较昨日"
          onClick={() => navigate("/applications")}
        />
        <StatCard
          className="animate-fade-in-up stagger-5 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-warn-500 to-warn-200"
          icon={Clock}
          iconColor="text-warn-600"
          iconBg="bg-warn-50"
          label="待审批"
          value={pendingApprovalCount.toString()}
          trend={-25}
          trendLabel="较昨日"
          onClick={() => navigate("/permissions")}
        />
        <StatCard
          className="animate-fade-in-up stagger-6 cursor-pointer transition-all hover:scale-[1.02]"
          gradient="from-danger-500 to-danger-200"
          icon={AlertTriangle}
          iconColor="text-danger-600"
          iconBg="bg-danger-50"
          label="风险告警"
          value={pendingRisks.length.toString()}
          trend={50}
          trendLabel="较昨日"
          onClick={() => navigate("/risk")}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-base p-5 lg:col-span-2 animate-fade-in-up">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-800">
              活跃用户与登录趋势
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">近30天活跃用户与登录次数统计</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
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
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "活跃用户",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#6366F1" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "登录次数",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 12, fill: "#0D9488" },
                  }}
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
                <Bar
                  yAxisId="left"
                  dataKey="active"
                  name="活跃用户"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="active"
                  name="活跃趋势"
                  stroke="#1E3A8A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="login"
                  name="登录次数"
                  stroke="#0D9488"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5 animate-fade-in-up stagger-1">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-800">登录成功率</h2>
            <p className="mt-0.5 text-xs text-ink-500">近24小时统计</p>
          </div>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-ink-800 font-display">
                98.6%
              </span>
              <span className="mt-1 text-xs text-ink-500">登录成功率</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-safe-50 p-3 text-center">
              <div className="text-xs text-ink-500">成功</div>
              <div className="mt-1 text-lg font-semibold text-safe-600">
                7,842
              </div>
            </div>
            <div className="rounded-md bg-danger-50 p-3 text-center">
              <div className="text-xs text-ink-500">失败</div>
              <div className="mt-1 text-lg font-semibold text-danger-600">
                109
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card-base p-5 animate-fade-in-up">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-800">
            应用访问热度 TOP5
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            本月应用登录次数与独立用户数统计
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topAppUsage}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 120, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                dataKey="appName"
                type="category"
                width={110}
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
                  value.toLocaleString(),
                  name === "loginCount" ? "登录次数" : "独立用户",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                iconType="circle"
              />
              <Bar
                dataKey="loginCount"
                name="登录次数"
                radius={[0, 6, 6, 0]}
                barSize={20}
              >
                {topAppUsage.map((_, index) => (
                  <defs key={`grad-${index}`}>
                    <linearGradient
                      id={`brandSafeGrad-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#0D9488" />
                    </linearGradient>
                  </defs>
                ))}
                {topAppUsage.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#brandSafeGrad-${index})`}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="uniqueUsers"
                name="独立用户"
                fill="#0D9488"
                fillOpacity={0.35}
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-base p-5 animate-fade-in-up">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-800">
                实时风险预警
              </h2>
              <p className="mt-0.5 text-xs text-ink-500">
                待处置的风险事件共 {pendingRisks.length} 条
              </p>
            </div>
            <button className="btn-ghost">
              <span>查看全部</span>
              <span>→</span>
            </button>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">等级</th>
                  <th className="table-th">类型</th>
                  <th className="table-th">用户/部门</th>
                  <th className="table-th">IP</th>
                  <th className="table-th">检测时间</th>
                  <th className="table-th text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingRisks.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-td">
                      <span className={levelBadgeMap[r.level]}>
                        {levelLabelMap[r.level]}
                      </span>
                    </td>
                    <td className="table-td text-ink-800 font-medium">
                      {r.type}
                    </td>
                    <td className="table-td">
                      <div className="text-ink-800 text-sm">{r.userName}</div>
                      <div className="text-ink-400 text-xs">{r.userDept}</div>
                    </td>
                    <td className="table-td font-mono text-xs text-ink-600">
                      {r.ip}
                    </td>
                    <td className="table-td text-ink-500 text-xs whitespace-nowrap">
                      {r.detectedAt.slice(5)}
                    </td>
                    <td className="table-td text-right">
                      <button
                        className="btn-ghost !py-1 !px-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                        onClick={() => {
                          handleRiskEvent(
                            r.id,
                            r.level === "high" ? "freeze" : "release",
                            "总览快速处置"
                          );
                          toast.success(
                            r.level === "high"
                              ? `已冻结账号 ${r.userName}`
                              : `已放行风险 ${r.userName}`
                          );
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>处置</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRisks.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="table-td text-center text-ink-400 py-8"
                    >
                      暂无待处置风险
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-base p-5 animate-fade-in-up stagger-1">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-800">操作审计留痕</h2>
            <p className="mt-0.5 text-xs text-ink-500">最近 6 条管理员操作</p>
          </div>
          <ol className="relative border-l border-ink-200 ml-2 space-y-5">
            {recentAudits.map((log, index) => {
              const initial = log.operatorName.charAt(0);
              const colors = [
                "bg-brand-100 text-brand-700",
                "bg-safe-100 text-safe-700",
                "bg-warn-100 text-warn-700",
                "bg-danger-100 text-danger-700",
              ];
              const avatarCls = colors[index % colors.length];
              return (
                <li key={log.id} className="ml-6">
                  <span
                    className={`absolute -left-[22px] flex items-center justify-center w-9 h-9 rounded-full ring-4 ring-white ${avatarCls} font-semibold text-sm`}
                  >
                    {initial}
                  </span>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-800">
                          {log.operatorName}
                        </span>
                        <span className="badge-info">{log.module}</span>
                        <span className="text-sm text-ink-700">
                          {log.action}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-600 truncate">
                        对象：
                        <span className="font-medium text-ink-800">
                          {log.targetName}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400 font-mono">
                        IP {log.ip}
                      </p>
                    </div>
                    <span className="text-xs text-ink-400 whitespace-nowrap">
                      {log.operateAt.slice(5)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  className?: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  onClick?: () => void;
}

function StatCard({
  className = "",
  gradient,
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  trendLabel,
  onClick,
}: StatCardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0 ? "text-safe-600" : trend < 0 ? "text-danger-600" : "text-ink-400";

  return (
    <div
      className={`card-base overflow-hidden ${className}${
        onClick ? " cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend)}%</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-ink-500">{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink-800 font-display tabular-nums">
              {value}
            </span>
            <span className="text-xs text-ink-400">{trendLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

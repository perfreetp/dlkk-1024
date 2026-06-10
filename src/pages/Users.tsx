import { useState, useMemo } from "react";
import {
  Upload,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldOff,
  Eye,
  KeyRound,
  Ticket,
  Ban,
  UserCheck,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { mockUsers, mockRoles, mockDepartments, mockPositions } from "@/mock";
import type { UserStatus } from "@/types";

type TabKey =
  | "all"
  | "active"
  | "disabled"
  | "frozen"
  | "mfaOn"
  | "mfaOff";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "启用" },
  { key: "disabled", label: "停用" },
  { key: "frozen", label: "冻结" },
  { key: "mfaOn", label: "已绑MFA" },
  { key: "mfaOff", label: "未绑MFA" },
];

const statusBadgeMap: Record<UserStatus, string> = {
  active: "badge-safe",
  disabled: "badge-neutral",
  frozen: "badge-danger",
};

const statusLabelMap: Record<UserStatus, string> = {
  active: "启用",
  disabled: "停用",
  frozen: "冻结",
};

const roleNameMap: Record<string, string> = {};
mockRoles.forEach((r) => {
  roleNameMap[r.id] = r.name;
});

const avatarColors = [
  "bg-brand-100 text-brand-700",
  "bg-safe-100 text-safe-700",
  "bg-warn-100 text-warn-700",
  "bg-danger-100 text-danger-700",
];

export default function Users() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchText, setSearchText] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((u) => {
      if (activeTab === "active" && u.status !== "active") return false;
      if (activeTab === "disabled" && u.status !== "disabled") return false;
      if (activeTab === "frozen" && u.status !== "frozen") return false;
      if (activeTab === "mfaOn" && !u.mfaEnabled) return false;
      if (activeTab === "mfaOff" && u.mfaEnabled) return false;

      if (searchText) {
        const kw = searchText.toLowerCase();
        if (
          !u.name.toLowerCase().includes(kw) &&
          !u.username.toLowerCase().includes(kw) &&
          !u.email.toLowerCase().includes(kw) &&
          !u.phone.includes(kw)
        ) {
          return false;
        }
      }

      if (deptFilter && u.departmentId !== deptFilter) return false;
      if (posFilter && u.positionId !== posFilter) return false;

      return true;
    });
  }, [activeTab, searchText, deptFilter, posFilter]);

  const totalPages = 27;

  return (
    <div className="space-y-4">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">
            用户目录
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            统一维护全集团员工账号信息与登录凭证
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Upload className="w-4 h-4" />
            <span>批量导入</span>
          </button>
          <button className="btn-primary">
            <UserPlus className="w-4 h-4" />
            <span>新增用户</span>
          </button>
        </div>
      </section>

      <section className="flex gap-4 animate-fade-in-up stagger-1">
        <StatMiniCard label="总账号" value="313" color="text-ink-800" />
        <StatMiniCard label="启用" value="298" variant="safe" />
        <StatMiniCard label="停用" value="11" variant="neutral" />
        <StatMiniCard label="冻结" value="4" variant="danger" />
      </section>

      <section className="card-base p-4 mb-4 animate-fade-in-up stagger-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              className="input-base !pl-9"
              placeholder="搜索用户名 / 邮箱 / 手机号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 flex-1">
            {tabs.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={
                    isActive
                      ? "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-brand-700 text-white shadow-sm"
                      : "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="input-base appearance-none pr-8 w-36"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">全部部门</option>
                {mockDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                className="input-base appearance-none pr-8 w-36"
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
              >
                <option value="">全部岗位</option>
                {mockPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="card-base overflow-auto scrollbar-thin animate-fade-in-up stagger-3">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-th w-64">用户</th>
              <th className="table-th w-48">部门岗位</th>
              <th className="table-th w-48">角色标签</th>
              <th className="table-th w-32">安全状态</th>
              <th className="table-th w-32">账号状态</th>
              <th className="table-th w-44">最近登录</th>
              <th className="table-th w-44">创建时间</th>
              <th className="table-th w-56 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => {
              const initial = u.name.charAt(0);
              const avatarCls = avatarColors[idx % avatarColors.length];
              const isDisabledOrFrozen =
                u.status === "disabled" || u.status === "frozen";

              return (
                <tr
                  key={u.id}
                  className={`table-row ${idx % 2 === 1 ? "even:bg-ink-50/40" : ""}`}
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${avatarCls}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-800">
                          {u.name}
                        </div>
                        <div className="text-xs text-ink-500 truncate">
                          {u.username} / {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="text-sm text-ink-800">{u.departmentName}</div>
                    <div className="text-xs text-ink-500">{u.positionName}</div>
                  </td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      {u.roleIds.map((rid) => (
                        <span key={rid} className="badge-info">
                          {roleNameMap[rid] || rid}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      {u.mfaEnabled ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-safe-600" />
                          <span className="badge-safe">MFA 已开启</span>
                        </>
                      ) : (
                        <>
                          <ShieldOff className="w-4 h-4 text-ink-400" />
                          <span className="badge-neutral">未绑定MFA</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <Switch checked={u.status === "active"} />
                      <span className={statusBadgeMap[u.status]}>
                        {statusLabelMap[u.status]}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="text-sm text-ink-700 whitespace-nowrap">
                      {u.lastLoginAt ? u.lastLoginAt.slice(5) : "-"}
                    </div>
                    <div className="text-xs text-ink-400 font-mono whitespace-nowrap">
                      {u.lastLoginIp ? `IP ${u.lastLoginIp}` : "-"}
                    </div>
                  </td>
                  <td className="table-td text-ink-600 text-sm whitespace-nowrap">
                    {u.createdAt.slice(0, 10)}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      <ActionBtn title="详情" icon={Eye} />
                      <ActionBtn title="重置密码" icon={KeyRound} />
                      <ActionBtn title="临时访问码" icon={Ticket} />
                      {isDisabledOrFrozen ? (
                        <ActionBtn
                          title="启用"
                          icon={UserCheck}
                          className="text-safe-600 hover:bg-safe-50"
                        />
                      ) : (
                        <ActionBtn
                          title="停用"
                          icon={Ban}
                          className="text-danger-600 hover:bg-danger-50"
                        />
                      )}
                      <ActionBtn title="更多" icon={MoreHorizontal} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="table-td text-center text-ink-400 py-12"
                >
                  暂无匹配的用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="flex items-center justify-between px-2 py-3 animate-fade-in-up stagger-4">
        <div className="text-sm text-ink-500">
          共 <span className="font-semibold text-ink-700">313</span> 条
          <span className="mx-2 text-ink-300">|</span>
          每页12条
        </div>
        <div className="flex items-center gap-1">
          <button
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
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
            onClick={() => setCurrentPage(totalPages)}
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
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-colors"
          >
            <span>下一页</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

interface StatMiniCardProps {
  label: string;
  value: string;
  variant?: "safe" | "danger" | "neutral";
  color?: string;
}

function StatMiniCard({ label, value, variant, color }: StatMiniCardProps) {
  let badgeCls = "bg-ink-50 text-ink-500 ring-ink-200/60";
  let valueCls = color || "text-ink-800";

  if (variant === "safe") {
    badgeCls = "bg-safe-50 text-safe-600 ring-safe-500/20";
    valueCls = "text-safe-700";
  } else if (variant === "danger") {
    badgeCls = "bg-danger-50 text-danger-600 ring-danger-500/20";
    valueCls = "text-danger-700";
  } else if (variant === "neutral") {
    badgeCls = "bg-ink-100 text-ink-600 ring-ink-300/60";
    valueCls = "text-ink-700";
  }

  return (
    <div className="card-base p-4 flex items-center gap-3 min-w-[160px]">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-md ring-1 ring-inset ${badgeCls}`}
      >
        <span className={`text-xl font-bold font-display tabular-nums`}>
          {value}
        </span>
      </div>
      <div>
        <div className={`text-lg font-bold font-display tabular-nums ${valueCls}`}>
          {value}
        </div>
        <div className="text-xs text-ink-500 mt-0.5">{label}</div>
      </div>
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
        checked ? "bg-safe-500" : "bg-ink-300"
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

interface ActionBtnProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

function ActionBtn({ title, icon: Icon, className = "" }: ActionBtnProps) {
  return (
    <button
      title={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

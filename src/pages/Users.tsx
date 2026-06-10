import { useState, useMemo } from "react";
import {
  UserPlus,
  Upload,
  Ticket,
  KeyRound,
  Eye,
  Ban,
  UserCheck,
  MoreHorizontal,
  Search,
  ChevronDown,
  Activity,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  Copy,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { mockRoles, mockDepartments, mockPositions } from "@/mock";
import type { User, UserStatus } from "@/types";
import { useAppStore } from "@/stores/useAppStore";
import { Modal, toast } from "@/components/ui/Modal";

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

interface TempCodeResult {
  code: string;
  expireAt: string;
  purpose: string;
  createdBy: string;
  createdAt: string;
}

export default function Users() {
  const users = useAppStore((s) => s.users);
  const toggleUserStatus = useAppStore((s) => s.toggleUserStatus);
  const resetUserPassword = useAppStore((s) => s.resetUserPassword);
  const createUser = useAppStore((s) => s.createUser);
  const generateTempCode = useAppStore((s) => s.generateTempCode);
  const batchImportUsers = useAppStore((s) => s.batchImportUsers);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchText, setSearchText] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tempCodeOpen, setTempCodeOpen] = useState(false);
  const [tempCodeResult, setTempCodeResult] = useState<TempCodeResult | null>(null);
  const [tempTargetUser, setTempTargetUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDept, setFormDept] = useState(mockDepartments[0]?.id || "");
  const [formPos, setFormPos] = useState(mockPositions[0]?.id || "");
  const [formRoles, setFormRoles] = useState<string[]>(["r004"]);
  const [formMfa, setFormMfa] = useState(false);

  const [tempPurpose, setTempPurpose] = useState("");
  const [tempHours, setTempHours] = useState(8);

  const [importDept, setImportDept] = useState(mockDepartments[0]?.id || "");
  const [importCount, setImportCount] = useState(10);

  const allDepartments = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    const walk = (list: typeof mockDepartments) => {
      list.forEach((d) => {
        result.push({ id: d.id, name: d.name });
        if (d.children) walk(d.children as unknown as typeof mockDepartments);
      });
    };
    walk(mockDepartments);
    return result;
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      disabled: users.filter((u) => u.status === "disabled").length,
      frozen: users.filter((u) => u.status === "frozen").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
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
  }, [activeTab, searchText, deptFilter, posFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / 12) || 27);

  const handleToggleStatus = (user: User) => {
    const oldStatus = user.status;
    toggleUserStatus(user.id);
    let newStatus: UserStatus = "active";
    if (oldStatus === "frozen") newStatus = "active";
    else if (oldStatus === "active") newStatus = "disabled";
    else newStatus = "active";

    if (newStatus === ("frozen" as UserStatus)) {
      toast.warn("已更新账号状态");
    } else {
      toast.success("已更新账号状态");
    }
  };

  const handleCreateUser = () => {
    if (!formName.trim() || !formUsername.trim()) {
      toast.error("请填写姓名和登录名");
      return;
    }
    const dept = allDepartments.find((d) => d.id === formDept);
    const pos = mockPositions.find((p) => p.id === formPos);
    createUser({
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      departmentId: formDept,
      departmentName: dept?.name,
      positionId: formPos,
      positionName: pos?.name,
      roleIds: formRoles,
      mfaEnabled: formMfa,
    });
    toast.success("新增用户成功，初始密码已发送至邮箱");
    setCreateOpen(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormDept(mockDepartments[0]?.id || "");
    setFormPos(mockPositions[0]?.id || "");
    setFormRoles(["r004"]);
    setFormMfa(false);
  };

  const handleTempCodeGenerate = () => {
    if (!tempTargetUser) return;
    const res = generateTempCode(tempTargetUser.id, tempPurpose, tempHours);
    setTempCodeResult({
      code: res.code,
      expireAt: res.expireAt,
      purpose: res.purpose,
      createdBy: res.createdBy,
      createdAt: res.createdAt,
    });
  };

  const handleResetPassword = () => {
    if (!resetUser) return;
    resetUserPassword(resetUser.id);
    toast.success("密码已重置，新密码已发送到用户邮箱");
    setResetUser(null);
  };

  const handleBatchImport = () => {
    const dept = allDepartments.find((d) => d.id === importDept);
    batchImportUsers(importCount, importDept, dept?.name || "");
    toast.success(`成功导入 ${importCount} 名员工账号`);
    setImportOpen(false);
  };

  const handleCopyCode = async () => {
    if (tempCodeResult) {
      try {
        await navigator.clipboard.writeText(tempCodeResult.code);
        toast.success("已复制");
      } catch {
        toast.success("已复制");
      }
    }
  };

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
          <button className="btn-secondary" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            <span>批量导入</span>
          </button>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>新增用户</span>
          </button>
        </div>
      </section>

      <section className="flex gap-4 animate-fade-in-up stagger-1">
        <StatMiniCard label="总账号" value={stats.total.toString()} color="text-ink-800" />
        <StatMiniCard label="启用" value={stats.active.toString()} variant="safe" />
        <StatMiniCard label="停用" value={stats.disabled.toString()} variant="neutral" />
        <StatMiniCard label="冻结" value={stats.frozen.toString()} variant="danger" />
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
                {allDepartments.map((d) => (
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
                      <Switch
                        checked={u.status === "active"}
                        onChange={() => handleToggleStatus(u)}
                      />
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
                      <ActionBtn
                        title="重置密码"
                        icon={KeyRound}
                        onClick={() => setResetUser(u)}
                      />
                      <ActionBtn
                        title="临时访问码"
                        icon={Ticket}
                        onClick={() => {
                          setTempTargetUser(u);
                          setTempCodeResult(null);
                          setTempPurpose("");
                          setTempHours(8);
                          setTempCodeOpen(true);
                        }}
                      />
                      <ActionBtn
                        title={isDisabledOrFrozen ? "启用" : "停用"}
                        icon={isDisabledOrFrozen ? UserCheck : Ban}
                        className={
                          isDisabledOrFrozen
                            ? "text-safe-600 hover:bg-safe-50"
                            : "text-danger-600 hover:bg-danger-50"
                        }
                        onClick={() => handleToggleStatus(u)}
                      />
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
          共{" "}
          <span className="font-semibold text-ink-700">
            {filteredUsers.length}
          </span>{" "}
          条
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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新增用户"
        description="创建新的员工账号，初始密码将通过邮件发送"
        icon={<UserPlus className="w-5 h-5" />}
        width="max-w-xl"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setCreateOpen(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleCreateUser}>
              确定创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                姓名 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="请输入姓名"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                登录名 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="请输入登录名"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="input-base"
                placeholder="请输入邮箱"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">手机号</label>
              <input
                type="text"
                className="input-base"
                placeholder="请输入手机号"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">归属部门</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-full"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                >
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="form-label">岗位</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-full"
                  value={formPos}
                  onChange={(e) => setFormPos(e.target.value)}
                >
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
          <div>
            <label className="form-label">角色</label>
            <div className="flex flex-wrap gap-2 pt-2">
              {mockRoles.map((r) => {
                const checked = formRoles.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                      checked
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setFormRoles(formRoles.filter((id) => id !== r.id));
                        } else {
                          setFormRoles([...formRoles, r.id]);
                        }
                      }}
                    />
                    <span className="text-sm">{r.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-ink-50">
            <div>
              <div className="text-sm font-medium text-ink-700">
                强制开启 MFA
              </div>
              <div className="text-xs text-ink-500">
                用户首次登录需绑定多因素认证
              </div>
            </div>
            <Switch checked={formMfa} onChange={setFormMfa} />
          </div>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="批量导入用户"
        description="通过 Excel 模板批量导入员工账号"
        icon={<Upload className="w-5 h-5" />}
        width="max-w-xl"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setImportOpen(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleBatchImport}>
              开始导入
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={() => toast.info("模板已开始下载")}
            >
              <FileText className="w-4 h-4" />
              <span>下载导入模板</span>
            </button>
            <span className="text-sm text-ink-500">
              下载导入模板并按格式填写
            </span>
          </div>

          <div className="border-2 border-dashed border-ink-200 rounded-md p-8 flex flex-col items-center justify-center bg-ink-50/50 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-ink-400 mb-2" />
            <div className="text-sm text-ink-600 font-medium">
              点击或拖拽 Excel 文件到此处上传
            </div>
            <div className="text-xs text-ink-400 mt-1">
              支持 .xlsx / .xls 格式，最大 10MB
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">导入部门</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8 w-full"
                  value={importDept}
                  onChange={(e) => setImportDept(e.target.value)}
                >
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="form-label">导入人数</label>
              <input
                type="number"
                className="input-base"
                min={1}
                max={500}
                value={importCount}
                onChange={(e) =>
                  setImportCount(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink-700 mb-2">
              预览示例数据
            </div>
            <div className="border border-ink-200 rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-ink-50">
                    <th className="px-3 py-2 text-left font-medium text-ink-600">
                      姓名
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-ink-600">
                      部门
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-ink-600">
                      岗位
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-ink-600">
                      邮箱
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "赵伟1",
                      dept: allDepartments.find((d) => d.id === importDept)
                        ?.name || "技术研发中心",
                      pos: "高级开发工程师",
                      email: "zhaowei1@group.com",
                    },
                    {
                      name: "钱芳2",
                      dept: allDepartments.find((d) => d.id === importDept)
                        ?.name || "技术研发中心",
                      pos: "高级开发工程师",
                      email: "qianfang2@group.com",
                    },
                    {
                      name: "孙娜3",
                      dept: allDepartments.find((d) => d.id === importDept)
                        ?.name || "技术研发中心",
                      pos: "高级开发工程师",
                      email: "sunna3@group.com",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-ink-100"
                    >
                      <td className="px-3 py-2 text-ink-700">{row.name}</td>
                      <td className="px-3 py-2 text-ink-600">{row.dept}</td>
                      <td className="px-3 py-2 text-ink-600">{row.pos}</td>
                      <td className="px-3 py-2 text-ink-600 font-mono">
                        {row.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={tempCodeOpen}
        onClose={() => {
          setTempCodeOpen(false);
          setTempCodeResult(null);
        }}
        title={tempCodeResult ? "临时访问码" : "生成临时访问码"}
        description={
          tempCodeResult
            ? undefined
            : "为指定用户生成一次性临时访问凭证"
        }
        icon={<Ticket className="w-5 h-5" />}
        width="max-w-lg"
        footer={
          tempCodeResult ? (
            <button
              className="btn-primary"
              onClick={() => {
                setTempCodeOpen(false);
                setTempCodeResult(null);
              }}
            >
              完成
            </button>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  setTempCodeOpen(false);
                  setTempCodeResult(null);
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleTempCodeGenerate}>
                生成访问码
              </button>
            </>
          )
        }
      >
        {tempCodeResult ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-safe-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-10 h-10 text-safe-500" />
              </div>
              <div className="text-lg font-semibold text-ink-800">
                临时访问码生成成功
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 py-4 px-4 bg-ink-50 rounded-md">
              <div className="font-mono font-bold text-3xl text-brand-700 tracking-widest">
                {tempCodeResult.code}
              </div>
              <button
                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-500 hover:bg-white hover:text-brand-600 border border-ink-200 transition-colors"
                onClick={handleCopyCode}
                title="复制"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-ink-100">
                <span className="text-ink-500">有效期至</span>
                <span className="text-ink-700 font-mono">
                  {tempCodeResult.expireAt}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink-100">
                <span className="text-ink-500">用途</span>
                <span className="text-ink-700">
                  {tempCodeResult.purpose || "未填写"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink-100">
                <span className="text-ink-500">创建人</span>
                <span className="text-ink-700">
                  {tempCodeResult.createdBy}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-warn-50 border border-warn-200">
              <AlertCircle className="w-4 h-4 text-warn-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-warn-700">
                此访问码一次性有效，过期后自动失效。请妥善保管，不要泄露给他人。
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tempTargetUser && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-ink-50">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
                  {tempTargetUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-800">
                    {tempTargetUser.name}
                  </div>
                  <div className="text-xs text-ink-500 truncate">
                    {tempTargetUser.departmentName}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="form-label">用途备注</label>
              <input
                type="text"
                className="input-base"
                placeholder="如：临时运维、首次登录等"
                value={tempPurpose}
                onChange={(e) => setTempPurpose(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">有效期</label>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[2, 8, 24, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => setTempHours(h)}
                    className={`py-2 rounded-md text-sm font-medium transition-colors ${
                      tempHours === h
                        ? "bg-brand-700 text-white shadow-sm"
                        : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
                    }`}
                  >
                    {h}小时
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title="重置密码"
        description="确认重置用户登录密码"
        icon={<KeyRound className="w-5 h-5" />}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setResetUser(null)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleResetPassword}>
              确认重置
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {resetUser && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-ink-50 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
                {resetUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-800">
                  {resetUser.name}
                </div>
                <div className="text-xs text-ink-500 truncate font-mono">
                  {resetUser.email}
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-ink-600 leading-relaxed">
            确定要重置该用户的登录密码吗？重置后新密码将通过邮件发送到用户绑定邮箱。
          </p>
        </div>
      </Modal>
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
  onClick?: () => void;
}

function ActionBtn({ title, icon: Icon, className = "", onClick }: ActionBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

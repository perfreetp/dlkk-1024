import { useState, useMemo } from "react";
import {
  Plus,
  Lock,
  Pencil,
  Users2,
  Copy,
  Menu,
  Database,
  LayoutGrid,
  Search,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  LogOut,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { mockRoles, mockPermissionRequests, mockDepartments, mockUsers } from "@/mock";
import type {
  Role,
  RoleType,
  PermissionRequest,
  RequestStatus,
  RiskLevel,
} from "@/types";

type MainTabKey = "roles" | "approvals" | "offboarding";
type RoleFilterKey = "all" | "system" | "custom";
type RoleDetailTabKey = "menu" | "data" | "matrix";
type ApprovalFilterKey = "pending" | "approved" | "rejected" | "all";
type OffboardStatusKey = "pending" | "recycled";

const mainTabs: { key: MainTabKey; label: string }[] = [
  { key: "roles", label: "角色管理" },
  { key: "approvals", label: "权限申请审批" },
  { key: "offboarding", label: "离职权限回收" },
];

const roleFilterTabs: { key: RoleFilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "system", label: "系统角色" },
  { key: "custom", label: "自定义角色" },
];

const roleDetailTabs: {
  key: RoleDetailTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "menu", label: "菜单权限", icon: Menu },
  { key: "data", label: "数据权限", icon: Database },
  { key: "matrix", label: "权限矩阵概览", icon: LayoutGrid },
];

const approvalFilterTabs: { key: ApprovalFilterKey; label: string }[] = [
  { key: "pending", label: "待审批" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已驳回" },
  { key: "all", label: "全部" },
];

const offboardStatusTabs: { key: OffboardStatusKey; label: string }[] = [
  { key: "pending", label: "待回收" },
  { key: "recycled", label: "已回收" },
];

const avatarColors = [
  "bg-brand-100 text-brand-700",
  "bg-safe-100 text-safe-700",
  "bg-warn-100 text-warn-700",
  "bg-danger-100 text-danger-700",
];

interface MenuPermissionNode {
  id: string;
  name: string;
  children?: MenuPermissionNode[];
}

const menuPermissionTree: MenuPermissionNode[] = [
  {
    id: "m-user",
    name: "用户目录",
    children: [
      {
        id: "m-user-list",
        name: "用户列表页",
        children: [
          { id: "m-user-list-view", name: "查看用户" },
          { id: "m-user-list-add", name: "新增用户" },
          { id: "m-user-list-edit", name: "编辑用户" },
          { id: "m-user-list-delete", name: "删除用户" },
        ],
      },
      {
        id: "m-user-import",
        name: "批量导入",
        children: [
          { id: "m-user-import-exec", name: "执行导入" },
          { id: "m-user-import-template", name: "下载模板" },
        ],
      },
    ],
  },
  {
    id: "m-org",
    name: "组织岗位",
    children: [
      {
        id: "m-org-dept",
        name: "部门管理",
        children: [
          { id: "m-org-dept-view", name: "查看部门" },
          { id: "m-org-dept-add", name: "新增部门" },
          { id: "m-org-dept-edit", name: "编辑部门" },
        ],
      },
      {
        id: "m-org-position",
        name: "岗位管理",
        children: [
          { id: "m-org-position-view", name: "查看岗位" },
          { id: "m-org-position-add", name: "新增岗位" },
          { id: "m-org-position-edit", name: "编辑岗位" },
        ],
      },
    ],
  },
  {
    id: "m-app",
    name: "应用接入",
    children: [
      {
        id: "m-app-list",
        name: "应用列表",
        children: [
          { id: "m-app-list-view", name: "查看应用" },
          { id: "m-app-list-add", name: "新增应用" },
          { id: "m-app-list-edit", name: "编辑配置" },
          { id: "m-app-list-toggle", name: "启用/停用" },
        ],
      },
    ],
  },
  {
    id: "m-perm",
    name: "权限角色",
    children: [
      {
        id: "m-perm-role",
        name: "角色管理",
        children: [
          { id: "m-perm-role-view", name: "查看角色" },
          { id: "m-perm-role-add", name: "新增角色" },
          { id: "m-perm-role-edit", name: "编辑权限" },
        ],
      },
      {
        id: "m-perm-approval",
        name: "审批管理",
        children: [
          { id: "m-perm-approval-view", name: "查看申请" },
          { id: "m-perm-approval-pass", name: "审批通过" },
          { id: "m-perm-approval-reject", name: "审批驳回" },
        ],
      },
    ],
  },
  {
    id: "m-audit",
    name: "审计中心",
    children: [
      {
        id: "m-audit-login",
        name: "登录审计",
        children: [
          { id: "m-audit-login-view", name: "查看日志" },
          { id: "m-audit-login-export", name: "导出报表" },
        ],
      },
      {
        id: "m-audit-risk",
        name: "风险处置",
        children: [
          { id: "m-audit-risk-view", name: "查看风险" },
          { id: "m-audit-risk-handle", name: "处置风险" },
        ],
      },
    ],
  },
];

const dataScopeOptions = [
  { key: "all", name: "全部数据", desc: "可查看系统内所有业务数据" },
  {
    key: "deptAndBelow",
    name: "本部门及下级",
    desc: "可查看本部门及所有下级部门数据",
  },
  { key: "deptOnly", name: "仅本部门", desc: "仅可查看所属部门范围内的数据" },
  { key: "selfOnly", name: "仅本人", desc: "仅可查看本人创建或负责的数据" },
  {
    key: "custom",
    name: "自定义数据范围",
    desc: "手动指定可访问的部门范围",
  },
];

const roleMenuPermissionMap: Record<string, string[]> = {
  r001: getAllMenuIds(menuPermissionTree),
  r002: [
    "m-user",
    "m-user-list",
    "m-user-list-view",
    "m-user-list-add",
    "m-user-list-edit",
    "m-org",
    "m-org-dept",
    "m-org-dept-view",
    "m-org-position",
    "m-org-position-view",
    "m-perm",
    "m-perm-approval",
    "m-perm-approval-view",
  ],
  r003: [
    "m-audit",
    "m-audit-login",
    "m-audit-login-view",
    "m-audit-login-export",
    "m-audit-risk",
    "m-audit-risk-view",
    "m-audit-risk-handle",
    "m-user",
    "m-user-list",
    "m-user-list-view",
  ],
  r004: ["m-user", "m-user-list", "m-user-list-view"],
  r005: ["m-app", "m-app-list", "m-app-list-view", "m-user", "m-user-list", "m-user-list-view"],
  r006: ["m-user", "m-user-list", "m-user-list-view", "m-app", "m-app-list", "m-app-list-view"],
  r007: ["m-app", "m-app-list", "m-app-list-view", "m-app-list-edit"],
};

function getAllMenuIds(nodes: MenuPermissionNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: MenuPermissionNode[]) => {
    list.forEach((n) => {
      ids.push(n.id);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return ids;
}

interface OffboardUser {
  id: string;
  name: string;
  departmentName: string;
  positionName: string;
  leaveDate: string;
  permissions: string[];
  riskLevel: RiskLevel;
  status: OffboardStatusKey;
  recycledAt?: string;
}

const mockOffboardUsers: OffboardUser[] = [
  {
    id: "ou001",
    name: "钱前",
    departmentName: "后端开发组",
    positionName: "后端工程师",
    leaveDate: "2026-06-08",
    permissions: ["普通用户", "财务审核员"],
    riskLevel: "high",
    status: "pending",
  },
  {
    id: "ou002",
    name: "孙逊",
    departmentName: "信息安全部",
    positionName: "安全工程师",
    leaveDate: "2026-06-09",
    permissions: ["安全审计员", "超级管理员"],
    riskLevel: "high",
    status: "pending",
  },
  {
    id: "ou003",
    name: "李丽",
    departmentName: "市场营销部",
    positionName: "市场专员",
    leaveDate: "2026-06-10",
    permissions: ["普通用户", "市场管理员"],
    riskLevel: "medium",
    status: "pending",
  },
  {
    id: "ou004",
    name: "周舟",
    departmentName: "运营管理部",
    positionName: "运营专员",
    leaveDate: "2026-06-05",
    permissions: ["普通用户"],
    riskLevel: "low",
    status: "recycled",
    recycledAt: "2026-06-05 18:30:00",
  },
  {
    id: "ou005",
    name: "吴梧",
    departmentName: "人力资源部",
    positionName: "招聘专员",
    leaveDate: "2026-06-03",
    permissions: ["组织管理员", "普通用户"],
    riskLevel: "medium",
    status: "recycled",
    recycledAt: "2026-06-03 20:15:00",
  },
  {
    id: "ou006",
    name: "郑峥",
    departmentName: "前端开发组",
    positionName: "前端工程师",
    leaveDate: "2026-06-01",
    permissions: ["普通用户"],
    riskLevel: "low",
    status: "recycled",
    recycledAt: "2026-06-01 19:00:00",
  },
];

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        checked ? "bg-brand-600" : "bg-ink-300"
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

const riskBadgeMap: Record<RiskLevel, string> = {
  high: "badge-danger",
  medium: "badge-warn bg-warn-50 text-warn-700 ring-warn-500/30",
  low: "badge-safe",
};

const riskLabelMap: Record<RiskLevel, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

const requestStatusBadgeMap: Record<RequestStatus, string> = {
  pending: "badge-warn bg-warn-50 text-warn-700 ring-warn-500/30",
  approved: "badge-safe",
  rejected: "badge-danger",
};

const requestStatusLabelMap: Record<RequestStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回",
};

export default function Permissions() {
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("roles");

  return (
    <div className="flex flex-col gap-4">
      <section className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-ink-800">权限角色</h1>
        <p className="mt-1 text-sm text-ink-500">
          定义系统角色与权限矩阵，审批并追溯权限分配全流程
        </p>
      </section>

      <section className="card-base p-1.5 animate-fade-in-up stagger-1">
        <div className="flex gap-1">
          {mainTabs.map((t) => {
            const isActive = activeMainTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveMainTab(t.key)}
                className={`flex items-center px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="animate-fade-in-up stagger-2">
        {activeMainTab === "roles" && <RoleManagementPanel />}
        {activeMainTab === "approvals" && <ApprovalPanel />}
        {activeMainTab === "offboarding" && <OffboardingPanel />}
      </section>
    </div>
  );
}

function RoleManagementPanel() {
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>("all");
  const [selectedRoleId, setSelectedRoleId] = useState<string>(mockRoles[0].id);
  const [detailTab, setDetailTab] = useState<RoleDetailTabKey>("menu");

  const filteredRoles = useMemo(() => {
    if (roleFilter === "all") return mockRoles;
    return mockRoles.filter((r) => r.type === roleFilter);
  }, [roleFilter]);

  const selectedRole = mockRoles.find((r) => r.id === selectedRoleId) || mockRoles[0];

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)]">
      <div className="w-96 card-base p-4 overflow-auto scrollbar-thin flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink-800">角色列表</h2>
          <button className="btn-primary !py-1.5 !px-2.5">
            <Plus className="w-4 h-4" />
            <span>新增角色</span>
          </button>
        </div>

        <div className="flex gap-1 mb-4 p-1 bg-ink-50 rounded-md">
          {roleFilterTabs.map((t) => {
            const isActive = roleFilter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setRoleFilter(t.key)}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-ink-500 hover:text-ink-700"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-3 -mx-1">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              selected={role.id === selectedRoleId}
              onClick={() => setSelectedRoleId(role.id)}
            />
          ))}
          {filteredRoles.length === 0 && (
            <div className="text-center text-ink-400 text-sm py-8">暂无角色数据</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="card-base p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-semibold text-ink-800">{selectedRole.name}</h3>
                <span className={`text-xs font-mono ${selectedRole.type === "system" ? "badge-info" : "badge-neutral"}`}>
                  {selectedRole.type === "system" ? "系统角色" : "自定义角色"}
                </span>
                <span className="font-mono text-xs text-ink-400">{selectedRole.code}</span>
              </div>
              <p className="mt-2 text-sm text-ink-500">{selectedRole.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn-secondary">
                <Pencil className="w-4 h-4" />
                <span>编辑角色</span>
              </button>
              <button className="btn-secondary">
                <Users2 className="w-4 h-4" />
                <span>成员管理</span>
              </button>
              <button className="btn-secondary">
                <Copy className="w-4 h-4" />
                <span>克隆</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card-base p-2 flex-shrink-0">
          <div className="flex gap-1">
            {roleDetailTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = detailTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {detailTab === "menu" && (
            <MenuPermissionTab roleId={selectedRole.id} />
          )}
          {detailTab === "data" && (
            <DataPermissionTab roleId={selectedRole.id} />
          )}
          {detailTab === "matrix" && (
            <PermissionMatrixTab selectedRoleId={selectedRole.id} />
          )}
        </div>
      </div>
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  selected: boolean;
  onClick: () => void;
}

function RoleCard({ role, selected, onClick }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-150 ${
        selected
          ? "border-brand-400 bg-brand-50/50 shadow-sm"
          : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-ink-800 truncate">{role.name}</span>
            <span className="font-mono text-[11px] text-ink-400 flex-shrink-0">{role.code}</span>
          </div>
          <div className="mt-1.5">
            <span className={role.type === "system" ? "badge-info text-[11px]" : "badge-neutral text-[11px]"}>
              {role.type === "system" ? "系统角色" : "自定义角色"}
            </span>
          </div>
        </div>
        {role.type === "system" && (
          <Lock className="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-1" />
        )}
      </div>
      <p className="mt-2 text-xs text-ink-500 line-clamp-2 leading-relaxed">
        {role.description}
      </p>
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span className="text-ink-600 font-medium">{role.permissionCount}</span>
          <span>权限</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Users2 className="w-3 h-3" />
          <span className="text-ink-600 font-medium">{role.memberCount}</span>
          <span>成员</span>
        </span>
      </div>
    </div>
  );
}

function MenuPermissionTab({ roleId }: { roleId: string }) {
  const grantedIds = useMemo(
    () => new Set(roleMenuPermissionMap[roleId] || []),
    [roleId]
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(grantedIds);

  const getAllDescendantIds = (node: MenuPermissionNode): string[] => {
    const ids: string[] = [node.id];
    if (node.children) {
      node.children.forEach((c) => ids.push(...getAllDescendantIds(c)));
    }
    return ids;
  };

  const getChildrenIds = (node: MenuPermissionNode): string[] => {
    const ids: string[] = [];
    if (node.children) {
      node.children.forEach((c) => ids.push(...getAllDescendantIds(c)));
    }
    return ids;
  };

  const getParentIdMap = (): Record<string, string | null> => {
    const map: Record<string, string | null> = {};
    const walk = (list: MenuPermissionNode[], parentId: string | null) => {
      list.forEach((n) => {
        map[n.id] = parentId;
        if (n.children) walk(n.children, n.id);
      });
    };
    walk(menuPermissionTree, null);
    return map;
  };

  const parentMap = useMemo(getParentIdMap, []);

  const getCheckState = (node: MenuPermissionNode): "checked" | "unchecked" | "indeterminate" => {
    if (!node.children || node.children.length === 0) {
      return checkedIds.has(node.id) ? "checked" : "unchecked";
    }
    const childStates = node.children.map(getCheckState);
    const allChecked = childStates.every((s) => s === "checked");
    const someChecked = childStates.some((s) => s === "checked" || s === "indeterminate");
    if (allChecked) return "checked";
    if (someChecked) return "indeterminate";
    return "unchecked";
  };

  const handleToggle = (node: MenuPermissionNode) => {
    const next = new Set(checkedIds);
    const descendants = getAllDescendantIds(node);
    const currentState = getCheckState(node);

    if (currentState === "unchecked") {
      descendants.forEach((id) => next.add(id));
    } else {
      descendants.forEach((id) => next.delete(id));
    }

    let curId: string | null = parentMap[node.id];
    while (curId) {
      const parentNode = findNodeById(menuPermissionTree, curId);
      if (parentNode && parentNode.children) {
        const siblingStates = parentNode.children.map(getCheckState);
        const allSiblingsChecked = siblingStates.every(
          (s, i) =>
            (parentNode.children![i].id === node.id ? currentState === "unchecked" : s === "checked")
        );
        if (allSiblingsChecked) {
          next.add(curId);
        } else {
          next.delete(curId);
        }
      }
      curId = parentMap[curId];
    }

    setCheckedIds(next);
  };

  return (
    <div className="card-base p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center">
          <Menu className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink-800">菜单与功能权限</h4>
          <p className="text-xs text-ink-500 mt-0.5">勾选以授予对应菜单页面和按钮操作权限，父子自动联动</p>
        </div>
      </div>
      <div className="space-y-1">
        {menuPermissionTree.map((node) => (
          <MenuTreeNode
            key={node.id}
            node={node}
            level={0}
            getCheckState={getCheckState}
            onToggle={handleToggle}
            expandedInitially={true}
          />
        ))}
      </div>
    </div>
  );
}

function findNodeById(
  nodes: MenuPermissionNode[],
  id: string
): MenuPermissionNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

interface MenuTreeNodeProps {
  node: MenuPermissionNode;
  level: number;
  getCheckState: (node: MenuPermissionNode) => "checked" | "unchecked" | "indeterminate";
  onToggle: (node: MenuPermissionNode) => void;
  expandedInitially?: boolean;
}

function MenuTreeNode({
  node,
  level,
  getCheckState,
  onToggle,
  expandedInitially = true,
}: MenuTreeNodeProps) {
  const [expanded, setExpanded] = useState(expandedInitially);
  const hasChildren = node.children && node.children.length > 0;
  const state = getCheckState(node);

  const checkboxRef = (el: HTMLInputElement | null) => {
    if (el) {
      el.indeterminate = state === "indeterminate";
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2.5 rounded-md hover:bg-ink-50 transition-colors group"
        style={{ marginLeft: level * 20 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-ink-100 text-ink-400"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="flex-shrink-0 w-5 h-5" />
        )}
        <input
          type="checkbox"
          ref={checkboxRef}
          checked={state === "checked"}
          onChange={() => onToggle(node)}
          className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
        />
        <span className="text-sm text-ink-700 select-none">{node.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <MenuTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              getCheckState={getCheckState}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DataPermissionTab({ roleId }: { roleId: string }) {
  const defaultScopes: Record<string, { key: string; enabled: boolean; deptIds?: string[] }> = {
    r001: { key: "all", enabled: true },
    r002: { key: "deptAndBelow", enabled: true },
    r003: { key: "selfOnly", enabled: false },
    r004: { key: "selfOnly", enabled: true },
    r005: { key: "deptOnly", enabled: true },
    r006: { key: "deptOnly", enabled: true },
    r007: { key: "selfOnly", enabled: false },
  };

  const [activeScope, setActiveScope] = useState(defaultScopes[roleId]?.key || "selfOnly");
  const [customDeptIds, setCustomDeptIds] = useState<Set<string>>(
    () => new Set(["d001", "d001-1"])
  );
  const [scopeSwitches, setScopeSwitches] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    dataScopeOptions.forEach((o) => (s[o.key] = false));
    const def = defaultScopes[roleId];
    if (def) {
      s[def.key] = def.enabled;
      dataScopeOptions.forEach((o) => {
        if (o.key !== def.key && (o.key === "all" || o.key === "deptAndBelow" || o.key === "deptOnly" || o.key === "selfOnly" || o.key === "custom")) {
          s[o.key] = roleId === "r001" ? o.key === "all" : false;
        }
      });
    }
    s["selfOnly"] = true;
    if (def && def.key !== "selfOnly") s[def.key] = true;
    return s;
  });

  const handleScopeSwitch = (key: string, enabled: boolean) => {
    setScopeSwitches((prev) => {
      const next = { ...prev };
      if (key === "all" && enabled) {
        dataScopeOptions.forEach((o) => (next[o.key] = o.key === "all" ? true : next[o.key]));
        next["all"] = true;
      } else {
        next[key] = enabled;
        if (enabled && key !== "custom") next["custom"] = false;
      }
      if (!enabled && key === "all") next["selfOnly"] = true;
      return next;
    });
    if (enabled) setActiveScope(key);
  };

  const toggleCustomDept = (deptId: string) => {
    setCustomDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const showCustomSection = scopeSwitches["custom"];

  return (
    <div className="space-y-4">
      <div className="card-base p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-md bg-safe-50 text-safe-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">数据范围权限</h4>
            <p className="text-xs text-ink-500 mt-0.5">控制角色可访问的业务数据范围，多维度叠加生效</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-200">
          <table className="min-w-full">
            <thead>
              <tr className="bg-ink-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">数据范围</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">说明</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide w-32">配置</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {dataScopeOptions.map((opt) => {
                const isActive = activeScope === opt.key;
                return (
                  <tr
                    key={opt.key}
                    className={`${isActive && scopeSwitches[opt.key] ? "bg-brand-50/30" : ""} hover:bg-ink-50 transition-colors`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {isActive && scopeSwitches[opt.key] && (
                          <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${isActive && scopeSwitches[opt.key] ? "font-semibold text-brand-700" : "text-ink-700"}`}>
                          {opt.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-500">{opt.desc}</td>
                    <td className="px-5 py-4 text-right">
                      <Switch
                        checked={!!scopeSwitches[opt.key]}
                        onChange={(v) => handleScopeSwitch(opt.key, v)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCustomSection && (
        <div className="card-base p-5 border-dashed border-brand-300">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-warn-50 text-warn-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink-800">自定义数据范围 - 选择部门</h4>
              <p className="text-xs text-ink-500 mt-0.5">勾选后，该角色将可访问选中部门范围内的数据</p>
            </div>
          </div>
          <div className="space-y-1 p-3 bg-ink-50/50 rounded-lg max-h-64 overflow-auto scrollbar-thin">
            {mockDepartments.map((dept) => (
              <DeptCheckboxItem
                key={dept.id}
                dept={dept}
                level={0}
                selected={customDeptIds}
                onToggle={toggleCustomDept}
              />
            ))}
          </div>
          <div className="mt-3 text-xs text-ink-400">
            已选择 <span className="text-brand-600 font-semibold">{customDeptIds.size}</span> 个部门
          </div>
        </div>
      )}
    </div>
  );
}

interface DeptCheckboxItemProps {
  dept: { id: string; name: string; children?: any[] };
  level: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function DeptCheckboxItem({ dept, level, selected, onToggle }: DeptCheckboxItemProps) {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white transition-colors"
        style={{ paddingLeft: level * 20 + 8 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-ink-100 text-ink-400"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="flex-shrink-0 w-5 h-5" />
        )}
        <input
          type="checkbox"
          checked={selected.has(dept.id)}
          onChange={() => onToggle(dept.id)}
          className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
        />
        <span className="text-sm text-ink-700 select-none">{dept.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {dept.children!.map((child: any) => (
            <DeptCheckboxItem
              key={child.id}
              dept={child}
              level={level + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionMatrixTab({ selectedRoleId }: { selectedRoleId: string }) {
  const moduleNames = ["用户目录", "组织岗位", "应用接入", "权限角色", "审计中心"];
  const moduleIds = ["m-user", "m-org", "m-app", "m-perm", "m-audit"];

  const hasModulePermission = (roleId: string, moduleId: string): boolean => {
    const perms = roleMenuPermissionMap[roleId] || [];
    return perms.includes(moduleId);
  };

  return (
    <div className="card-base p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-warn-50 text-warn-600 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink-800">权限矩阵概览</h4>
          <p className="text-xs text-ink-500 mt-0.5">横向对比各角色在不同模块下的权限覆盖情况，当前选中角色高亮显示</p>
        </div>
      </div>

      <div className="overflow-auto scrollbar-thin rounded-lg border border-ink-200">
        <table className="min-w-full">
          <thead>
            <tr className="bg-ink-50">
              <th className="sticky left-0 bg-ink-50 z-10 text-left px-5 py-3.5 text-xs font-semibold text-ink-600 uppercase tracking-wide border-r border-ink-200 w-40">
                角色 \ 模块
              </th>
              {moduleNames.map((name) => (
                <th
                  key={name}
                  className="text-center px-4 py-3.5 text-xs font-semibold text-ink-600 uppercase tracking-wide min-w-[120px]"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {mockRoles.map((role) => {
              const isSelected = role.id === selectedRoleId;
              return (
                <tr
                  key={role.id}
                  className={`transition-colors ${isSelected ? "bg-brand-50/50" : "hover:bg-ink-50"}`}
                >
                  <td
                    className={`sticky left-0 z-10 border-r border-ink-200 px-5 py-4 ${isSelected ? "bg-brand-50/60" : "bg-white"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-sm font-semibold ${isSelected ? "text-brand-700" : "text-ink-800"}`}
                      >
                        {role.name}
                      </span>
                      <span className={role.type === "system" ? "badge-info text-[10px]" : "badge-neutral text-[10px]"}>
                        {role.type === "system" ? "系统" : "自定义"}
                      </span>
                    </div>
                  </td>
                  {moduleIds.map((mid) => {
                    const hasPerm = hasModulePermission(role.id, mid);
                    return (
                      <td
                        key={mid}
                        className="text-center px-4 py-4"
                      >
                        {hasPerm ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${isSelected ? "bg-brand-100 text-brand-700" : "bg-safe-50 text-safe-600"}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-block w-6 h-6 rounded-full bg-ink-50 text-ink-300">
                            <span className="leading-6 text-sm">—</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-6 text-xs text-ink-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-safe-50 text-safe-600">
            <CheckCircle2 className="w-3 h-3" />
          </span>
          <span>已授权</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-5 rounded-full bg-ink-50 text-ink-300 leading-5 text-center text-sm">
            —
          </span>
          <span>未授权</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-5 rounded-md bg-brand-50 border border-brand-200"></span>
          <span>当前选中角色高亮列</span>
        </div>
      </div>
    </div>
  );
}

function ApprovalPanel() {
  const [filterTab, setFilterTab] = useState<ApprovalFilterKey>("pending");
  const [searchText, setSearchText] = useState("");
  const [approvalOpinions, setApprovalOpinions] = useState<Record<string, string>>({});

  const filteredRequests = useMemo(() => {
    return mockPermissionRequests.filter((r) => {
      if (filterTab !== "all" && r.status !== filterTab) return false;
      if (searchText) {
        const kw = searchText.toLowerCase();
        if (
          !r.userName.toLowerCase().includes(kw) &&
          !r.roleName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filterTab, searchText]);

  const pendingCount = mockPermissionRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-1 flex-wrap">
            {approvalFilterTabs.map((t) => {
              const isActive = filterTab === t.key;
              const showBadge = t.key === "pending" && pendingCount > 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setFilterTab(t.key)}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-brand-700 text-white shadow-sm"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                  }`}
                >
                  {t.label}
                  {showBadge && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? "bg-white text-brand-700"
                          : "bg-warn-100 text-warn-700"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                className="input-base !pl-9"
                placeholder="搜索申请人、角色名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="relative flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ink-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                className="input-base !pl-9 w-52"
                placeholder="申请时间范围"
                defaultValue="2026-06-01 ~ 2026-06-10"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((req, idx) => (
          <ApprovalCard
            key={req.id}
            request={req}
            index={idx}
            opinion={approvalOpinions[req.id] || ""}
            onOpinionChange={(v) =>
              setApprovalOpinions((prev) => ({ ...prev, [req.id]: v }))
            }
          />
        ))}
        {filteredRequests.length === 0 && (
          <div className="card-base p-12 text-center text-ink-400">暂无匹配的审批申请</div>
        )}
      </div>
    </div>
  );
}

interface ApprovalCardProps {
  request: PermissionRequest;
  index: number;
  opinion: string;
  onOpinionChange: (v: string) => void;
}

function ApprovalCard({ request, index, opinion, onOpinionChange }: ApprovalCardProps) {
  const initial = request.userName.charAt(0);
  const avatarCls = avatarColors[index % avatarColors.length];
  const isPending = request.status === "pending";

  return (
    <div className="card-base p-5 card-hover">
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold ${avatarCls} flex-shrink-0`}>
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-ink-800">{request.userName}</span>
              <span className="text-xs text-ink-500">{request.userDept}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
              <Clock className="w-3 h-3" />
              <span>提交于 {request.submitAt}</span>
            </div>
          </div>
        </div>
        <span className={requestStatusBadgeMap[request.status]}>
          {requestStatusLabelMap[request.status]}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">申请角色</label>
          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold bg-info-50 text-brand-700 ring-1 ring-brand-500/20 bg-brand-50">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            {request.roleName}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">申请理由</label>
          <div className="bg-ink-50 border-l-4 border-brand-400 px-4 py-3 rounded-r-md">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-ink-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink-700 leading-relaxed italic">{request.reason}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-2">审批流程</label>
          <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-md">
            <ApprovalFlowNode
              title="初审"
              subtitle="组织管理员"
              status={isPending ? "current" : "done"}
            />
            <ArrowRight className="w-5 h-5 text-ink-300 flex-shrink-0" />
            <ApprovalFlowNode
              title="终审"
              subtitle="超级管理员"
              status={isPending ? "pending" : (request.status === "approved" ? "done" : "rejected")}
            />
          </div>
        </div>

        {!isPending && request.approverName && (
          <div className="p-3 bg-ink-50 rounded-md">
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
              <span>
                {request.status === "approved" ? "通过" : "驳回"}人：
                <span className="text-ink-700 font-medium">{request.approverName}</span>
              </span>
              <span className="text-ink-300">|</span>
              <span>
                审批时间：
                <span className="text-ink-700">{request.approveAt}</span>
              </span>
            </div>
            {request.approveRemark && (
              <div className="mt-1.5 text-sm text-ink-600 flex items-start gap-2">
                <span className="text-ink-400 flex-shrink-0">意见：</span>
                <span>{request.approveRemark}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isPending && (
        <div className="mt-5 pt-4 border-t border-ink-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">
              审批意见 <span className="text-ink-400">（选填）</span>
            </label>
            <textarea
              className="input-base min-h-[72px] resize-none"
              placeholder="请输入审批意见或备注说明..."
              value={opinion}
              onChange={(e) => onOpinionChange(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button className="btn-secondary">
              <XCircle className="w-4 h-4 text-danger-500" />
              <span>驳回</span>
            </button>
            <button className="btn-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span>通过</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ApprovalFlowNodeProps {
  title: string;
  subtitle: string;
  status: "pending" | "current" | "done" | "rejected";
}

function ApprovalFlowNode({ title, subtitle, status }: ApprovalFlowNodeProps) {
  let containerCls = "bg-white border-ink-200";
  let titleCls = "text-ink-500";
  let subCls = "text-ink-400";
  let icon: React.ReactNode = <Clock className="w-4 h-4" />;
  let iconCls = "bg-ink-100 text-ink-400";

  if (status === "current") {
    containerCls = "bg-brand-50 border-brand-400 ring-2 ring-brand-500/20";
    titleCls = "text-brand-700 font-semibold";
    subCls = "text-brand-600";
    iconCls = "bg-brand-500 text-white animate-pulse-soft";
    icon = <ShieldAlert className="w-4 h-4" />;
  } else if (status === "done") {
    containerCls = "bg-safe-50 border-safe-300";
    titleCls = "text-safe-700 font-semibold";
    subCls = "text-safe-600";
    iconCls = "bg-safe-500 text-white";
    icon = <CheckCircle2 className="w-4 h-4" />;
  } else if (status === "rejected") {
    containerCls = "bg-danger-50 border-danger-300";
    titleCls = "text-danger-700 font-semibold";
    subCls = "text-danger-600";
    iconCls = "bg-danger-500 text-white";
    icon = <XCircle className="w-4 h-4" />;
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md border flex-1 min-w-0 ${containerCls}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconCls}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-sm ${titleCls}`}>{title}</div>
        <div className={`text-xs truncate ${subCls}`}>{subtitle}</div>
      </div>
    </div>
  );
}

function OffboardingPanel() {
  const [statusTab, setStatusTab] = useState<OffboardStatusKey>("pending");
  const [searchText, setSearchText] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const filteredUsers = useMemo(() => {
    return mockOffboardUsers.filter((u) => {
      if (u.status !== statusTab) return false;
      if (searchText && !u.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (deptFilter && u.departmentName !== deptFilter) return false;
      return true;
    });
  }, [statusTab, searchText, deptFilter]);

  const deptNames = Array.from(new Set(mockOffboardUsers.map((u) => u.departmentName)));
  const pendingCount = mockOffboardUsers.filter((u) => u.status === "pending").length;
  const recycledCount = mockOffboardUsers.filter((u) => u.status === "recycled").length;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border bg-warn-50 border-warn-300 flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-warn-100 text-warn-600 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-warn-800">重要风险提示</h3>
          <p className="mt-1 text-xs text-warn-700 leading-relaxed">
            注意：离职人员权限回收将立即撤销其所有系统访问权并强制下线所有会话，操作不可逆。
            请在执行前与相关部门确认离职手续已完整办理，并确保已完成工作交接。
          </p>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-1">
            {offboardStatusTabs.map((t) => {
              const isActive = statusTab === t.key;
              const count = t.key === "pending" ? pendingCount : recycledCount;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatusTab(t.key)}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? t.key === "pending"
                        ? "bg-warn-600 text-white shadow-sm"
                        : "bg-brand-700 text-white shadow-sm"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : t.key === "pending"
                        ? "bg-warn-100 text-warn-700"
                        : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                className="input-base !pl-9"
                placeholder="搜索离职人员姓名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="input-base appearance-none pr-9 w-44"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">全部部门</option>
                {deptNames.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-base overflow-auto scrollbar-thin">
        <table className="min-w-full">
          <thead>
            <tr className="bg-ink-50">
              <th className="table-th w-64">人员信息</th>
              <th className="table-th w-32">离职日期</th>
              <th className="table-th w-56">权限清单</th>
              <th className="table-th w-28">风险等级</th>
              <th className="table-th w-28">回收状态</th>
              <th className="table-th w-44 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => (
              <OffboardUserRow key={u.id} user={u} index={idx} />
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="table-td text-center text-ink-400 py-12"
                >
                  暂无匹配的人员数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-base p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-safe-50">
            <div className="w-10 h-10 rounded-md bg-safe-100 text-safe-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-safe-600">本月已回收</div>
              <div className="text-xl font-bold font-display text-safe-700 tabular-nums mt-0.5">
                18 <span className="text-sm font-normal text-safe-600">人</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warn-50">
            <div className="w-10 h-10 rounded-md bg-warn-100 text-warn-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-warn-600">待回收</div>
              <div className="text-xl font-bold font-display text-warn-700 tabular-nums mt-0.5">
                {pendingCount} <span className="text-sm font-normal text-warn-600">人</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50">
            <div className="w-10 h-10 rounded-md bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-brand-600">平均回收时长</div>
              <div className="text-xl font-bold font-display text-brand-700 tabular-nums mt-0.5">
                4.2 <span className="text-sm font-normal text-brand-600">小时</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OffboardUserRowProps {
  user: OffboardUser;
  index: number;
}

function OffboardUserRow({ user, index }: OffboardUserRowProps) {
  const initial = user.name.charAt(0);
  const avatarCls = avatarColors[index % avatarColors.length];
  const isPending = user.status === "pending";

  return (
    <tr
      className={`table-row ${!isPending ? "opacity-60" : ""} ${
        index % 2 === 1 ? "even:bg-ink-50/40" : ""
      }`}
    >
      <td className="table-td">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${avatarCls}`}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink-800">{user.name}</div>
            <div className="text-xs text-ink-500 truncate">
              {user.departmentName} · {user.positionName}
            </div>
          </div>
        </div>
      </td>
      <td className="table-td">
        <div className="flex items-center gap-1.5 text-sm text-ink-600 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-ink-400" />
          {user.leaveDate}
        </div>
      </td>
      <td className="table-td">
        <div className="flex flex-wrap gap-1">
          {user.permissions.map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-ink-100 text-ink-600"
            >
              {p}
            </span>
          ))}
        </div>
      </td>
      <td className="table-td">
        <span className={riskBadgeMap[user.riskLevel]}>
          {riskLabelMap[user.riskLevel]}
        </span>
      </td>
      <td className="table-td">
        {isPending ? (
          <span className="badge-warn bg-warn-50 text-warn-700 ring-warn-500/30">
            待回收
          </span>
        ) : (
          <div>
            <span className="badge-safe">已回收</span>
            {user.recycledAt && (
              <div className="mt-1 text-[11px] text-ink-400">
                {user.recycledAt.slice(5, 16)}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="table-td">
        <div className="flex items-center justify-end gap-1.5">
          {isPending ? (
            <>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-warn-700 bg-warn-50 hover:bg-warn-100 ring-1 ring-inset ring-warn-500/30 transition-colors"
                title="立即回收权限并强制下线"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>回收权限</span>
              </button>
              <button
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                title="查看详情"
              >
                <FileText className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>操作记录</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

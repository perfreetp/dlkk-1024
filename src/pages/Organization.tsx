import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  FolderPlus,
  Upload,
  Users,
  UserCog,
  ShieldCheck,
  Settings,
  Search,
  Plus,
  Pencil,
  ArrowRightLeft,
  UserMinus,
  CheckSquare,
  Save,
  Trash2,
} from "lucide-react";
import {
  mockDepartments,
  mockPositions,
  mockUsers,
  mockRoles,
} from "@/mock";
import type { Department, UserStatus } from "@/types";

type TabKey = "positions" | "members" | "roles" | "settings";

const statusBadgeMap: Record<UserStatus, string> = {
  active: "badge-safe",
  disabled: "badge-neutral",
  frozen: "badge-danger",
};

const statusLabelMap: Record<UserStatus, string> = {
  active: "在职",
  disabled: "停用",
  frozen: "冻结",
};

interface TreeNodeProps {
  dept: Department;
  level: number;
  selectedId: string;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

function TreeNode({
  dept,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: TreeNodeProps) {
  const hasChildren = dept.children && dept.children.length > 0;
  const isExpanded = expandedIds.has(dept.id);
  const isSelected = selectedId === dept.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ${
          isSelected
            ? "bg-brand-50 border-l-3 border-brand-600 -ml-[3px]"
            : "hover:bg-ink-50"
        }`}
        style={{ marginLeft: level * 16 }}
        onClick={() => onSelect(dept.id)}
      >
        {hasChildren ? (
          <button
            className="flex-shrink-0 p-0.5 rounded hover:bg-ink-100"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(dept.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ink-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-ink-500" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}
        <Building2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-ink-800 truncate">
          {dept.name}
        </span>
        <span className="badge-neutral whitespace-nowrap">{dept.memberCount}</span>
      </div>
      {dept.leaderName && (
        <div
          className="flex items-center gap-2 py-1.5 px-3 ml-8 text-xs text-ink-500"
          style={{ marginLeft: level * 16 + 32 }}
        >
          <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold">
            {dept.leaderName.charAt(0)}
          </div>
          <span>{dept.leaderName}</span>
        </div>
      )}
      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-ink-200"
            style={{ marginLeft: level * 16 + 10 }}
          />
          {dept.children!.map((child) => (
            <TreeNode
              key={child.id}
              dept={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getAllDeptIds(depts: Department[]): string[] {
  const ids: string[] = [];
  const walk = (list: Department[]) => {
    list.forEach((d) => {
      ids.push(d.id);
      if (d.children) walk(d.children);
    });
  };
  walk(depts);
  return ids;
}

function findDeptById(depts: Department[], id: string): Department | undefined {
  for (const d of depts) {
    if (d.id === id) return d;
    if (d.children) {
      const found = findDeptById(d.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export default function Organization() {
  const [selectedDeptId, setSelectedDeptId] = useState("d001");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(getAllDeptIds(mockDepartments))
  );
  const [activeTab, setActiveTab] = useState<TabKey>("positions");

  const [positionSearch, setPositionSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const [roleBindings, setRoleBindings] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    mockPositions.forEach((p) => {
      map[p.id] = [...p.roleIds];
    });
    return map;
  });

  const selectedDept = useMemo(
    () => findDeptById(mockDepartments, selectedDeptId),
    [selectedDeptId]
  );

  const deptAndChildrenIds = useMemo(() => {
    const ids = new Set<string>();
    const collect = (dept: Department | undefined) => {
      if (!dept) return;
      ids.add(dept.id);
      if (dept.children) dept.children.forEach(collect);
    };
    collect(selectedDept);
    return ids;
  }, [selectedDept]);

  const filteredPositions = useMemo(() => {
    return mockPositions.filter((p) => {
      const matchDept = deptAndChildrenIds.has(p.departmentId);
      const matchSearch =
        p.name.toLowerCase().includes(positionSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(positionSearch.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [deptAndChildrenIds, positionSearch]);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((u) => {
      const matchDept = deptAndChildrenIds.has(u.departmentId);
      const matchSearch =
        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [deptAndChildrenIds, memberSearch]);

  const allMembersSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedMembers.has(u.id));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllMembers = () => {
    if (allMembersSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleRole = (positionId: string, roleId: string) => {
    setRoleBindings((prev) => {
      const current = prev[positionId] || [];
      const next = current.includes(roleId)
        ? current.filter((r) => r !== roleId)
        : [...current, roleId];
      return { ...prev, [positionId]: next };
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "positions", label: "岗位管理", icon: Users },
    { key: "members", label: "成员列表", icon: UserCog },
    { key: "roles", label: "角色绑定", icon: ShieldCheck },
    { key: "settings", label: "部门设置", icon: Settings },
  ];

  const roleMap = useMemo(() => {
    const m: Record<string, typeof mockRoles[number]> = {};
    mockRoles.forEach((r) => (m[r.id] = r));
    return m;
  }, []);

  const [formData, setFormData] = useState({
    name: selectedDept?.name || "",
    code: selectedDept?.code || "",
    parentId: selectedDept?.parentId || "",
    leaderId: selectedDept?.leaderId || "",
    sort: selectedDept?.sort || 1,
    description: "",
  });

  useEffect(() => {
    if (selectedDept) {
      setFormData({
        name: selectedDept.name,
        code: selectedDept.code,
        parentId: selectedDept.parentId || "",
        leaderId: selectedDept.leaderId || "",
        sort: selectedDept.sort,
        description: "",
      });
    }
  }, [selectedDept]);

  const handleFormChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const departmentOptions = useMemo(() => {
    const options: { id: string; name: string }[] = [{ id: "", name: "无（顶级部门）" }];
    const walk = (list: Department[], prefix = "") => {
      list.forEach((d) => {
        if (d.id !== selectedDeptId) {
          options.push({ id: d.id, name: prefix + d.name });
        }
        if (d.children) walk(d.children, prefix + "　");
      });
    };
    walk(mockDepartments);
    return options;
  }, [selectedDeptId]);

  const leaderOptions = useMemo(() => {
    return [
      { id: "", name: "未指定" },
      ...mockUsers
        .filter((u) => deptAndChildrenIds.has(u.departmentId))
        .map((u) => ({ id: u.id, name: u.name })),
    ];
  }, [deptAndChildrenIds]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-800">
          组织岗位
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          管理组织架构、部门岗位与成员角色
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)]">
        <div className="w-80 card-base p-4 overflow-auto scrollbar-thin flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink-800">组织架构</h2>
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost !p-1.5"
                title="新增部门"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                className="btn-ghost !p-1.5"
                title="导入"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 -mx-2">
            {mockDepartments.map((dept) => (
              <TreeNode
                key={dept.id}
                dept={dept}
                level={0}
                selectedId={selectedDeptId}
                expandedIds={expandedIds}
                onSelect={setSelectedDeptId}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="card-base p-2 flex-shrink-0">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
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
            {activeTab === "positions" && (
              <div className="space-y-4">
                <div className="card-base p-4 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      placeholder="搜索岗位名称或编码..."
                      className="input-base pl-9"
                      value={positionSearch}
                      onChange={(e) => setPositionSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>新增岗位</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredPositions.map((pos) => {
                    const percentage = pos.quota
                      ? Math.min(100, (pos.memberCount / pos.quota) * 100)
                      : 0;
                    return (
                      <div
                        key={pos.id}
                        className="card-base p-5 card-hover"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-ink-800">
                                {pos.name}
                              </span>
                              <span className="text-ink-400 font-mono text-xs">
                                {pos.code}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-ink-500">人员配置</span>
                                <span className="font-medium text-ink-700">
                                  {pos.memberCount}
                                  {pos.quota ? ` / ${pos.quota}` : ""}
                                </span>
                              </div>
                              {pos.quota && (
                                <div className="bg-ink-100 h-2 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {pos.roleIds.map((rid) => (
                                <span key={rid} className="badge-info">
                                  {roleMap[rid]?.name || rid}
                                </span>
                              ))}
                              {pos.roleIds.length === 0 && (
                                <span className="text-xs text-ink-400">
                                  未绑定角色
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="btn-ghost !p-2"
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="btn-ghost !p-2"
                              title="查看成员"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredPositions.length === 0 && (
                    <div className="card-base p-12 text-center text-ink-400 col-span-full">
                      暂无岗位数据
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-4">
                <div className="card-base p-4 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      placeholder="搜索成员姓名或邮箱..."
                      className="input-base pl-9"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary">
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>批量调整部门</span>
                    </button>
                    <button className="btn-secondary">
                      <UserMinus className="w-4 h-4" />
                      <span>移出部门</span>
                    </button>
                  </div>
                </div>

                <div className="card-base overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="table-th w-12">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={allMembersSelected}
                                onChange={toggleAllMembers}
                                className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                              />
                            </div>
                          </th>
                          <th className="table-th">用户</th>
                          <th className="table-th">岗位</th>
                          <th className="table-th">角色</th>
                          <th className="table-th">状态</th>
                          <th className="table-th">入职时间</th>
                          <th className="table-th text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="table-row">
                            <td className="table-td">
                              <input
                                type="checkbox"
                                checked={selectedMembers.has(user.id)}
                                onChange={() => toggleMember(user.id)}
                                className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                              />
                            </td>
                            <td className="table-td">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-ink-800">
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-ink-400">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="table-td text-ink-700">
                              {user.positionName}
                            </td>
                            <td className="table-td">
                              <div className="flex flex-wrap gap-1">
                                {user.roleIds.map((rid) => (
                                  <span key={rid} className="badge-info">
                                    {roleMap[rid]?.name || rid}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="table-td">
                              <span className={statusBadgeMap[user.status]}>
                                {statusLabelMap[user.status]}
                              </span>
                            </td>
                            <td className="table-td text-ink-500 text-xs whitespace-nowrap">
                              {user.createdAt.slice(0, 10)}
                            </td>
                            <td className="table-td text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button className="btn-ghost !py-1 !px-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button className="btn-ghost !py-1 !px-2 text-ink-500 hover:bg-ink-100">
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="table-td text-center text-ink-400 py-12"
                            >
                              暂无成员数据
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "roles" && (
              <div className="space-y-4">
                <div className="card-base p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink-800">
                        岗位默认角色绑定
                      </h3>
                      <p className="mt-1 text-xs text-ink-500">
                        绑定后，该岗位下所有成员将自动获得对应角色权限。调整后请点击「保存」确认变更。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredPositions.map((pos) => {
                    const boundRoles = roleBindings[pos.id] || [];
                    return (
                      <div key={pos.id} className="card-base p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-base font-semibold text-ink-800">
                                {pos.name}
                              </span>
                              <span className="text-ink-400 font-mono text-xs">
                                {pos.code}
                              </span>
                              <span className="badge-neutral">
                                {pos.memberCount} 人
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                              {mockRoles.map((role) => {
                                const isChecked = boundRoles.includes(role.id);
                                return (
                                  <label
                                    key={role.id}
                                    className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all duration-150 ${
                                      isChecked
                                        ? "border-brand-400 bg-brand-50/60"
                                        : "border-ink-200 hover:border-ink-300 hover:bg-ink-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleRole(pos.id, role.id)}
                                      className="w-4 h-4 mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-ink-800">
                                        {role.name}
                                      </div>
                                      <div className="mt-0.5 text-xs text-ink-400 truncate">
                                        {role.description}
                                      </div>
                                      <div className="mt-1 text-[11px] text-ink-400 font-mono">
                                        {role.code}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button className="btn-primary">
                              <Save className="w-4 h-4" />
                              <span>保存</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredPositions.length === 0 && (
                    <div className="card-base p-12 text-center text-ink-400">
                      当前部门下暂无岗位，请先创建岗位后再进行角色绑定
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && selectedDept && (
              <div className="space-y-4">
                <div className="card-base p-6">
                  <h3 className="text-base font-semibold text-ink-800 mb-6">
                    部门信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        部门名称 <span className="text-danger-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-base"
                        placeholder="请输入部门名称"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        部门编码 <span className="text-danger-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-base font-mono"
                        placeholder="请输入部门编码"
                        value={formData.code}
                        onChange={(e) => handleFormChange("code", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        上级部门
                      </label>
                      <select
                        className="input-base"
                        value={formData.parentId}
                        onChange={(e) => handleFormChange("parentId", e.target.value)}
                      >
                        {departmentOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        部门负责人
                      </label>
                      <select
                        className="input-base"
                        value={formData.leaderId}
                        onChange={(e) => handleFormChange("leaderId", e.target.value)}
                      >
                        {leaderOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        排序号
                      </label>
                      <input
                        type="number"
                        className="input-base"
                        placeholder="数值越小越靠前"
                        value={formData.sort}
                        onChange={(e) => handleFormChange("sort", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">
                        部门描述
                      </label>
                      <textarea
                        className="input-base min-h-[100px] resize-none"
                        placeholder="请输入部门职责、业务范围等描述信息..."
                        value={formData.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="card-base p-5 flex items-center justify-between">
                  <div className="text-sm text-ink-500">
                    部门ID：
                    <span className="font-mono text-ink-700">{selectedDept.id}</span>
                    <span className="mx-3">|</span>
                    成员数：
                    <span className="text-ink-700 font-medium">{selectedDept.memberCount} 人</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="btn-danger">
                      <Trash2 className="w-4 h-4" />
                      <span>删除部门</span>
                    </button>
                    <button className="btn-primary">
                      <Save className="w-4 h-4" />
                      <span>保存修改</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

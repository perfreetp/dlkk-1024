import { NavLink } from "react-router-dom";
import {
  Shield,
  Key,
  LayoutDashboard,
  Users,
  Building2,
  AppWindow,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

const menuItems: MenuItem[] = [
  { label: "租户总览", icon: LayoutDashboard, to: "/dashboard" },
  { label: "用户目录", icon: Users, to: "/users" },
  { label: "组织岗位", icon: Building2, to: "/organization" },
  { label: "应用接入", icon: AppWindow, to: "/applications" },
  { label: "权限角色", icon: ShieldCheck, to: "/permissions" },
  { label: "登录审计", icon: ClipboardList, to: "/audit" },
  { label: "风险处置", icon: AlertTriangle, to: "/risk" },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-screen w-[256px] bg-ink-900 text-white shadow-sidebar flex-shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <Key className="w-3.5 h-3.5 text-white absolute -bottom-0.5 -right-0.5 drop-shadow-md" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-semibold text-white tracking-wide">
              统一认证中心
            </span>
            <span className="text-[10px] text-ink-400 tracking-[0.2em] font-medium">
              GROUP IAM
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar-item-active" : "sidebar-item"
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">张</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">超级管理员·张三</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}

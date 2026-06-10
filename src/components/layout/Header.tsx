import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronRight,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  dashboard: "租户总览",
  users: "用户目录",
  organization: "组织岗位",
  applications: "应用接入",
  permissions: "权限角色",
  audit: "登录审计",
  risk: "风险处置",
};

export default function Header() {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage = breadcrumbMap[pathSegments[0]] || "首页";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-soft border-b border-ink-200/80 flex-shrink-0">
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-ink-500 hover:text-ink-700 transition-colors cursor-pointer">
          首页
        </span>
        <ChevronRight className="w-4 h-4 text-ink-400" strokeWidth={2} />
        <span className="text-ink-800 font-medium">{currentPage}</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2"
            strokeWidth={1.8}
          />
          <input
            type="text"
            placeholder="搜索用户、应用、权限..."
            className="w-64 h-9 pl-9 pr-3 rounded-md border border-ink-200 bg-ink-50/50 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <button
          type="button"
          className="relative w-9 h-9 flex items-center justify-center rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ink-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">张</span>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white border border-ink-200 shadow-card-hover py-1 z-50 animate-fade-in-up">
              <div className="px-4 py-3 border-b border-ink-100">
                <p className="text-sm font-medium text-ink-800">超级管理员·张三</p>
                <p className="text-xs text-ink-500 mt-0.5">admin@group.com</p>
              </div>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors"
              >
                <User className="w-4 h-4" strokeWidth={1.8} />
                个人中心
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors"
              >
                <Settings className="w-4 h-4" strokeWidth={1.8} />
                系统设置
              </button>
              <div className="border-t border-ink-100 my-1" />
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.8} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

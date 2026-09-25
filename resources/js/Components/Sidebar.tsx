import React from 'react';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  Scale,
  Boxes,
  Scissors,
  CheckCircle2,
  Package,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  User,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    if (csrfToken) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_token';
      input.value = csrfToken;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const handleProfile = () => {
    window.location.href = '/profile';
  };
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'lots', label: 'Raw Material Lots', icon: Layers, badge: 'Fabric' },
    { id: 'fabric_loss', label: 'Loss Fabric & Samples', icon: AlertTriangle, badge: 'Loss' },
    { id: 'wadding', label: 'Wadding & Quilt Estimator', icon: Scale, badge: 'Kg' },
    { id: 'raw_materials', label: 'Packaging & Bags Stock', icon: Boxes },
    { id: 'cutting', label: 'Daily Cutting Log', icon: Scissors },
    { id: 'production', label: 'Daily Production Log', icon: CheckCircle2 },
    { id: 'products', label: 'Product & Stock Manage', icon: Package },
    { id: 'parties', label: 'Parties & Customer Dues', icon: Users },
    { id: 'supplier_dues', label: 'Supplier Accounts Payable', icon: CreditCard },
    { id: 'billing', label: 'Billing & PDF Invoice', icon: FileText },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 lg:min-h-[calc(100vh-61px)] border-r border-slate-800 p-3 shrink-0 flex flex-col justify-between">
      <div>
        <div className="mb-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 space-y-3">
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Auto-Deduction Engine
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Daily production automatically deducts stiffeners, polybags, design cards, quilt bags, wadding (kg), and cut pieces.
          </p>
        </div>

        {/* User Account: Profile & Logout */}
        <div className="pt-3 border-t border-slate-800/90 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            User Account
          </div>
          <button
            onClick={handleProfile}
            title="Manage user profile"
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer border border-transparent hover:border-slate-700"
          >
            <User className="w-4 h-4 text-indigo-400" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={handleLogout}
            title="Log out of session"
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

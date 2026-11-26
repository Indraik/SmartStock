import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Warehouse,
  AlertTriangle,
  ShoppingBag,
  Users,
  UserCircle,
  ShoppingCart,
  Store,
  ChevronLeft,
  ChevronRight,
  X,
  Boxes,
} from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { useCart } from '../../context/CartContext';

const NAV_CONFIG = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/admin/inventory', label: 'Inventory', icon: Warehouse, end: true },
    { to: '/admin/inventory/low-stock', label: 'Low Stock', icon: AlertTriangle },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ],
  [ROLES.STAFF]: [
    { to: '/staff/products', label: 'Products', icon: Package },
    { to: '/staff/inventory', label: 'Inventory', icon: Warehouse, end: true },
    { to: '/staff/inventory/low-stock', label: 'Low Stock', icon: AlertTriangle },
    { to: '/staff/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ],
  [ROLES.CUSTOMER]: [
    { to: '/customer/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/customer/catalog', label: 'Catalog', icon: Store },
    { to: '/customer/cart', label: 'Cart', icon: ShoppingCart, showCartCount: true },
    { to: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ],
};

export default function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const { itemCount } = useCart();
  const navItems = NAV_CONFIG[role] || [];

  const renderLinks = (isMobile = false) => (
    <nav
      className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={isMobile ? onCloseMobile : undefined}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {(!collapsed || isMobile) && (
              <span className="flex-1 truncate">{item.label}</span>
            )}
            {(!collapsed || isMobile) && item.showCartCount && itemCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {itemCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              SmartStock
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderLinks(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-200 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'mx-auto' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="truncate text-base font-bold tracking-tight text-white">
                SmartStock
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {renderLinks(false)}

        {collapsed && (
          <div className="border-t border-slate-800 p-3">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
